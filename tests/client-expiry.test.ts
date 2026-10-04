import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/client/[token]/route';
import { clientLinkLifetimeMs, clientLinkValid, newClientLinkExpiry } from '../lib/client-access';
import { mutate, read, seed } from '../lib/store';

test('client expiry rejects legacy/invalid/expired links and expiry during acceptance without changing decisions', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH;
  process.env.NUDGE_MODE = 'demo'; process.env.NUDGE_DB_PATH = `./data/client-expiry-${randomUUID()}.sqlite`;
  const request = () => new NextRequest('http://localhost:3000/api/client/test', { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify({ type: 'acceptAgreement' }) });
  try {
    mutate(s => { Object.assign(s, seed()); s.agreementStatus = 'approved'; });
    const token = read().clientToken, context = { params: Promise.resolve({ token }) };
    const baseline = read();
    const now = Date.now();
    assert.equal(Date.parse(newClientLinkExpiry(now)) - now, clientLinkLifetimeMs);
    assert.equal(clientLinkValid({ ...baseline, clientLinkExpiresAt: new Date(now).toISOString() }, token, now), false);
    assert.equal(clientLinkValid({ ...baseline, clientLinkExpiresAt: new Date(now + 1).toISOString() }, token, now), true);
    assert.equal(clientLinkValid(baseline, 'wrong-token'), false);
    for (const expiry of [undefined, 'not-a-date', new Date(now - 1).toISOString()]) {
      mutate(s => { s.clientLinkExpiresAt = expiry; });
      const before = read();
      const get = await GET(new NextRequest('http://localhost:3000/api/client/test'), context);
      assert.equal(get.status, 404); assert.equal(get.headers.get('cache-control'), 'no-store');
      assert.equal((await POST(request(), context)).status, 404);
      assert.deepEqual(read(), before);
    }
    mutate(s => { s.clientLinkExpiresAt = newClientLinkExpiry(); });
    const stale = request();
    const staleReader = stale.body!.getReader(); let changed = false;
    Object.defineProperty(stale, 'body', { value: { getReader: () => ({
      read: async () => { if (!changed) { changed = true; mutate(s => { s.clientLinkExpiresAt = new Date(0).toISOString(); }); } return staleReader.read(); },
      cancel: () => staleReader.cancel(), releaseLock: () => staleReader.releaseLock(),
    }) } });
    const auditCount = read().audit.length;
    assert.equal((await POST(stale, context)).status, 400);
    assert.equal(read().agreementStatus, 'approved'); assert.equal(read().agreementAcceptedAt, undefined);
    assert.equal(read().audit.length, auditCount);
    mutate(s => { s.clientLinkExpiresAt = newClientLinkExpiry(); });
    assert.equal((await POST(request(), context)).status, 200);
  } finally {
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
