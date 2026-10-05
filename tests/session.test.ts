import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/session/route';
import { ownerLoginWindow } from '../lib/request-guards';

test('owner login rejects oversized and repeated attempts without cookies and preserves authenticated cookie protections', async () => {
  const old = process.env.NUDGE_ADMIN_TOKEN, originalFetch = globalThis.fetch;
  const secret = 'fictional-owner-login-secret-long-enough';
  process.env.NUDGE_ADMIN_TOKEN = secret;
  globalThis.fetch = async () => { throw Error('Network forbidden'); };
  const request = (body: string, origin = 'https://localhost:3000') => new NextRequest('https://localhost:3000/api/session', { method: 'POST', headers: { host: 'localhost:3000', origin, 'content-type': 'application/json' }, body });
  try {
    assert.equal((await POST(request(JSON.stringify({ token: secret }), 'https://foreign.example'))).status, 403);
    const large = await POST(request('x'.repeat(4097))); assert.equal(large.status, 413); assert.equal(large.headers.get('set-cookie'), null);
    const wrong = await POST(request(JSON.stringify({ token: 'wrong' }))); assert.equal(wrong.status, 401); assert.equal(wrong.headers.get('set-cookie'), null);
    assert.equal((await POST(request('null'))).status, 401);
    const valid = await POST(request(JSON.stringify({ token: secret })));
    assert.equal(valid.status, 200); assert.equal(valid.headers.get('cache-control'), 'no-store');
    const cookie = valid.headers.get('set-cookie')!;
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=strict', 'Max-Age=28800']) assert.ok(cookie.includes(flag));
    assert.equal(cookie.includes(secret), false);
    for (let n = 0; n < 10; n++) ownerLoginWindow.take();
    const limited = await POST(request(JSON.stringify({ token: secret })));
    assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 0);
    assert.equal(limited.headers.get('set-cookie'), null);
    assert.equal((await limited.text()).includes(secret), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (old === undefined) delete process.env.NUDGE_ADMIN_TOKEN; else process.env.NUDGE_ADMIN_TOKEN = old;
  }
});
