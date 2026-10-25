import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { elasticScopeInstructions } from '../lib/scope-instructions';
const require = createRequire(import.meta.url);
const { createSession, openSession } = require('../scripts/sandbox-rehearsal-controller.cjs');
const { prepare } = require('../scripts/sandbox-payment-plan.cjs');
const { bindPaymentChild, armDeadline } = require('../scripts/sandbox-payment-child.cjs');
const origin = 'https://api-m.sandbox.paypal.com';
const confirmation = 'approve-one-usd300-sandbox-invoice-and-send';
const opts = (body: unknown) => ({ method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000), body: JSON.stringify(body) });
async function fixture() {
  let time = Date.parse('2026-10-21T07:00:00Z'); const now = () => time;
  const session = createSession({ buyerEmail: 'sb-fictional@personal.example.com', merchantEmail: 'fictional@business.example.com', now });
  session.transition('ai'); const agreement = session.snapshot().fixture.agreement;
  const expected = { endpoint: 'https://fictional.elastic.cloud/api/agent_builder/converse', agentId: 'fictional-agent', inferenceId: '.anthropic-claude-5-sonnet-chat_completion', instructions: elasticScopeInstructions,
    input: { approvedAgreement: { title: agreement.title, clauses: agreement.clauses }, clientRequest: 'Please add appointment booking with available time slots.' } };
  const body = { agent_id: expected.agentId, _execution_mode: 'local', inference_id: expected.inferenceId, access_control: { access_mode: 'private' }, configuration_overrides: { instructions: elasticScopeInstructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false }, input: JSON.stringify(expected.input) };
  await session.aiFetch(expected, async () => Response.json({ fictional: true }))(expected.endpoint, opts(body)); session.transition('review', true); time += 3600001;
  const deliverables = ['Appointment booking with available time slots'];
  const workspace: any = { mode: 'sandbox', agreementStatus: 'accepted', agreement, proposals: [{ id: 'fictional-proposal', status: 'accepted', amountCents: 30000, deliverables,
    analysis: { source: 'elastic', classification: 'additional', references: ['S2'], deliverables }, scopeReview: { id: 'fictional-review', classification: 'additional', rationale: 'S2 explicitly excludes this requested appointment booking.', references: ['S2'], deliverables } }], invoices: [] };
  const plan = prepare({ session, workspace, now: now() });
  return { session, workspace, plan, now, advance: (ms: number) => { time += ms; } };
}
test('explicit continuation preserves deadline and ledger, never renews old grants or copies AI credentials', async () => {
  const f = await fixture(), before = f.session.snapshot(), bytes = readFileSync(join(f.session.directory, 'manifest.json'));
  assert.throws(() => f.session.authorizePaymentContinuation(f.plan, f.workspace, '')); assert(readFileSync(join(f.session.directory, 'manifest.json')).equals(bytes));
  const id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation), after = f.session.snapshot();
  assert.equal(after.expiresAt, before.expiresAt); assert.deepEqual(after.attempts, before.attempts); assert.equal(after.phase, 'review');
  assert.equal(after.paymentContinuation.expiresAt, f.now() + 600000);
  assert.throws(() => f.session.environment({})); assert.throws(() => f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation));
  const env = f.session.environment({ PAYPAL_CLIENT_ID: 'fictional', PAYPAL_CLIENT_SECRET: 'fictional', PAYPAL_MERCHANT_EMAIL: before.fixture.merchantEmail, ELASTIC_API_KEY: 'never-copy' }, { NODE_OPTIONS: 'never-copy' }, id);
  assert.equal(env.NUDGE_AI_ENABLED, 'false'); assert.equal(env.ELASTIC_API_KEY, undefined); assert.equal(env.NODE_OPTIONS, undefined);
});
test('changed plan or accepted workspace cannot gain payment permission', async () => {
  const f = await fixture(); const altered = structuredClone(f.workspace); altered.proposals[0].amountCents++;
  assert.throws(() => f.session.authorizePaymentContinuation(f.plan, altered, confirmation));
  const plan = structuredClone(f.plan); plan.proposedApproval.body.primary_recipients[0].billing_info.email_address = 'changed@example.com';
  assert.throws(() => f.session.authorizePaymentContinuation(plan, f.workspace, confirmation)); assert.equal(f.session.snapshot().approval, undefined);
});
test('exact sandbox body and grant identity are enforced; foreign and AI destinations never dispatch', async () => {
  const f = await fixture(), id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation); let calls = 0;
  const transport = async () => { calls++; return Response.json({ id: 'INV2-FICTIONAL-CONTINUATION' }); };
  const fetch = f.session.paymentFetch(transport, id), body = f.plan.proposedApproval.body;
  for (const url of ['https://api-m.paypal.com/v2/invoicing/invoices', 'https://fictional.elastic.cloud/api/agent_builder/converse', origin + '/v2/invoicing/invoices?extra=1']) await assert.rejects(fetch(url, opts(body)));
  await assert.rejects(f.session.paymentFetch(transport, 'wrong-grant')(origin + '/v2/invoicing/invoices', opts(body)));
  const changed = structuredClone(body); changed.items[0].unit_amount.value = '301.00'; await assert.rejects(fetch(origin + '/v2/invoicing/invoices', opts(changed)));
  assert.equal(calls, 0); await fetch(origin + '/v2/invoicing/invoices', opts(body)); assert.equal(calls, 1); assert.equal(f.session.snapshot().attempts.create, 1);
});
test('lost create response stays consumed across restart and permission cannot be replenished', async () => {
  const f = await fixture(), id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation); let calls = 0;
  const transport = async () => { calls++; throw Error('fictional lost response'); };
  await assert.rejects(f.session.paymentFetch(transport, id)(origin + '/v2/invoicing/invoices', opts(f.plan.proposedApproval.body)));
  const reopened = openSession(f.session.directory, f.now);
  await assert.rejects(reopened.paymentFetch(transport, id)(origin + '/v2/invoicing/invoices', opts(f.plan.proposedApproval.body)));
  assert.throws(() => reopened.authorizePaymentContinuation(f.plan, f.workspace, confirmation)); assert.equal(calls, 1); assert.equal(reopened.snapshot().attempts.create, 1);
});
test('failed send and concurrent create reserve once in the original persistent ledger', async () => {
  const f = await fixture(), id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation), competing = openSession(f.session.directory, f.now); let calls = 0, resolveCreate!: (value: Response) => void;
  const transport = async () => { calls++; return new Promise<Response>(resolve => { resolveCreate = resolve; }); };
  const first = f.session.paymentFetch(transport, id)(origin + '/v2/invoicing/invoices', opts(f.plan.proposedApproval.body));
  await assert.rejects(competing.paymentFetch(transport, id)(origin + '/v2/invoicing/invoices', opts(f.plan.proposedApproval.body)));
  resolveCreate(Response.json({ id: 'INV2-FICTIONAL-CONCURRENT' })); await first; assert.equal(calls, 1);
  const send = opts({ send_to_recipient: true, send_to_invoicer: true }), url = origin + '/v2/invoicing/invoices/INV2-FICTIONAL-CONCURRENT/send';
  await assert.rejects(f.session.paymentFetch(async () => { throw Error('fictional failed send'); }, id)(url, send));
  await assert.rejects(openSession(f.session.directory, f.now).paymentFetch(async () => { calls++; }, id)(url, send));
  assert.equal(calls, 1); assert.equal(f.session.snapshot().attempts.send, 1);
});
test('expired permission blocks all further dispatch while a late create response still records its identity', async () => {
  const f = await fixture(), id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation);
  const fetch = f.session.paymentFetch(async () => { f.advance(600000); return Response.json({ id: 'INV2-FICTIONAL-LATE' }); }, id);
  await fetch(origin + '/v2/invoicing/invoices', opts(f.plan.proposedApproval.body));
  assert.equal(f.session.snapshot().invoiceId, 'INV2-FICTIONAL-LATE'); let calls = 0;
  await assert.rejects(f.session.paymentFetch(async () => { calls++; }, id)(origin + '/v2/invoicing/invoices/INV2-FICTIONAL-LATE', { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(1000) }));
  assert.throws(() => f.session.environment({}, {}, id)); assert.equal(calls, 0);
});
test('corrupt continuation metadata is rejected on reopen and closed sessions cannot dispatch', async () => {
  const f = await fixture(), id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation);
  await f.session.cleanup({}); let calls = 0;
  await assert.rejects(f.session.paymentFetch(async () => { calls++; }, id)(origin + '/v2/invoicing/invoices', opts(f.plan.proposedApproval.body))); assert.equal(calls, 0);
  const file = join(f.session.directory, 'manifest.json'), state = JSON.parse(readFileSync(file, 'utf8')); state.paymentContinuation.expiresAt++;
  writeFileSync(file, JSON.stringify(state)); assert.throws(() => openSession(f.session.directory, f.now));
});
test('crossing the preparation UTC day blocks dispatch even inside the ten-minute permission', async () => {
  const f = await fixture(); f.advance((15 * 3600 + 59 * 60 + 49) * 1000);
  const id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation); f.advance(11000); let calls = 0;
  await assert.rejects(f.session.paymentFetch(async () => { calls++; }, id)(origin + '/v2/invoicing/invoices', opts(f.plan.proposedApproval.body)));
  assert.equal(calls, 0); assert.equal(f.session.snapshot().attempts.create, 0);
});
test('child environment binds exact DB, owner, merchant and payment permission without AI settings', async () => {
  const f = await fixture(), id = f.session.authorizePaymentContinuation(f.plan, f.workspace, confirmation);
  const env = { ...f.session.environment({ PAYPAL_CLIENT_ID: 'fictional', PAYPAL_CLIENT_SECRET: 'fictional', PAYPAL_MERCHANT_EMAIL: 'fictional@business.example.com' }, {}, id), NUDGE_PAYMENT_SESSION: f.session.directory, NUDGE_PAYMENT_GRANT: id };
  assert.throws(() => bindPaymentChild(env, undefined, f.now));
  assert.equal(bindPaymentChild(env, async () => {}, f.now).expiresAt, f.session.snapshot().paymentContinuation.expiresAt);
  for (const bad of [{ NUDGE_DB_PATH: 'other.sqlite' }, { NUDGE_ADMIN_TOKEN: 'other' }, { ELASTIC_API_KEY: 'never-allowed' }, { NUDGE_AI_ENABLED: 'true' }, { PAYPAL_MERCHANT_EMAIL: 'other@example.com' }, { NUDGE_PAYMENT_GRANT: 'wrong-grant' }]) assert.throws(() => bindPaymentChild({ ...env, ...bad }, async () => {}, f.now));
});
test('deadline timer schedules absolute shutdown, rejects expired or extended deadlines and does not renew on reuse', () => {
  let stopped = 0, delay = 0, scheduled!: () => void;
  const options = { now: () => 1000, stop: () => { stopped++; }, schedule: (fn: () => void, ms: number) => { delay = ms; scheduled = fn; return { unref() {} }; } };
  armDeadline(2000, options); assert.equal(delay, 1000); scheduled(); assert.equal(stopped, 1);
  assert.throws(() => armDeadline(1000, options)); assert.throws(() => armDeadline(601001, options));
  armDeadline(2000, { ...options, now: () => 1500 }); assert.equal(delay, 500);
});
