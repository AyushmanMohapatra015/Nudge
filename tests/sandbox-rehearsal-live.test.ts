import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { elasticScopeInstructions } from '../lib/scope-instructions';
const require = createRequire(import.meta.url);
const { createSession, openSession } = require('../scripts/sandbox-rehearsal-controller.cjs');
const { createLiveBinding, acquireServeLock } = require('../scripts/sandbox-rehearsal-live.cjs');
function fixture(now = Date.now) {
  const s = createSession({ buyerEmail: 'sb-fictional@personal.example.com', merchantEmail: 'fictional-merchant@business.example.com', now }); s.transition('ai'); const state = s.snapshot(), a = state.fixture.agreement;
  const grant = { kind: 'operator-approved-loopback', phase: 'ai', sessionId: state.id, fixtureHash: state.fixtureHash, expiresAt: state.expiresAt, limits: { ai: 1, create: 0, send: 0 } };
  const expectedAI = { endpoint: 'https://fictional.elastic.cloud/api/agent_builder/converse', agentId: 'fictional-agent', inferenceId: '.anthropic-claude-5-sonnet-chat_completion', instructions: elasticScopeInstructions, input: { approvedAgreement: { title: a.title, clauses: a.clauses }, clientRequest: 'Please add appointment booking with available time slots.' } };
  const body = { agent_id: expectedAI.agentId, _execution_mode: 'local', inference_id: expectedAI.inferenceId, access_control: { access_mode: 'private' }, configuration_overrides: { instructions: elasticScopeInstructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false }, input: JSON.stringify(expectedAI.input) };
  const options = { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000), body: JSON.stringify(body) };
  return { s, grant, expectedAI, options };
}
test('missing, wrong-session, wrong-budget, wrong-phase and expired grants fail before transport', () => {
  const { s, grant, expectedAI } = fixture(); let calls = 0;
  for (const candidate of [undefined, { ...grant, sessionId: 'other' }, { ...grant, fixtureHash: 'changed' }, { ...grant, limits: { ai: 2, create: 0, send: 0 } }, { ...grant, phase: 'payment' }, { ...grant, expiresAt: 0 }]) {
    assert.throws(() => createLiveBinding({ session: s, grant: candidate, expectedAI, transport: async () => { calls++; }, saveUsage: () => {} }));
  }
  assert.equal(calls, 0); assert.equal(s.snapshot().attempts.ai, 0);
});
test('grant expiry is checked on every dispatch and cannot be extended past session expiry', async () => {
  let time = 100; const { s, grant, expectedAI, options } = fixture(() => time); let calls = 0;
  assert.throws(() => createLiveBinding({ session: s, grant: { ...grant, expiresAt: grant.expiresAt + 1 }, expectedAI, transport: async () => {}, saveUsage: () => {}, now: () => time }));
  const fetch = createLiveBinding({ session: s, grant: { ...grant, expiresAt: 200 }, expectedAI, transport: async () => { calls++; }, saveUsage: () => {}, now: () => time });
  time = 201; await assert.rejects(fetch(expectedAI.endpoint, options)); assert.equal(calls, 0); assert.equal(s.snapshot().attempts.ai, 0);
});
test('one bound AI response retains only numeric usage and preserves original response', async () => {
  const { s, grant, expectedAI, options } = fixture(); const usage: any[] = []; let calls = 0;
  const response = { status: 'completed', conversation_id: 'do-not-save', model_usage: { input_tokens: 123, output_tokens: 45 }, response: { message: 'fictional response' } };
  const fetch = createLiveBinding({ session: s, grant, expectedAI, transport: async () => { calls++; return Response.json(response); }, saveUsage: (r: unknown) => usage.push(r) });
  assert.deepEqual(await (await fetch(expectedAI.endpoint, options)).json(), response); await assert.rejects(fetch(expectedAI.endpoint, options));
  assert.equal(calls, 1); assert.equal(usage[0].inputTokens, 123); assert(!JSON.stringify(usage).includes('do-not-save'));
});
test('a failed live transport consumes the persisted AI slot across a new binding', async () => {
  const { s, grant, expectedAI, options } = fixture(); let calls = 0; const transport = async () => { calls++; throw Error('private provider failure'); };
  await assert.rejects(createLiveBinding({ session: s, grant, expectedAI, transport, saveUsage: () => {} })(expectedAI.endpoint, options));
  const reopened = openSession(s.directory); await assert.rejects(createLiveBinding({ session: reopened, grant, expectedAI, transport, saveUsage: () => {} })(expectedAI.endpoint, options)); assert.equal(calls, 1);
});
test('review grant cannot contact any provider; payment binds only the approved sandbox body', async () => {
  const { s, grant, expectedAI, options } = fixture();
  await s.aiFetch(expectedAI, async () => Response.json({}))(expectedAI.endpoint, options); s.transition('review', true);
  let calls = 0; const review = createLiveBinding({ session: s, grant: { ...grant, phase: 'review', limits: { ai: 0, create: 0, send: 0 } }, transport: async () => { calls++; } });
  await assert.rejects(review('https://example.com', options)); assert.equal(calls, 0);
  const deliverables = ['Appointment booking with available time slots'];
  s.approve({ mode: 'sandbox', agreement: s.snapshot().fixture.agreement, agreementStatus: 'accepted', proposals: [{ id: 'fictional-proposal', status: 'accepted', amountCents: 30000, analysis: { source: 'elastic' }, deliverables, scopeReview: { id: 'review', classification: 'additional', references: ['S2'], deliverables } }], invoices: [] }, 'fictional-proposal', '2026-11-01'); s.transition('payment', true);
  const payment = createLiveBinding({ session: s, grant: { ...grant, phase: 'payment', limits: { ai: 0, create: 1, send: 1 } }, transport: async () => { calls++; return Response.json({ id: 'INV2-FICTIONAL-LIVE-TEST' }); } });
  const body = s.snapshot().approval.body, opts = { ...options, body: JSON.stringify(body) };
  await assert.rejects(payment('https://api-m.paypal.com/v2/invoicing/invoices', opts)); await payment('https://api-m.sandbox.paypal.com/v2/invoicing/invoices', opts);
  await assert.rejects(payment('https://api-m.sandbox.paypal.com/v2/invoicing/invoices', opts)); assert.equal(calls, 1);
});
test('serve CLI rejects absent confirmation before reading configuration or starting an app', () => {
  const { s } = fixture(); const before = readFileSync(resolve(s.directory, 'manifest.json'), 'utf8');
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(k))), NODE_ENV: 'test' as const };
  for (const phase of ['serve-ai', 'serve-review', 'serve-payment']) {
    const result = spawnSync(process.execPath, ['scripts/prepare-sandbox-rehearsal-live.mjs', phase, s.directory], { env, encoding: 'utf8', windowsHide: true, timeout: 10000 }); assert.equal(result.status, 1); assert.equal(result.stdout, '');
  }
  assert.equal(readFileSync(resolve(s.directory, 'manifest.json'), 'utf8'), before);
});

test('one serving lease prevents concurrent phase servers; unconfirmed cleanup preserves the lock', () => {
  const { s } = fixture(); const first = acquireServeLock(s.directory);
  assert.throws(() => acquireServeLock(s.directory)); first.finish(true); assert.equal(existsSync(resolve(s.directory, 'serve.lock')), false);
  const second = acquireServeLock(s.directory); second.finish(false); assert.equal(existsSync(resolve(s.directory, 'serve.lock')), true); assert.throws(() => acquireServeLock(s.directory));
});
