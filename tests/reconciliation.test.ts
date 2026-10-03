import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { reconcileOutstanding } from '../lib/reconciliation';
import { mutate, read } from '../lib/store';

test('automatic recovery throttles reads, records authoritative payment, and preserves newer actions', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH;
  process.env.NUDGE_MODE = 'sandbox';
  process.env.NUDGE_DB_PATH = `./data/recovery-${randomUUID()}.sqlite`;
  const id = 'INV2-RECOVERY-TEST';
  try {
    mutate(s => { s.invoices = [{ id, proposalId: 'base', status: 'UNPAID', amountCents: 100, outstandingCents: 100, createdAt: new Date().toISOString(), dueDate: '2026-10-10', reminders: 0 }]; });
    let calls = 0;
    await reconcileOutstanding(async invoice => { calls++; return { ...invoice, status: 'PAID', outstandingCents: 0 }; }, 100000);
    assert.equal(read().invoices[0].status, 'PAID');
    assert.equal(read().audit[0].actor, 'PayPal reconciliation');
    await reconcileOutstanding(async invoice => { calls++; return invoice; }, 100001);
    assert.equal(calls, 1);
    mutate(s => { s.invoices[0].status = 'UNPAID'; s.invoices[0].outstandingCents = 100; });
    await reconcileOutstanding(async invoice => { mutate(s => { s.invoices[0].reminders = 2; }); return { ...invoice, status: 'PAID', outstandingCents: 0 }; }, 140000);
    assert.equal(read().invoices[0].status, 'UNPAID');
    assert.equal(read().invoices[0].reminders, 2);
    await reconcileOutstanding(async () => { throw Error('Temporary sandbox failure'); }, 180000);
    assert.equal(read().invoices[0].status, 'UNPAID');
    await reconcileOutstanding(async invoice => ({ ...invoice, status: 'PAID', outstandingCents: 0 }), 220000);
    assert.equal(read().invoices[0].status, 'PAID');
  } finally {
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
