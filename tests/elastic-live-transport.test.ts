import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { observedTransport } = require('../scripts/elastic-live-review.cjs');

test('live observer preserves provider response but retains only allowlisted usage', async () => {
  const payload = { status: 'completed', model_usage: { input_tokens: 123, output_tokens: 45 }, conversation_id: 'do-not-save', response: { message: 'do-not-save' } };
  const receipts: unknown[] = [];
  const wrapped = observedTransport(async () => Response.json(payload), (r: unknown) => receipts.push(r));
  assert.deepEqual(await (await wrapped('unused', {})).json(), payload);
  assert.deepEqual(receipts, [{ attempted: true, httpStatus: 200, inputTokens: 123, outputTokens: 45, status: 'completed', cost: 'unknown' }]);
});

test('live observer records HTTP and unknown usage without retaining error content', async () => {
  let receipt: any;
  const response = await observedTransport(async () => new Response('private provider error', { status: 429 }), (r: unknown) => { receipt = r; })('unused', {});
  assert.equal(response.status, 429); assert.equal(await response.text(), 'private provider error');
  assert.equal(receipt.httpStatus, 429); assert.equal(receipt.inputTokens, null); assert(!JSON.stringify(receipt).includes('private'));
});

test('live observer bounds response and records transport failures without retry', async () => {
  const receipts: any[] = []; let calls = 0;
  const wrapped = observedTransport(async () => { calls++; throw Error('private transport failure'); }, (r: unknown) => receipts.push(r));
  await assert.rejects(wrapped('unused', {})); assert.equal(calls, 1); assert.equal(receipts[0].httpStatus, null);
  await assert.rejects(observedTransport(async () => new Response('x'.repeat(131073)), (r: unknown) => receipts.push(r))('unused', {}), /exceeded limit/);
  assert.equal(receipts.length, 2);
});
