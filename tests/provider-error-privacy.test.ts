import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paypal } from '../lib/paypal';
import { createWebhookRelay } from '../scripts/webhook-relay.mjs';

test('PayPal failures omit provider bodies, malformed JSON and transport details', async () => {
  const originalFetch = globalThis.fetch;
  const before = [process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET];
  process.env.PAYPAL_CLIENT_ID = 'fictional-client';
  process.env.PAYPAL_CLIENT_SECRET = 'fictional-secret';
  const privateText = 'private-buyer@example.com secret-token private-scope';
  let response: () => Response = () => Response.json({ message: privateText, name: privateText, debug_id: privateText, details: [{ description: privateText }] }, { status: 422 });
  globalThis.fetch = async (input, init) => {
    assert.equal(init?.redirect, 'error');
    if (String(input).endsWith('/oauth2/token')) return Response.json({ access_token: 'fictional-token', expires_in: 3600 });
    return response();
  };
  try {
    await assert.rejects(paypal('/v2/invoicing/invoices/INV2-FICTIONAL'), error => error instanceof Error && error.message.includes('(422)') && !error.message.includes(privateText));
    response = () => new Response(`{"private":"${privateText}",`, { status: 200 });
    await assert.rejects(paypal('/v2/invoicing/invoices/INV2-FICTIONAL'), /^Error: PayPal returned an invalid response\./);
    response = () => { throw Error(privateText); };
    await assert.rejects(paypal('/v2/invoicing/invoices/INV2-FICTIONAL'), /^Error: PayPal request failed or timed out\./);
    response = () => new Response(null, { status: 204 });
    assert.deepEqual(await paypal('/v2/invoicing/invoices/INV2-FICTIONAL/send', 'POST'), {});
  } finally {
    globalThis.fetch = originalFetch;
    for (const [index, name] of ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'].entries()) {
      if (before[index] === undefined) delete process.env[name]; else process.env[name] = before[index];
    }
  }
});

test('relay logs only status metadata even when event fields contain private content', async () => {
  const logs: string[] = [];
  const originalLog = console.log;
  const relay = createWebhookRelay('http://127.0.0.1:3000', async () => Response.json({ received: true }));
  await new Promise<void>(resolve => relay.listen(0, '127.0.0.1', resolve));
  const address = relay.address();
  assert.ok(address && typeof address !== 'string');
  console.log = value => { logs.push(String(value)); };
  try {
    const result = await fetch(`http://127.0.0.1:${address.port}/api/paypal/webhook`, {
      method: 'POST', headers: { 'paypal-transmission-sig': 'fictional-secret' },
      body: JSON.stringify({ id: 'private-buyer@example.com', event_type: { secret: 'private-scope' }, resource: { token: 'fictional-secret' } }),
    });
    assert.equal(result.status, 200);
    assert.deepEqual(logs.map(value => JSON.parse(value)), [{ component: 'webhook-relay', signatureHeadersPresent: true, status: 200 }]);
  } finally {
    console.log = originalLog;
    relay.closeAllConnections();
    await new Promise<void>(resolve => relay.close(() => resolve()));
  }
});
