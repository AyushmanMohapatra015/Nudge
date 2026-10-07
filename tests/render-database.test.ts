import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, mkdtempSync, readFileSync, existsSync, symlinkSync, readdirSync, appendFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { renderMaintenanceOperation } from '../scripts/render-database-operations.mjs';
import { createDatabaseSnapshot } from '../scripts/database-lifecycle.mjs';

function fixture() {
  mkdirSync('data', { recursive: true });
  const base = mkdtempSync(resolve('data/render-recovery-')), root = join(base, 'app'), storage = join(base, 'mounted-disk');
  mkdirSync(root); mkdirSync(storage);
  const source = join(storage, 'nudge.sqlite'), writer = new DatabaseSync(source);
  writer.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE workspaces (mode TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE webhook_events (id TEXT PRIMARY KEY, received_at TEXT NOT NULL); CREATE TABLE remote_operations (key TEXT PRIMARY KEY, body TEXT NOT NULL);');
  const body = { version: 3, mode: 'sandbox', clientToken: 'fictional-client-token', agreement: { title: 'Fictional website' }, agreementStatus: 'accepted', policies: { protectedClient: true },
    proposals: [{ id: 'change-1', status: 'accepted', amountCents: 30000, clientExplanation: { message: 'Booking was excluded; this quote adds scheduling.', references: [{ id: 'S3', text: 'Booking is excluded.' }] } }],
    invoices: [{ id: 'INV2-FICTIONAL', status: 'DRAFT', amountCents: 30000, pendingSend: { key: 'uncertain-send' } }], audit: [{ title: 'Client accepted' }], processing: { key: 'uncertain-process' } };
  writer.prepare('INSERT INTO workspaces VALUES (?, ?)').run('sandbox', JSON.stringify(body));
  writer.prepare('INSERT INTO webhook_events VALUES (?, ?)').run('fictional-signed-event', '2026-10-07T00:00:00.000Z');
  writer.prepare('INSERT INTO remote_operations VALUES (?, ?)').run('create-attempt-fictional', JSON.stringify({ attempted: true, outcome: 'unknown' }));
  return { root, storage, source, writer, body };
}

test('Render storage recovery preserves committed decisions/evidence/uncertainty without touching the live database', async () => {
  const { root, storage, source, writer, body } = fixture();
  const previousFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; throw Error('Network forbidden'); };
  try {
    writer.exec('BEGIN IMMEDIATE'); writer.prepare('INSERT INTO remote_operations VALUES (?, ?)').run('uncommitted', '{}');
    const snapshot = (await renderMaintenanceOperation(root, storage, ['backup'])).result;
    writer.exec('ROLLBACK');
    const snapshotArg = 'backups/' + basename(snapshot.directory);
    const verified = (await renderMaintenanceOperation(root, storage, ['verify', '--snapshot', snapshotArg])).result;
    assert.deepEqual(verified.counts, { workspaces: 1, pendingWorkspaces: 1, webhookEvents: 1, remoteOperations: 1 });
    writer.prepare('UPDATE workspaces SET body = ?').run(JSON.stringify({ ...body, version: 4, clientToken: 'newer-revoked-token' }));
    const current = writer.prepare('SELECT body FROM workspaces').get()!.body;
    const first = (await renderMaintenanceOperation(root, storage, ['restore', '--snapshot', snapshotArg, '--confirm-offline-copy'])).result;
    const second = (await renderMaintenanceOperation(root, storage, ['restore', '--snapshot', snapshotArg, '--confirm-offline-copy'])).result;
    assert.notEqual(first.directory, second.directory);
    const recovered = new DatabaseSync(join(first.directory, 'database.sqlite'), { readOnly: true });
    try {
      assert.deepEqual(JSON.parse(String(recovered.prepare('SELECT body FROM workspaces').get()!.body)), body);
      assert.equal(recovered.prepare('SELECT COUNT(*) AS count FROM webhook_events').get()!.count, 1);
      assert.equal(JSON.parse(String(recovered.prepare('SELECT body FROM remote_operations').get()!.body)).outcome, 'unknown');
    } finally { recovered.close(); }
    assert.equal(writer.prepare('SELECT body FROM workspaces').get()!.body, current);
    assert.equal(readFileSync(join(first.directory, 'RECOVERY_REVIEW_REQUIRED.json'), 'utf8').includes('offline-review-only'), true);
    assert.equal(calls, 0);
    assert.equal(existsSync(join(root, 'data')), false, 'no project-directory bridge or link is created');
    await assert.rejects(createDatabaseSnapshot(root, source), 'local defaults still require project data');
    appendFileSync(join(snapshot.directory, 'database.sqlite'), 'tampered');
    const before = readdirSync(join(storage, 'recovery'));
    await assert.rejects(renderMaintenanceOperation(root, storage, ['restore', '--snapshot', snapshotArg, '--confirm-offline-copy']), /checksum/);
    assert.deepEqual(readdirSync(join(storage, 'recovery')), before);
  } finally { globalThis.fetch = previousFetch; writer.close(); }
});

test('Render maintenance rejects traversal, source overrides, missing confirmation and escaping storage outputs', async () => {
  const { root, storage, writer } = fixture();
  try {
    for (const args of [['backup', '--source', '/private.sqlite'], ['verify', '--snapshot', '/var/data/backups/snapshot-a'], ['verify', '--snapshot', 'backups/../nudge.sqlite'], ['verify', '--snapshot', 'backups/snapshot-a/extra'], ['restore', '--snapshot', 'backups/snapshot-a'], ['backup', '--storage', storage]]) {
      await assert.rejects(renderMaintenanceOperation(root, storage, args), /Use backup/);
    }
    const outside = join(root, 'outside'); mkdirSync(outside);
    symlinkSync(outside, join(storage, 'backups'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(renderMaintenanceOperation(root, storage, ['backup']), /regular directory/);
    assert.deepEqual(readdirSync(outside), []);
    const linkedStorage = join(root, 'linked-disk');
    symlinkSync(storage, linkedStorage, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(renderMaintenanceOperation(root, linkedStorage, ['backup']), /Storage directory/);
    const child = spawnSync(process.execPath, ['scripts/render-database-maintenance.mjs', 'backup'], { env: { ...process.env, RENDER: '', NUDGE_ADMIN_TOKEN: 'private-placeholder-never-print' }, encoding: 'utf8', timeout: 5000 });
    assert.equal(child.status, 1); assert.equal(child.stdout, ''); assert.match(child.stderr, /Render maintenance refused/);
    assert.equal(child.stderr.includes('private-placeholder-never-print'), false);
  } finally { writer.close(); }
});
