import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { sessionToken, validSession, sessionLifetimeSeconds } from '../lib/auth';
import { GET, POST } from '../app/api/workspace/route';
import { read } from '../lib/store';

test('signed owner sessions expire exactly at eight hours and reject tampering, future issuance, legacy tokens and changed secrets', () => {
  const old = process.env.NUDGE_ADMIN_TOKEN;
  const secret = 'fictional-owner-session-expiry-secret';
  process.env.NUDGE_ADMIN_TOKEN = secret;
  try {
    const now = 1700000000000, token = sessionToken(now), ttl = sessionLifetimeSeconds * 1000;
    assert.equal(validSession(token, now), true);
    assert.equal(validSession(token, now + ttl - 1), true);
    assert.equal(validSession(token, now + ttl), false);
    assert.equal(validSession(token, now - 1), false);
    assert.notEqual(sessionToken(now), token);
    const parts = token.split('.');
    parts[1] = String(now + 1000); assert.equal(validSession(parts.join('.'), now + 2000), false);
    const nonce = token.split('.'); nonce[2] = '0'.repeat(32); assert.equal(validSession(nonce.join('.'), now), false);
    for (const malformed of ['', 'x'.repeat(161), token + '.extra', token.replace('v2', 'v1'), token.slice(0, -1)]) assert.equal(validSession(malformed, now), false);
    const legacy = createHmac('sha256', secret).update('nudge-admin-session-v1').digest('hex');
    assert.equal(validSession(legacy, now), false);
    process.env.NUDGE_ADMIN_TOKEN = 'different-fictional-owner-secret'; assert.equal(validSession(token, now), false);
    delete process.env.NUDGE_ADMIN_TOKEN; assert.equal(validSession(token, now), false);
  } finally { if (old === undefined) delete process.env.NUDGE_ADMIN_TOKEN; else process.env.NUDGE_ADMIN_TOKEN = old; }
});

test('expired sessions cannot read owner data, mutate workspace or trigger provider calls', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN'];
  const before = Object.fromEntries(names.map(name => [name, process.env[name]])), originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/session-expiry-${randomUUID()}.sqlite`, NUDGE_ADMIN_TOKEN: 'fictional-owner-route-expiry-secret' });
  globalThis.fetch = async () => { throw Error('Network forbidden'); };
  const request = (token: string, mutate = false) => new NextRequest('http://localhost:3000/api/workspace', { method: mutate ? 'POST' : 'GET',
    headers: { host: 'localhost:3000', origin: 'http://localhost:3000', cookie: `nudge_session=${token}`, 'content-type': 'application/json' },
    ...(mutate ? { body: JSON.stringify({ type: 'analyze', request: 'Add appointment booking.' }) } : {}) });
  try {
    const initial = read(), expired = sessionToken(Date.now() - sessionLifetimeSeconds * 1000 - 1000);
    const rejected = await GET(request(expired));
    assert.equal(rejected.status, 401); assert.equal(rejected.headers.get('cache-control'), 'no-store');
    assert.equal((await POST(request(expired, true))).status, 401);
    assert.deepEqual(read(), initial);
    assert.equal((await GET(request(sessionToken()))).status, 200);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
