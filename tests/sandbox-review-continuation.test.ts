import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { environment, validate, denyProviderFetch } = require('../scripts/sandbox-review-continuation.cjs');
function fixture() {
  const state = { phase: 'review', expiresAt: 100, attempts: { ai: 1, oauth: 0, create: 0, send: 0, read: 0 } };
  return { state, session: { directory: 'D:\\Nudge\\data\\fictional-test', snapshot: () => structuredClone(state) } };
}
test('expired record gets only a new local session; original deadline and financial ledger are untouched', () => {
  const { state, session } = fixture(), before = structuredClone(state);
  const env = environment(session, { Path: 'test', ELASTIC_API_KEY: 'never-copy', PAYPAL_CLIENT_SECRET: 'never-copy', NODE_OPTIONS: 'never-copy' }, 200);
  assert.equal(env.NUDGE_AI_ENABLED, 'false'); assert.equal(env.ELASTIC_API_KEY, undefined); assert.equal(env.PAYPAL_CLIENT_SECRET, undefined); assert.equal(env.NODE_OPTIONS, undefined);
  assert.equal(env.NUDGE_LOCAL_REVIEW_DEADLINE, '600200'); validate(session, env, 200); assert.deepEqual(state, before);
  assert.throws(() => validate(session, env, 600200));
});
test('active, payment, pre-AI, used financial budgets and provider credentials fail closed', () => {
  const { state, session } = fixture();
  assert.throws(() => environment(session, {}, 99));
  state.phase = 'payment'; assert.throws(() => environment(session, {}, 200)); state.phase = 'review';
  state.attempts.ai = 0; assert.throws(() => environment(session, {}, 200)); state.attempts.ai = 1;
  state.attempts.create = 1; assert.throws(() => environment(session, {}, 200)); state.attempts.create = 0;
  const env = environment(session, {}, 200);
  for (const bad of [{ ELASTIC_API_KEY: 'secret' }, { PAYPAL_CLIENT_ID: 'secret' }, { NUDGE_AI_ENABLED: 'true' }, { NUDGE_DB_PATH: 'other.sqlite' }, { NUDGE_REHEARSAL_LIVE_SESSION: 'old' }]) assert.throws(() => validate(session, { ...env, ...bad }, 200));
});
test('local review never delegates any fetch, including AI, PayPal and loopback URLs', async () => {
  for (const url of ['https://fictional.elastic.cloud/api/agent_builder/converse', 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices', 'http://127.0.0.1:3000']) await assert.rejects(denyProviderFetch(url));
});
