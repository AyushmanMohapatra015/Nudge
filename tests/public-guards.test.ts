import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST as clientPost } from '../app/api/client/[token]/route';
import { POST as webhookPost } from '../app/api/paypal/webhook/route';
import { read, db } from '../lib/store';
import { clientDecisionWindow, webhookWindow } from '../lib/request-guards';

test('public routes reject oversized bodies and overload without provider access or state changes', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH']; const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'demo'; process.env.NUDGE_DB_PATH = `./data/public-guards-${randomUUID()}.sqlite`;
  globalThis.fetch = async () => { throw Error('Network forbidden in guard checks'); };
  const clientRequest = (body: string) => new NextRequest('http://localhost:3000/api/client/test', { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' }, body });
  const signed = { 'paypal-auth-algo': 'test', 'paypal-cert-url': 'test', 'paypal-transmission-id': 'test', 'paypal-transmission-sig': 'test', 'paypal-transmission-time': 'test' };
  const webhookRequest = (body: string) => new NextRequest('http://localhost:3000/api/paypal/webhook', { method: 'POST', headers: signed, body });
  try {
    const state = read(), context = { params: Promise.resolve({ token: state.clientToken }) };
    assert.equal((await clientPost(clientRequest('x'.repeat(8193)), context)).status, 413);
    assert.deepEqual(read(), state);
    for (let n = 0; n < 60; n++) clientDecisionWindow.take();
    const limitedClient = await clientPost(clientRequest('{"type":"acceptAgreement"}'), context);
    assert.equal(limitedClient.status, 429); assert.ok(Number(limitedClient.headers.get('retry-after')) >= 1);
    assert.deepEqual(read(), state);
    process.env.NUDGE_MODE = 'sandbox';
    const sandbox = read();
    assert.equal((await webhookPost(webhookRequest('x'.repeat(262145)))).status, 413);
    for (let n = 0; n < 120; n++) webhookWindow.take();
    const limitedWebhook = await webhookPost(webhookRequest('{"id":"guard-event","event_type":"INVOICING.INVOICE.PAID"}'));
    assert.equal(limitedWebhook.status, 503); assert.ok(Number(limitedWebhook.headers.get('retry-after')) >= 1);
    assert.deepEqual(read(), sandbox);
    assert.equal(db().prepare('SELECT id FROM webhook_events WHERE id = ?').get('guard-event'), undefined);
  } finally {
    globalThis.fetch = originalFetch;
    for (const n of names) { if (before[n] === undefined) delete process.env[n]; else process.env[n] = before[n]; }
  }
});
