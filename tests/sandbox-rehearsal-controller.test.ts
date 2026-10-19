import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { elasticScopeInstructions } from '../lib/scope-instructions';
const require = createRequire(import.meta.url);
const { createSession, openSession } = require('../scripts/sandbox-rehearsal-controller.cjs');
const origin = 'https://api-m.sandbox.paypal.com';
function setup(now?: () => number) { return createSession({ buyerEmail: 'sb-fictional@personal.example.com', merchantEmail: 'fictional-merchant@business.example.com', ...(now ? { now } : {}) }); }
function ai(session: any) {
  const agreement = session.snapshot().fixture.agreement;
  const policy = { endpoint: 'https://fictional.elastic.cloud/api/agent_builder/converse', agentId: 'fictional-agent', inferenceId: '.anthropic-claude-5-sonnet-chat_completion', instructions: elasticScopeInstructions, input: { approvedAgreement: { title: agreement.title, clauses: agreement.clauses }, clientRequest: 'Please add appointment booking with available time slots.' } };
  const body = { agent_id: policy.agentId, _execution_mode: 'local', inference_id: policy.inferenceId, access_control: { access_mode: 'private' }, configuration_overrides: { instructions: policy.instructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false }, input: JSON.stringify(policy.input) };
  return { policy, options: { method: 'POST', redirect: 'error', body: JSON.stringify(body), signal: AbortSignal.timeout(5000) } };
}
function approved(session: any) {
  const deliverables = ['Appointment booking with available time slots'];
  return { mode: 'sandbox', agreement: session.snapshot().fixture.agreement, agreementStatus: 'accepted', proposals: [{ id: 'fictional-proposal', status: 'accepted', amountCents: 30000, analysis: { source: 'elastic' }, deliverables, scopeReview: { id: 'review-1', classification: 'additional', references: ['S2'], deliverables } }], invoices: [] };
}
async function review(session: any) {
  session.transition('ai'); const { policy, options } = ai(session);
  await session.aiFetch(policy, async () => Response.json({ fictional: true }))(policy.endpoint, options);
  session.transition('review', true);
}
async function payment(session: any) { await review(session); session.approve(approved(session), 'fictional-proposal', '2026-11-01'); session.transition('payment', true); }
function post(body: unknown) { return { method: 'POST', redirect: 'error', body: JSON.stringify(body), signal: AbortSignal.timeout(5000) }; }

test('session uses dedicated paths and filters phase credentials without loading ordinary environment', async () => {
  const session = setup(); const ordinary = resolve('data/nudge.sqlite');
  assert.notEqual(resolve(session.directory, 'fictional.sqlite'), ordinary);
  const settings = { ELASTIC_API_KEY: 'fictional-ai', ELASTIC_KIBANA_URL: 'https://fictional.elastic.cloud', PAYPAL_CLIENT_SECRET: 'fictional-paypal', PAYPAL_MERCHANT_EMAIL: 'fictional-merchant@business.example.com', NODE_OPTIONS: 'unsafe' };
  session.transition('ai'); const env = session.environment(settings, { PATH: 'fictional', NODE_OPTIONS: 'unsafe', GITHUB_TOKEN: 'private', PAYPAL_CLIENT_SECRET: 'wrong' });
  assert.equal(env.ELASTIC_API_KEY, 'fictional-ai'); assert.equal(env.PAYPAL_CLIENT_SECRET, undefined); assert.equal(env.NODE_OPTIONS, undefined); assert.equal(env.GITHUB_TOKEN, undefined);
  const { policy, options } = ai(session); await session.aiFetch(policy, async () => Response.json({}))(policy.endpoint, options); session.transition('review', true);
  session.approve(approved(session), 'fictional-proposal', '2026-11-01'); session.transition('payment', true);
  const paymentEnv = session.environment(settings); assert.equal(paymentEnv.ELASTIC_API_KEY, undefined); assert.equal(paymentEnv.NUDGE_AI_ENABLED, 'false'); assert.equal(paymentEnv.PAYPAL_CLIENT_SECRET, 'fictional-paypal'); assert.equal(paymentEnv.NUDGE_ADMIN_TOKEN, env.NUDGE_ADMIN_TOKEN); assert.equal(paymentEnv.NUDGE_DB_PATH, env.NUDGE_DB_PATH);
});

test('AI rejects changed input/model/instructions; failure consumes the one slot across reopen', async () => {
  const s = setup(); s.transition('ai'); const { policy, options } = ai(s); let calls = 0;
  for (const change of [{ instructions: 'changed' }, { inferenceId: 'other' }, { input: { private: 'data' } }, { endpoint: 'https://example.com/api/agent_builder/converse' }]) assert.throws(() => s.aiFetch({ ...policy, ...change }, async () => { calls++; }));
  await assert.rejects(s.aiFetch(policy, async () => { calls++; throw Error('fictional timeout'); })(policy.endpoint, options));
  const reopened = openSession(s.directory); await assert.rejects(reopened.aiFetch(policy, async () => { calls++; })(policy.endpoint, options)); assert.equal(calls, 1); assert.equal(reopened.snapshot().attempts.ai, 1);
});

test('stale handles, occupied locks, expired sessions and external paths fail closed', async () => {
  let time = 100; const s = setup(() => time), stale = openSession(s.directory, () => time);
  s.transition('ai'); assert.throws(() => stale.transition('ai'));
  const lock = resolve(s.directory, 'manifest.lock'); writeFileSync(lock, 'fictional interrupted operator', { flag: 'wx' }); assert.throws(() => s.transition('review', true)); assert(existsSync(lock));
  const expired = setup(() => time); time += 3600001; assert.throws(() => expired.transition('ai'));
  assert.throws(() => openSession(resolve('data'))); assert.throws(() => openSession(resolve('data/nudge.sqlite')));
  const clean = setup(() => time); time += 3600001; assert.equal((await clean.cleanup({})).complete, true);
});

test('owner review rejects unaccepted, changed-price, changed-recipient, missing-review and existing-invoice snapshots', async () => {
  const s = setup(); await review(s); const good = approved(s);
  const variants = [
    { ...good, agreement: { ...good.agreement, clientEmail: 'someone@example.com' } },
    { ...good, proposals: [{ ...good.proposals[0], amountCents: 100 }] },
    { ...good, proposals: [{ ...good.proposals[0], status: 'approved' }] },
    { ...good, proposals: [{ ...good.proposals[0], scopeReview: undefined }] },
    { ...good, proposals: [{ ...good.proposals[0], deliverables: ['Changed deliverable'] }] },
    { ...good, invoices: [{ id: 'existing' }] },
  ];
  for (const snapshot of variants) assert.throws(() => s.approve(snapshot, 'fictional-proposal', '2026-11-01'));
  assert.throws(() => s.transition('payment', true)); s.approve(good, 'fictional-proposal', '2026-11-01'); assert.throws(() => s.transition('payment')); s.transition('payment', true);
});

test('payment exact-body guard blocks altered amount/recipient/URL and reserves create/send once', async () => {
  const s = setup(); await payment(s); let creates = 0, sends = 0;
  const transport = s.paymentFetch(async (url: string) => { if (url.endsWith('/send')) { sends++; return new Response(null, { status: 202 }); } creates++; return Response.json({ id: 'INV2-FICTIONAL-123' }); });
  const body = s.snapshot().approval.body;
  for (const candidate of [ { ...body, items: [{ ...body.items[0], unit_amount: { currency_code: 'USD', value: '1.00' } }] }, { ...body, primary_recipients: [{ billing_info: { email_address: 'other@example.com' } }] } ]) await assert.rejects(transport(origin + '/v2/invoicing/invoices', post(candidate)));
  await assert.rejects(transport('https://api-m.paypal.com/v2/invoicing/invoices', post(body)));
  await transport(origin + '/v2/invoicing/invoices', post(body)); assert.equal(s.snapshot().invoiceId, 'INV2-FICTIONAL-123');
  await assert.rejects(transport(origin + '/v2/invoicing/invoices', post(body)));
  await assert.rejects(transport(origin + '/v2/invoicing/invoices/INV2-OTHER/send', post({ send_to_recipient: true, send_to_invoicer: true })));
  await transport(origin + '/v2/invoicing/invoices/INV2-FICTIONAL-123/send', post({ send_to_recipient: true, send_to_invoicer: true }));
  await assert.rejects(transport(origin + '/v2/invoicing/invoices/INV2-FICTIONAL-123/send', post({ send_to_recipient: true, send_to_invoicer: true })));
  assert.equal(creates, 1); assert.equal(sends, 1);
});

test('lost create response and failed send cannot dispatch again after restart', async () => {
  const s = setup(); await payment(s); let calls = 0;
  await assert.rejects(s.paymentFetch(async () => { calls++; throw Error('lost create'); })(origin + '/v2/invoicing/invoices', post(s.snapshot().approval.body)));
  const reopened = openSession(s.directory); await assert.rejects(reopened.paymentFetch(async () => { calls++; })(origin + '/v2/invoicing/invoices', post(reopened.snapshot().approval.body))); assert.equal(calls, 1);
  const other = setup(); await payment(other);
  await other.paymentFetch(async () => Response.json({ id: 'INV2-FICTIONAL-456' }))(origin + '/v2/invoicing/invoices', post(other.snapshot().approval.body));
  const url = origin + '/v2/invoicing/invoices/INV2-FICTIONAL-456/send', options = post({ send_to_recipient: true, send_to_invoicer: true });
  await assert.rejects(other.paymentFetch(async () => { calls++; throw Error('lost send'); })(url, options));
  await assert.rejects(openSession(other.directory).paymentFetch(async () => { calls++; })(url, options)); assert.equal(calls, 2);
});

test('malformed create output and foreign links consume create without binding a sendable identity', async () => {
  for (const response of [() => new Response('not json'), () => Response.json({ href: 'https://example.com/v2/invoicing/invoices/INV2-OTHER' }), () => new Response('x'.repeat(131073))]) {
    const s = setup(); await payment(s); await assert.rejects(s.paymentFetch(response)(origin + '/v2/invoicing/invoices', post(s.snapshot().approval.body))); assert.equal(s.snapshot().attempts.create, 1); assert.equal(s.snapshot().invoiceId, undefined);
  }
});

test('read-only and authentication traffic have separate bounded slots, other financial actions rejected', async () => {
  const s = setup(); await payment(s);
  const f = s.paymentFetch(async (url: string) => Response.json(url.endsWith('/v2/invoicing/invoices') ? { id: 'INV2-FICTIONAL-789' } : {}));
  const auth = { method: 'POST', redirect: 'error', body: 'grant_type=client_credentials', signal: AbortSignal.timeout(5000) };
  for (let i = 0; i < 4; i++) await f(origin + '/v1/oauth2/token', auth); await assert.rejects(f(origin + '/v1/oauth2/token', auth));
  await f(origin + '/v2/invoicing/invoices', post(s.snapshot().approval.body));
  const get = { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(5000) };
  for (let i = 0; i < 12; i++) await f(origin + '/v2/invoicing/invoices/INV2-FICTIONAL-789', get); await assert.rejects(f(origin + '/v2/invoicing/invoices/INV2-FICTIONAL-789', get));
  for (const suffix of ['/remind', '/cancel', '/payments', '/refunds']) await assert.rejects(f(origin + '/v2/invoicing/invoices/INV2-FICTIONAL-789' + suffix, post({})));
});

test('cleanup continues after registration failure and reports incomplete without leaking errors', async () => {
  const s = setup(), order: string[] = [];
  const result = await s.cleanup({ tunnel: async () => { order.push('tunnel'); return true; }, registration: async () => { order.push('registration'); throw Error('private provider data'); }, browser: async () => { order.push('browser'); return true; }, app: async () => { order.push('app'); return false; }, relay: async () => { order.push('relay'); return true; } });
  assert.deepEqual(order, ['tunnel', 'registration', 'browser', 'app', 'relay']); assert.equal(result.complete, false); assert.equal(result.registration, 'failed'); assert.equal(result.app, 'unconfirmed'); assert.equal(s.snapshot().phase, 'closed'); assert(!JSON.stringify(result).includes('private')); assert.throws(() => s.transition('ai'));
  assert.equal(readFileSync(resolve(s.directory, 'manifest.json'), 'utf8').includes('private provider data'), false);
});

test('corrupted counters, changed fixture and changed approved body fail closed on reopen', async () => {
  for (const mutate of [
    (s: any) => { s.attempts.create = null; },
    (s: any) => { s.fixture.agreement.clientEmail = 'changed@example.com'; },
    (s: any) => { s.approval.body.items[0].unit_amount.value = '1.00'; },
    (s: any) => { s.invoiceId = '../other'; },
  ]) {
    const session = setup(); await payment(session); const file = resolve(session.directory, 'manifest.json');
    const data = JSON.parse(readFileSync(file, 'utf8')); mutate(data); writeFileSync(file, JSON.stringify(data)); assert.throws(() => openSession(session.directory));
  }
});

test('competing handles cannot dispatch two creates while the first response is unresolved', async () => {
  const first = setup(); await payment(first); const other = openSession(first.directory); let calls = 0;
  let release!: () => void; const waiting = new Promise<void>(done => { release = done; });
  const pending = first.paymentFetch(async () => { calls++; await waiting; return Response.json({ id: 'INV2-FICTIONAL-RACE' }); })(origin + '/v2/invoicing/invoices', post(first.snapshot().approval.body));
  await assert.rejects(other.paymentFetch(async () => { calls++; return Response.json({}); })(origin + '/v2/invoicing/invoices', post(other.snapshot().approval.body)));
  release(); await pending; assert.equal(calls, 1); assert.equal(openSession(first.directory).snapshot().attempts.create, 1);
});

test('hung cleanup reports timeout, requests abort and still attempts remaining resources', async () => {
  const s = setup(); let signal!: AbortSignal, appStopped = false;
  const report = await s.cleanup({ registration: async (value: AbortSignal) => { signal = value; return new Promise(() => {}); }, app: async () => { appStopped = true; return true; } }, 10);
  assert.equal(report.registration, 'timed-out'); assert.equal(report.complete, false); assert.equal(signal.aborted, true); assert.equal(appStopped, true);
});
