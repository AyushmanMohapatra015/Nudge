// Preparation is provider-free. Serving requires an exact prepared filename and explicit confirmation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, lstatSync, realpathSync, readdirSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { createServer, createConnection } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url), root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { openSession } = require('./sandbox-rehearsal-controller.cjs');
const { acquireServeLock } = require('./sandbox-rehearsal-live.cjs');
const { prepare, verify } = require('./sandbox-payment-plan.cjs');
const flag = '--confirm-one-usd300-sandbox-invoice-and-send';
function privateJson(file) { assert(!lstatSync(file).isSymbolicLink()); return JSON.parse(readFileSync(file, 'utf8')); }
function workspace(run) { const db = new DatabaseSync(join(run, 'fictional.sqlite'), { readOnly: true }); try { return JSON.parse(db.prepare('SELECT body FROM workspaces WHERE mode=?').get('sandbox').body); } finally { db.close(); } }
function verifiedBuild(run) {
  const app = realpathSync(privateJson(join(run, 'owner-plan.json')).app);
  assert(app.startsWith(join(root, 'data/postman-workflow') + sep) && app.endsWith(sep + 'app-source'));
  const evidence = privateJson(resolve(app, '../summary.json')); assert(evidence.success && evidence.restartPersistence && !evidence.blockedProviderFetch);
  const files = (base, rel) => { const p = join(base, rel), stat = lstatSync(p); assert(!stat.isSymbolicLink()); return stat.isDirectory() ? readdirSync(p).flatMap(n => files(base, join(rel, n))).sort() : [rel]; };
  for (const dir of ['app', 'components', 'lib', ...(existsSync(join(root, 'public')) ? ['public'] : [])]) { const names = files(root, dir); assert.deepEqual(names, files(app, dir)); for (const p of names) assert(readFileSync(join(root, p)).equals(readFileSync(join(app, p)))); }
  for (const p of ['package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts']) assert(readFileSync(join(root, p)).equals(readFileSync(join(app, p))));
  assert(!readdirSync(app).some(p => /^\.env(?:$|\.)/.test(p)), 'Disposable build must not load environment files');
  return app;
}
const portClosed = port => new Promise(done => { const s = createConnection({ host: '127.0.0.1', port }); s.setTimeout(1000); s.once('connect', () => { s.destroy(); done(false); }); s.once('error', e => done(e.code === 'ECONNREFUSED')); s.once('timeout', () => { s.destroy(); done(false); }); });
async function main() {
  const [command, target, filename, confirmation, ...extra] = process.argv.slice(2);
  // Reject incomplete activation before opening a run or reading any configuration.
  assert(!extra.length && target && (command === 'prepare' ? !filename && !confirmation : command === 'serve' && /^payment-plan-[a-f0-9-]{36}\.json$/.test(filename || '') && confirmation === flag));
  let session = openSession(resolve(root, target)); const run = session.directory, lease = acquireServeLock(run);
  let server, port, stopped = false, signalHandler, timer, activated = false, report;
  const os = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
  try {
    const app = verifiedBuild(run), current = workspace(run);
    if (command === 'prepare') {
      const plan = prepare({ session, workspace: current }), name = 'payment-plan-' + randomUUID() + '.json';
      writeFileSync(join(run, name), JSON.stringify(plan, null, 2), { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ prepared: true, planFile: name, amountCents: 30000, dueDate: plan.proposedApproval.body.detail.payment_term.due_date, activated: false, externalCalls: 0, credentialsRead: false })); return;
    }
    const plan = privateJson(join(run, filename)); verify(plan, { session, workspace: current });
    const config = parseEnv(readFileSync(join(root, '.env.local'), 'utf8'));
    assert.equal(config.NUDGE_MODE, 'sandbox'); assert.notEqual(config.NUDGE_AI_ENABLED, 'true');
    const settings = Object.fromEntries(['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL'].map(k => [k, config[k]]));
    assert(settings.PAYPAL_CLIENT_ID && settings.PAYPAL_CLIENT_SECRET && settings.PAYPAL_MERCHANT_EMAIL === session.snapshot().fixture.merchantEmail);
    assert(/^sb-[a-zA-Z0-9]+@personal\.example\.com$/.test(current.agreement.clientEmail) && current.agreement.clientEmail !== 'sb-fictional@personal.example.com');
    port = await new Promise((done, reject) => { const s = createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)); }); });
    const origin = 'http://127.0.0.1:' + port;
    const id = session.authorizePaymentContinuation(plan, current, 'approve-one-usd300-sandbox-invoice-and-send'); activated = true;
    report = { startedAt: new Date().toISOString(), mode: 'explicit-live-sandbox-payment-window', success: false, aiEnabled: false, serverClosed: false };
    const state = session.snapshot(), env = session.environment(settings, os, id);
    Object.assign(env, { NUDGE_PAYMENT_SESSION: run, NUDGE_PAYMENT_GRANT: id, NUDGE_PAYMENT_LIVE_CONFIRMATION: 'one-usd300-sandbox-invoice-and-send', NODE_OPTIONS: '--require "' + join(root, 'scripts/sandbox-payment-live.cjs').split(sep).join('/') + '"' });
    const stopFile = join(run, 'payment-stop-' + id + '.request'); assert(!existsSync(stopFile));
    signalHandler = () => { stopped = true; }; process.once('SIGINT', signalHandler); process.once('SIGTERM', signalHandler);
    timer = setTimeout(signalHandler, Math.max(1, state.paymentContinuation.expiresAt - Date.now()));
    let startupError; server = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: 'ignore' }); server.on('error', e => { startupError = e.code; });
    let ready = false; for (let i = 0; i < 80 && !stopped; i++) { if (startupError || server.exitCode !== null) throw Error('startup'); try { ready = (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(500) })).ok; } catch {} if (ready) break; await new Promise(done => setTimeout(done, 250)); } assert(ready);
    const accessFile = join(run, 'payment-owner-access-' + id + '.txt');
    writeFileSync(accessFile, `Local owner URL: ${origin}\nWorkspace token: ${state.ownerToken}\nExpires: ${new Date(state.paymentContinuation.expiresAt).toISOString()}\nStop file: ${stopFile}\nSandbox only. Create the accepted USD300 extra invoice once, then approve/send once. No AI or base invoice.\n`, { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ ready: true, accessFile, expiresAt: new Date(state.paymentContinuation.expiresAt).toISOString(), automaticInvoiceActions: 0, bound: 'Original ledger: create1/send1/OAuth4/read12; exact same accepted USD300 quote; no AI.' }));
    while (!stopped && !existsSync(stopFile) && server.exitCode === null) await new Promise(done => setTimeout(done, 200));
    report.success = true;
  } catch {
    if (report) report.failure = 'Payment window stopped; inspect private state before any retry. No automatic recreation.';
    throw Error('Payment preparation/window could not complete; no raw secret or provider error printed.');
  } finally {
    clearTimeout(timer); if (signalHandler) { process.removeListener('SIGINT', signalHandler); process.removeListener('SIGTERM', signalHandler); }
    let closed = !server;
    try {
      if (server && server.exitCode === null && server.signalCode === null) spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { env: os, windowsHide: true, stdio: 'ignore', timeout: 10000 });
      if (port) closed = await portClosed(port);
      if (activated) {
        session = openSession(run); const result = await session.cleanup({ app: async () => closed });
        report = report || { success: false }; report.serverClosed = closed; report.cleanup = result; report.attempts = session.snapshot().attempts;
        const final = workspace(run); report.invoiceCount = final.invoices.length; report.invoiceStatus = final.invoices[0]?.status; report.outstandingCents = final.invoices[0]?.outstandingCents;
        if (!closed || !result.complete) { report.success = false; process.exitCode = 1; }
        writeFileSync(join(run, 'payment-window-' + Date.now() + '.json'), JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 }); console.log(JSON.stringify(report));
      }
    } finally { lease.finish(closed); }
  }
}
main().catch(() => { console.error('Sandbox payment preparation/window rejected. Review retained local evidence; no automatic retry or raw secret output.'); process.exitCode = 1; });
