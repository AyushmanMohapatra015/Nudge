import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { preparePaymentWebhookFixture } from '../scripts/prepare-payment-webhook';
import { mutate, read } from '../lib/store';

test('fresh payment fixture needs confirmation and registered sandbox, creates only one draft, and never sends or pays', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'PAYPAL_WEBHOOK_ID', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]])), fetchBefore = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/payment-fixture-${randomUUID()}.sqlite`, PAYPAL_CLIENT_ID: 'mock-id', PAYPAL_CLIENT_SECRET: 'mock-secret', PAYPAL_MERCHANT_EMAIL: 'merchant@example.com' });
  delete process.env.PAYPAL_WEBHOOK_ID;
  let creates = 0, calls = 0, failDetailsOnce = true;
  globalThis.fetch = async (input, init) => {
    calls++; const url = String(input);
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'mock-token', expires_in: 3600 });
    if (url.endsWith('/v2/invoicing/invoices') && init?.method === 'POST') {
      creates++; const body = JSON.parse(String(init.body));
      assert.equal(body.detail.currency_code, 'USD'); assert.equal(body.items[0].unit_amount.value, '1.00');
      assert.equal(body.primary_recipients[0].billing_info.email_address, 'sb-fictional@personal.example.com');
      assert.equal(read().processing?.owner?.pid, process.pid);
      return Response.json({ id: 'INV2-FRESH-FIXTURE' });
    }
    if (url.endsWith('/INV2-FRESH-FIXTURE') && init?.method === 'GET') {
      if (failDetailsOnce) { failDetailsOnce = false; throw Error('Lost follow-up details response'); }
      return Response.json({ id: 'INV2-FRESH-FIXTURE', status: 'DRAFT', amount: { currency_code: 'USD', value: '1.00' }, due_amount: { currency_code: 'USD', value: '1.00' } });
    }
    throw Error('Unexpected request: sending or paying is forbidden in this test.');
  };
  try {
    await assert.rejects(preparePaymentWebhookFixture(false), /confirmation/);
    await assert.rejects(preparePaymentWebhookFixture(true), /registration/);
    assert.equal(calls, 0);
    mutate(s => { s.agreement.title = 'Sandbox integration test'; s.invoices = [{ id: '[historical sandbox invoice redacted]', proposalId: 'base', status: 'PAID', amountCents: 1000, outstandingCents: 0, recipientEmail: 'sb-fictional@personal.example.com', createdAt: '2026-10-04', dueDate: '2026-10-11', reminders: 0 }]; });
    process.env.PAYPAL_WEBHOOK_ID = 'mock-registration';
    await assert.rejects(preparePaymentWebhookFixture(true), /PayPal request failed or timed out/);
    assert.equal(read().invoices.length, 1); assert.equal(read().processing, undefined);
    const result = await preparePaymentWebhookFixture(true);
    assert.equal(result.status, 'DRAFT'); assert.equal(result.sentByScript, false); assert.equal(result.paidByScript, false);
    assert.equal(read().invoices.length, 2); assert.equal(read().processing, undefined);
    const saved = structuredClone(read());
    await assert.rejects(preparePaymentWebhookFixture(true), /already exists/);
    assert.deepEqual(read(), saved); assert.equal(creates, 1);
  } finally { globalThis.fetch = fetchBefore; for (const n of names) { if (before[n] === undefined) delete process.env[n]; else process.env[n] = before[n]; } }
});
