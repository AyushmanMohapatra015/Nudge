import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AgAiAgentRunContext, AgAiRunInput } from 'ag-studio';
import { createStudioAgentBridge } from '../lib/studio-agent-bridge';
import type { OwnerAnalytics } from '../lib/owner-analytics';

const snapshot = (): OwnerAnalytics => ({ version: 2, mode: 'sandbox', asOf: '2026-10-09T00:00:00.000Z', currency: 'USD', invoices: [], changes: [],
  totals: { outstandingCents: 579, overdueCents: 123, unknownDueDateCents: 1, approvedExtraCents: 30001,
    awaitingAcceptanceCents: 30001, awaitingAcceptanceCount: 1, statusReviewCount: 0 } });
const input = (question: string): AgAiRunInput => ({ threadId: 'fictional-thread', runId: 'fictional-run', tools: [],
  state: {}, context: [], forwardedProps: {}, messages: [{ id: 'fictional-user', role: 'user', content: question }] });
const context = (signal?: AbortSignal): AgAiAgentRunContext => ({ params: undefined, signal, tools: () => [], instructions: () => undefined });
async function collect(question: string, signal?: AbortSignal) {
  const events = [];
  for await (const event of createStudioAgentBridge(snapshot)(input(question), context(signal))) events.push(event);
  return events;
}
async function mockFetch(fetch: typeof globalThis.fetch, run: () => Promise<void>) {
  const previous = globalThis.fetch; globalThis.fetch = fetch;
  try { await run(); } finally { globalThis.fetch = previous; }
}

test('bridge rejects blank/oversized questions and pre-cancellation without requests', async () => {
  let calls = 0;
  await mockFetch(async () => { calls++; throw Error('Network forbidden'); }, async () => {
    for (const question of ['  ', 'x'.repeat(1001)]) await assert.rejects(collect(question), /Dashboard response unavailable/);
    assert.deepEqual(await collect('Explain', AbortSignal.abort()), []); assert.equal(calls, 0);
  });
});

test('bridge sends only latest question/version with same-origin credentials, abort signal and no redirects', async () => {
  const request = input('  Explain this snapshot.  ');
  request.messages.unshift({ id: 'private-history', role: 'assistant', content: 'Private old conversation' });
  let calls = 0;
  await mockFetch(async (url, options) => {
    calls++; assert.equal(url, '/api/analytics/agent'); assert.equal(options?.credentials, 'same-origin');
    assert.equal(options?.redirect, 'error'); assert.equal(options?.cache, 'no-store');
    assert.ok(options?.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(String(options?.body)), { expectedVersion: 2, question: 'Explain this snapshot.' });
    return Response.json({ text: 'Offline mock.', usage: { inputTokens: 1, outputTokens: 1 }, snapshotVersion: 2,
      asOf: '2026-10-09T00:00:00.000Z', stateSource: 'local-records' });
  }, async () => {
    const events = []; for await (const event of createStudioAgentBridge(snapshot)(request, context())) events.push(event);
    assert.deepEqual(events.map(event => event.type), ['TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END']);
    assert.equal(calls, 1);
  });
});

test('bridge rejects HTTP, content-type, malformed/schema/usage/source/timestamp failures without retry or raw details', async () => {
  const good = { text: 'Offline mock.', usage: { inputTokens: 1, outputTokens: 1 }, snapshotVersion: 2,
    asOf: '2026-10-09T00:00:00.000Z', stateSource: 'local-records' };
  const responses = [new Response('private quota detail', { status: 429 }), new Response('private malformed data'),
    new Response('{private invalid JSON', { headers: { 'content-type': 'application/json' } }),
    Response.json({ ...good, usage: { inputTokens: 5000, outputTokens: 1 } }),
    Response.json({ ...good, stateSource: 'live-paypal' }), Response.json({ ...good, asOf: '2026-10-10T00:00:00.000Z' })];
  for (const response of responses) {
    let calls = 0;
    await mockFetch(async () => { calls++; return response; }, async () => {
      await assert.rejects(collect('Explain'), { message: 'Dashboard response unavailable. Refresh the report before trying again.' });
      assert.equal(calls, 1);
    });
  }
});

test('bridge deadline aborts request without retry; owner cancellation emits no answer', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0; let signal: AbortSignal | undefined;
  await mockFetch(async (_, options) => {
    calls++; signal = options!.signal as AbortSignal;
    return new Promise<Response>((_, reject) => signal!.addEventListener('abort', () => reject(Error('private transport error')), { once: true }));
  }, async () => {
    const pending = collect('Explain'); t.mock.timers.tick(12000);
    await assert.rejects(pending, { message: 'Dashboard response timed out. No retry was made.' });
    assert.equal(signal!.aborted, true); assert.equal(calls, 1);
    const controller = new AbortController(); const cancelled = collect('Explain', controller.signal); controller.abort();
    assert.deepEqual(await cancelled, []); assert.equal(signal!.aborted, true); assert.equal(calls, 2);
  });
});
