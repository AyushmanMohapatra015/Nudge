import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { paypalUsdCents, reconcileInvoice } from '../lib/paypal';
import type { Invoice } from '../lib/domain';
import { POST as ownerPost } from '../app/api/workspace/route';
import { POST as webhookPost } from '../app/api/paypal/webhook/route';
import { read, mutate, db } from '../lib/store';
import { reconcileOutstanding } from '../lib/reconciliation';
import { sessionToken } from '../lib/auth';

const invoice: Invoice = { id: 'INV2-INTEGRITY', proposalId: 'base', status: 'DRAFT', amountCents: 1000, outstandingCents: 1000, createdAt: '2026-10-04', dueDate: '2026-10-11', reminders: 0, pendingSend: { key: 'uncertain-send', startedAt: '2026-10-04' } };
const snapshot = () => ({ id: invoice.id, status: 'PARTIALLY_PAID', detail: { currency_code: 'USD' }, amount: { currency_code: 'USD', value: '10.00' }, due_amount: { currency_code: 'USD', value: '6.01' } });

test('PayPal USD amounts parse exactly including zero and reject rounding, unsafe numbers and foreign currency', () => {
  for (const [value, cents] of [['0', 0], ['0.01', 1], ['6.01', 601], ['10.1', 1010], ['100000.00', 10000000]] as const) assert.equal(paypalUsdCents(value, 'USD'), cents);
  for (const value of ['-1', '1.001', '1e2', 'NaN', 'Infinity', '1,000', ' 1.00 ', '01.00', '100000.01', '9007199254740993', 1.00, null, undefined]) assert.throws(() => paypalUsdCents(value, 'USD'));
  for (const currency of ['INR', 'EUR', 'usd', null, undefined]) assert.throws(() => paypalUsdCents('10.00', currency));
});

test('invoice reconciliation rejects incorrect identity, changed approved totals and conflicting balances without releasing markers', () => {
  const remote = snapshot();
  const invalid = [
    { ...remote, id: 'INV2-WRONG' }, { ...remote, id: undefined }, { ...remote, amount: undefined },
    { ...remote, amount: { currency_code: 'USD', value: '12.00' } },
    { ...remote, amount: { currency_code: 'INR', value: '10.00' } },
    { ...remote, detail: { currency_code: 'INR' } },
    { ...remote, due_amount: { currency_code: 'USD', value: '10.01' } },
    { ...remote, due_amount: { currency_code: 'EUR', value: '6.01' } },
    { ...remote, due_amount: { currency_code: 'USD', value: '6.001' } },
    { ...remote, status: 'PAID' }, { ...remote, status: 'PARTIALLY_PAID', due_amount: undefined },
    { ...remote, due_amount: { currency_code: 'USD', value: '0.00' } },
    { ...remote, due_amount: { currency_code: 'USD', value: '10.00' } },
    { ...remote, status: 'SENT' }, { ...remote, status: 'UNPAID', due_amount: undefined },
    { ...remote, status: null },
  ];
  const original = structuredClone(invoice);
  for (const input of invalid) { assert.throws(() => reconcileInvoice(invoice, input)); assert.deepEqual(invoice, original); }
});

test('valid partial, paid, cancelled and unknown states retain correct financial and pending-send behavior', () => {
  const remote = snapshot();
  const partial = reconcileInvoice(invoice, remote);
  assert.equal(partial.status, 'PARTIALLY_PAID'); assert.equal(partial.outstandingCents, 601); assert.equal(partial.pendingSend, undefined);
  const paid = reconcileInvoice(invoice, { ...remote, status: 'PAID', due_amount: { currency_code: 'USD', value: '0.00' } });
  assert.equal(paid.outstandingCents, 0); assert.equal(paid.status, 'PAID');
  const cancelled = reconcileInvoice(invoice, { ...remote, status: 'CANCELLED', due_amount: { currency_code: 'USD', value: '10.00' } });
  assert.equal(cancelled.outstandingCents, 0); assert.equal(cancelled.status, 'CANCELLED', 'cancellation is not payment');
  const unknown = reconcileInvoice(invoice, { ...remote, status: 'MARKED_AS_PAID', due_amount: { currency_code: 'USD', value: '0.00' } });
  assert.equal(unknown.status, 'OTHER'); assert.ok(unknown.pendingSend, 'unsupported state cannot authorize another send');
});

test('invalid provider amounts cannot alter payment state via owner sync, fallback or signed webhook; corrected delivery can retry', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]])), originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/payment-integrity-${randomUUID()}.sqlite`, NUDGE_ADMIN_TOKEN: 'fictional-owner-secret-long-enough', PAYPAL_CLIENT_ID: 'mock-id', PAYPAL_CLIENT_SECRET: 'mock-secret', PAYPAL_WEBHOOK_ID: 'mock-webhook' });
  let total = '12.00';
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'mock-token', expires_in: 3600 });
    if (url.endsWith('/verify-webhook-signature')) return Response.json({ verification_status: 'SUCCESS' });
    if (url.endsWith(`/invoices/${invoice.id}`)) return Response.json({ ...snapshot(), status: 'PAID', amount: { currency_code: 'USD', value: total }, due_amount: { currency_code: 'USD', value: '0.00' } });
    throw new Error('Unexpected mocked request');
  };
  const webhook = () => webhookPost(new NextRequest('http://localhost:3000/api/paypal/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.sandbox.paypal.com/test', 'paypal-transmission-id': 'mock', 'paypal-transmission-sig': 'mock', 'paypal-transmission-time': '2026-10-04T00:00:00Z' }, body: JSON.stringify({ id: 'integrity-event', event_type: 'INVOICING.INVOICE.PAID', resource: { id: invoice.id } }) }));
  try {
    mutate(s => { s.invoices = [structuredClone(invoice)]; });
    const original = read();
    await reconcileOutstanding(undefined, 100000);
    assert.deepEqual(read(), original, 'invalid background data retains the last known state');
    const result = await ownerPost(new NextRequest('http://localhost:3000/api/workspace', { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', cookie: `nudge_session=${sessionToken()}`, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'syncInvoice', id: invoice.id }) }));
    assert.equal(result.status, 400); assert.deepEqual(read().invoices, original.invoices);
    assert.equal((await webhook()).status, 503);
    assert.equal(db().prepare('SELECT id FROM webhook_events WHERE id = ?').get('integrity-event'), undefined);
    assert.deepEqual(read().invoices, original.invoices);
    total = '10.00';
    assert.equal((await webhook()).status, 200);
    assert.equal(read().invoices[0].status, 'PAID'); assert.equal(read().invoices[0].outstandingCents, 0);
    assert.equal(read().invoices[0].pendingSend, undefined);
    assert.deepEqual(await (await webhook()).json(), { duplicate: true });
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
