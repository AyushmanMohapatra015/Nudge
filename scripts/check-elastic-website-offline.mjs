// Offline wiring rehearsal only. No real environment/key, model or PayPal access.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, lstatSync, existsSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { createServer, createConnection } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { elasticScopeInstructions } from '../lib/scope-instructions.ts';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
if (process.argv.length !== 3) throw Error('Pass one verified disposable app-source build');
const app = realpathSync(resolve(root, process.argv[2]));
assert(app.startsWith(resolve(root, 'data/postman-workflow') + sep) && app.endsWith(sep + 'app-source'));
const prior = JSON.parse(readFileSync(resolve(app, '../summary.json'), 'utf8'));
assert(prior.success && prior.restartPersistence && !prior.blockedProviderFetch);
function files(base, relative) { const path = resolve(base, relative), stat = lstatSync(path); assert(!stat.isSymbolicLink()); return stat.isDirectory() ? readdirSync(path).flatMap(name => files(base, relative + '/' + name)).sort() : [relative]; }
let matchedFiles = 0;
for (const directory of ['app', 'components', 'lib', ...(existsSync(resolve(root, 'public')) ? ['public'] : [])]) {
  const paths = files(root, directory); assert.deepEqual(paths, files(app, directory));
  for (const path of paths) { assert(readFileSync(resolve(root, path)).equals(readFileSync(resolve(app, path))), 'Production source mismatch'); matchedFiles++; }
}
for (const path of ['package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts']) assert(readFileSync(resolve(root, path)).equals(readFileSync(resolve(app, path))), 'Build config mismatch');

const run = resolve(root, 'data/ai-website-check', randomUUID()); mkdirSync(run, { recursive: true });
const model = '.anthropic-claude-5-sonnet-chat_completion', agentId = 'nudge-offline-scope-review';
const requestText = 'Please add appointment booking with available time slots.';
const agreement = { title: 'Fictional five-page marketing website', clientName: 'Fictional client', clientEmail: 'fictional-client@example.com', amountCents: 120000,
  clauses: [{ id: 'S1', text: 'Five responsive marketing pages are included.' }, { id: 'S2', text: 'Appointment booking, scheduling calendars and booking integrations are excluded.' }, { id: 'S3', text: 'Two minor revision rounds are included.' }] };
const analysis = { classification: 'additional', summary: 'S2 explicitly excludes appointment booking. The requested time-slot booking is additional work for human review.', references: ['S2'], questions: [], deliverables: ['Appointment booking with available time slots'] };
const ledgerPath = resolve(run, 'attempt.json'), configPath = resolve(run, 'offline-transport.json');
const config = { transport: 'stub', endpoint: 'https://nudge-offline.elastic.cloud/api/agent_builder/converse', agentId, inferenceId: model, instructions: elasticScopeInstructions,
  input: { approvedAgreement: { title: agreement.title, clauses: agreement.clauses }, clientRequest: requestText }, ledgerPath,
  response: { status: 'completed', conversation_id: 'fictional-offline-conversation', response: { message: JSON.stringify(analysis) }, steps: [] } };
writeFileSync(configPath, JSON.stringify(config, null, 2), { flag: 'wx' });
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)));
const browserEnv = { ...env }, token = randomUUID() + randomUUID();
const guard = resolve(root, 'scripts/elastic-one-attempt-guard.cjs').split(sep).join('/'); assert(!/["\r\n]/.test(guard));
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NUDGE_MODE: 'sandbox', NUDGE_AI_ENABLED: 'true', NUDGE_AI_PROVIDER: 'elastic',
  NUDGE_ADMIN_TOKEN: token, NUDGE_DB_PATH: resolve(run, 'fictional.sqlite'), ELASTIC_KIBANA_URL: 'https://nudge-offline.elastic.cloud', ELASTIC_API_KEY: 'fictional-key-no-authentication',
  ELASTIC_AGENT_ID: agentId, ELASTIC_INFERENCE_ID: model, NUDGE_OFFLINE_AI_REVIEW_CONFIG: configPath, NODE_OPTIONS: '--require "' + guard + '"' });
const port = await new Promise((done, reject) => { const s = createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)); }); });
const origin = 'http://127.0.0.1:' + port;
const report = { mode: 'offline-stub-rehearsal', run, port, matchedFiles, modelVerified: false, realInferenceRequests: 0, checks: [], blockedBrowserRequests: [], browserErrors: [], browserClosed: false, serverClosed: false };
let browser, server, startupError;
try {
  server = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: 'ignore' });
  server.on('error', error => { startupError = error.code; });
  let ready = false;
  for (let i = 0; i < 80; i++) { if (startupError || server.exitCode !== null) throw Error('Review server failed'); try { ready = (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(500) })).ok; } catch {} if (ready) break; await new Promise(done => setTimeout(done, 250)); }
  assert(ready); browser = await chromium.launch({ channel: 'msedge', headless: true, env: browserEnv });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block', acceptDownloads: false });
  context.setDefaultTimeout(15000);
  await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin === origin) return route.continue(); report.blockedBrowserRequests.push(url.hostname); return route.abort(); });
  const page = await context.newPage(); page.on('pageerror', e => report.browserErrors.push(e.name));
  const json = async (path, body) => { const r = body ? await context.request.post(origin + path, { headers: { origin }, data: body }) : await context.request.get(origin + path); assert.equal(r.status(), 200, 'Fictional local setup'); return r.json(); };
  await page.goto(origin); await page.getByRole('heading', { name: 'Your workspace, protected.' }).waitFor();
  await page.getByLabel('Workspace token', { exact: true }).fill(token); await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  await page.getByRole('heading', { name: 'Project overview' }).waitFor();
  let state = await json('/api/workspace'); assert.equal(state.mode, 'sandbox'); assert.equal(state.aiEnabled, true); assert.equal(state.connections.paypal, false); assert.equal(state.connections.webhook, false);
  await json('/api/workspace', { type: 'saveAgreement', agreement }); await json('/api/workspace', { type: 'approveAgreement' }); state = await json('/api/workspace'); await json('/api/client/' + state.clientToken, { type: 'acceptAgreement' });
  await page.reload(); const input = page.getByLabel('CLIENT REQUEST', { exact: true }); await input.fill(requestText);
  await page.getByRole('button', { name: 'Compare with agreement', exact: true }).click(); await page.getByText('Elastic AI analysis', { exact: true }).waitFor();
  const draft = await json('/api/workspace'); assert.equal(draft.proposals.length, 1); assert.deepEqual(draft.proposals[0].analysis, { ...analysis, source: 'elastic' });
  assert.equal(draft.proposals[0].status, 'draft'); assert.equal(draft.proposals[0].amountCents, 0); assert.equal(draft.proposals[0].scopeReview, undefined); assert.equal(draft.invoices.length, 0);
  assert(await page.getByPlaceholder('e.g. 300.00').isDisabled()); assert(await page.getByRole('button', { name: 'Approve proposal', exact: true }).isDisabled());
  assert.equal(JSON.parse(readFileSync(ledgerPath, 'utf8')).reserved, true); const ledger = readFileSync(ledgerPath, 'utf8');
  report.checks.push('Actual owner login, sandbox route, Elastic adapter, validated local response and unpriced human-review draft');
  await page.evaluate(() => { const label = document.createElement('div'); label.id = 'offline-review-label'; label.textContent = 'OFFLINE WIRING REHEARSAL — fictional local Elastic response; no model called'; label.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px;background:#172b21;color:white;text-align:center;font:14px system-ui'; document.body.append(label); });
  await page.screenshot({ path: resolve(run, 'offline-website-draft.png'), fullPage: true, animations: 'disabled' });
  await input.fill(requestText); await page.getByRole('button', { name: 'Compare with agreement', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Elastic request failed or timed out' }).waitFor();
  const after = await json('/api/workspace'); assert.equal(after.proposals.length, 1); assert.equal(after.invoices.length, 0); assert.equal(after.processing, undefined); assert.deepEqual(after.proposals, draft.proposals); assert.equal(readFileSync(ledgerPath, 'utf8'), ledger);
  report.checks.push('Repeated website comparison blocked by the shared attempt slot; existing draft preserved, no simulation substituted');
  assert.deepEqual(report.browserErrors, []); assert(report.blockedBrowserRequests.every(host => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host)));
  report.checks.push('Fake credentials only, provider transport stub-only, browser external requests blocked, no PayPal access'); report.success = true;
  await context.close();
} catch (error) { report.failure = { name: error.name, message: error.message }; process.exitCode = 1; }
finally {
  if (browser) { await browser.close(); report.browserClosed = true; }
  if (server && server.exitCode === null && server.signalCode === null) { const stopped = spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { env: browserEnv, windowsHide: true, stdio: 'ignore', timeout: 10000 }); report.taskkillExit = stopped.status; }
  report.serverClosed = await new Promise(done => { const s = createConnection({ host: '127.0.0.1', port }); s.setTimeout(2000); s.once('connect', () => { s.destroy(); done(false); }); s.once('error', e => done(e.code === 'ECONNREFUSED')); s.once('timeout', () => { s.destroy(); done(false); }); });
  if (!report.serverClosed) process.exitCode = 1;
  report.sourceFingerprint = createHash('sha256').update(readFileSync(resolve(root, 'lib/elastic-ai.ts'))).digest('hex');
  writeFileSync(resolve(run, 'summary.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ run, success: report.success, checks: report.checks, failure: report.failure, realInferenceRequests: 0, modelVerified: false, browserClosed: report.browserClosed, serverClosed: report.serverClosed }, null, 2));
}
