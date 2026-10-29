import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { paypal } from '../lib/paypal';
import { POST } from '../app/api/workspace/route';
import { mutate, read } from '../lib/store';
import { sessionToken } from '../lib/auth';

test('rejected PayPal tokens refresh only on a later request, preserve newer tokens and never replay sends', { timeout: 10000 }, async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'];
  const before = Object.fromEntries(names.map(name => [name, process.env[name]])), originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/paypal-auth-${randomUUID()}.sqlite`,
    NUDGE_ADMIN_TOKEN: 'fictional-private-owner-for-auth-test', PAYPAL_CLIENT_ID: 'fictional-client', PAYPAL_CLIENT_SECRET: 'fictional-secret' });
  let issued = 0, protectedCalls = 0, sends = 0, rejectedToken = '', denyOnce = false;
  let release!: () => void, entered!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    assert.ok(url.startsWith('https://api-m.sandbox.paypal.com/'));
    if (url.endsWith('/v1/oauth2/token')) { issued++; return Response.json({ access_token: `fictional-token-${issued}`, expires_in: 3600 }); }
    protectedCalls++;
    const token = new Headers(init?.headers).get('Authorization');
    if (url.endsWith('/held-old-token')) { entered(); await held; return Response.json({ private: 'do-not-expose' }, { status: 401 }); }
    if (url.endsWith('/reject-now')) return Response.json({ private: 'do-not-expose' }, { status: 401 });
    if (url.endsWith('/INV2-AUTH-FIXTURE/send')) { sends++; return Response.json({ private: 'do-not-expose' }, { status: 401 }); }
    if (token === rejectedToken) return Response.json({ private: 'do-not-expose' }, { status: 401 });
    if (denyOnce) { denyOnce = false; return Response.json({ private: 'do-not-expose' }, { status: 403 }); }
    if (url.endsWith('/INV2-AUTH-FIXTURE')) return Response.json({ id: 'INV2-AUTH-FIXTURE', status: 'DRAFT', amount: { currency_code: 'USD', value: '10.00' }, due_amount: { currency_code: 'USD', value: '10.00' } });
    return Response.json({ received: true });
  };
  const owner = (type: string) => POST(new NextRequest('http://localhost:3000/api/workspace', { method: 'POST',
    headers: { host: 'localhost:3000', origin: 'http://localhost:3000', cookie: `nudge_session=${sessionToken()}`, 'content-type': 'application/json' },
    body: JSON.stringify({ type, id: 'INV2-AUTH-FIXTURE' }) }));
  try {
    await paypal('/fictional-read'); assert.equal(issued, 1);
    rejectedToken = 'Bearer fictional-token-1';
    const failedCalls = protectedCalls;
    await assert.rejects(paypal('/fictional-write', 'POST', { fictional: true }, 'fictional-request-id'), error =>
      error instanceof Error && error.message.includes('(401)') && !error.message.includes('do-not-expose'));
    assert.equal(protectedCalls, failedCalls + 1, 'no automatic repeat of the failed operation'); assert.equal(issued, 1);
    await paypal('/fictional-read'); assert.equal(issued, 2, 'a later independent read can acquire a fresh token');

    denyOnce = true;
    await assert.rejects(paypal('/forbidden-read'), /\(403\)/);
    await paypal('/fictional-read'); assert.equal(issued, 2, 'permissions errors do not invalidate authentication or trigger a refresh');

    const late = paypal('/held-old-token'); await started;
    try {
      await assert.rejects(paypal('/reject-now'), /\(401\)/);
      await paypal('/fictional-read'); assert.equal(issued, 3);
      const rejected = assert.rejects(late, /\(401\)/); release(); await rejected;
      await paypal('/fictional-read'); assert.equal(issued, 3, 'late rejection for token2 cannot discard fresh token3');
    } finally { release(); await late.catch(() => {}); }

    mutate(s => { s.invoices = [{ id: 'INV2-AUTH-FIXTURE', proposalId: 'base', status: 'DRAFT', amountCents: 1000,
      outstandingCents: 1000, reminders: 0, createdAt: '2026-10-28', dueDate: '2026-11-04' }]; });
    assert.equal((await owner('sendInvoice')).status, 400);
    const marker = read().invoices[0].pendingSend; assert.ok(marker); assert.equal(sends, 1);
    const beforeBlocked = protectedCalls;
    assert.equal((await owner('sendInvoice')).status, 400); assert.equal(sends, 1); assert.equal(protectedCalls, beforeBlocked);
    assert.equal((await owner('syncInvoice')).status, 200); assert.equal(issued, 4);
    assert.deepEqual(read().invoices[0].pendingSend, marker, 'fresh authentication does not resolve a DRAFT send uncertainty');
    assert.equal(sends, 1);
  } finally {
    release(); globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
