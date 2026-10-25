// tests/agent-a-storage-recovery.test.ts
// PA-3 (Revision A3) tests, reviewed and corrected against actual repository APIs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { createDatabaseSnapshot, verifyDatabaseSnapshot, createRecoveryCopy } from '../scripts/database-lifecycle.mjs';
import { renderMaintenanceOperation } from '../scripts/render-database-operations.mjs';
import { validateRenderConfig, renderPort } from '../scripts/render-config.mjs';
import { processingRecovery } from '../lib/processing';
import { studioRequestAllowance } from '../lib/studio-request-allowance';

function createFictionalWorkspaceFixture() {
  mkdirSync('./data', { recursive: true });
  const root = mkdtempSync(resolve('data/agent-a-pa3-'));
  mkdirSync(join(root, 'data'));
  const source = join(root, 'data', 'source.sqlite');
  const writer = new DatabaseSync(source);
  writer.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA wal_autocheckpoint=0;
    CREATE TABLE workspaces (mode TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE webhook_events (id TEXT PRIMARY KEY, received_at TEXT NOT NULL);
    CREATE TABLE remote_operations (key TEXT PRIMARY KEY, body TEXT NOT NULL);
  `);
  const sandboxWorkspace = {
    version: 11,
    mode: 'sandbox',
    clientToken: 'fictional-rotated-client-token-001',
    clientLinkExpiresAt: '2026-10-01T00:00:00.000Z', // Intentionally expired bearer link
    baseInvoiceKey: 'base-fictional-frozen-01',
    agreement: {
      title: 'Fictional micro-agency redesign',
      clientName: 'Fictional Buyer',
      clientEmail: 'buyer.fictional@example.com',
      amountCents: 120000,
      clauses: [{ id: 'S1', text: 'Five-page marketing site.' }, { id: 'S3', text: 'Booking extra excluded.' }],
    },
    agreementStatus: 'accepted',
    agreementAcceptedAt: '2026-09-25T12:00:00.000Z',
    policies: { protectedClient: true, reminderLimit: 3, cooldownDays: 7 },
    proposals: [
      {
        id: 'prop-booking-300',
        status: 'accepted',
        amountCents: 30000,
        clientExplanation: { message: 'Adds booking workflow.', references: [{ id: 'S3', text: 'Booking extra excluded.' }] },
      },
    ],
    invoices: [
      {
        id: 'INV2-FICTIONAL-DRAFT',
        proposalId: 'prop-booking-300',
        amountCents: 30000,
        outstandingCents: 30000,
        status: 'DRAFT',
        pendingSend: { key: 'send-uncertain-01', startedAt: '2026-10-04T10:00:00.000Z' },
      },
      {
        id: 'INV2-FICTIONAL-UNPAID',
        proposalId: 'base-fictional-frozen-01',
        amountCents: 120000,
        outstandingCents: 120000,
        status: 'UNPAID',
        pendingReminder: { key: 'remind-uncertain-01', startedAt: '2026-10-04T10:05:00.000Z' },
      },
    ],
    processing: {
      key: 'send-uncertain-01',
      operation: 'sendInvoice',
      startedAt: '2026-10-04T10:00:00.000Z',
      owner: { pid: 999999, host: hostname() },
    },
    audit: [{ id: 'audit-1', time: '2026-10-04T10:00:00.000Z', actor: 'Owner', title: 'Started send', detail: 'Fictional uncertain send.' }],
  };
  const demoWorkspace = {
    ...sandboxWorkspace,
    version: 1,
    mode: 'demo',
    invoices: [],
    processing: undefined,
  };
  writer.prepare('INSERT INTO workspaces (mode, body) VALUES (?, ?)').run('sandbox', JSON.stringify(sandboxWorkspace));
  writer.prepare('INSERT INTO workspaces (mode, body) VALUES (?, ?)').run('demo', JSON.stringify(demoWorkspace));
  writer.prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)').run('WH-FICTIONAL-001', '2026-10-04T09:50:00.000Z');
  writer.prepare('INSERT INTO remote_operations (key, body) VALUES (?, ?)').run(
    'attempt-invoice-prop-booking-300',
    JSON.stringify({ startedAt: '2026-10-04T09:40:00.000Z', invoiceNumber: 'N-prop-booking-30' })
  );
  writer.prepare('INSERT INTO remote_operations (key, body) VALUES (?, ?)').run(
    'invoice-prop-booking-300',
    JSON.stringify({ id: 'INV2-FICTIONAL-DRAFT', proposalId: 'prop-booking-300', status: 'DRAFT', amountCents: 30000, outstandingCents: 30000 })
  );
  return { root, source, writer, sandboxWorkspace };
}

test('PA-3 Scenario 1: snapshot and recovery copy preserve all financial/AI uncertainty markers, expired link state, and host/PID lock boundaries', async () => {
  const { root, source, writer, sandboxWorkspace } = createFictionalWorkspaceFixture();
  try {
    const ledger = studioRequestAllowance(writer);
    ledger.approve({ id: randomUUID(), maxRequests: 5, expiresAt: Date.now() + 3600_000 });
    assert.equal(ledger.reserve(), true);
    assert.equal(ledger.reserve(), true);
    assert.equal(ledger.reserve(), true);
    assert.equal(ledger.status().usedRequests, 3);

    const snapshot = await createDatabaseSnapshot(root, source);
    assert.deepEqual(snapshot.counts, {
      workspaces: 2,
      pendingWorkspaces: 1,
      webhookEvents: 1,
      remoteOperations: 2,
      studioApprovals: 1,
      studioReservedRequests: 3,
    });

    const recovery = await createRecoveryCopy(root, snapshot.directory);
    const reviewMarker = JSON.parse(readFileSync(join(recovery.directory, 'RECOVERY_REVIEW_REQUIRED.json'), 'utf8'));
    assert.equal(reviewMarker.status, 'offline-review-only');
    assert.equal(reviewMarker.studioAllowancesRevoked, true);

    const restoredDb = new DatabaseSync(recovery.file, { readOnly: true });
    try {
      const restoredSandbox = JSON.parse(String(restoredDb.prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body));
      assert.equal(restoredSandbox.clientToken, sandboxWorkspace.clientToken);
      assert.equal(restoredSandbox.clientLinkExpiresAt, '2026-10-01T00:00:00.000Z');
      assert.equal(restoredSandbox.baseInvoiceKey, 'base-fictional-frozen-01');
      assert.deepEqual(restoredSandbox.invoices[0].pendingSend, sandboxWorkspace.invoices[0].pendingSend);
      assert.deepEqual(restoredSandbox.invoices[1].pendingReminder, sandboxWorkspace.invoices[1].pendingReminder);
      assert.deepEqual(restoredSandbox.processing, sandboxWorkspace.processing);

      // Control checks on processingRecovery with restored lock state:
      const exitedProbe = () => {
        const err = new Error('No such process') as NodeJS.ErrnoException;
        err.code = 'ESRCH';
        throw err;
      };
      assert.equal(processingRecovery(restoredSandbox.processing, exitedProbe).status, 'exited');
      assert.equal(processingRecovery({ ...restoredSandbox.processing, owner: { pid: process.pid, host: hostname() } }).status, 'running');
      assert.equal(
        processingRecovery({ ...restoredSandbox.processing, owner: { pid: 999999, host: 'other-render-instance.internal' } }, exitedProbe).status,
        'unknown'
      );

      const attemptOp = JSON.parse(
        String(restoredDb.prepare('SELECT body FROM remote_operations WHERE key = ?').get('attempt-invoice-prop-booking-300')!.body)
      );
      assert.equal(attemptOp.invoiceNumber, 'N-prop-booking-30');
      assert.equal(restoredDb.prepare('SELECT COUNT(*) AS count FROM webhook_events WHERE id = ?').get('WH-FICTIONAL-001')!.count, 1);

      const allowanceRow = restoredDb.prepare('SELECT max_requests, used_requests, active FROM studio_request_allowances').get()!;
      assert.equal(allowanceRow.max_requests, 5);
      assert.equal(allowanceRow.used_requests, 3);
      assert.equal(allowanceRow.active, 0);
    } finally {
      restoredDb.close();
    }

    // Source database allowance remains active and untouched:
    assert.equal(ledger.status().state, 'available');
    assert.equal(ledger.status().usedRequests, 3);
  } finally {
    writer.close();
  }
});

test('PA-3 Scenario 2: verifyDatabaseSnapshot rejects extra manifest.counts keys (A3-01), oversized manifests, and unsupported views or triggers', async () => {
  const { root, source, writer } = createFictionalWorkspaceFixture();
  try {
    const snapshot = await createDatabaseSnapshot(root, source);
    const manifestPath = join(snapshot.directory, 'manifest.json');
    const originalManifestText = readFileSync(manifestPath, 'utf8');
    const originalManifest = JSON.parse(originalManifestText);

    // 1. A3-01 regression check: manifest claims studioApprovals/studioReservedRequests on a DB without studio_request_allowances
    writeFileSync(
      manifestPath,
      JSON.stringify({
        ...originalManifest,
        counts: { ...originalManifest.counts, studioApprovals: 1, studioReservedRequests: 2 },
      })
    );
    await assert.rejects(verifyDatabaseSnapshot(root, snapshot.directory), /Snapshot record counts do not match its manifest\./);
    await assert.rejects(createRecoveryCopy(root, snapshot.directory), /Snapshot record counts do not match its manifest\./);
    assert.equal(existsSync(join(root, 'data', 'recovery')), false);

    // 2. Oversized manifest (> 16384 bytes) fails closed before parsing
    writeFileSync(manifestPath, JSON.stringify({ ...originalManifest, padding: 'x'.repeat(17000) }));
    await assert.rejects(verifyDatabaseSnapshot(root, snapshot.directory), /Snapshot manifest is too large\./);

    // 3. Manifest byteLength exceeding 64 MiB limit fails closed
    writeFileSync(manifestPath, JSON.stringify({ ...originalManifest, byteLength: 64 * 1024 * 1024 + 1 }));
    await assert.rejects(verifyDatabaseSnapshot(root, snapshot.directory), /Snapshot manifest is unsupported or invalid\./);

    // Positive control: restoring the exact original manifest passes verification
    writeFileSync(manifestPath, originalManifestText);
    const verified = await verifyDatabaseSnapshot(root, snapshot.directory);
    assert.deepEqual(verified.counts, originalManifest.counts);

    // 4. Database containing a VIEW or TRIGGER is rejected during both snapshot creation and snapshot verification
    const snapshotDb = new DatabaseSync(join(snapshot.directory, 'database.sqlite'));
    try {
      snapshotDb.exec('CREATE VIEW v_workspaces AS SELECT mode FROM workspaces;');
    } finally {
      snapshotDb.close();
    }
    const viewDbBytes = readFileSync(join(snapshot.directory, 'database.sqlite'));
    const viewSha256 = createHash('sha256').update(viewDbBytes).digest('hex');
    writeFileSync(
      manifestPath,
      JSON.stringify({ ...originalManifest, byteLength: viewDbBytes.byteLength, sha256: viewSha256 })
    );
    await assert.rejects(verifyDatabaseSnapshot(root, snapshot.directory), /unsupported triggers or views/);

    writer.exec('CREATE TRIGGER tr_no_delete BEFORE DELETE ON webhook_events BEGIN SELECT RAISE(ABORT, "blocked"); END;');
    await assert.rejects(createDatabaseSnapshot(root, source), /unsupported triggers or views/);
  } finally {
    writer.close();
  }
});

test('PA-3 Scenario 3: partial snapshot folders and unexpected snapshot WAL sidecars fail closed', async () => {
  const { root, source, writer } = createFictionalWorkspaceFixture();
  try {
    // 1. Interrupted snapshot containing only database.partial.sqlite (no database.sqlite or manifest.json)
    const backupsDir = join(root, 'data', 'backups');
    mkdirSync(backupsDir, { recursive: true });
    const partialDir = mkdtempSync(join(backupsDir, 'snapshot-partial-'));
    writeFileSync(join(partialDir, 'database.partial.sqlite'), readFileSync(source));
    await assert.rejects(verifyDatabaseSnapshot(root, partialDir));
    await assert.rejects(createRecoveryCopy(root, partialDir));
    assert.equal(existsSync(join(root, 'data', 'recovery')), false);

    // 2. Valid snapshot that acquires an unexpected -wal sidecar is rejected
    const validSnapshot = await createDatabaseSnapshot(root, source);
    const snapshotWalPath = join(validSnapshot.directory, 'database.sqlite-wal');
    writeFileSync(snapshotWalPath, 'unexpected-wal-bytes');
    await assert.rejects(verifyDatabaseSnapshot(root, validSnapshot.directory), /unexpected SQLite sidecars/);
    await assert.rejects(createRecoveryCopy(root, validSnapshot.directory), /unexpected SQLite sidecars/);
    assert.equal(existsSync(join(root, 'data', 'recovery')), false);

    // Positive control: removing the stray -wal sidecar allows verification and offline recovery to succeed
    rmSync(snapshotWalPath);
    const recovered = await createRecoveryCopy(root, validSnapshot.directory);
    assert.equal(existsSync(join(recovered.directory, 'RECOVERY_REVIEW_REQUIRED.json')), true);

  } finally {
    writer.close();
  }
});

test('PA-3 source sidecar symlinks are rejected where file symlink creation is permitted', async t => {
  const { root, source, writer } = createFictionalWorkspaceFixture();
  try {
    const validSnapshot = await createDatabaseSnapshot(root, source);
    const outsideTarget = join(root, 'outside-shm-target');
    writeFileSync(outsideTarget, 'fake-shm');
    const copySource = join(root, 'data', 'copy-source.sqlite');
    writeFileSync(copySource, readFileSync(join(validSnapshot.directory, 'database.sqlite')));
    try { symlinkSync(outsideTarget, copySource + '-shm'); }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (['EPERM', 'EACCES', 'ENOSYS'].includes(code || '')) {
        t.skip('File-symlink creation is unavailable; actual sidecar-symlink verification remains pending.');
        return;
      }
      throw error;
    }
    await assert.rejects(createDatabaseSnapshot(root, copySource), /Database sidecars must not be symbolic links\./);
  } finally {
    writer.close();
  }
});

test('PA-3 Scenario 4: simulated Render config and storage boundaries vs. actual Linux runtime gate', async () => {
  const { root, source, writer } = createFictionalWorkspaceFixture();
  try {
    const baseEnv = {
      RENDER: 'true',
      NODE_ENV: 'production' as const,
      NUDGE_MODE: 'sandbox',
      NUDGE_ADMIN_TOKEN: 'fictional-owner-admin-token-24chars-min',
      NUDGE_DB_PATH: '/var/data/nudge.sqlite',
      NUDGE_AI_ENABLED: 'false',
      PORT: '10000',
    };

    // Port boundary checks
    assert.equal(renderPort({ PORT: '1' }), '1');
    assert.equal(renderPort({ PORT: '65535' }), '65535');
    assert.throws(() => renderPort({ PORT: '0' }), /valid TCP port/);
    assert.throws(() => renderPort({ PORT: '65536' }), /valid TCP port/);

    // Mountinfo parsing: octal-escaped space (\040) on a different mount Does NOT falsely satisfy /var/data, while exact /var/data mount passes
    const mountWithEscapedSibling = '120 30 8:1 / /var/data\\040backup rw,relatime - ext4 /dev/sda1 rw\n';
    assert.throws(() => validateRenderConfig(baseEnv, mountWithEscapedSibling), /Persistent disk mount not detected/);

    const mountSubpathOnly = '120 30 8:1 / /var/data/subpath rw,relatime - ext4 /dev/sda1 rw\n';
    assert.throws(() => validateRenderConfig(baseEnv, mountSubpathOnly), /Persistent disk mount not detected/);

    const mountWithoutSeparator = '120 30 8:1 / /var/data rw,relatime ext4 /dev/sda1 rw\n';
    assert.throws(() => validateRenderConfig(baseEnv, mountWithoutSeparator), /Persistent disk mount not detected/);

    const validMultiLineMount = [
      '22 1 8:1 / / rw,relatime - ext4 /dev/root rw',
      mountWithEscapedSibling.trim(),
      '121 22 8:2 / /var/data rw,noatime - ext4 /dev/sdb1 rw',
    ].join('\n');
    assert.deepEqual(validateRenderConfig(baseEnv, validMultiLineMount), { port: '10000' });

    // Simulated Render storage directory maintenance operation
    const simulatedDisk = join(root, 'simulated-var-data');
    mkdirSync(simulatedDisk);
    // Copy the verified standalone snapshot, never just the main file of a live WAL database.
    const standalone = await createDatabaseSnapshot(root, source);
    writeFileSync(join(simulatedDisk, 'nudge.sqlite'), readFileSync(join(standalone.directory, 'database.sqlite')));
    const backupOp = await renderMaintenanceOperation(root, simulatedDisk, ['backup']);
    const relSnapshot = 'backups/' + basename(backupOp.result.directory);
    const verifyOp = await renderMaintenanceOperation(root, simulatedDisk, ['verify', '--snapshot', relSnapshot]);
    assert.equal(verifyOp.result.counts.pendingWorkspaces, 1);
    const restoreOp = await renderMaintenanceOperation(root, simulatedDisk, ['restore', '--snapshot', relSnapshot, '--confirm-offline-copy']);
    assert.equal(readdirSync(join(simulatedDisk, 'recovery')).length, 1);
    assert.equal(existsSync(join(restoreOp.result.directory, 'RECOVERY_REVIEW_REQUIRED.json')), true);

    // Platform boundary check: on non-Linux hosts, start-render.mjs with clean argv (length === 2) still refuses startup
    if (process.platform !== 'linux') {
      const startAttempt = spawnSync(process.execPath, [resolve('scripts/start-render.mjs')], {
        env: { SystemRoot: process.env.SystemRoot, ...baseEnv },
        encoding: 'utf8',
        timeout: 5000,
      });
      assert.equal(startAttempt.status, 1);
      assert.equal(startAttempt.stdout, '');
      assert.match(startAttempt.stderr, /Hosted startup refused/);
      assert.equal(startAttempt.stderr.includes(baseEnv.NUDGE_ADMIN_TOKEN), false);
    }
  } finally {
    writer.close();
  }
});
