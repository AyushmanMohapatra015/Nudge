// Actual website/adapter rehearsal with fictional transports only. Never loads .env.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createServer, createConnection } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
const require = createRequire(import.meta.url);
const { createSession, openSession } = require('./sandbox-rehearsal-controller.cjs');
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
assert.equal(process.argv.length, 3, 'Pass one matching verified disposable production build');
const app = realpathSync(resolve(root, process.argv[2]));
assert(app.startsWith(resolve(root, 'data/postman-workflow') + sep) && app.endsWith(sep + 'app-source'));
const prior = JSON.parse(readFileSync(resolve(app, '../summary.json'), 'utf8'));
assert(prior.success && prior.restartPersistence && !prior.blockedProviderFetch);
function files(base, relative) { const file = resolve(base, relative), stat = lstatSync(file); assert(!stat.isSymbolicLink()); return stat.isDirectory() ? readdirSync(file).flatMap(n => files(base, relative + '/' + n)).sort() : [relative]; }
let matchedFiles = 0;
for (const directory of ['app', 'components', 'lib', ...(existsSync(resolve(root, 'public')) ? ['public'] : [])]) {
  const paths = files(root, directory); assert.deepEqual(paths, files(app, directory));
  for (const file of paths) { assert(readFileSync(resolve(root, file)).equals(readFileSync(resolve(app, file))), 'Production runtime mismatch'); matchedFiles++; }
}
for (const file of ['package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts']) assert(readFileSync(resolve(root, file)).equals(readFileSync(resolve(app, file))), 'Production config mismatch');
const osEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
const settings = { ELASTIC_KIBANA_URL: 'https://nudge-offline.elastic.cloud', ELASTIC_API_KEY: 'fictional-ai-no-access', ELASTIC_AGENT_ID: 'nudge-offline-scope-review', ELASTIC_INFERENCE_ID: '.anthropic-claude-5-sonnet-chat_completion', PAYPAL_CLIENT_ID: 'fictional-paypal-id', PAYPAL_CLIENT_SECRET: 'fictional-paypal-no-access', PAYPAL_MERCHANT_EMAIL: 'fictional-merchant@business.example.com' };
let session = createSession({ buyerEmail: 'sb-fictional@personal.example.com', merchantEmail: settings.PAYPAL_MERCHANT_EMAIL });
const run = session.directory, remotePath = resolve(run, 'offline-remote.json');
writeFileSync(remotePath, JSON.stringify({ created: false, sent: false, paid: false }), { flag: 'wx' });
const port = await new Promise((done, reject) => { const s = createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)); }); });
const origin = 'http://127.0.0.1:' + port;
const preload = resolve(root, 'scripts/sandbox-rehearsal-offline.cjs').split(sep).join('/'); assert(!/["\r\n]/.test(preload));
const report = { mode: 'actual-website-fictional-transports', run, port, matchedFiles, checks: [], phases: [], browserErrors: [], blockedBrowserHosts: [], realAiCalls: 0, realPayPalCalls: 0 };
let server, browser, ownerContext, clientContext, page, stage = 'startup';
const portClosed = () => new Promise(done => { const s = createConnection({ host: '127.0.0.1', port }); s.setTimeout(2000); s.once('connect', () => { s.destroy(); done(false); }); s.once('error', e => done(e.code === 'ECONNREFUSED')); s.once('timeout', () => { s.destroy(); done(false); }); });
async function stopApp() {
  if (server && server.exitCode === null && server.signalCode === null) {
    const result = spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { env: osEnv, windowsHide: true, stdio: 'ignore', timeout: 10000 });
    if (result.status !== 0 && !await portClosed()) return false;
  }
  const closed = await portClosed(); if (closed) server = undefined; return closed;
}
async function startApp() {
  const env = session.environment(settings, osEnv);
  Object.assign(env, { NUDGE_REHEARSAL_OFFLINE_SESSION: run, NODE_OPTIONS: '--require "' + preload + '"' });
  let startupError;
  server = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: 'ignore' });
  server.on('error', e => { startupError = e.code; });
  for (let i = 0; i < 80; i++) {
    if (startupError || server.exitCode !== null) throw Error('Owned app startup failed');
    try { if ((await fetch(origin + '/api/health', { signal: AbortSignal.timeout(500) })).ok) { report.phases.push(session.snapshot().phase); return; } } catch {}
    await new Promise(done => setTimeout(done, 250));
  }
  throw Error('Owned app readiness timed out');
}
async function context() {
  const c = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block', acceptDownloads: false }); c.setDefaultTimeout(20000);
  await c.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin === origin) return route.continue(); report.blockedBrowserHosts.push(url.hostname); return route.abort(); });
  c.on('page', p => p.on('pageerror', e => report.browserErrors.push(e.name))); return c;
}
async function ownerPage() {
  stage = 'owner-login'; page = await ownerContext.newPage(); await page.goto(origin);
  await page.getByRole('heading', { name: 'Good work deserves to get paid.', exact: true }).or(page.getByLabel('Workspace token', { exact: true })).first().waitFor();
  if (await page.getByLabel('Workspace token', { exact: true }).count()) {
    await page.getByLabel('Workspace token', { exact: true }).fill(session.snapshot().ownerToken);
    await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  }
  await page.getByRole('heading', { name: 'Good work deserves to get paid.', exact: true }).waitFor();
}
async function json(path, body) {
  const r = body ? await ownerContext.request.post(origin + path, { headers: { origin }, data: body }) : await ownerContext.request.get(origin + path);
  assert.equal(r.status(), 200, 'Isolated website operation failed'); return r.json();
}
async function waitForState(predicate) {
  for (let i = 0; i < 40; i++) { const s = await json('/api/workspace'); if (predicate(s)) return s; await new Promise(done => setTimeout(done, 150)); }
  throw Error('Website state not observed');
}
async function screenshot(name) {
  await page.evaluate(() => { document.getElementById('rehearsal-label')?.remove(); const n = document.createElement('div'); n.id = 'rehearsal-label'; n.textContent = 'OFFLINE REHEARSAL - fictional AI and PayPal responses; no provider called'; n.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px;background:#172b21;color:white;text-align:center;font:14px system-ui'; document.body.append(n); });
  await page.screenshot({ path: resolve(run, name + '.png'), fullPage: true, animations: 'disabled' });
}
try {
  session.transition('ai'); await startApp(); browser = await chromium.launch({ channel: 'msedge', headless: true, env: osEnv });
  ownerContext = await context(); clientContext = await context(); await ownerPage();
  stage = 'original-scope'; await json('/api/workspace', { type: 'saveAgreement', agreement: session.snapshot().fixture.agreement }); await page.reload();
  await page.getByRole('button', { name: 'Approve scope', exact: true }).click();
  let state = await waitForState(s => s.agreementStatus === 'approved'); const client = await clientContext.newPage(); await client.goto(origin + '/client/' + state.clientToken);
  await client.getByLabel('I have reviewed the scope, deliverables, exclusions, and project price above.', { exact: true }).check();
  await client.getByRole('button', { name: 'Accept project scope', exact: true }).click(); await waitForState(s => s.agreementStatus === 'accepted'); await client.close();
  stage = 'fictional-ai'; await page.reload(); await page.getByLabel('CLIENT REQUEST', { exact: true }).fill('Please add appointment booking with available time slots.');
  await page.getByRole('button', { name: 'Compare with agreement', exact: true }).click(); await page.getByText('Elastic AI analysis', { exact: true }).waitFor();
  state = await json('/api/workspace'); const proposalId = state.proposals[0].id;
  assert.equal(state.proposals[0].analysis.source, 'elastic'); assert.equal(state.proposals[0].amountCents, 0); assert(state.proposals[0].analysis.references.includes('S2'));
  assert(await page.getByPlaceholder('e.g. 300.00').isDisabled()); await screenshot('offline-unpriced-draft');
  await page.close(); assert(await stopApp()); session = openSession(run); session.transition('review', true); await startApp(); await ownerPage();
  stage = 'human-review'; await page.getByLabel('Decision rationale', { exact: true }).fill('S2 explicitly excludes appointment booking. Review and quote only that separate booking deliverable.');
  await page.getByRole('button', { name: 'Record scope decision', exact: true }).click();
  await page.getByPlaceholder('e.g. 300.00').fill('300.00');
  await page.getByLabel('Explanation for your client (optional)', { exact: true }).fill('S2 excludes appointment booking. This optional USD300 change adds booking with available time slots; the original project scope remains as agreed.');
  await page.getByLabel('This quote contains only reviewed additional work.', { exact: true }).check(); await page.getByRole('button', { name: 'Approve proposal', exact: true }).click();
  state = await waitForState(s => s.proposals[0].status === 'approved');
  stage = 'client-price-review'; const quote = await clientContext.newPage(); await quote.goto(origin + '/client/' + state.clientToken);
  await quote.getByRole('button', { name: 'Accept work & price', exact: true }).waitFor();
  assert((await quote.locator('main').innerText()).includes('$300.00'));
  await quote.getByRole('button', { name: 'Accept work & price', exact: true }).click(); await waitForState(s => s.proposals[0].status === 'accepted'); await quote.close();
  state = await json('/api/workspace'); assert.equal(state.invoices.length, 0); assert.equal(state.proposals[0].amountCents, 30000); assert.equal(state.proposals[0].id, proposalId);
  await page.close(); assert(await stopApp()); session = openSession(run); session.approve(state, proposalId, new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)); session.transition('payment', true);
  stage = 'fictional-invoice'; await startApp(); await ownerPage();
  await page.getByRole('button', { name: 'Create PayPal invoice', exact: true }).click(); await page.getByRole('button', { name: 'Invoice created', exact: true }).waitFor();
  state = await json('/api/workspace'); assert.equal(state.invoices.length, 1); assert.equal(state.invoices[0].status, 'DRAFT'); assert.equal(state.invoices[0].amountCents, 30000); assert.equal(state.invoices[0].proposalId, proposalId);
  await page.getByRole('button', { name: 'Payments', exact: true }).click(); await page.getByRole('button', { name: 'Approve & send invoice', exact: true }).click();
  await page.getByRole('button', { name: 'Draft reminder', exact: true }).waitFor(); state = await json('/api/workspace'); assert.equal(state.invoices[0].status, 'UNPAID');
  stage = 'fictional-payment'; const remote = JSON.parse(readFileSync(remotePath, 'utf8')); assert(remote.created && remote.sent); writeFileSync(remotePath, JSON.stringify({ ...remote, paid: true }));
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click(); await page.getByText('paid', { exact: true }).first().waitFor(); state = await json('/api/workspace');
  assert.equal(state.invoices[0].status, 'PAID'); assert.equal(state.invoices[0].outstandingCents, 0); assert.equal(state.invoices.length, 1); assert.equal(state.agreement.amountCents, 120000); assert.equal(state.proposals[0].id, proposalId);
  assert.equal(state.audit.filter(a => a.title === 'Invoice created').length, 1); assert.equal(state.audit.filter(a => a.title === 'Invoice sent').length, 1);
  await screenshot('offline-paid-invoice');
  stage = 'local-analytics'; await page.goto(origin + '/analytics'); await page.getByRole('heading', { name: 'Your work, in perspective.', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Refresh local snapshot', exact: true }).click();
  const analytics = await json('/api/analytics'); assert.equal(analytics.stateSource, 'local-records');
  assert.equal(analytics.invoices.length, 1); assert.equal(analytics.invoices[0].status, 'PAID'); assert.equal(analytics.invoices[0].amountCents, 30000); assert.equal(analytics.invoices[0].outstandingCents, 0);
  assert.equal(analytics.totals.outstandingCents, 0); assert.equal(analytics.totals.approvedExtraCents, 30000); assert.equal(analytics.changes.length, 1); assert.equal(analytics.changes[0].status, 'accepted');
  report.analytics = { invoiceCount: 1, invoiceCents: 30000, outstandingCents: 0, approvedExtraCents: 30000, stateSource: 'local-records' }; await screenshot('offline-local-analytics');
  report.checks.push('Actual owner/client UI scope acceptance, stub-only AI adapter and unpriced human-review draft', 'Same proposal retained across AI/review/payment server restarts with separate phase environments', 'Actual owner review/price/approval and client USD300 acceptance before one guarded invoice creation/send', 'Actual sandbox-mode PayPal adapter reconciles fictional same-invoice PAID/$0; base scope uninvoiced', 'Actual local Analytics snapshot and annotated offline screenshots');
  assert.deepEqual(report.browserErrors, []); assert(report.blockedBrowserHosts.every(h => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(h)));
  report.success = true;
} catch (e) { report.failure = { stage, category: e.name }; report.success = false; process.exitCode = 1; }
finally {
  let browserClosed = false, appClosed = false;
  try { if (browser) await browser.close(); browserClosed = true; } catch { /* Report failed closure; still stop owned app. */ }
  try { appClosed = await stopApp(); } catch { /* No arbitrary process fallback. */ }
  // Reopen after all request producers are stopped: a final owner poll must not
  // make the parent's manifest handle stale while recording terminal cleanup.
  session = openSession(run);
  report.attempts = session.snapshot().attempts;
  report.cleanup = await session.cleanup({ browser: async () => browserClosed, app: async () => appClosed && await portClosed() });
  report.serverClosed = await portClosed(); if (!report.cleanup.complete || !report.serverClosed) { report.success = false; process.exitCode = 1; }
  writeFileSync(resolve(run, 'website-summary.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ run, success: report.success, checks: report.checks, failure: report.failure, attempts: report.attempts, cleanup: report.cleanup, serverClosed: report.serverClosed, realAiCalls: 0, realPayPalCalls: 0 }, null, 2));
}
