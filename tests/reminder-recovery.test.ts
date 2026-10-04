import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/workspace/route';
import { mutate, read, seed } from '../lib/store';
import { sessionToken } from '../lib/auth';

test('uncertain sandbox reminder blocks retries and replacement drafts; confirmed sends clear the block', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/reminder-recovery-${randomUUID()}.sqlite`,
    NUDGE_ADMIN_TOKEN: 'fictional-test-admin-secret-long-enough', PAYPAL_CLIENT_ID: 'test-id', PAYPAL_CLIENT_SECRET: 'test-secret' });
  let sends = 0, loseResponse = true;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'test-token', expires_in: 3600 });
    if (url.endsWith('/INV2-REMINDER-TEST/remind')) {
      assert.equal(init?.method, 'POST');
      assert.ok(read().invoices[0].pendingReminder, 'attempt must be persisted before network send');
      sends++;
      if (loseResponse) throw new Error('Reminder response lost');
      return new Response(null, { status: 202 });
    }
    if (url.endsWith('/INV2-REMINDER-TEST')) return Response.json({ id: 'INV2-REMINDER-TEST', amount: { currency_code: 'USD', value: '100.00' }, status: 'SENT', due_amount: { currency_code: 'USD', value: '100.00' } });
    throw new Error('Unexpected mocked request');
  };
  const invoke = (body: unknown) => POST(new NextRequest('http://localhost:3000/api/workspace', {
    method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000',
      cookie: `nudge_session=${sessionToken()}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));
  const setup = () => mutate(s => {
    Object.assign(s, seed());
    s.invoices = [{ id: 'INV2-REMINDER-TEST', proposalId: 'base', status: 'UNPAID', amountCents: 10000, outstandingCents: 10000,
      createdAt: '2020-01-01T00:00:00Z', dueDate: '2020-01-02', reminders: 0 }];
  });
  try {
    setup();
    assert.equal((await invoke({ type: 'draftReminder', id: 'INV2-REMINDER-TEST' })).status, 200);
    let draft = read().reminderDraft!;
    assert.equal((await invoke({ type: 'sendReminder', id: draft.id, note: draft.note })).status, 400);
    assert.equal(read().invoices[0].pendingReminder?.draftId, draft.id);
    assert.equal(read().invoices[0].reminders, 0);
    assert.equal(read().processing, undefined);
    let response = await invoke({ type: 'sendReminder', id: draft.id, note: draft.note });
    assert.match((await response.json()).error, /uncertain delivery/);
    assert.equal(sends, 1);

    assert.equal((await invoke({ type: 'syncInvoice', id: 'INV2-REMINDER-TEST' })).status, 200);
    assert.ok(read().invoices[0].pendingReminder, 'payment reconciliation cannot prove reminder delivery');
    await invoke({ type: 'dismissReminder', id: draft.id });
    response = await invoke({ type: 'draftReminder', id: 'INV2-REMINDER-TEST' });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /uncertain delivery/);
    assert.equal(sends, 1);
    const review = { type: 'resolveReminder', id: 'INV2-REMINDER-TEST', draftId: draft.id,
      outcome: 'countAsSent', evidence: 'Uncertain delivery: conservatively counting the attempted reminder as sent.', confirmed: true };
    assert.equal((await invoke({ ...review, confirmed: false })).status, 400);
    assert.equal((await invoke({ ...review, evidence: 'guess' })).status, 400);
    assert.equal((await invoke({ ...review, draftId: 'stale-attempt' })).status, 400);
    assert.ok(read().invoices[0].pendingReminder);
    assert.equal((await invoke(review)).status, 200);
    assert.equal(read().invoices[0].pendingReminder, undefined);
    assert.equal(read().invoices[0].reminders, 1);
    assert.match(read().audit[0].detail, /not API-verified delivery/);
    assert.equal((await invoke(review)).status, 400);
    assert.equal(read().invoices[0].reminders, 1);
    response = await invoke({ type: 'draftReminder', id: 'INV2-REMINDER-TEST' });
    assert.match((await response.json()).error, /cooldown/);
    assert.equal(sends, 1);

    setup();
    await invoke({ type: 'draftReminder', id: 'INV2-REMINDER-TEST' });
    draft = read().reminderDraft!;
    await invoke({ type: 'sendReminder', id: draft.id, note: draft.note });
    assert.equal((await invoke({ ...review, draftId: draft.id, outcome: 'confirmedNotSent', evidence: 'Fictional support response confirms this attempt was rejected before sending.' })).status, 200);
    assert.equal(read().invoices[0].reminders, 0);
    assert.equal(read().reminderDraft, undefined);
    assert.equal(sends, 2, 'review must not send another reminder');
    assert.equal((await invoke({ type: 'draftReminder', id: 'INV2-REMINDER-TEST' })).status, 200);
    assert.notEqual(read().reminderDraft!.id, draft.id);

    setup(); // Separate fixture, not an operator instruction to clear uncertain outcomes.
    loseResponse = false;
    await invoke({ type: 'draftReminder', id: 'INV2-REMINDER-TEST' });
    draft = read().reminderDraft!;
    assert.equal((await invoke({ type: 'sendReminder', id: draft.id, note: draft.note })).status, 200);
    assert.equal(read().invoices[0].reminders, 1);
    assert.equal(read().invoices[0].pendingReminder, undefined);
    assert.equal(read().reminderDraft, undefined);
    assert.equal(sends, 3);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
