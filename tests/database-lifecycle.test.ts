import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, statSync, readFileSync, writeFileSync, appendFileSync, readdirSync, symlinkSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { createDatabaseSnapshot, verifyDatabaseSnapshot, createRecoveryCopy } from '../scripts/database-lifecycle.mjs';

function fixture() {
  mkdirSync('./data', { recursive: true });
  const root = mkdtempSync(resolve('data/database-lifecycle-'));
  mkdirSync(join(root, 'data'));
  const source = join(root, 'data', 'source.sqlite'), writer = new DatabaseSync(source);
  writer.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE workspaces (mode TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE webhook_events (id TEXT PRIMARY KEY, received_at TEXT NOT NULL); CREATE TABLE remote_operations (key TEXT PRIMARY KEY, body TEXT NOT NULL);');
  const body = { version: 7, mode: 'sandbox', clientToken: 'fictional-private-client-link', clientLinkExpiresAt: '2026-11-01T00:00:00.000Z', baseInvoiceKey: 'base-frozen-test',
    agreement: { title: 'Fictional website', clientName: 'Fictional contact', clientEmail: 'fictional@example.com', amountCents: 1000, clauses: [{ id: 'S1', text: 'Booking excluded.' }] },
    agreementStatus: 'accepted', agreementAcceptedAt: '2026-10-04T00:00:00.000Z', policies: { reminderLimit: 3, protectedClient: true },
    proposals: [{ id: 'fictional-extra', status: 'accepted', amountCents: 1000 }],
    invoices: [{ id: 'INV2-FICTIONAL', amountCents: 1000, outstandingCents: 1000, status: 'DRAFT', pendingSend: { key: 'uncertain-send', startedAt: '2026-10-04T00:00:00.000Z' } }],
    processing: { key: 'uncertain-owner-action', operation: 'sendInvoice', startedAt: '2026-10-04T00:00:00.000Z' },
    audit: [{ title: 'Approval retained', actor: 'You', detail: 'Fictional decision.' }] };
  writer.prepare('INSERT INTO workspaces VALUES (?, ?)').run('sandbox', JSON.stringify(body));
  writer.prepare('INSERT INTO workspaces VALUES (?, ?)').run('demo', JSON.stringify({ ...body, mode: 'demo', processing: undefined, invoices: [] }));
  writer.prepare('INSERT INTO webhook_events VALUES (?, ?)').run('FICTIONAL-EVENT', '2026-10-04T00:00:00.000Z');
  writer.prepare('INSERT INTO remote_operations VALUES (?, ?)').run('create-attempt-base-frozen-test', JSON.stringify({ attempted: true, outcome: 'unknown' }));
  writer.prepare('INSERT INTO remote_operations VALUES (?, ?)').run('invoice-base-frozen-test', JSON.stringify({ id: 'INV2-FICTIONAL' }));
  return { root, source, writer, body };
}

function dump(connection: DatabaseSync) {
  return JSON.stringify({ workspaces: connection.prepare('SELECT * FROM workspaces ORDER BY mode').all(),
    events: connection.prepare('SELECT * FROM webhook_events ORDER BY id').all(), operations: connection.prepare('SELECT * FROM remote_operations ORDER BY key').all() });
}

test('online snapshot includes committed WAL records, excludes uncommitted work and restores all recovery evidence to a new file', async () => {
  const { root, source, writer, body } = fixture();
  const before = dump(writer), configBefore = process.env.NUDGE_DB_PATH;
  try {
    assert.ok(statSync(source + '-wal').size > 0);
    writer.exec('BEGIN IMMEDIATE');
    writer.prepare('INSERT INTO remote_operations VALUES (?, ?)').run('uncommitted', '{}');
    const snapshot = await createDatabaseSnapshot(root, source);
    writer.exec('ROLLBACK');
    assert.equal(dump(writer), before);
    const verified = await verifyDatabaseSnapshot(root, snapshot.directory);
    assert.deepEqual(verified.counts, { workspaces: 2, pendingWorkspaces: 1, webhookEvents: 1, remoteOperations: 2 });
    const backup = new DatabaseSync(verified.file, { readOnly: true });
    try { assert.equal(dump(backup), before); assert.equal(backup.prepare('PRAGMA journal_mode').get()!.journal_mode, 'delete'); }
    finally { backup.close(); }
    assert.equal(existsSync(verified.file + '-wal'), false);
    writer.prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(JSON.stringify({ ...body, version: 8, clientToken: 'changed-after-snapshot' }), 'sandbox');
    const sourceAfterChange = dump(writer);
    const first = await createRecoveryCopy(root, snapshot.directory), second = await createRecoveryCopy(root, snapshot.directory);
    assert.notEqual(first.directory, second.directory); assert.notEqual(first.file, source);
    const restored = new DatabaseSync(first.file, { readOnly: true });
    try { assert.equal(dump(restored), before); }
    finally { restored.close(); }
    assert.equal(dump(writer), sourceAfterChange);
    assert.deepEqual(readFileSync(first.file), readFileSync(verified.file));
    assert.equal(JSON.parse(readFileSync(join(first.directory, 'RECOVERY_REVIEW_REQUIRED.json'), 'utf8')).status, 'offline-review-only');
    const reload = spawnSync(process.execPath, ['--import', 'tsx', '--eval', `
      globalThis.fetch = async () => { throw Error('Network forbidden'); };
      const assert = require('node:assert/strict');
      const { read, cachedOperation, db } = require('./lib/store.ts');
      const state = read();
      assert.equal(state.agreementStatus, 'accepted');
      assert.equal(state.baseInvoiceKey, 'base-frozen-test');
      assert.equal(state.processing.key, 'uncertain-owner-action');
      assert.equal(state.invoices[0].pendingSend.key, 'uncertain-send');
      assert.equal(cachedOperation('create-attempt-base-frozen-test').outcome, 'unknown');
      assert.equal(cachedOperation('invoice-base-frozen-test').id, 'INV2-FICTIONAL');
      assert.equal(db().prepare('SELECT COUNT(*) AS count FROM webhook_events').get().count, 1);
      db().close(); console.log('Recovered records reloaded without provider calls.');
    `], { cwd: process.cwd(), env: { SystemRoot: process.env.SystemRoot, NODE_ENV: 'test', NUDGE_MODE: 'sandbox', NUDGE_AI_ENABLED: 'false', NUDGE_DB_PATH: first.file }, encoding: 'utf8' });
    assert.equal(reload.status, 0, reload.stderr);
    assert.match(reload.stdout, /Recovered records reloaded/);
    assert.equal(dump(writer), sourceAfterChange);
    assert.equal(process.env.NUDGE_DB_PATH, configBefore);
  } finally { writer.close(); }
});

test('checksum mismatch and missing/escaping manifests fail before creating a recovery folder', async () => {
  const { root, source, writer } = fixture();
  try {
    const snapshot = await createDatabaseSnapshot(root, source);
    const manifestPath = join(snapshot.directory, 'manifest.json'), originalManifest = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(originalManifest);
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, databaseFile: '../source.sqlite' }));
    await assert.rejects(createRecoveryCopy(root, snapshot.directory), /manifest/);
    assert.equal(existsSync(join(root, 'data', 'recovery')), false);
    writeFileSync(manifestPath, originalManifest);
    appendFileSync(join(snapshot.directory, 'database.sqlite'), 'tampered');
    await assert.rejects(createRecoveryCopy(root, snapshot.directory), /checksum/);
    assert.equal(existsSync(join(root, 'data', 'recovery')), false);
    const incomplete = join(root, 'data', 'incomplete'); mkdirSync(incomplete);
    await assert.rejects(createRecoveryCopy(root, incomplete));
    assert.equal(existsSync(join(root, 'data', 'recovery')), false);
  } finally { writer.close(); }
});

test('maintenance refuses unknown databases, paths outside data and escaping output junctions', async () => {
  const { root, source, writer } = fixture();
  try {
    await assert.rejects(createDatabaseSnapshot(root, join(root, 'outside.sqlite')), /inside/);
    const unknown = join(root, 'data', 'unknown.sqlite'), other = new DatabaseSync(unknown);
    other.exec('CREATE TABLE unrelated (id TEXT)'); other.close();
    await assert.rejects(createDatabaseSnapshot(root, unknown), /table layout/);
    assert.equal(existsSync(join(root, 'data', 'backups')), false);
    const outside = join(root, 'outside'); mkdirSync(outside);
    symlinkSync(outside, join(root, 'data', 'backups'), 'junction');
    await assert.rejects(createDatabaseSnapshot(root, source), /regular directory/);
    assert.deepEqual(readdirSync(outside), []);
  } finally { writer.close(); }
});

test('maintenance CLI reports only sanitized metadata and never loads environment secrets or prints workspace contents', async () => {
  const { root, source, writer, body } = fixture();
  try {
    const snapshot = await createDatabaseSnapshot(root, source);
    const command = resolve('scripts/database-maintenance.mjs');
    const environment = { SystemRoot: process.env.SystemRoot, NODE_ENV: 'test' as const, NUDGE_DB_PATH: 'must-not-be-used', ANTHROPIC_API_KEY: 'fictional-secret-never-print' };
    const verify = spawnSync(process.execPath, [command, 'verify', '--snapshot', relative(root, snapshot.directory)], { cwd: root, env: environment, encoding: 'utf8' });
    assert.equal(verify.status, 0, verify.stderr);
    assert.match(verify.stdout, /verified/);
    for (const value of [body.clientToken, body.agreement.clientEmail, 'fictional-secret-never-print', 'uncertain-owner-action']) assert.equal(verify.stdout.includes(value), false);
    const denied = spawnSync(process.execPath, [command, 'restore', '--snapshot', relative(root, snapshot.directory)], { cwd: root, env: environment, encoding: 'utf8' });
    assert.equal(denied.status, 1); assert.equal(existsSync(join(root, 'data', 'recovery')), false);
    const restored = spawnSync(process.execPath, [command, 'restore', '--snapshot', relative(root, snapshot.directory), '--confirm-offline-copy'], { cwd: root, env: environment, encoding: 'utf8' });
    assert.equal(restored.status, 0, restored.stderr); assert.match(restored.stdout, /offline-review-only/);
    assert.equal(restored.stdout.includes(body.clientToken), false);
  } finally { writer.close(); }
});

test('matching table names without required primary keys are not accepted as a Nudge database', async () => {
  const { root, writer } = fixture();
  const badPath = join(root, 'data', 'bad-layout.sqlite'), invalid = new DatabaseSync(badPath);
  try {
    invalid.exec('CREATE TABLE workspaces (mode TEXT, body TEXT NOT NULL); CREATE TABLE webhook_events (id TEXT PRIMARY KEY, received_at TEXT NOT NULL); CREATE TABLE remote_operations (key TEXT PRIMARY KEY, body TEXT NOT NULL);');
  } finally { invalid.close(); }
  try {
    await assert.rejects(createDatabaseSnapshot(root, badPath), /primary keys/);
    assert.equal(existsSync(join(root, 'data', 'backups')), false);
  } finally { writer.close(); }
});
