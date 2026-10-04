import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { NextRequest } from 'next/server';
import { processingOwner, processingRecovery } from '../lib/processing';
import { mutate, mutateOwned, read, cacheOperation, cachedOperation } from '../lib/store';
import { POST } from '../app/api/workspace/route';

test('process recovery requires positive exit evidence, never age or permission failure', () => {
  const lock = { key: 'test', operation: 'analyze', startedAt: '2000-01-01', owner: processingOwner() };
  assert.equal(processingRecovery(lock).status, 'running');
  assert.equal(processingRecovery({ ...lock, owner: undefined }).status, 'unknown');
  assert.equal(processingRecovery({ ...lock, owner: { ...lock.owner, host: 'different-host' } }).status, 'unknown');
  assert.equal(processingRecovery(lock, () => { throw Object.assign(new Error('denied'), { code: 'EPERM' }); }).status, 'unknown');
  assert.equal(processingRecovery(lock, () => { throw Object.assign(new Error('exited'), { code: 'ESRCH' }); }).status, 'exited');
});

test('confirmed dead-process recovery preserves uncertain attempts and rejects stale, live and unverified locks', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH, originalFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'demo'; process.env.NUDGE_DB_PATH = `./data/processing-${randomUUID()}.sqlite`;
  globalThis.fetch = async () => { throw new Error('Network forbidden'); };
  const invoke = (body: unknown) => POST(new NextRequest('http://localhost:3000/api/workspace', { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  try {
    const action = { type: 'recoverProcessing', key: 'interrupted', confirmed: true, note: 'Reviewed the interruption; will verify remote state before any new send.' };
    mutate(s => { s.processing = { key: 'interrupted', operation: 'sendInvoice', startedAt: '2000-01-01', owner: processingOwner() }; });
    assert.equal((await invoke(action)).status, 400);
    mutate(s => { delete s.processing!.owner; });
    assert.equal((await invoke(action)).status, 400);
    const child = spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore', windowsHide: true });
    const pid = child.pid!;
    await once(child, 'exit');
    mutate(s => {
      s.processing!.owner = { ...processingOwner(), pid };
      s.invoices = [{ id: 'SIM-INTERRUPTED', proposalId: 'base', status: 'DRAFT', amountCents: 10000, outstandingCents: 10000, createdAt: '2026-10-04', dueDate: '2026-10-11', reminders: 0,
        pendingSend: { key: 'interrupted', startedAt: '2026-10-04' }, pendingReminder: { draftId: 'uncertain-reminder', startedAt: '2026-10-04' } }];
    });
    cacheOperation('attempt-invoice-recovery-test', { invoiceNumber: 'N-original' });
    assert.equal((await invoke({ ...action, key: 'stale' })).status, 400);
    assert.equal((await invoke({ ...action, confirmed: false })).status, 400);
    assert.equal((await invoke(action)).status, 200);
    assert.equal(read().processing, undefined);
    assert.ok(read().invoices[0].pendingSend); assert.ok(read().invoices[0].pendingReminder);
    assert.equal(read().invoices[0].reminders, 0);
    assert.deepEqual(cachedOperation('attempt-invoice-recovery-test'), { invoiceNumber: 'N-original' });
    assert.match(read().audit[0].detail, /no automatic replay/);
    assert.equal((await invoke(action)).status, 400);
    assert.equal((await invoke({ type: 'sendInvoice', id: 'SIM-INTERRUPTED' })).status, 400);
    mutate(s => { s.processing = { key: 'new-owner', operation: 'analyze', startedAt: '2026-10-04', owner: processingOwner() }; });
    const before = read();
    assert.throws(() => mutateOwned('old-owner', s => { s.agreement.title = 'Stale mutation'; }), /ownership changed/);
    assert.deepEqual(read(), before);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
