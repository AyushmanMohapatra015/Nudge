import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/workspace/route';
import { sessionToken } from '../lib/auth';
import { read } from '../lib/store';
import { ownerReadWindow, ownerActionWindow, ownerBodyMaxBytes } from '../lib/request-guards';

test('owner quotas isolate polling from actions and reject excess/large requests before state writes or providers', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN'];
  const before = Object.fromEntries(names.map(name => [name, process.env[name]])), originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/owner-guards-${randomUUID()}.sqlite`, NUDGE_ADMIN_TOKEN: 'fictional-owner-guard-secret-long-enough' });
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw Error('Network forbidden'); };
  const request = (body?: string, signed = true) => new NextRequest('http://localhost:3000/api/workspace', { method: body === undefined ? 'GET' : 'POST',
    headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json', ...(signed ? { cookie: `nudge_session=${sessionToken()}` } : {}) }, ...(body === undefined ? {} : { body }) });
  try {
    const initial = read();
    assert.equal((await POST(request('x'.repeat(ownerBodyMaxBytes + 1), false))).status, 401);
    const oversized = await POST(request('x'.repeat(ownerBodyMaxBytes + 1)));
    assert.equal(oversized.status, 413); assert.equal(oversized.headers.get('cache-control'), 'no-store');
    assert.deepEqual(read(), initial); assert.equal(calls, 0);
    const valid = await POST(request(JSON.stringify({ type: 'policies', protectedClient: true, reminderLimit: 3, cooldownDays: 7 })));
    assert.equal(valid.status, 200); assert.equal(valid.headers.get('cache-control'), 'no-store');
    const after = read(); assert.equal(after.policies.protectedClient, true);
    for (let n = 0; n < 120; n++) ownerReadWindow.take();
    const blockedRead = await GET(request());
    assert.equal(blockedRead.status, 429); assert.ok(Number(blockedRead.headers.get('retry-after')) > 0);
    assert.equal(calls, 0); assert.deepEqual(read(), after);
    // Exhausting read quota does not prevent a legitimate owner mutation.
    assert.equal((await POST(request(JSON.stringify({ type: 'policies', protectedClient: false, reminderLimit: 3, cooldownDays: 7 })))).status, 200);
    const current = read();
    for (let n = 0; n < 60; n++) ownerActionWindow.take();
    const blockedAction = await POST(request(JSON.stringify({ type: 'analyze', request: 'Add appointment booking.' })));
    assert.equal(blockedAction.status, 429); assert.ok(Number(blockedAction.headers.get('retry-after')) > 0);
    assert.deepEqual(read(), current); assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
