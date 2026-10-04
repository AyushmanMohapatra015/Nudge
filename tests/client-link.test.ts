import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST as ownerPost } from '../app/api/workspace/route';
import { GET as clientGet, POST as clientPost } from '../app/api/client/[token]/route';
import { read, mutate, cacheOperation } from '../lib/store';
import { sessionToken } from '../lib/auth';

test('replacing client links revokes old access and preserves legacy invoice caches and unresolved attempts', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN', 'PAYPAL_MERCHANT_EMAIL'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]])), originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'demo', NUDGE_DB_PATH: `./data/client-link-${randomUUID()}.sqlite`, NUDGE_ADMIN_TOKEN: 'fictional-owner-token-for-local-tests', PAYPAL_MERCHANT_EMAIL: 'merchant@example.com' });
  globalThis.fetch = async () => { throw new Error('Network forbidden'); };
  const request = (body: unknown, authenticated = true, origin = 'http://localhost:3000') => new NextRequest('http://localhost:3000/api/workspace', { method: 'POST', headers: { host: 'localhost:3000', origin, 'content-type': 'application/json', ...(authenticated ? { cookie: `nudge_session=${sessionToken()}` } : {}) }, body: JSON.stringify(body) });
  const replace = (token: string) => ownerPost(request({ type: 'replaceClientLink', expectedToken: token, confirmed: true }));
  const client = (token: string) => clientGet(new NextRequest('http://localhost:3000/api/client/test'), { params: Promise.resolve({ token }) });
  try {
    mutate(s => { s.agreementStatus = 'accepted'; s.agreementAcceptedAt = '2026-10-04T00:00:00.000Z'; delete s.baseInvoiceKey; });
    const old = read().clientToken, key = `base-${old.slice(0, 16)}`, acceptedAt = read().agreementAcceptedAt;
    cacheOperation(`invoice-${key}`, { id: 'SIM-LEGACY', proposalId: key, status: 'DRAFT', amountCents: read().agreement.amountCents, outstandingCents: read().agreement.amountCents, createdAt: '2026-10-04', dueDate: '2026-10-11', reminders: 0 });
    assert.equal((await ownerPost(request({ type: 'replaceClientLink', expectedToken: old, confirmed: false }))).status, 400);
    assert.equal((await replace(old)).status, 200);
    const current = read().clientToken;
    assert.match(current, /^[a-f0-9]{48}$/); assert.notEqual(current, old);
    assert.ok(Date.parse(read().clientLinkExpiresAt!) > Date.now());
    assert.equal(read().baseInvoiceKey, key); assert.equal(read().agreementAcceptedAt, acceptedAt);
    assert.equal((await client(old)).status, 404); assert.equal((await client(current)).status, 200);
    assert.equal((await clientPost(request({ type: 'acceptAgreement' }), { params: Promise.resolve({ token: old }) })).status, 404);
    assert.equal((await replace(old)).status, 400);
    assert.equal((await ownerPost(request({ type: 'createInvoice', id: 'base' }))).status, 200);
    assert.equal(read().invoices[0].id, 'SIM-LEGACY', 'legacy cached identity must survive rotation');
    assert.equal((await replace(current)).status, 200);
    assert.equal(read().baseInvoiceKey, key);
    assert.equal((await ownerPost(request({ type: 'createInvoice', id: 'base' }))).status, 400);
    assert.ok(read().audit.every(entry => !entry.detail.includes(old) && !entry.detail.includes(current)));

    process.env.NUDGE_MODE = 'sandbox';
    mutate(s => { s.agreementStatus = 'accepted'; delete s.baseInvoiceKey; });
    const sandboxToken = read().clientToken, sandboxKey = `base-${sandboxToken.slice(0, 16)}`;
    cacheOperation(`attempt-invoice-${sandboxKey}`, { startedAt: '2026-10-04', invoiceNumber: `N-${sandboxKey.slice(0, 16)}` });
    assert.equal((await ownerPost(request({ type: 'replaceClientLink', expectedToken: sandboxToken, confirmed: true }, false))).status, 401);
    assert.equal((await ownerPost(request({ type: 'replaceClientLink', expectedToken: sandboxToken, confirmed: true }, true, 'https://untrusted.example'))).status, 403);
    mutate(s => { s.processing = { key: 'busy', operation: 'sendInvoice', startedAt: '2026-10-04' }; });
    assert.equal((await replace(sandboxToken)).status, 400);
    mutate(s => { delete s.processing; });
    assert.equal((await replace(sandboxToken)).status, 200);
    const response = await ownerPost(request({ type: 'createInvoice', id: 'base' }));
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /unresolved outcome/);
    assert.equal(read().invoices.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
