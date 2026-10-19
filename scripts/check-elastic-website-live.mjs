// Authorized one-conversation website verification. No PayPal access.
import { parseEnv } from "node:util";
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
if (process.argv.length !== 4 || process.argv[3] !== '--live-once') throw Error('Pass one verified disposable app-source build and explicit --live-once');
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
const settings = parseEnv(readFileSync(resolve(root, '.env.local'), 'utf8'));
assert(settings.NUDGE_AI_ENABLED !== 'true', 'Keep ordinary AI paused');
const cloud = new URL(settings.ELASTIC_KIBANA_URL);
assert(cloud.protocol === 'https:' && !cloud.username && !cloud.password && !cloud.port && !cloud.search && !cloud.hash && cloud.pathname === '/' && ['.elastic.cloud', '.elastic-cloud.com', '.cloud.es.io'].some(s => cloud.hostname.endsWith(s)), 'Invalid Cloud origin');
const agentId = settings.ELASTIC_AGENT_ID, space = settings.ELASTIC_SPACE_ID || '';
assert(/^[a-zA-Z0-9_-]{1,128}$/.test(agentId) && agentId !== 'elastic-ai-agent');
assert(!space || /^[a-zA-Z0-9_-]{1,128}$/.test(space));
assert(settings.ELASTIC_API_KEY && !/\s/.test(settings.ELASTIC_API_KEY));
const model = '.anthropic-claude-5-sonnet-chat_completion';
const requestText = 'Please add appointment booking with available time slots.';
const agreement = { title: 'Fictional five-page marketing website', clientName: 'Fictional client', clientEmail: 'fictional-client@example.com', amountCents: 120000,
  clauses: [{ id: 'S1', text: 'Five responsive marketing pages are included.' }, { id: 'S2', text: 'Appointment booking, scheduling calendars and booking integrations are excluded.' }, { id: 'S3', text: 'Two minor revision rounds are included.' }] };
const ledgerPath = resolve(run, 'attempt.json'), configPath = resolve(run, 'live-transport.json');
const config = { transport: 'live-once', endpoint: cloud.origin + (space ? '/s/' + space : '') + '/api/agent_builder/converse', agentId, inferenceId: model, instructions: elasticScopeInstructions,
  input: { approvedAgreement: { title: agreement.title, clauses: agreement.clauses }, clientRequest: requestText }, ledgerPath, usagePath: resolve(run, 'usage.json') };
writeFileSync(configPath, JSON.stringify(config, null, 2), { flag: 'wx' });
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)));
const browserEnv = { ...env }, token = randomUUID() + randomUUID();
const guard = resolve(root, 'scripts/elastic-live-review.cjs').split(sep).join('/'); assert(!/["\r\n]/.test(guard));
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NUDGE_MODE: 'sandbox', NUDGE_AI_ENABLED: 'true', NUDGE_AI_PROVIDER: 'elastic',
  NUDGE_ADMIN_TOKEN: token, NUDGE_DB_PATH: resolve(run, 'fictional.sqlite'), ELASTIC_KIBANA_URL: cloud.origin, ELASTIC_API_KEY: settings.ELASTIC_API_KEY, ELASTIC_SPACE_ID: space,
  ELASTIC_AGENT_ID: agentId, ELASTIC_INFERENCE_ID: model, NUDGE_LIVE_AI_REVIEW_CONFIG: configPath, NODE_OPTIONS: '--require "' + guard + '"' });
const port = await new Promise((done, reject) => { const s = createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)); }); });
const origin = 'http://127.0.0.1:' + port;
const report = { mode: 'live-one-conversation', run, port, matchedFiles, modelVerified: false, realConversationAttempts: 0, checks: [], blockedBrowserRequests: [], browserErrors: [], browserClosed: false, serverClosed: false };
let browser, server, startupError;
try {
  server = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: 'ignore' });
  server.on('error', error => { startupError = error.code; });
  let ready = false;
  for (let i = 0; i < 80; i++) { if (startupError || server.exitCode !== null) throw Error('Review server failed'); try { ready = (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(500) })).ok; } catch {} if (ready) break; await new Promise(done => setTimeout(done, 250)); }
  assert(ready); browser = await chromium.launch({ channel: 'msedge', headless: true, env: browserEnv });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block', acceptDownloads: false });
  context.setDefaultTimeout(60000);
  await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin === origin) return route.continue(); report.blockedBrowserRequests.push(url.hostname); return route.abort(); });
  const page = await context.newPage(); page.on('pageerror', e => report.browserErrors.push(e.name));
  const json = async (path, body) => { const r = body ? await context.request.post(origin + path, { headers: { origin }, data: body }) : await context.request.get(origin + path); assert.equal(r.status(), 200, 'Fictional local setup'); return r.json(); };
  await page.goto(origin); await page.getByRole('heading', { name: 'Your workspace, protected.' }).waitFor();
  await page.getByLabel('Workspace token', { exact: true }).fill(token); await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  await page.getByRole('heading', { name: 'Good work deserves to get paid.' }).waitFor();
  let state = await json('/api/workspace'); assert.equal(state.mode, 'sandbox'); assert.equal(state.aiEnabled, true); assert.equal(state.connections.paypal, false); assert.equal(state.connections.webhook, false);
  await json('/api/workspace', { type: 'saveAgreement', agreement }); await json('/api/workspace', { type: 'approveAgreement' }); state = await json('/api/workspace'); await json('/api/client/' + state.clientToken, { type: 'acceptAgreement' });
  await page.reload(); const input = page.getByLabel('CLIENT REQUEST', { exact: true }); await input.fill(requestText);
  await page.getByRole('button', { name: 'Compare with agreement', exact: true }).click(); await page.getByText('Elastic AI analysis', { exact: true }).waitFor();
  const draft = await json('/api/workspace'); assert.equal(draft.proposals.length, 1); assert.equal(draft.proposals[0].analysis.source, 'elastic'); assert.equal(draft.proposals[0].analysis.classification, 'additional'); assert(draft.proposals[0].analysis.references.includes('S2')); report.analysis = draft.proposals[0].analysis;
  assert.equal(draft.proposals[0].status, 'draft'); assert.equal(draft.proposals[0].amountCents, 0); assert.equal(draft.proposals[0].scopeReview, undefined); assert.equal(draft.invoices.length, 0);
  assert(await page.getByPlaceholder('e.g. 300.00').isDisabled()); assert(await page.getByRole('button', { name: 'Approve proposal', exact: true }).isDisabled());
  assert.equal(JSON.parse(readFileSync(ledgerPath, 'utf8')).reserved, true);
  report.checks.push('Actual website login, comparison, live Elastic adapter, validated additional-work draft citing S2');
  report.checks.push('Draft unpriced, human review required, price and approval disabled, no invoice or PayPal credentials');
  assert.deepEqual(report.browserErrors, []); assert(report.blockedBrowserRequests.every(host => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host)));
  await page.evaluate(() => { const label = document.createElement('div'); label.textContent = 'BOUNDED LIVE ELASTIC CHECK - fictional data; unreviewed draft'; label.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px;background:#172b21;color:white;text-align:center;font:14px system-ui'; document.body.append(label); });
  await page.screenshot({ path: resolve(run, 'live-website-draft.png'), fullPage: true, animations: 'disabled' });
  report.modelVerified = true; report.success = true;
  await context.close();
} catch (error) { report.failure = { category: 'website-or-provider-verification-failed', name: error.name }; process.exitCode = 1; }
finally {
  if (browser) { await browser.close(); report.browserClosed = true; }
  if (server && server.exitCode === null && server.signalCode === null) { const stopped = spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { env: browserEnv, windowsHide: true, stdio: 'ignore', timeout: 10000 }); report.taskkillExit = stopped.status; }
  report.serverClosed = await new Promise(done => { const s = createConnection({ host: '127.0.0.1', port }); s.setTimeout(2000); s.once('connect', () => { s.destroy(); done(false); }); s.once('error', e => done(e.code === 'ECONNREFUSED')); s.once('timeout', () => { s.destroy(); done(false); }); });
  if (!report.serverClosed) process.exitCode = 1;
  report.realConversationAttempts = existsSync(ledgerPath) ? 1 : 0;
  if (existsSync(config.usagePath)) report.usage = JSON.parse(readFileSync(config.usagePath, 'utf8'));
  report.modelIdentity = 'Requested Sonnet endpoint; internal orchestration models not independently verified';
  report.sourceFingerprint = createHash('sha256').update(readFileSync(resolve(root, 'lib/elastic-ai.ts'))).digest('hex');
  writeFileSync(resolve(run, 'summary.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ run, success: report.success, checks: report.checks, failure: report.failure, realConversationAttempts: report.realConversationAttempts, usage: report.usage, modelVerified: report.modelVerified, browserClosed: report.browserClosed, serverClosed: report.serverClosed }, null, 2));
}
