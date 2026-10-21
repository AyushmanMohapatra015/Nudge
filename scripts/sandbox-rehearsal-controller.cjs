// Operator-only controller primitives. No default fetch, process launch, key loading or live CLI.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { createOneAttemptFetch } = require('./elastic-one-attempt-guard.cjs');
const { elasticScopeInstructions } = require('../lib/scope-instructions.ts');
const base = path.resolve(__dirname, '../data/sandbox-rehearsal');
const origin = 'https://api-m.sandbox.paypal.com';
const fail = () => { throw Error('Rehearsal boundary rejected; inspect private session evidence before continuing.'); };
const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Shared pure validation/body construction; calling this does not authorise a transport.
function reviewedApproval(f, snapshot, proposalId, dueDate) {
  const p = snapshot.proposals?.find(p => p.id === proposalId);
  if (snapshot.processing || snapshot.mode !== 'sandbox' || snapshot.agreementStatus !== 'accepted' ||
      !isDeepStrictEqual(snapshot.agreement, f.agreement) || !p || p.status !== 'accepted' || p.amountCents !== 30000 ||
      p.analysis?.source !== 'elastic' || p.scopeReview?.classification !== 'additional' || !p.scopeReview.id ||
      !p.scopeReview.references?.includes('S2') || !isDeepStrictEqual(p.deliverables, p.scopeReview.deliverables) ||
      !Array.isArray(p.deliverables) || p.deliverables.length !== 1 || typeof p.deliverables[0] !== 'string' ||
      p.deliverables[0].trim().length < 3 || p.deliverables[0].length > 250 || !/^[a-zA-Z0-9-]{1,64}$/.test(p.id) ||
      snapshot.invoices?.length !== 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      !Number.isFinite(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0, 10) !== dueDate) fail();
  const description = p.deliverables.join('; ');
  return { proposalId: p.id, reviewId: p.scopeReview.id, body: {
    detail: { invoice_number: 'N-' + p.id.slice(0, 16), currency_code: 'USD', note: `Approved change to ${f.agreement.title}. ${description}`.slice(0, 4000), payment_term: { term_type: 'DUE_ON_DATE_SPECIFIED', due_date: dueDate } },
    invoicer: { email_address: f.merchantEmail }, primary_recipients: [{ billing_info: { email_address: f.agreement.clientEmail } }],
    items: [{ name: 'Approved additional work', description, quantity: '1', unit_amount: { currency_code: 'USD', value: '300.00' } }], configuration: { allow_tip: false },
  } };
}
function rejectLinks(target) {
  let current = path.parse(target).root;
  for (const component of target.slice(current.length).split(path.sep)) {
    current = path.join(current, component);
    if (fs.lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()) fail();
  }
}
function safeDirectory(directory) {
  const target = path.resolve(directory);
  if (!target.startsWith(base + path.sep)) fail();
  // Reject junctions/symlinks anywhere from the repository to the run.
  rejectLinks(target);
  if (!fs.existsSync(target) || fs.realpathSync(target) !== target) fail();
  return target;
}
function atomicWrite(file, value) {
  const temporary = file + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
  fs.renameSync(temporary, file);
}
function openSession(directory, now = Date.now) {
  const run = safeDirectory(directory), manifest = path.join(run, 'manifest.json');
  for (const name of ['manifest.json', 'manifest.lock', 'fictional.sqlite', 'ai-attempt.json']) {
    const file = path.join(run, name);
    if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) fail();
  }
  function read() {
    safeDirectory(run);
    for (const name of ['manifest.json', 'fictional.sqlite', 'fictional.sqlite-wal', 'fictional.sqlite-shm', 'ai-attempt.json']) rejectLinks(path.join(run, name));
    const s = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (s.schema !== 1 || s.id !== path.basename(run) || !Number.isSafeInteger(s.version) ||
        s.version < 0 || !Number.isSafeInteger(s.expiresAt) || typeof s.ownerToken !== 'string' || !/^[a-f0-9-]{72}$/.test(s.ownerToken) ||
        fingerprint(s.fixture) !== s.fixtureHash || s.fixture.amountCents !== 30000 || !['setup', 'ai', 'review', 'payment', 'closed'].includes(s.phase)) fail();
    for (const [kind, limit] of Object.entries({ ai: 1, oauth: 4, create: 1, send: 1, read: 12 })) {
      if (!Number.isSafeInteger(s.attempts?.[kind]) || s.attempts[kind] < 0 || s.attempts[kind] > limit) fail();
    }
    if ((s.approval && fingerprint(s.approval) !== s.approvalHash) || (s.phase === 'payment' && !s.approval) ||
        (s.invoiceId !== undefined && (typeof s.invoiceId !== 'string' || !/^INV2-[A-Z0-9-]+$/.test(s.invoiceId)))) fail();
    if (s.paymentContinuation) {
      const c = s.paymentContinuation;
      if (!/^[a-f0-9-]{36}$/.test(c.id) || !Number.isSafeInteger(c.grantedAt) || !Number.isSafeInteger(c.expiresAt) ||
          c.expiresAt !== c.grantedAt + 600000 || c.grantedAt < s.expiresAt || c.originalExpiresAt !== s.expiresAt ||
          c.approvalHash !== s.approvalHash || !s.approval || !/^[a-f0-9]{64}$/.test(c.sourceManifestHash)) fail();
    }
    return s;
  }
  let version = read().version;
  function change(update, allowExpired = false) {
    safeDirectory(run);
    const lock = path.join(run, 'manifest.lock'); let descriptor;
    try { descriptor = fs.openSync(lock, 'wx', 0o600); } catch { fail(); }
    try {
      const s = read();
      if (s.version !== version || (!allowExpired && now() >= s.expiresAt)) fail();
      const result = update(s); s.version++;
      atomicWrite(manifest, s); version = s.version;
      return result;
    } finally { fs.closeSync(descriptor); fs.unlinkSync(lock); }
  }
  function transition(next, previousAppClosed = false) {
    change(s => {
      const allowed = { setup: 'ai', ai: 'review', review: 'payment' };
      if (allowed[s.phase] !== next || (next === 'review' && (!previousAppClosed || s.attempts.ai !== 1)) ||
          (next === 'payment' && (!previousAppClosed || !s.approval))) fail();
      s.phase = next;
    });
  }
  function approve(snapshot, proposalId, dueDate) {
    change(s => {
      if (s.phase !== 'review' || s.approval) fail();
      s.approval = reviewedApproval(s.fixture, snapshot, proposalId, dueDate);
      s.approvalHash = fingerprint(s.approval);
    });
  }
  function authorizePaymentContinuation(plan, workspace, confirmation) {
    if (confirmation !== 'approve-one-usd300-sandbox-invoice-and-send') fail();
    let id;
    change(s => {
      if (s.paymentContinuation) fail();
      // Verify the original source and accepted quote under the existing manifest lock.
      require('./sandbox-payment-plan.cjs').verify(plan, { session: { snapshot: () => s }, workspace, now: now() });
      s.approval = structuredClone(plan.proposedApproval); s.approvalHash = fingerprint(s.approval);
      id = randomUUID(); const grantedAt = now();
      s.paymentContinuation = { id, grantedAt, expiresAt: grantedAt + 600000,
        originalExpiresAt: s.expiresAt, sourceManifestHash: plan.sourceManifestHash, approvalHash: s.approvalHash };
    }, true);
    return id;
  }
  function continuationAuthority(s, id, dispatch = true) {
    const c = s.paymentContinuation;
    if (!id || !c || c.id !== id || s.phase !== 'review' || c.approvalHash !== s.approvalHash ||
        (dispatch && (now() < c.grantedAt || now() >= c.expiresAt ||
          new Date(now()).toISOString().slice(0, 10) !== new Date(c.grantedAt).toISOString().slice(0, 10)))) fail();
  }
  function aiFetch(expected, delegate) {
    if (typeof delegate !== 'function') fail();
    const s = read();
    let destination; try { destination = new URL(expected.endpoint); } catch { fail(); }
    if (destination.protocol !== 'https:' || destination.username || destination.password || destination.port || destination.search || destination.hash ||
        !['.elastic.cloud', '.elastic-cloud.com', '.cloud.es.io'].some(suffix => destination.hostname.endsWith(suffix)) ||
        !/^\/(?:s\/[a-zA-Z0-9_-]+\/)?api\/agent_builder\/converse$/.test(destination.pathname) ||
        !/^[a-zA-Z0-9_-]{1,128}$/.test(expected.agentId) || expected.agentId === 'elastic-ai-agent' ||
        expected.inferenceId !== '.anthropic-claude-5-sonnet-chat_completion' || expected.instructions !== elasticScopeInstructions ||
        !isDeepStrictEqual(expected.input, { approvedAgreement: { title: s.fixture.agreement.title, clauses: s.fixture.agreement.clauses }, clientRequest: 'Please add appointment booking with available time slots.' })) fail();
    const guard = createOneAttemptFetch({ ...expected, ledgerPath: path.join(run, 'ai-attempt.json'), delegate: async (url, options) => {
      change(s => { if (s.phase !== 'ai' || s.attempts.ai) fail(); s.attempts.ai = 1; });
      return delegate(url, options);
    } });
    return guard;
  }
  function paymentFetch(delegate, continuationId) {
    if (typeof delegate !== 'function') fail();
    return async (url, options = {}) => {
      if (typeof url !== 'string' || options.redirect !== 'error' || !options.signal || options.signal.aborted) fail();
      let kind;
      change(s => {
        if (continuationId) continuationAuthority(s, continuationId);
        else if (s.phase !== 'payment') fail();
        if (url === origin + '/v1/oauth2/token' && options.method === 'POST' && options.body === 'grant_type=client_credentials') kind = 'oauth';
        else if (url === origin + '/v2/invoicing/invoices' && options.method === 'POST') {
          let body; try { body = JSON.parse(options.body); } catch { fail(); }
          if (!s.approval || !isDeepStrictEqual(body, s.approval.body)) fail(); kind = 'create';
        } else if (s.invoiceId && url === origin + '/v2/invoicing/invoices/' + s.invoiceId && options.method === 'GET' && options.body === undefined) kind = 'read';
        else if (s.invoiceId && url === origin + '/v2/invoicing/invoices/' + s.invoiceId + '/send' && options.method === 'POST') {
          let body; try { body = JSON.parse(options.body); } catch { fail(); }
          if (!isDeepStrictEqual(body, { send_to_recipient: true, send_to_invoicer: true })) fail(); kind = 'send';
        } else fail();
        const limits = { oauth: 4, create: 1, send: 1, read: 12 };
        if (s.attempts[kind] >= limits[kind]) fail(); s.attempts[kind]++;
      }, Boolean(continuationId)); // Reserve BEFORE delegation, including HTTP errors and timeouts.
      const response = await delegate(url, options);
      if (kind !== 'create' || !response.ok) return response;
      if (!response.body) fail();
      const reader = response.body.getReader(), parts = []; let bytes = 0;
      for (;;) { const p = await reader.read(); if (p.done) break; bytes += p.value.byteLength; if (bytes > 131072) { await reader.cancel(); fail(); } parts.push(p.value); }
      const buffer = Buffer.concat(parts); let data;
      try { data = JSON.parse(buffer.toString('utf8')); } catch { fail(); }
      const self = data.href || data.links?.find(link => link.rel === 'self')?.href;
      let id = data.id;
      if (!id && typeof self === 'string') {
        const link = new URL(self);
        if (link.origin !== origin || link.search || link.hash || link.username || link.password || !/^\/v2\/invoicing\/invoices\/INV2-[A-Z0-9-]+$/.test(link.pathname)) fail();
        id = link.pathname.split('/').pop();
      }
      if (typeof id !== 'string' || !/^INV2-[A-Z0-9-]+$/.test(id)) fail();
      change(s => {
        // Retain the identity of a reserved create even if its response arrives after grant expiry.
        // This records evidence only; any later dispatch still checks the deadline.
        if (continuationId) continuationAuthority(s, continuationId, false);
        if (s.invoiceId) fail(); s.invoiceId = id;
      }, Boolean(continuationId));
      return new Response(buffer, { status: response.status, headers: { 'content-type': 'application/json' } });
    };
  }
  function environment(settings, os = {}, continuationId) {
    const s = read();
    if (s.version !== version) fail();
    if (continuationId) continuationAuthority(s, continuationId);
    else if (now() >= s.expiresAt || !['ai', 'review', 'payment'].includes(s.phase)) fail();
    const env = Object.fromEntries(Object.entries(os).filter(([k]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
    Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: path.join(run, 'fictional.sqlite'), NUDGE_ADMIN_TOKEN: s.ownerToken, NUDGE_AI_PROVIDER: 'elastic', NUDGE_AI_ENABLED: s.phase === 'ai' ? 'true' : 'false' });
    const names = s.phase === 'ai' ? ['ELASTIC_KIBANA_URL', 'ELASTIC_API_KEY', 'ELASTIC_AGENT_ID', 'ELASTIC_SPACE_ID', 'ELASTIC_INFERENCE_ID'] : s.phase === 'payment' || continuationId ? ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL'] : [];
    for (const name of names) if (typeof settings[name] === 'string') env[name] = settings[name];
    if ((s.phase === 'payment' || continuationId) && env.PAYPAL_MERCHANT_EMAIL !== s.fixture.merchantEmail) fail();
    return env;
  }
  async function cleanup(owned, timeoutMs = 10000) {
    // Callbacks must be bound to resources created by the eventual owning runner;
    // never accept arbitrary PIDs/registration IDs from a user or stale manifest.
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000) fail();
    const report = {};
    for (const name of ['tunnel', 'registration', 'browser', 'app', 'relay']) {
      if (!owned[name]) { report[name] = 'not-owned'; continue; }
      let timer; const abort = new AbortController();
      try {
        const result = await Promise.race([Promise.resolve().then(() => owned[name](abort.signal)), new Promise(resolve => { timer = setTimeout(() => { abort.abort(); resolve('timed-out'); }, timeoutMs); })]);
        report[name] = result === true ? 'confirmed' : result === 'timed-out' ? 'timed-out' : 'unconfirmed';
      }
      catch { report[name] = 'failed'; }
      finally { clearTimeout(timer); }
    }
    change(s => { s.phase = 'closed'; s.cleanup = report; }, true);
    return { ...report, complete: Object.values(report).every(v => ['confirmed', 'not-owned'].includes(v)) };
  }
  return { directory: run, snapshot: read, transition, approve, authorizePaymentContinuation, aiFetch, paymentFetch, environment, cleanup };
}
function createSession({ buyerEmail, merchantEmail, now = Date.now }) {
  if (!/^sb-[a-zA-Z0-9]+@personal\.example\.com$/.test(buyerEmail) || typeof merchantEmail !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(merchantEmail) || buyerEmail === merchantEmail) fail();
  rejectLinks(base); fs.mkdirSync(base, { recursive: true });
  const id = randomUUID(), run = path.join(base, id); fs.mkdirSync(run); safeDirectory(run);
  const fixture = { amountCents: 30000, merchantEmail, agreement: { title: 'Fictional five-page marketing website', clientName: 'Fictional client', clientEmail: buyerEmail, amountCents: 120000, clauses: [
    { id: 'S1', text: 'Five responsive marketing pages are included.' }, { id: 'S2', text: 'Appointment booking, scheduling calendars and booking integrations are excluded.' }, { id: 'S3', text: 'Two minor revision rounds are included.' },
  ] } };
  fs.writeFileSync(path.join(run, 'manifest.json'), JSON.stringify({ schema: 1, id, version: 0, phase: 'setup', expiresAt: now() + 3600000, fixture, fixtureHash: fingerprint(fixture), ownerToken: randomUUID() + randomUUID(), attempts: { ai: 0, oauth: 0, create: 0, send: 0, read: 0 } }, null, 2), { flag: 'wx', mode: 0o600 });
  return openSession(run, now);
}
module.exports = { createSession, openSession, reviewedApproval };
