import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { reconcileOutstanding } from '../lib/reconciliation';
import { mutate, read } from '../lib/store';
import type { Invoice } from '../lib/domain';

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

test('automatic recovery throttles reads, records authoritative payment, and preserves newer actions', async t => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH;
  const oldFetch = globalThis.fetch; let unexpectedFetches = 0;
  globalThis.fetch = async () => { unexpectedFetches++; throw Error('Network forbidden in reconciliation tests.'); };
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

    await t.test('concurrent callers wait for one lookup even beyond the throttle interval', async () => {
      mutate(s => { s.invoices[0].status = 'UNPAID'; s.invoices[0].outstandingCents = 100; });
      const before = read(), remote = deferred<Invoice>(); let lookups = 0, leaderDone = false, followerDone = false;
      const lookup = async () => { lookups++; return remote.promise; };
      const leader = reconcileOutstanding(lookup, 300000).then(() => { leaderDone = true; });
      // More than 30 seconds later: the throttle alone cannot hide a missing
      // in-flight guard. Both calls must remain pending until remote release.
      const follower = reconcileOutstanding(lookup, 340001).then(() => { followerDone = true; });
      try {
        await nextTurn();
        assert.equal(lookups, 1, 'only the leader starts an authoritative lookup');
        assert.equal(leaderDone, false); assert.equal(followerDone, false);
        assert.deepEqual(read(), before, 'unresolved lookup changes no workspace state');
      } finally {
        remote.resolve({ ...before.invoices[0], status: 'PAID', outstandingCents: 0 });
        await Promise.allSettled([leader, follower]);
      }
      await Promise.all([leader, follower]);
      const after = read();
      assert.equal(leaderDone, true); assert.equal(followerDone, true); assert.equal(lookups, 1);
      assert.equal(after.invoices[0].status, 'PAID'); assert.equal(after.invoices[0].outstandingCents, 0);
      assert.equal(after.version, before.version + 1); assert.equal(after.audit.length, before.audit.length + 1);
      assert.equal(after.audit[0].actor, 'PayPal reconciliation'); assert.deepEqual(after.audit.slice(1), before.audit);
      assert.deepEqual(after.agreement, before.agreement); assert.deepEqual(after.policies, before.policies);
    });

    await t.test('shared lookup failure preserves state and releases the in-flight slot for later recovery', async () => {
      mutate(s => { s.invoices[0].status = 'UNPAID'; s.invoices[0].outstandingCents = 100; });
      const before = read(), remote = deferred<Invoice>(); let lookups = 0, followerDone = false;
      const lookup = async () => { lookups++; return remote.promise; };
      const leader = reconcileOutstanding(lookup, 400000);
      const follower = reconcileOutstanding(lookup, 440001).then(() => { followerDone = true; });
      try {
        await nextTurn();
        assert.equal(lookups, 1); assert.equal(followerDone, false);
        assert.deepEqual(read(), before);
      } finally {
        remote.reject(Error('Fictional unavailable provider.'));
        await Promise.allSettled([leader, follower]);
      }
      await Promise.all([leader, follower]);
      assert.equal(followerDone, true); assert.deepEqual(read(), before, 'failed lookup creates no audit or version change');
      await reconcileOutstanding(async invoice => { lookups++; return { ...invoice, status: 'PAID', outstandingCents: 0 }; }, 440002);
      const recovered = read();
      assert.equal(lookups, 2); assert.equal(recovered.invoices[0].status, 'PAID');
      assert.equal(recovered.invoices[0].outstandingCents, 0); assert.equal(recovered.version, before.version + 1);
      assert.equal(recovered.audit.length, before.audit.length + 1); assert.deepEqual(recovered.audit.slice(1), before.audit);
    });
    assert.equal(unexpectedFetches, 0, 'no network/provider fetch was attempted');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
