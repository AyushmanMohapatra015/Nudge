// Preparation is the default. Serving requires an explicit phase confirmation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, realpathSync, readdirSync, lstatSync } from 'node:fs';
import { resolve, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseEnv } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { createServer, createConnection } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { createSession, openSession } = require('./sandbox-rehearsal-controller.cjs');
const { acquireServeLock } = require('./sandbox-rehearsal-live.cjs');
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fields = ['ELASTIC_KIBANA_URL', 'ELASTIC_API_KEY', 'ELASTIC_AGENT_ID', 'ELASTIC_SPACE_ID', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL'];
function settings() {
  const source = parseEnv(readFileSync(join(root, '.env.local'), 'utf8'));
  assert.equal(source.NUDGE_MODE, 'sandbox'); assert.notEqual(source.NUDGE_AI_ENABLED, 'true');
  return { source, provider: { ...Object.fromEntries(fields.filter(k => typeof source[k] === 'string').map(k => [k, source[k]])), ELASTIC_INFERENCE_ID: '.anthropic-claude-5-sonnet-chat_completion' } };
}
function verifiedBuild(input) {
  const app = realpathSync(resolve(root, input));
  assert(app.startsWith(resolve(root, 'data/postman-workflow') + sep) && app.endsWith(sep + 'app-source'));
  const receipt = JSON.parse(readFileSync(resolve(app, '../summary.json'), 'utf8')); assert(receipt.success && receipt.restartPersistence && !receipt.blockedProviderFetch);
  const files = (base, rel) => { const p = join(base, rel), stat = lstatSync(p); assert(!stat.isSymbolicLink()); return stat.isDirectory() ? readdirSync(p).flatMap(n => files(base, join(rel, n))).sort() : [rel]; };
  for (const directory of ['app', 'components', 'lib', ...(existsSync(join(root, 'public')) ? ['public'] : [])]) {
    const names = files(root, directory); assert.deepEqual(names, files(app, directory)); for (const name of names) assert(readFileSync(join(root, name)).equals(readFileSync(join(app, name))));
  }
  for (const name of ['package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts']) assert(readFileSync(join(root, name)).equals(readFileSync(join(app, name))));
  return app;
}
function workspace(database) {
  const db = new DatabaseSync(database, { readOnly: true });
  try { const row = db.prepare('SELECT body FROM workspaces WHERE mode=?').get('sandbox'); assert(row); return JSON.parse(row.body); } finally { db.close(); }
}
const closedPort = port => new Promise(done => { const s = createConnection({ host: '127.0.0.1', port }); s.setTimeout(2000); s.once('connect', () => { s.destroy(); done(false); }); s.once('error', e => done(e.code === 'ECONNREFUSED')); s.once('timeout', () => { s.destroy(); done(false); }); });
async function main() {
  const [command, target, confirmation, ...extra] = process.argv.slice(2);
  assert(!extra.length && target);
  if (command === 'prepare') {
    assert(!confirmation); const app = verifiedBuild(target), { source, provider } = settings();
    const database = resolve(root, source.NUDGE_DB_PATH || 'data/nudge.sqlite'); assert(database.startsWith(join(root, 'data') + sep));
    const reference = JSON.parse(readFileSync(join(root, 'data/fresh-payment-webhook-session.json'), 'utf8')); assert.equal(reference.environment, 'sandbox');
    const state = workspace(database), invoice = state.invoices.find(i => i.id === reference.invoiceId);
    assert(invoice && invoice.status === 'PAID' && invoice.outstandingCents === 0);
    const session = createSession({ buyerEmail: invoice.recipientEmail, merchantEmail: provider.PAYPAL_MERCHANT_EMAIL });
    writeFileSync(join(session.directory, 'owner-plan.json'), JSON.stringify({ app, minimumRoute: 'loopback-reconciliation', preparedAt: new Date().toISOString() }, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ prepared: true, run: session.directory, externalCalls: 0, approvalCreated: false, amountCents: 30000, buyerSource: 'existing paid sandbox fixture; address not printed', next: 'Owner reviews phase commands in SANDBOX_REHEARSAL_PLAN.md before any serve command. No service was started.' }, null, 2)); return;
  }
  assert(['serve-ai', 'serve-review', 'serve-payment'].includes(command));
  const expectedFlag = { 'serve-ai': '--confirm-one-ai-conversation', 'serve-review': '--confirm-local-review-only', 'serve-payment': '--confirm-one-usd300-sandbox-invoice-and-send' }[command];
  assert.equal(confirmation, expectedFlag);
  let session = openSession(resolve(root, target)); const run = session.directory;
  const lease = acquireServeLock(run); let serverMayRun = false, closureConfirmed = false;
  try {
  const planPath = join(run, 'owner-plan.json'); assert(!lstatSync(planPath).isSymbolicLink());
  const plan = JSON.parse(readFileSync(planPath, 'utf8')); const app = verifiedBuild(plan.app);
  const phase = command.slice(6), before = session.snapshot();
  if (phase === 'ai') {
    assert(['setup', 'ai'].includes(before.phase)); assert.equal(before.attempts.ai, 0); assert(!existsSync(join(run, 'ai-attempt.json')));
    if (before.phase === 'setup') session.transition('ai');
  }
  else assert.equal(before.phase, phase);
  const { provider } = settings(), os = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
  const state = session.snapshot();
  if (phase === 'payment') assert.equal(state.approval.body.detail.payment_term.due_date, new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), 'Review date changed; stop before creating an invoice');
  // A previous completed grant is not a new budget: counters are kept in the controller manifest.
  const grant = { kind: 'operator-approved-loopback', sessionId: state.id, fixtureHash: state.fixtureHash, phase, expiresAt: Math.min(state.expiresAt, Date.now() + 600000), limits: phase === 'ai' ? { ai: 1, create: 0, send: 0 } : phase === 'payment' ? { ai: 0, create: 1, send: 1 } : { ai: 0, create: 0, send: 0 } };
  const approvalPath = join(run, 'live-approval.json'); if (existsSync(approvalPath)) assert(!lstatSync(approvalPath).isSymbolicLink());
  writeFileSync(approvalPath, JSON.stringify(grant, null, 2), { mode: 0o600 });
  const env = session.environment(provider, os), preloader = join(root, 'scripts/sandbox-rehearsal-live.cjs').split(sep).join('/'); assert(!/["\r\n]/.test(preloader));
  Object.assign(env, { NUDGE_REHEARSAL_LIVE_SESSION: run, NODE_OPTIONS: '--require "' + preloader + '"' });
  const port = await new Promise((done, reject) => { const s = createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)); }); });
  const origin = 'http://127.0.0.1:' + port;
  let appProcess, stopRequested = false, timer; const stop = () => { stopRequested = true; };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  const receipt = { phase, startedAt: new Date().toISOString(), realUsage: phase === 'ai' ? 'see private live-ai-usage.json if attempted' : 'no AI enabled', serverClosed: false, stopped: false };
  try {
    let startupError;
    appProcess = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: 'ignore' });
    serverMayRun = true;
    appProcess.on('error', e => { startupError = e.code; }); let ready = false;
    for (let i = 0; i < 80 && !stopRequested; i++) {
      if (startupError || appProcess.exitCode !== null) throw Error('startup');
      try { ready = (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(500) })).ok; } catch {}
      if (ready) break; await new Promise(done => setTimeout(done, 250));
    }
    assert(ready);
    if (phase === 'ai') {
      // Prepare the exact new scope through authenticated local routes. Acceptance remains manual.
      const auth = await fetch(origin + '/api/session', { method: 'POST', redirect: 'error', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ token: state.ownerToken }), signal: AbortSignal.timeout(5000) }); assert(auth.ok);
      const cookie = auth.headers.get('set-cookie')?.split(';')[0]; assert(cookie);
      const initial = await fetch(origin + '/api/workspace', { headers: { cookie }, signal: AbortSignal.timeout(5000) }); assert(initial.ok); const data = await initial.json();
      assert(data.proposals.length === 0 && data.invoices.length === 0);
      if (data.agreementStatus === 'draft') {
        const saved = await fetch(origin + '/api/workspace', { method: 'POST', redirect: 'error', headers: { origin, cookie, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'saveAgreement', agreement: state.fixture.agreement }), signal: AbortSignal.timeout(5000) }); assert(saved.ok);
      } else assert.deepEqual(data.agreement, state.fixture.agreement);
    }
    writeFileSync(join(run, 'owner-access.txt'), `Local owner URL: ${origin}\nWorkspace token: ${state.ownerToken}\nPrivate: do not upload/share this file. Stop this session with Ctrl+C.\n`, { mode: 0o600 });
    console.log(JSON.stringify({ ready: true, phase, localUrl: origin, privateAccessFile: join(run, 'owner-access.txt'), expiry: new Date(grant.expiresAt).toISOString(), action: phase === 'ai' ? 'Manually approve/accept scope, then compare the exact booking request once.' : phase === 'review' ? 'Manually review scope, set USD300, approve and accept the change; then Ctrl+C.' : 'Create/send only the accepted USD300 extra; buyer checkout stays manual and sandbox-only. Then Ctrl+C.', stop: 'Ctrl+C; session also stops at its ten-minute grant deadline.' }, null, 2));
    timer = setTimeout(stop, Math.max(1, grant.expiresAt - Date.now()));
    while (!stopRequested && appProcess.exitCode === null) await new Promise(done => setTimeout(done, 250));
    if (!stopRequested) throw Error('app-exit'); receipt.stopped = true;
  } catch { receipt.failure = 'Session stopped; inspect retained private state and sanitized usage before continuing. No automatic retry.'; process.exitCode = 1; }
  finally {
    clearTimeout(timer); process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
    if (appProcess && appProcess.exitCode === null && appProcess.signalCode === null) spawnSync('taskkill', ['/PID', String(appProcess.pid), '/T', '/F'], { env: os, windowsHide: true, stdio: 'ignore', timeout: 10000 });
    receipt.serverClosed = await closedPort(port);
    closureConfirmed = receipt.serverClosed;
    if (!receipt.serverClosed) { receipt.failure = 'Owned loopback closure unconfirmed; no phase advance.'; process.exitCode = 1; }
    if (receipt.serverClosed && !receipt.failure) {
      try {
        session = openSession(run); const snapshot = workspace(join(run, 'fictional.sqlite'));
        if (phase === 'ai' && session.snapshot().attempts.ai === 1 && snapshot.proposals.length === 1 && snapshot.proposals[0].analysis.source === 'elastic' && !snapshot.processing) session.transition('review', true);
        if (phase === 'review') {
          const proposal = snapshot.proposals.find(p => p.status === 'accepted');
          if (proposal) { session.approve(snapshot, proposal.id, new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)); session.transition('payment', true); }
        }
        receipt.nextPhase = session.snapshot().phase;
      } catch { receipt.failure = 'Phase finalization requires review; no automatic retry or phase advance.'; process.exitCode = 1; }
    }
    receipt.endedAt = new Date().toISOString(); writeFileSync(join(run, 'serve-' + phase + '-' + Date.now() + '.json'), JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify(receipt, null, 2));
  }
  } finally { lease.finish(!serverMayRun || closureConfirmed); }
}
main().catch(() => { console.error('Rehearsal preparation/phase stopped. No raw credential or provider error displayed. Inspect the private session before continuing; never create a replacement invoice to bypass an unresolved attempt.'); process.exitCode = 1; });
