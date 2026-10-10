import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/analytics/route';
import { db, seed } from '../lib/store';
import { sessionToken } from '../lib/auth';
import { ownerReadWindow } from '../lib/request-guards';
import { studioRequestAllowance } from '../lib/studio-request-allowance';

test('analytics route enforces owner auth and shared quota with minimal no-store local snapshots and no reconciliation', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH;
  const oldAdmin = process.env.NUDGE_ADMIN_TOKEN, oldFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'sandbox'; process.env.NUDGE_DB_PATH = `./data/analytics-route-${randomUUID()}.sqlite`;
  process.env.NUDGE_ADMIN_TOKEN = 'fictional-analytics-owner-token-for-tests-only';
  let calls = 0; globalThis.fetch = async () => { calls++; throw Error('Network forbidden'); };
  const request = (cookie?: string) => new NextRequest('http://localhost:3000/api/analytics?includePrivate=true&mode=demo', {
    headers: cookie ? { cookie: `nudge_session=${cookie}` } : {},
  });
  try {
    for (const cookie of [undefined, 'client-token', sessionToken(Date.now() - 8 * 60 * 60 * 1000)]) {
      const denied = GET(request(cookie)); assert.equal(denied.status, 401);
      assert.equal(denied.headers.get('cache-control'), 'no-store');
    }
    const cookie = sessionToken();
    const missing = GET(request(cookie)); assert.equal(missing.status, 404);
    assert.equal(db().prepare('SELECT COUNT(*) AS count FROM workspaces').get()!.count, 0);
    const state = seed(); state.clientToken = 'private-client-token';
    state.invoices = [{ id: 'private-remote-invoice', proposalId: 'private-proposal', amountCents: 10000, outstandingCents: 321,
      status: 'PARTIALLY_PAID', createdAt: '2026-01-01T00:00:00Z', dueDate: '2026-01-01', reminders: 0,
      recipientEmail: 'private@example.com', payUrl: 'https://private.example/payment' }];
    const original = JSON.stringify(state);
    db().prepare('INSERT INTO workspaces (mode, body) VALUES (?, ?)').run('sandbox', original);
    db().prepare('INSERT INTO workspaces (mode, body) VALUES (?, ?)').run('demo', JSON.stringify({ ...seed(), version: 99 }));
    const response = GET(request(cookie)); assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const view = await response.json();
    assert.deepEqual(view.dashboardAllowance, { state: 'unapproved', remainingRequests: 0, maxRequests: null, usedRequests: null, expiresAt: null });
    assert.equal(db().prepare("SELECT name FROM sqlite_schema WHERE name = 'studio_request_allowances'").get(), undefined);
    assert.equal(view.stateSource, 'local-records'); assert.equal(view.mode, 'sandbox'); assert.equal(view.version, 1);
    assert.equal(view.totals.outstandingCents, 321); assert.equal(view.invoices[0].recordIndex, 0);
    const text = JSON.stringify(view); assert.equal(text.includes('private'), false); assert.equal(text.includes(state.agreement.clientName), false);
    assert.equal(db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body, original);
    assert.equal(db().prepare('SELECT COUNT(*) AS count FROM remote_operations').get()!.count, 0);
    assert.equal(db().prepare('SELECT COUNT(*) AS count FROM webhook_events').get()!.count, 0);

    const ledger = studioRequestAllowance(db()), expiry = Date.now() + 60000;
    ledger.approve({ id: randomUUID(), maxRequests: 2, expiresAt: expiry }); ledger.reserve();
    const beforeLedger = JSON.stringify(db().prepare('SELECT * FROM studio_request_allowances').all());
    db().exec('PRAGMA query_only=ON;');
    const allowance = (await GET(request(cookie)).json()).dashboardAllowance;
    assert.deepEqual(allowance, { state: 'available', remainingRequests: 1, maxRequests: 2, usedRequests: 1, expiresAt: new Date(expiry).toISOString() });
    assert.equal(JSON.stringify(db().prepare('SELECT * FROM studio_request_allowances').all()), beforeLedger);
    assert.equal(JSON.stringify(allowance).includes('id'), false);
    db().exec('PRAGMA query_only=OFF;');
    process.env.NUDGE_MODE = 'demo';
    assert.deepEqual((await GET(request()).json()).dashboardAllowance, { state: 'simulation', remainingRequests: 0, maxRequests: null, usedRequests: null, expiresAt: null });
    process.env.NUDGE_MODE = 'sandbox';
    db().exec('ALTER TABLE studio_request_allowances RENAME TO unavailable_allowance_fixture; CREATE TABLE studio_request_allowances (broken TEXT);');
    const unavailable = GET(request(cookie)); assert.equal(unavailable.status, 200);
    assert.equal((await unavailable.json()).dashboardAllowance.state, 'unavailable');
    assert.equal(db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body, original);

    db().prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run('private malformed JSON', 'sandbox');
    const failure = GET(request(cookie)); assert.equal(failure.status, 503);
    assert.deepEqual(await failure.json(), { error: 'Analytics are unavailable. Review the workspace before trying again.' });
    assert.equal(failure.headers.get('cache-control'), 'no-store');
    db().prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(original, 'sandbox');
    while (!ownerReadWindow.take()) { /* Exhaust shared read quota without route/storage/provider work. */ }
    db().exec('ALTER TABLE workspaces RENAME TO analytics_unavailable_fixture');
    const limited = GET(request(cookie)); assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('cache-control'), 'no-store'); assert.ok(Number(limited.headers.get('retry-after')) > 0);
    assert.equal(GET(request()).status, 401);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of [['NUDGE_MODE', oldMode], ['NUDGE_DB_PATH', oldPath], ['NUDGE_ADMIN_TOKEN', oldAdmin]] as const) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
