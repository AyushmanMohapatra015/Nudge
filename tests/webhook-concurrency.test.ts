import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/paypal/webhook/route';
import { db, mutate, read } from '../lib/store';

test('overlapping verified webhook lookups cannot overwrite newer payment or uncertainty state', { timeout: 15000 }, async t => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/webhook-concurrency-${randomUUID()}.sqlite`,
    PAYPAL_CLIENT_ID: 'fictional', PAYPAL_CLIENT_SECRET: 'fictional', PAYPAL_WEBHOOK_ID: 'fictional' });
  const invoiceId = 'INV2-CONCURRENCY-FIXTURE';
  const remote = (status: string) => ({ id: invoiceId, status, amount: { currency_code: 'USD', value: '10.00' },
    due_amount: { currency_code: 'USD', value: status === 'PAID' ? '0.00' : '10.00' } });
  let remoteStatus = 'PAID', lookups = 0;
  let held: { release: () => void; entered: Promise<void>; wait: Promise<void>; markEntered: () => void; snapshot: ReturnType<typeof remote> } | undefined;
  const holdNext = (status: string) => {
    let release!: () => void, markEntered!: () => void;
    const gate = { wait: new Promise<void>(resolve => { release = resolve; }), entered: new Promise<void>(resolve => { markEntered = resolve; }),
      release: () => release(), markEntered: () => markEntered(), snapshot: remote(status) };
    held = gate;
    return gate;
  };
  globalThis.fetch = async input => {
    const url = String(input);
    assert.ok(url.startsWith('https://api-m.sandbox.paypal.com/'), 'all network calls are intercepted sandbox fixtures');
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'fictional', expires_in: 3600 });
    if (url.endsWith('/verify-webhook-signature')) return Response.json({ verification_status: 'SUCCESS' });
    if (url.endsWith(`/invoices/${invoiceId}`)) {
      lookups++;
      if (held) { const gate = held; held = undefined; gate.markEntered(); await gate.wait; return Response.json(gate.snapshot); }
      return Response.json(remote(remoteStatus));
    }
    throw Error('Unexpected mocked network request');
  };
  const request = (id: string) => new NextRequest('http://localhost/api/paypal/webhook', { method: 'POST',
    headers: { 'content-type': 'application/json', 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.sandbox.paypal.com/fictional',
      'paypal-transmission-id': 'fictional', 'paypal-transmission-sig': 'fictional', 'paypal-transmission-time': '2026-10-28T00:00:00Z' },
    body: JSON.stringify({ id, event_type: 'INVOICING.INVOICE.PAID', resource: { id: invoiceId } }) });
  const reset = (status: 'DRAFT' | 'UNPAID') => mutate(s => {
    s.processing = undefined; s.audit = [];
    s.invoices = [{ id: invoiceId, proposalId: 'base', status, amountCents: 1000, outstandingCents: 1000,
      createdAt: '2026-10-28', dueDate: '2026-11-04', reminders: 0 }];
  });
  const seen = (id: string) => db().prepare('SELECT id FROM webhook_events WHERE id = ?').get(id);
  try {
    await t.test('late unpaid lookup is retried without regressing the newer paid result', async () => {
      reset('UNPAID'); const gate = holdNext('SENT');
      const slow = POST(request('concurrent-old'));
      await gate.entered;
      try {
        assert.equal((await POST(request('concurrent-new'))).status, 200);
        const paid = read(); assert.equal(paid.invoices[0].status, 'PAID');
        gate.release();
        assert.equal((await slow).status, 503, 'stale authoritative lookup must request a fresh delivery');
        assert.deepEqual(read(), paid, 'stale delivery cannot change invoice, version or audit');
        assert.equal(seen('concurrent-old'), undefined);
        assert.equal((await POST(request('concurrent-old'))).status, 200);
        assert.equal(read().invoices[0].status, 'PAID'); assert.equal(read().invoices[0].outstandingCents, 0);
        assert.ok(seen('concurrent-old'));
        const beforeDuplicate = read(), beforeLookups = lookups;
        assert.deepEqual(await (await POST(request('concurrent-old'))).json(), { duplicate: true });
        assert.deepEqual(read(), beforeDuplicate); assert.equal(lookups, beforeLookups);
      } finally { gate.release(); await slow; }
    });
    await t.test('lookup started before an owner send attempt cannot erase its uncertain marker', async () => {
      reset('DRAFT'); const gate = holdNext('DRAFT');
      const slow = POST(request('owner-send-race'));
      await gate.entered;
      try {
        mutate(s => { s.invoices[0].pendingSend = { key: 'fictional-owner-send', startedAt: '2026-10-28T00:00:00Z' }; });
        const uncertain = read(); gate.release();
        assert.equal((await slow).status, 503);
        assert.deepEqual(read(), uncertain, 'uncertain send evidence must survive a stale lookup');
        assert.equal(seen('owner-send-race'), undefined);
      } finally { gate.release(); await slow; }
    });
    await t.test('same-event overlap remains idempotent when another delivery already committed', async () => {
      reset('UNPAID'); const gate = holdNext('SENT');
      const slow = POST(request('same-event-overlap'));
      await gate.entered;
      try {
        assert.equal((await POST(request('same-event-overlap'))).status, 200);
        const paid = read(); gate.release();
        assert.equal((await slow).status, 200);
        assert.deepEqual(read().invoices, paid.invoices); assert.deepEqual(read().audit, paid.audit);
        assert.equal(read().audit.length, 1);
        assert.equal(db().prepare('SELECT COUNT(*) AS n FROM webhook_events WHERE id = ?').get('same-event-overlap')?.n, 1);
      } finally { gate.release(); await slow; }
    });
  } finally {
    held?.release(); globalThis.fetch = originalFetch;
    for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; }
  }
});
