import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/paypal/webhook/route';
import { db, mutate, read } from '../lib/store';
import { createWebhookRelay } from '../scripts/webhook-relay.mjs';

test('webhook rejects forged events, reconciles partial payments, deduplicates and retries busy workspaces', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/webhook-test-${randomUUID()}.sqlite`, PAYPAL_CLIENT_ID: 'test', PAYPAL_CLIENT_SECRET: 'test', PAYPAL_WEBHOOK_ID: 'test-webhook' });
  let verification = 'FAILURE';
  let lookups = 0;
  let remoteStatus = 'PARTIALLY_PAID';
  const invoiceId = 'INV2-WEBHOOK-TEST';
  globalThis.fetch = async (input) => {
    const url = String(input);
    assert.ok(url.startsWith('https://api-m.sandbox.paypal.com/'));
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'test', expires_in: 3600 });
    if (url.endsWith('/verify-webhook-signature')) return Response.json({ verification_status: verification });
    if (url.endsWith(`/invoices/${invoiceId}`)) { lookups++; return Response.json({ status: remoteStatus, due_amount: { value: '4.00' } }); }
    throw Error('Unexpected request');
  };
  const headers = { 'content-type': 'application/json', 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.sandbox.paypal.com/test', 'paypal-transmission-id': 'test', 'paypal-transmission-sig': 'test', 'paypal-transmission-time': new Date().toISOString() };
  const request = (id: string, signed = true) => new NextRequest('http://localhost/api/paypal/webhook', { method: 'POST', headers: signed ? headers : { 'content-type': 'application/json' }, body: JSON.stringify({ id, event_type: 'INVOICING.INVOICE.PAID', resource: { id: invoiceId, status: 'PAID' } }) });
  try {
    mutate(s => { s.invoices.push({ id: invoiceId, proposalId: 'base', status: 'UNPAID', amountCents: 1000, outstandingCents: 1000, createdAt: new Date().toISOString(), dueDate: '2026-10-10', reminders: 0 }); });
    assert.equal((await POST(request('missing', false))).status, 401);
    assert.equal((await POST(request('forged'))).status, 401);
    assert.equal(lookups, 0);
    verification = 'SUCCESS';
    assert.equal((await POST(request('valid'))).status, 200);
    assert.equal(read().invoices[0].status, 'PARTIALLY_PAID');
    assert.equal(read().invoices[0].outstandingCents, 400);
    const version = read().version;
    assert.deepEqual(await (await POST(request('valid'))).json(), { duplicate: true });
    assert.equal(read().version, version);
    assert.equal(lookups, 1);
    mutate(s => { s.processing = { key: 'busy', operation: 'test', startedAt: new Date().toISOString() }; });
    remoteStatus = 'PAID';
    assert.equal((await POST(request('retry'))).status, 503);
    assert.equal(db().prepare('SELECT id FROM webhook_events WHERE id = ?').get('retry'), undefined);
    mutate(s => { delete s.processing; });
    assert.equal((await POST(request('retry'))).status, 200);
    assert.equal(read().invoices[0].status, 'PAID');
    assert.equal(read().invoices[0].outstandingCents, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});

test('relay forwards only webhook POSTs without cookies or authorization', async () => {
  let forwarded = 0;
  const relay = createWebhookRelay('http://127.0.0.1:3000', async (url, init) => {
    forwarded++;
    assert.equal(url, 'http://127.0.0.1:3000/api/paypal/webhook');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('cookie'), null);
    assert.equal(headers.get('authorization'), null);
    assert.equal(headers.get('paypal-transmission-id'), 'test');
    assert.equal(Buffer.from(init?.body as Uint8Array).toString(), '{"test":true}');
    return Response.json({ received: true });
  });
  await new Promise<void>(resolve => relay.listen(0, '127.0.0.1', resolve));
  const address = relay.address();
  assert.ok(address && typeof address !== 'string');
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    for (const path of ['/', '/api/workspace', '/api/session', '/api/paypal/webhook?extra=1']) assert.equal((await fetch(origin + path)).status, 404);
    assert.equal((await fetch(origin + '/api/paypal/webhook')).status, 405);
    const response = await fetch(origin + '/api/paypal/webhook', { method: 'POST', headers: { cookie: 'secret', authorization: 'secret', 'paypal-transmission-id': 'test' }, body: '{"test":true}' });
    assert.equal(response.status, 200);
    assert.equal(forwarded, 1);
    assert.equal((await fetch(origin + '/api/paypal/webhook', { method: 'POST', body: 'x'.repeat(262145) })).status, 413);
    assert.equal(forwarded, 1);
  } finally { relay.closeAllConnections(); await new Promise<void>(resolve => relay.close(() => resolve())); }
});
