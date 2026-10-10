import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { sessionToken } from '../lib/auth';
import { RequestWindow } from '../lib/request-guards';
import { createStudioAgentPost } from '../lib/studio-agent-transport';
import { POST } from '../app/api/analytics/agent/route';
import type { OwnerAnalytics } from '../lib/owner-analytics';

const fixture = (): OwnerAnalytics => ({ version: 2, mode: 'sandbox', asOf: '2026-10-09T00:00:00.000Z', currency: 'USD', invoices: [], changes: [],
  totals: { outstandingCents: 579, overdueCents: 123, unknownDueDateCents: 1, approvedExtraCents: 30001,
    awaitingAcceptanceCents: 30001, awaitingAcceptanceCount: 1, statusReviewCount: 0 } });
const reply = () => ({ text: 'A fictional mock response, not a live model result.', usage: { inputTokens: 10, outputTokens: 3 } });
function request(body: unknown = { expectedVersion: 2, question: 'Explain these totals.' }, options: {
  cookie?: boolean; origin?: string; contentType?: string; signal?: AbortSignal; raw?: string } = {}) {
  return new NextRequest('http://localhost/api/analytics/agent', { method: 'POST', signal: options.signal,
    headers: { host: 'localhost', origin: options.origin ?? 'http://localhost', 'content-type': options.contentType ?? 'application/json',
      ...(options.cookie === false ? {} : { cookie: `nudge_session=${sessionToken()}` }) }, body: options.raw ?? JSON.stringify(body) });
}
async function isolated(run: () => Promise<void>) {
  const old = { mode: process.env.NUDGE_MODE, admin: process.env.NUDGE_ADMIN_TOKEN, enabled: process.env.NUDGE_AI_ENABLED, fetch: globalThis.fetch };
  process.env.NUDGE_MODE = 'sandbox'; process.env.NUDGE_ADMIN_TOKEN = 'fictional-studio-owner-secret-only-for-tests';
  globalThis.fetch = async () => { throw Error('Network forbidden'); };
  try { await run(); }
  finally {
    for (const [key, value] of [['NUDGE_MODE', old.mode], ['NUDGE_ADMIN_TOKEN', old.admin], ['NUDGE_AI_ENABLED', old.enabled]]) {
      if (value === undefined) delete process.env[key!]; else process.env[key!] = value;
    }
    globalThis.fetch = old.fetch;
  }
}

test('production endpoint remains disconnected even with the AI flag enabled; owner/origin gates apply first', async () => isolated(async () => {
  process.env.NUDGE_AI_ENABLED = 'true';
  for (const [req, expected] of [[request(undefined, { cookie: false }), 401], [request(undefined, { origin: 'https://outside.example' }), 403],
    [request(), 503]] as const) {
    const response = await POST(req); assert.equal(response.status, expected); assert.equal(response.headers.get('cache-control'), 'no-store');
  }
}));

test('mock transport derives minimal server totals, preserves cents and rejects browser-supplied financial fields', async () => isolated(async () => {
  const snapshot = Object.assign(fixture(), { clientToken: 'private-token', clientEmail: 'private@example.com' });
  const before = structuredClone(snapshot); let calls = 0;
  const post = createStudioAgentPost({ enabled: () => true, getSnapshot: () => snapshot, window: new RequestWindow(100), adapter: async input => {
    calls++; assert.equal(input.maxOutputTokens, 256); assert.equal(input.snapshot.totals.outstandingCents, 579);
    assert.equal(JSON.stringify(input).includes('private'), false); return reply();
  } });
  const valid = await post(request()); assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { ...reply(), snapshotVersion: 2, asOf: snapshot.asOf, stateSource: 'local-records' });
  const supplied = await post(request({ expectedVersion: 2, question: 'Explain', snapshot: { outstandingCents: 0 }, tools: ['refund'] }));
  assert.equal(supplied.status, 400); assert.equal(calls, 1); assert.deepEqual(snapshot, before);
}));

test('demo mode cannot activate an adapter through its unauthenticated workspace access', async () => isolated(async () => {
  let reads = 0; let calls = 0;
  const post = createStudioAgentPost({ enabled: () => true, getSnapshot: () => { reads++; return fixture(); },
    adapter: async () => { calls++; return reply(); } });
  process.env.NUDGE_MODE = 'demo';
  assert.equal((await post(request(undefined, { cookie: false }))).status, 503);
  assert.equal(reads, 0); assert.equal(calls, 0);
}));

test('disabled, unauthorized, malformed, oversized and stale requests do not invoke the mock adapter', async () => isolated(async () => {
  let calls = 0; let reads = 0;
  const options = { enabled: () => true, getSnapshot: () => { reads++; return fixture(); }, window: new RequestWindow(100),
    adapter: async () => { calls++; return reply(); } };
  const post = createStudioAgentPost(options);
  assert.equal((await createStudioAgentPost({ ...options, enabled: () => false })(request())).status, 503);
  for (const [req, expected] of [[request(undefined, { cookie: false }), 401], [request(undefined, { origin: 'https://outside.example' }), 403],
    [request(undefined, { contentType: 'text/plain' }), 415], [request(undefined, { raw: '{' }), 400],
    [request({ expectedVersion: 2, question: 'a'.repeat(1001) }), 400], [request(undefined, { raw: 'a'.repeat(8193) }), 413],
    [request({ expectedVersion: '2', question: 'Explain' }), 400]] as const) assert.equal((await post(req)).status, expected);
  assert.equal(reads, 0); assert.equal(calls, 0);
  assert.equal((await post(request({ expectedVersion: 1, question: 'Explain' }))).status, 409); assert.equal(calls, 0);
}));

test('request cap counts failed attempts and reports Retry-After without extra adapter calls', async () => isolated(async () => {
  let calls = 0;
  const post = createStudioAgentPost({ enabled: () => true, getSnapshot: fixture, window: new RequestWindow(2),
    adapter: async () => { calls++; throw Error('private provider trace'); } });
  assert.equal((await post(request())).status, 502); assert.equal((await post(request())).status, 502);
  const capped = await post(request()); assert.equal(capped.status, 429); assert.ok(Number(capped.headers.get('retry-after')) > 0); assert.equal(calls, 2);
}));

test('timeout aborts the mock signal and retains concurrency lock until an uncooperative adapter settles', async () => isolated(async () => {
  let finish!: (value: unknown) => void; let calls = 0; let signal!: AbortSignal;
  const pending = new Promise(resolve => { finish = resolve; });
  const post = createStudioAgentPost({ enabled: () => true, getSnapshot: fixture, window: new RequestWindow(100), deadlineMs: 15,
    adapter: async input => { signal = input.signal; calls++; return calls === 1 ? pending : reply(); } });
  assert.equal((await post(request())).status, 504); assert.equal(signal.aborted, true);
  assert.equal((await post(request())).status, 409); assert.equal(calls, 1);
  finish(reply()); await new Promise(resolve => setImmediate(resolve));
  assert.equal((await post(request())).status, 200); assert.equal(calls, 2);
}));

test('client cancellation aborts once, blocks a second request and does not retry', async () => isolated(async () => {
  let finish!: (value: unknown) => void; let started!: () => void; let calls = 0; let signal!: AbortSignal;
  const startedPromise = new Promise<void>(resolve => { started = resolve; });
  const pending = new Promise(resolve => { finish = resolve; }); const controller = new AbortController();
  const post = createStudioAgentPost({ enabled: () => true, getSnapshot: fixture, window: new RequestWindow(100), adapter: async input => {
    calls++; signal = input.signal; started(); return pending;
  } });
  const result = post(request(undefined, { signal: controller.signal })); await startedPromise; controller.abort();
  assert.equal((await result).status, 408); assert.equal(signal.aborted, true);
  assert.equal((await post(request())).status, 409); assert.equal(calls, 1); finish(reply());
}));

test('malformed, excessive usage, provider errors and now-stale responses are rejected without exposing errors', async () => isolated(async () => {
  for (const result of [{ ...reply(), usage: { inputTokens: 10, outputTokens: 257 } }, { ...reply(), usage: { inputTokens: 4097, outputTokens: 1 } },
    { ...reply(), text: 'x'.repeat(2001) }, { ...reply(), tools: ['refund'] }]) {
    const post = createStudioAgentPost({ enabled: () => true, getSnapshot: fixture, adapter: async () => result });
    const response = await post(request()); assert.equal(response.status, 502); assert.equal((await response.text()).includes('refund'), false);
  }
  const failed = createStudioAgentPost({ enabled: () => true, getSnapshot: fixture, adapter: async () => { throw Error('private key and provider URL'); } });
  const error = await failed(request()); assert.equal(error.status, 502); assert.equal((await error.text()).includes('private'), false);
  let snapshot = fixture(); const stale = createStudioAgentPost({ enabled: () => true, getSnapshot: () => snapshot,
    adapter: async () => { snapshot = { ...snapshot, version: 3 }; return reply(); } });
  assert.equal((await stale(request())).status, 409);
}));
