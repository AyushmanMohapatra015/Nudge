// Actual website payment controls, seeded disposable fixture and fictional transports only.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync, realpathSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createServer, createConnection } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
const require = createRequire(import.meta.url), root = process.cwd();
const { createSession, openSession } = require('./sandbox-rehearsal-controller.cjs');
const { acquireServeLock } = require('./sandbox-rehearsal-live.cjs');
const { prepare } = require('./sandbox-payment-plan.cjs');
const { elasticScopeInstructions } = require('../lib/scope-instructions.ts');
const injectFailure = process.argv[3] === '--fail-after-create';
assert(process.argv.length === 3 || (process.argv.length === 4 && injectFailure)); const app = realpathSync(resolve(process.argv[2]));
assert(app.startsWith(resolve('data/postman-workflow') + sep) && app.endsWith(sep + 'app-source'));
const prior = JSON.parse(readFileSync(resolve(app, '../summary.json'), 'utf8')); assert(prior.success && prior.restartPersistence && !prior.blockedProviderFetch);
const list = (base, relative) => { const p = join(base, relative), stat = lstatSync(p); assert(!stat.isSymbolicLink()); return stat.isDirectory() ? readdirSync(p).flatMap(n => list(base, join(relative, n))).sort() : [relative]; };
let matchedFiles = 0;
for (const dir of ['app', 'components', 'lib', ...(existsSync('public') ? ['public'] : [])]) { const paths = list(root, dir); assert.deepEqual(paths, list(app, dir)); for (const p of paths) { assert(readFileSync(p).equals(readFileSync(join(app, p)))); matchedFiles++; } }
for (const p of ['package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json']) assert(readFileSync(p).equals(readFileSync(join(app, p))));
const os = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
// Controlled historical clock only for constructing this synthetic expired fixture.
// The app, grant and transport use the real clock. No existing session is edited or reopened with a fake clock.
let session = createSession({ buyerEmail: 'sb-fictional@personal.example.com', merchantEmail: 'fictional-merchant@business.example.com', now: () => Date.now() - 3600001 });
session.transition('ai'); const agreement = session.snapshot().fixture.agreement;
const input = { approvedAgreement: { title: agreement.title, clauses: agreement.clauses }, clientRequest: 'Please add appointment booking with available time slots.' };
const expected = { endpoint: 'https://fictional.elastic.cloud/api/agent_builder/converse', agentId: 'fictional-agent', inferenceId: '.anthropic-claude-5-sonnet-chat_completion', instructions: elasticScopeInstructions, input };
const aiBody = { agent_id: expected.agentId, _execution_mode: 'local', inference_id: expected.inferenceId, access_control: { access_mode: 'private' }, configuration_overrides: { instructions: elasticScopeInstructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false }, input: JSON.stringify(input) };
await session.aiFetch(expected, async () => Response.json({ fictional: true }))(expected.endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(1000), body: JSON.stringify(aiBody) }); session.transition('review', true);
const run = session.directory; session = openSession(run); const oldDeadline = session.snapshot().expiresAt; assert(oldDeadline <= Date.now());
const time = new Date().toISOString(), deliverables = ['Appointment booking with available time slots'];
const workspace = { version: 1, mode: 'sandbox', clientToken: randomBytes(24).toString('hex'), clientLinkExpiresAt: new Date(Date.now() + 86400000).toISOString(), agreement, agreementStatus: 'accepted', agreementAcceptedAt: time,
  proposals: [{ id: randomUUID(), request: input.clientRequest, analysis: { source: 'elastic', classification: 'additional', summary: 'Fictional seeded analysis: S2 excludes booking.', references: ['S2'], questions: [], deliverables }, deliverables, amountCents: 30000, status: 'accepted', approvedAt: time, acceptedAt: time,
    scopeReview: { id: randomUUID(), classification: 'additional', rationale: 'Fictional test decision: S2 excludes the requested booking work.', references: ['S2'], clarification: '', deliverables, reviewedAt: time, actor: 'You' } }], invoices: [], policies: { protectedClient: false, reminderLimit: 3, cooldownDays: 7 }, audit: [{ id: randomUUID(), time, actor: 'System', title: 'Fictional test fixture', detail: 'Seeded accepted quote for offline payment-control testing; not live AI or user-consent evidence.' }] };
const db = new DatabaseSync(join(run, 'fictional.sqlite')); db.exec('CREATE TABLE workspaces (mode TEXT PRIMARY KEY, body TEXT NOT NULL)'); db.prepare('INSERT INTO workspaces VALUES (?,?)').run('sandbox', JSON.stringify(workspace)); db.close();
const remotePath = join(run, 'offline-remote.json'); writeFileSync(remotePath, JSON.stringify({ created: false, sent: false, paid: false }), { flag: 'wx' });
const plan = prepare({ session, workspace }); const id = session.authorizePaymentContinuation(plan, workspace, 'approve-one-usd300-sandbox-invoice-and-send');
const lease = acquireServeLock(run), report = { run, mode: 'fictional-payment-continuation-website', matchedFiles, seededFixture: true, realAiCalls: 0, realPayPalCalls: 0, browserErrors: [], success: false, browserClosed: false, serverClosed: false };
let server, browser, deadlineTimer, stage = 'startup';
const port = await new Promise((done, reject) => { const s = createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)); }); }), origin = 'http://127.0.0.1:' + port;
const closedPort = () => new Promise(done => { const s = createConnection({ host: '127.0.0.1', port }); s.setTimeout(1000); s.once('connect', () => { s.destroy(); done(false); }); s.once('error', e => done(e.code === 'ECONNREFUSED')); s.once('timeout', () => { s.destroy(); done(false); }); });
function killOwned() { if (server && server.exitCode === null && server.signalCode === null) spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { env: os, windowsHide: true, stdio: 'ignore', timeout: 10000 }); }
try {
  const env = session.environment({ PAYPAL_CLIENT_ID: 'fictional-paypal-id', PAYPAL_CLIENT_SECRET: 'fictional-paypal-no-access', PAYPAL_MERCHANT_EMAIL: 'fictional-merchant@business.example.com' }, os, id);
  Object.assign(env, { NUDGE_PAYMENT_SESSION: run, NUDGE_PAYMENT_GRANT: id, NODE_OPTIONS: '--require "' + resolve('scripts/sandbox-payment-offline.cjs').split(sep).join('/') + '"' });
  let startupError; server = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: 'ignore' }); server.on('error', e => { startupError = e.code; });
  deadlineTimer = setTimeout(killOwned, Math.max(1, session.snapshot().paymentContinuation.expiresAt - Date.now()));
  let ready = false; for (let i = 0; i < 80; i++) { if (startupError || server.exitCode !== null) throw Error('startup'); try { ready = (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(500) })).ok; } catch {} if (ready) break; await new Promise(done => setTimeout(done, 250)); } assert(ready);
  browser = await chromium.launch({ channel: 'msedge', headless: true, env: os }); const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block' }); context.setDefaultTimeout(15000);
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage(); page.on('pageerror', e => report.browserErrors.push(e.name)); await page.goto(origin); await page.getByLabel('Workspace token', { exact: true }).fill(env.NUDGE_ADMIN_TOKEN); await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  await page.getByRole('heading', { name: 'Good work deserves to get paid.', exact: true }).waitFor();
  const state = async () => { const r = await context.request.get(origin + '/api/workspace'); assert.equal(r.status(), 200); return r.json(); };
  let current = await state(); assert.equal(current.aiEnabled, false); assert.equal(current.connections.ai, false);
  stage = 'create'; await page.getByRole('button', { name: 'Create PayPal invoice', exact: true }).click(); await page.getByRole('button', { name: 'Invoice created', exact: true }).waitFor(); current = await state(); assert.equal(current.invoices.length, 1); assert.equal(current.invoices[0].status, 'DRAFT'); assert.equal(current.invoices[0].amountCents, 30000); assert.equal(current.invoices[0].proposalId, workspace.proposals[0].id);
  if (injectFailure) { report.expectedFailureInjected = true; throw Error('Expected offline failure after fictional create'); }
  // Restart the owned server before send to exercise persisted permission/identity/counters.
  await page.close(); killOwned(); assert(await closedPort()); session = openSession(run);
  server = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: 'ignore' }); server.on('error', () => {});
  ready = false; for (let i = 0; i < 80; i++) { try { ready = (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(500) })).ok; } catch {} if (ready) break; await new Promise(done => setTimeout(done, 250)); } assert(ready);
  const resumed = await context.newPage(); resumed.on('pageerror', e => report.browserErrors.push(e.name)); await resumed.goto(origin); await resumed.getByRole('button', { name: 'Payments', exact: true }).click();
  stage = 'send'; await resumed.getByRole('button', { name: 'Approve & send invoice', exact: true }).click(); await resumed.getByRole('button', { name: 'Draft reminder', exact: true }).waitFor(); current = await state(); assert.equal(current.invoices[0].status, 'UNPAID');
  stage = 'reconcile'; const remote = JSON.parse(readFileSync(remotePath, 'utf8')); assert(remote.created && remote.sent); writeFileSync(remotePath, JSON.stringify({ ...remote, paid: true }));
  await resumed.getByRole('button', { name: 'Refresh status', exact: true }).click(); await resumed.getByText('paid', { exact: true }).first().waitFor(); current = await state();
  assert.equal(current.invoices.length, 1); assert.equal(current.invoices[0].outstandingCents, 0); assert.equal(current.invoices[0].status, 'PAID'); assert.deepEqual(current.proposals[0].analysis, workspace.proposals[0].analysis); assert.deepEqual(current.agreement, agreement);
  assert.equal(current.audit.filter(a => a.title === 'Invoice created').length, 1); assert.equal(current.audit.filter(a => a.title === 'Invoice sent').length, 1); assert.deepEqual(report.browserErrors, []);
  await resumed.evaluate(() => { const n = document.createElement('div'); n.textContent = 'OFFLINE TEST - seeded fictional quote and PayPal responses; no real provider called'; n.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px;background:#172b21;color:white;text-align:center'; document.body.append(n); });
  await resumed.screenshot({ path: join(run, 'offline-continuation-paid.png'), fullPage: true, animations: 'disabled' }); report.restartPersistence = true; report.invoiceCents = 30000; report.outstandingCents = 0; report.success = true;
} catch (e) { report.failure = { stage, category: e.name }; process.exitCode = 1; }
finally {
  clearTimeout(deadlineTimer); try { if (browser) await browser.close(); report.browserClosed = true; } catch {}
  killOwned(); report.serverClosed = await closedPort(); session = openSession(run); report.attempts = session.snapshot().attempts; assert.equal(session.snapshot().expiresAt, oldDeadline);
  report.cleanup = await session.cleanup({ browser: async () => report.browserClosed, app: async () => report.serverClosed }); lease.finish(report.serverClosed);
  if (!report.cleanup.complete || !report.serverClosed) { report.success = false; process.exitCode = 1; }
  writeFileSync(join(run, 'continuation-website-summary.json'), JSON.stringify(report, null, 2), { flag: 'wx' }); console.log(JSON.stringify(report, null, 2));
}
