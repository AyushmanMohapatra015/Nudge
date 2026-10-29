import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { observedTransport } = require('../scripts/elastic-live-review.cjs');
const { createOneAttemptFetch } = require('../scripts/elastic-one-attempt-guard.cjs');
import { mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';

test('live observer preserves provider response but retains only allowlisted usage', async () => {
  const payload = { status: 'completed', model_usage: { input_tokens: 123, output_tokens: 45 }, conversation_id: 'do-not-save', response: { message: 'do-not-save' } };
  const receipts: unknown[] = [];
  const wrapped = observedTransport(async () => Response.json(payload), (r: unknown) => receipts.push(r));
  assert.deepEqual(await (await wrapped('unused', {})).json(), payload);
  assert.deepEqual(receipts, [{ attempted: true, httpStatus: 200, inputTokens: 123, outputTokens: 45, status: 'completed', cost: 'unknown', promptsShape: 'absent', promptTypeCounts: null, stepTypeCounts: null }]);
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

test('interactive diagnostics preserve the response and count types without saving private fields or unknown type text', async () => {
  const secret = 'fictional-private-marker-never-retain';
  const payload = { status: 'awaiting_prompt', conversation_id: secret, model_usage: { input_tokens: 11090, output_tokens: 89 },
    response: { message: secret, prompts: [
      { type: 'ask_user_question', id: secret, questions: [{ question: secret }] },
      { type: 'confirmation', message: secret }, { type: 'authorization', title: secret },
      { type: secret }, null, 'confirmation', { type: '__proto__' },
    ] }, steps: [{ type: 'tool_call', tool_id: secret, params: secret }, { type: 'ask_user_question', reasoning: secret }, { type: secret }] };
  let receipt: any, calls = 0;
  const response = await observedTransport(async () => { calls++; return Response.json(payload); }, (r: unknown) => { receipt = r; })('unused', {});
  assert.deepEqual(await response.json(), payload);
  assert.equal(calls, 1);
  assert.deepEqual(receipt.promptTypeCounts, { ask_user_question: 1, confirmation: 1, authorization: 1, other: 4 });
  assert.deepEqual(receipt.stepTypeCounts, { tool_call: 1, tool_result: 0, reasoning: 0, ask_user_question: 1, confirmation: 0, authorization: 0, other: 1 });
  assert.equal(JSON.stringify(receipt).includes(secret), false);
  assert.equal(JSON.stringify(receipt).includes('__proto__'), false);
  assert.equal(receipt.status, 'awaiting_prompt');
  assert.equal(receipt.promptsShape, 'array');
});

test('object prompt diagnostics discard secret keys and preserve provider bytes exactly', async () => {
  const secretKey = 'fictional-secret-prompt-identifier';
  const raw = ' { "status" : "awaiting_prompt", "response": {"prompts": {' +
    JSON.stringify(secretKey) + ':{"type":"ask_user_question","message":"private-question"},' +
    '"another-private-id":{"type":"private-type"}}}}\n';
  let receipt: any;
  const response = await observedTransport(async () => new Response(raw, { status: 200 }), (r: unknown) => { receipt = r; })('unused', {});
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(raw));
  assert.equal(receipt.promptsShape, 'object');
  assert.deepEqual(receipt.promptTypeCounts, { ask_user_question: 1, confirmation: 0, authorization: 0, other: 1 });
  for (const secret of [secretKey, 'another-private-id', 'private-question', 'private-type']) assert.equal(JSON.stringify(receipt).includes(secret), false);
});

test('prompt shape is a fixed enum for arrays, maps, missing values and malformed containers', async () => {
  for (const [prompts, shape] of [[[], 'array'], [{}, 'object'], [undefined, 'absent'], ['private', 'other'], [null, 'other'], [42, 'other']] as const) {
    let receipt: any;
    await observedTransport(async () => Response.json({ status: 'awaiting_prompt', response: { prompts } }), (r: unknown) => { receipt = r; })('unused', {});
    assert.equal(receipt.promptsShape, shape);
    if (shape === 'array' || shape === 'object') assert.deepEqual(Object.values(receipt.promptTypeCounts), [0, 0, 0, 0]);
    else assert.equal(receipt.promptTypeCounts, null);
  }
});

test('observing an interactive response cannot replenish the one-attempt guard', async () => {
  const directory = mkdtempSync(resolve('data/elastic-observer-guard-'));
  const config = { endpoint: 'https://fictional.elastic.cloud/api/agent_builder/converse', agentId: 'fictional-scope', inferenceId: 'fictional-model',
    instructions: 'Fictional non-interactive scope policy', input: { clientRequest: 'Fictional booking request' }, ledgerPath: resolve(directory, 'attempt.json') };
  const body = { agent_id: config.agentId, _execution_mode: 'local', inference_id: config.inferenceId, access_control: { access_mode: 'private' },
    configuration_overrides: { instructions: config.instructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false }, input: JSON.stringify(config.input) };
  let calls = 0;
  const delegate = observedTransport(async () => { calls++; return Response.json({ status: 'awaiting_prompt', response: { prompts: { 'private-id': { type: 'confirmation' } } } }); }, () => {});
  const guarded = createOneAttemptFetch({ ...config, delegate });
  const options = { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000), body: JSON.stringify(body) };
  assert.equal((await (await guarded(config.endpoint, options)).json()).status, 'awaiting_prompt');
  await assert.rejects(guarded(config.endpoint, options), /attempt unavailable/);
  await assert.rejects(createOneAttemptFetch({ ...config, delegate })(config.endpoint, options), /attempt unavailable/);
  assert.equal(calls, 1);
});

test('diagnostics distinguish absent, malformed and empty arrays and never retain malformed usage values', async () => {
  for (const [prompts, steps, expected] of [[undefined, undefined, null], ['private-text', {}, null], [[], [], 'empty']] as const) {
    let receipt: any;
    await observedTransport(async () => Response.json({ status: 'private-status', response: { prompts }, steps,
      model_usage: { input_tokens: -1, output_tokens: 'private-count' } }), (r: unknown) => { receipt = r; })('unused', {});
    assert.equal(receipt.status, 'unknown');
    assert.equal(receipt.inputTokens, null); assert.equal(receipt.outputTokens, null);
    if (expected === 'empty') {
      assert.deepEqual(Object.values(receipt.promptTypeCounts), [0, 0, 0, 0]);
      assert.deepEqual(Object.values(receipt.stepTypeCounts), [0, 0, 0, 0, 0, 0, 0]);
    } else { assert.equal(receipt.promptTypeCounts, null); assert.equal(receipt.stepTypeCounts, null); }
    assert.equal(JSON.stringify(receipt).includes('private-'), false);
  }
});
