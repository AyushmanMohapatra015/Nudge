// Explicit live binding only. No default transport and no application-wide spend cap.
const fs = require('node:fs');
const path = require('node:path');
const { openSession } = require('./sandbox-rehearsal-controller.cjs');
const { observedTransport } = require('./elastic-live-review.cjs');
const { elasticScopeInstructions } = require('../lib/scope-instructions.ts');
const reject = () => { throw Error('Live rehearsal is not approved for this session/phase.'); };

function createLiveBinding({ session, grant, expectedAI, transport, saveUsage, now = Date.now }) {
  if (typeof transport !== 'function') reject();
  const phase = session.snapshot().phase;
  function check() {
    const state = session.snapshot();
    const expected = phase === 'ai' ? { ai: 1, create: 0, send: 0 } : phase === 'payment' ? { ai: 0, create: 1, send: 1 } : { ai: 0, create: 0, send: 0 };
    if (!grant || grant.kind !== 'operator-approved-loopback' || grant.sessionId !== state.id || grant.fixtureHash !== state.fixtureHash || grant.phase !== phase || state.phase !== phase ||
        !['ai', 'review', 'payment'].includes(phase) || !Number.isSafeInteger(grant.expiresAt) || grant.expiresAt > state.expiresAt || now() >= grant.expiresAt ||
        ['ai', 'create', 'send'].some(k => grant.limits?.[k] !== expected[k])) reject();
  }
  check();
  const delegate = phase === 'ai' ? (() => {
    if (typeof saveUsage !== 'function') reject();
    return session.aiFetch(expectedAI, observedTransport(transport, saveUsage));
  })() : phase === 'payment' ? session.paymentFetch(transport) : async () => reject();
  return async (url, options) => { check(); return delegate(url, options); };
}
function acquireServeLock(directory) {
  const session = openSession(directory), file = path.join(session.directory, 'serve.lock');
  let descriptor; try { descriptor = fs.openSync(file, 'wx', 0o600); } catch { reject(); }
  let finished = false;
  return { finish(noOwnedServerRemains) { if (finished) return; finished = true; fs.closeSync(descriptor); if (noOwnedServerRemains === true) fs.unlinkSync(file); } };
}
module.exports = { createLiveBinding, acquireServeLock };

if (process.env.NUDGE_REHEARSAL_LIVE_SESSION) {
  const session = openSession(process.env.NUDGE_REHEARSAL_LIVE_SESSION), state = session.snapshot();
  const file = path.join(session.directory, 'live-approval.json');
  if (fs.lstatSync(file).isSymbolicLink() || process.env.NUDGE_MODE !== 'sandbox' || process.env.NUDGE_DB_PATH !== path.join(session.directory, 'fictional.sqlite') || process.env.NUDGE_ADMIN_TOKEN !== state.ownerToken) reject();
  const grant = JSON.parse(fs.readFileSync(file, 'utf8'));
  let expectedAI;
  if (state.phase === 'ai') {
    if (process.env.NUDGE_AI_ENABLED !== 'true' || !process.env.ELASTIC_API_KEY || process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_SECRET) reject();
    const cloud = new URL(process.env.ELASTIC_KIBANA_URL), space = process.env.ELASTIC_SPACE_ID || '';
    if (cloud.pathname !== '/' || cloud.username || cloud.password || cloud.port || cloud.search || cloud.hash || (space && !/^[a-zA-Z0-9_-]{1,128}$/.test(space))) reject();
    const agreement = state.fixture.agreement;
    expectedAI = { endpoint: cloud.origin + (space ? '/s/' + space : '') + '/api/agent_builder/converse', agentId: process.env.ELASTIC_AGENT_ID, inferenceId: process.env.ELASTIC_INFERENCE_ID, instructions: elasticScopeInstructions,
      input: { approvedAgreement: { title: agreement.title, clauses: agreement.clauses }, clientRequest: 'Please add appointment booking with available time slots.' } };
  } else if (state.phase === 'payment') {
    if (process.env.NUDGE_AI_ENABLED !== 'false' || process.env.ELASTIC_API_KEY || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_MERCHANT_EMAIL !== state.fixture.merchantEmail) reject();
  } else if (process.env.NUDGE_AI_ENABLED !== 'false' || process.env.ELASTIC_API_KEY || process.env.PAYPAL_CLIENT_SECRET) reject();
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = createLiveBinding({ session, grant, expectedAI, transport: originalFetch,
    saveUsage: receipt => fs.writeFileSync(path.join(session.directory, 'live-ai-usage.json'), JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600 }) });
}
