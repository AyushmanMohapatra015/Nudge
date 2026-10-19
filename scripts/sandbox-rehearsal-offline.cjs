// Stub-only child preloader. Never retain the original fetch or read .env files.
const fs = require('node:fs');
const path = require('node:path');
const { openSession } = require('./sandbox-rehearsal-controller.cjs');
const { elasticScopeInstructions } = require('../lib/scope-instructions.ts');
if (!process.env.NUDGE_REHEARSAL_OFFLINE_SESSION) throw Error('Explicit disposable offline session required');
const session = openSession(process.env.NUDGE_REHEARSAL_OFFLINE_SESSION);
const initial = session.snapshot();
if (process.env.NUDGE_MODE !== 'sandbox' || process.env.NUDGE_DB_PATH !== path.join(session.directory, 'fictional.sqlite') ||
    initial.fixture.agreement.clientEmail !== 'sb-fictional@personal.example.com' || initial.fixture.merchantEmail !== 'fictional-merchant@business.example.com') throw Error('Only fictional rehearsal data allowed');
const remotePath = path.join(session.directory, 'offline-remote.json');
if (fs.lstatSync(remotePath).isSymbolicLink()) throw Error('Invalid offline fixture path');
if (initial.phase === 'ai') {
  if (process.env.ELASTIC_API_KEY !== 'fictional-ai-no-access' || process.env.ELASTIC_KIBANA_URL !== 'https://nudge-offline.elastic.cloud' || process.env.PAYPAL_CLIENT_SECRET) throw Error('Only fictional AI settings allowed');
  const agreement = initial.fixture.agreement;
  globalThis.fetch = session.aiFetch({ endpoint: 'https://nudge-offline.elastic.cloud/api/agent_builder/converse', agentId: 'nudge-offline-scope-review', inferenceId: '.anthropic-claude-5-sonnet-chat_completion', instructions: elasticScopeInstructions,
    input: { approvedAgreement: { title: agreement.title, clauses: agreement.clauses }, clientRequest: 'Please add appointment booking with available time slots.' } }, async () => Response.json({
    status: 'completed', conversation_id: 'fictional-offline-conversation', steps: [], response: { message: JSON.stringify({ classification: 'additional', summary: 'S2 explicitly excludes appointment booking. Review this separate deliverable before proposing a price.', references: ['S2'], questions: [], deliverables: ['Appointment booking with available time slots'] }) },
  }));
} else if (initial.phase === 'review') {
  globalThis.fetch = async () => { throw Error('No provider transport in review phase'); };
} else if (initial.phase === 'payment') {
  if (process.env.NUDGE_AI_ENABLED !== 'false' || process.env.ELASTIC_API_KEY || process.env.PAYPAL_CLIENT_ID !== 'fictional-paypal-id' || process.env.PAYPAL_CLIENT_SECRET !== 'fictional-paypal-no-access') throw Error('Only fictional payment settings allowed');
  globalThis.fetch = session.paymentFetch(async (url, options) => {
    const remote = JSON.parse(fs.readFileSync(remotePath, 'utf8'));
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'fictional-no-access', expires_in: 3600 });
    if (url.endsWith('/v2/invoicing/invoices') && options.method === 'POST') {
      remote.created = true; fs.writeFileSync(remotePath, JSON.stringify(remote)); return Response.json({ id: 'INV2-FICTIONAL-REHEARSAL' });
    }
    if (url.endsWith('/send')) { remote.sent = true; fs.writeFileSync(remotePath, JSON.stringify(remote)); return new Response(null, { status: 202 }); }
    if (!remote.created) throw Error('Fictional invoice not created');
    return Response.json({ id: 'INV2-FICTIONAL-REHEARSAL', status: remote.paid ? 'PAID' : remote.sent ? 'SENT' : 'DRAFT',
      amount: { currency_code: 'USD', value: '300.00' }, due_amount: { currency_code: 'USD', value: remote.paid ? '0.00' : '300.00' },
      detail: { metadata: { recipient_view_url: 'https://www.sandbox.paypal.com/invoice/p/fictional-not-payable' } } });
  });
} else throw Error('Offline phase cannot start');
