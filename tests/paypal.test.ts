import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createInvoice, verifyWebhook } from '../lib/paypal';
import type { Agreement, Proposal } from '../lib/domain';

test('invoice identity survives a failing follow-up; webhook signature failures stay rejected', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL', 'PAYPAL_WEBHOOK_ID'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]])); const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/adapter-test-${randomUUID()}.sqlite`, PAYPAL_CLIENT_ID: 'test-id', PAYPAL_CLIENT_SECRET: 'test-secret', PAYPAL_MERCHANT_EMAIL: 'merchant@example.com', PAYPAL_WEBHOOK_ID: 'webhook-test' });
  let creates = 0; let verification = 'FAILURE'; let verificationPayload: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'test-token', expires_in: 3600 });
    if (url.endsWith('/v2/invoicing/invoices') && init?.method === 'POST') {
      creates++; const body = JSON.parse(String(init.body));
      assert.equal(body.items[0].unit_amount.value, '300.00');
      assert.equal(body.primary_recipients[0].billing_info.email_address, 'buyer@example.com');
      const headers = new Headers(init.headers); assert.equal(headers.get('PayPal-Request-Id')?.length, 32);
      return Response.json({ id: 'INV2-TEST-0001', links: [] }, { status: 201 });
    }
    if (url.endsWith('/v2/invoicing/invoices/INV2-TEST-0001')) return Response.json({ message: 'temporary detail lookup failure' }, { status: 503 });
    if (url.endsWith('/v1/notifications/verify-webhook-signature')) { verificationPayload = JSON.parse(String(init?.body)); return Response.json({ verification_status: verification }); }
    throw new Error(`Unexpected external request: ${url}`);
  };
  try {
    const agreement: Agreement = { title: 'Website', clientName: 'Buyer', clientEmail: 'buyer@example.com', amountCents: 120000, clauses: [{ id: 'S1', text: 'Five marketing pages.' }, { id: 'S2', text: 'No booking systems.' }] };
    const proposal: Proposal = { id: randomUUID(), request: 'Booking page', analysis: { classification: 'additional', summary: 'Booking is excluded.', references: ['S2'], questions: [], deliverables: ['Booking page'], source: 'claude' }, amountCents: 30000, deliverables: ['Booking page'], status: 'accepted' };
    await assert.rejects(createInvoice(agreement, proposal), /PayPal request failed \(503\)/);
    const invoice = await createInvoice(agreement, proposal); assert.equal(invoice.id, 'INV2-TEST-0001'); assert.equal(creates, 1);
    const event = { id: 'event1', event_type: 'INVOICING.INVOICE.PAID', resource: { id: invoice.id, status: 'PARTIALLY_PAID' } };
    assert.equal(await verifyWebhook(new Headers(), event), false);
    const headers = new Headers({ 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.paypal.com/test-cert', 'paypal-transmission-id': 'transmission1', 'paypal-transmission-sig': 'signature', 'paypal-transmission-time': '2026-10-03T10:00:00Z' });
    assert.equal(await verifyWebhook(headers, event), false);
    verification = 'SUCCESS'; assert.equal(await verifyWebhook(headers, event), true);
    assert.deepEqual(verificationPayload?.webhook_event, event);
    assert.equal(verificationPayload?.webhook_id, 'webhook-test');
    const rawBody = '{ "create_time": "2026-10-03", "id": "event1", "event_type": "INVOICING.INVOICE.PAID" }';
    const priorFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      if (String(input).endsWith('/verify-webhook-signature')) {
        assert.ok(String(init?.body).includes(`"webhook_event":${rawBody}`));
        return Response.json({ verification_status: 'SUCCESS' });
      }
      return priorFetch(input, init);
    };
    assert.equal(await verifyWebhook(headers, JSON.parse(rawBody), rawBody), true);
  } finally { globalThis.fetch = originalFetch; for (const n of names) { if (before[n] === undefined) delete process.env[n]; else process.env[n] = before[n]; } }
});
