import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, lstatSync, realpathSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { createServer, createConnection } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (process.platform !== 'win32' || process.argv.length !== 3) throw Error('Windows rehearsal requires one verified disposable app-source build');
const app = realpathSync(resolve(root, process.argv[2]));
if (!app.startsWith(resolve(root, 'data/postman-workflow') + sep) || !app.endsWith(sep + 'app-source')) throw Error('Disposable build required');
const buildReceipt = JSON.parse(readFileSync(resolve(app, '../summary.json'), 'utf8'));
assert.equal(buildReceipt.success, true); assert.equal(buildReceipt.restartPersistence, true); assert.equal(buildReceipt.blockedProviderFetch, false);
function files(base, relative) {
  const path = resolve(base, relative), stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw Error('Source links unsupported');
  if (stat.isDirectory()) return readdirSync(path).flatMap(name => files(base, relative + '/' + name)).sort();
  if (!stat.isFile()) throw Error('Unsupported source'); return [relative];
}
for (const directory of ['app', 'components', 'lib', ...(existsSync(resolve(root, 'public')) ? ['public'] : [])]) {
  const current = files(root, directory); assert.deepEqual(current, files(app, directory));
  for (const file of current) assert.equal(createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex'), createHash('sha256').update(readFileSync(resolve(app, file))).digest('hex'), 'Build runtime source mismatch');
}
for (const file of ['package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts']) assert.ok(readFileSync(resolve(root, file)).equals(readFileSync(resolve(app, file))), 'Build configuration mismatch');
const run = resolve(root, 'data/delivery-rehearsal', randomUUID()); mkdirSync(run, { recursive: true });
const env = {}; for (const [key, value] of Object.entries(process.env)) if (/^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)) env[key] = value;
const guard = resolve(root, 'scripts/postman-no-network.cjs').split(sep).join('/');
if (/["\r\n]/.test(guard)) throw Error('Unsupported guard path');
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NUDGE_MODE: 'demo', NUDGE_AI_ENABLED: 'false',
  NUDGE_DB_PATH: resolve(run, 'fictional.sqlite'), NUDGE_POSTMAN_RUN_DIR: run, NODE_OPTIONS: `--require "${guard}"` });
const port = await new Promise((done, reject) => { const reservation = createServer(); reservation.once('error', reject); reservation.listen(0, '127.0.0.1', () => { const port = reservation.address().port; reservation.close(() => done(port)); }); });
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: ['ignore', 'ignore', 'ignore'] });
let browser, context, started = false, checkpoint = 'startup'; server.once('error', () => { started = false; });
const steps = [], memory = [], routeAssets = [], external = [], browserErrors = [];
async function json(path, data, status = 200) {
  checkpoint = (data?.type ?? 'GET') + ' ' + path.split('/').slice(0,3).join('/');
  assert.ok(path.startsWith('/api/') && !path.includes('://'));
  const response = await fetch(origin + path, { method: data ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: data ? { 'content-type': 'application/json', origin } : {}, ...(data ? { body: JSON.stringify(data) } : {}) });
  assert.equal(response.status, status, `Unexpected local HTTP status for ${path.split('/').slice(0,3).join('/')}`);
  return response.json();
}
const workspace = () => json('/api/workspace');
const stage = data => json('/api/delivery-plan', { type: 'stage', ...data });
const finances = value => { const { deliveryPlan, audit, version, ...records } = value; return records; };
function sample(label) {
  assert.ok(Number.isInteger(server.pid));
  const command = `Get-Process -Id ${server.pid} | Select-Object @{n='workingSetBytes';e={$_.WorkingSet64}},@{n='privateBytes';e={$_.PrivateMemorySize64}} | ConvertTo-Json -Compress`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { env, encoding: 'utf8', timeout: 10000, windowsHide: true });
  assert.equal(result.status, 0, 'Owned-process memory sampling failed');
  const usage = JSON.parse(result.stdout); assert.ok(usage.workingSetBytes > 0 && usage.privateBytes > 0); memory.push({ label, ...usage });
}
async function inspectPage(path, label, use) {
  checkpoint = label;
  const page = await context.newPage(), requested = new Set();
  page.on('response', response => { const url = new URL(response.url()); if (url.origin === origin && url.pathname.startsWith('/_next/static/') && ['.js','.css'].includes(extname(url.pathname))) requested.add(url.pathname); });
  await page.goto(origin + path); await use(page); sample(label);
  const assets = [...requested].map(path => { const local = realpathSync(resolve(app, '.next/static', path.slice('/_next/static/'.length))); assert.ok(local.startsWith(resolve(app, '.next/static') + sep)); const data = readFileSync(local); return { path, bytes: data.length, gzipBytes: gzipSync(data).length }; });
  routeAssets.push({ label, assets, bytes: assets.reduce((n, a) => n + a.bytes, 0), gzipBytes: assets.reduce((n, a) => n + a.gzipBytes, 0) });
  await page.close();
}
try {
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw Error('Owned server exited');
    try { const response = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1000) }); if (response.ok) { started = true; break; } } catch { /* bounded startup polling only */ }
    await new Promise(done => setTimeout(done, 250));
  }
  assert.ok(started); const initial = await workspace(); assert.equal(initial.mode, 'demo'); assert.equal(initial.aiEnabled, false);
  assert.ok(Object.values(initial.connections).every(value => value === false)); assert.equal(initial.version, 1); sample('after-startup-health-and-empty-workspace');
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', env: Object.fromEntries(Object.entries(env).filter(([key]) => !key.startsWith('NODE_OPTIONS'))) });
  context = await browser.newContext();
  context.setDefaultTimeout(20000); context.setDefaultNavigationTimeout(20000);
  context.on('page', page => page.on('pageerror', error => browserErrors.push(error.name)));
  await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin === origin) return route.continue(); external.push(url.hostname); return route.fulfill({ status: 200, contentType: 'text/css', body: '' }); });
  await inspectPage('/', 'workspace-empty', async page => { await page.getByRole('heading', { name: 'Good work deserves to get paid.' }).waitFor(); });
  await json('/api/workspace', { type: 'approveAgreement' }); let state = await workspace();
  await json('/api/client/' + encodeURIComponent(state.clientToken), { type: 'acceptAgreement' }); state = await workspace();
  const calendar = { timezone: 'Asia/Kolkata', weekdays: [1,2,3,4,5], holidays: ['2026-10-19'] };
  let preview = await stage({ expectedWorkspaceVersion: state.version, expectedPlanRevision: 0, expectedPreviewId: null, calendar,
    candidate: { tasks: [{ key: 'new:website', label: 'Website delivery', kind: 'base', proposalId: null, references: ['S1'], duration: 3,
      startDate: '2026-10-16', endDateExclusive: '2026-10-22' }], dependencies: [] } });
  await json('/api/delivery-plan', { type: 'apply', expectedWorkspaceVersion: preview.version, previewId: preview.plan.preview.id, confirmed: true });
  state = await workspace(); const original = structuredClone(state.deliveryPlan.original), base = state.deliveryPlan.current.snapshot.tasks[0];
  steps.push({ step: 'accepted-base-plan', projectCents: state.agreement.amountCents, finishExclusive: base.endDateExclusive, workingDays: base.duration });
  await json('/api/workspace', { type: 'analyze', request: 'Could we add appointment booking with available time slots?' }); state = await workspace(); let proposal = state.proposals[0];
  assert.equal(proposal.analysis.source, 'simulation'); assert.equal(proposal.analysis.classification, 'additional');
  await json('/api/workspace', { type: 'reviewScope', id: proposal.id, expectedReviewId: '', classification: 'additional',
    rationale: 'Booking is excluded under S3. Quote only appointment booking as additional work.', references: ['S3'], clarification: '', deliverables: ['Appointment booking with available time slots'] });
  state = await workspace(); proposal = state.proposals[0];
  await json('/api/workspace', { type: 'approveProposal', id: proposal.id, reviewId: proposal.scopeReview.id, extrasConfirmed: true,
    amountCents: 30000, deliverables: ['Appointment booking with available time slots'], clientMessage: 'Your website scope excludes booking. This separate quote adds appointment scheduling; the original website price stays unchanged.' });
  state = await workspace(); const beforePreview = state;
  const candidate = { tasks: [{ ...base, key: base.id }, { key: 'new:booking', label: 'Appointment booking', kind: 'extra', proposalId: proposal.id,
    references: ['S3'], duration: 3, startDate: '2026-10-22', endDateExclusive: '2026-10-27' }], dependencies: [{ predecessorKey: base.id, successorKey: 'new:booking', type: 'finish-to-start' }] };
  delete candidate.tasks[0].id;
  preview = await stage({ expectedWorkspaceVersion: state.version, expectedPlanRevision: 1, expectedPreviewId: null, calendar, candidate });
  assert.deepEqual(finances(await workspace()), finances(beforePreview));
  await json('/api/delivery-plan', { type: 'apply', expectedWorkspaceVersion: preview.version, previewId: preview.plan.preview.id, confirmed: true }, 400);
  steps.push({ step: 'approved-extra-preview', extraCents: 30000, applyBeforeAcceptanceStatus: 400, originalFinishExclusive: original.snapshot.tasks[0].endDateExclusive });
  await inspectPage('/client/' + encodeURIComponent(state.clientToken), 'client-accepts-booking', async page => {
    await page.getByRole('button', { name: 'Accept work & price' }).waitFor();
    const text = await page.locator('main').innerText(); assert.ok(text.includes('$300.00')); assert.ok(!text.includes('2026-10-27'));
    await page.getByRole('button', { name: 'Accept work & price' }).click();
    await page.getByRole('button', { name: 'Accept work & price' }).waitFor({ state: 'detached' });
  });
  state = await workspace(); const stale = await json('/api/delivery-plan'); assert.equal(stale.previewStale, true);
  await json('/api/delivery-plan', { type: 'apply', expectedWorkspaceVersion: state.version, previewId: preview.plan.preview.id, confirmed: true }, 409);
  const savedCandidate = state.deliveryPlan.preview.candidate.snapshot;
  const restage = { tasks: savedCandidate.tasks.map(({ id, ...task }) => ({ ...task, key: id })), dependencies: savedCandidate.dependencies.map(edge => ({ predecessorKey: edge.predecessorId, successorKey: edge.successorId, type: edge.type })) };
  preview = await stage({ expectedWorkspaceVersion: state.version, expectedPlanRevision: 1, expectedPreviewId: state.deliveryPlan.preview.id, calendar, candidate: restage });
  assert.equal(preview.plan.preview.diff.finishDeltaCalendarDays, 5);
  const beforeApply = await workspace();
  await inspectPage('/delivery', 'delivery-chart-after-reviewed-apply', async page => {
    await page.getByRole('button', { name: 'Proposed preview', exact: true }).click();
    await page.getByLabel('I reviewed this preview and want to apply it internally.', { exact: true }).check();
    await page.getByRole('button', { name: 'Apply internal plan', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Internal plan applied.' }).waitFor();
    await page.getByRole('button', { name: 'Show Gantt timeline' }).click();
    await page.getByRole('status').filter({ hasText: 'Read-only timeline ready.' }).waitFor({ timeout: 45000 });
    assert.ok((await page.getByRole('table', { name: 'Current delivery dates' }).innerText()).includes('2026-10-27'));
    await page.getByRole('button', { name: 'Original plan', exact: true }).click();
    assert.ok((await page.getByRole('table', { name: 'Original delivery dates' }).innerText()).includes('2026-10-22'));
  });
  state = await workspace(); assert.deepEqual(finances(state), finances(beforeApply)); assert.deepEqual(state.deliveryPlan.original, original);
  assert.equal(state.deliveryPlan.revision, 2); const applied = structuredClone(state.deliveryPlan);
  steps.push({ step: 'accepted-extra-explicitly-applied', extraCents: state.proposals[0].amountCents, extraWorkingDays: 3, finishDeltaCalendarDays: 5,
    originalFinishExclusive: '2026-10-22', currentFinishExclusive: '2026-10-27', staleApplyStatus: 409, unchangedFinancialRecords: true });
  await json('/api/workspace', { type: 'createInvoice', id: proposal.id }); state = await workspace(); const invoiceId = state.invoices[0].id;
  assert.equal(state.invoices[0].amountCents, 30000); assert.deepEqual(state.deliveryPlan, applied);
  await json('/api/workspace', { type: 'sendInvoice', id: invoiceId }); assert.deepEqual((await workspace()).deliveryPlan, applied);
  await json('/api/workspace', { type: 'simulatePayment', id: invoiceId }); state = await workspace();
  assert.equal(state.invoices[0].status, 'PAID'); assert.equal(state.invoices[0].outstandingCents, 0); assert.deepEqual(state.deliveryPlan, applied);
  const analytics = await json('/api/analytics'); assert.equal(analytics.totals.approvedExtraCents, 30000); assert.equal(analytics.totals.outstandingCents, 0);
  await inspectPage('/analytics', 'analytics-studio-and-native-tables', async page => {
    await page.getByRole('heading', { name: 'Your work, in perspective.' }).waitFor();
    await page.getByRole('button', { name: 'Load interactive reports', exact: true }).click();
    await page.getByRole('region', { name: 'AG Studio report builder' }).locator('.ag-studio-layout-widget').first().waitFor({ timeout: 30000 });
    await page.getByText('Read complete snapshot as tables', { exact: true }).click();
    assert.ok((await page.getByRole('table', { name: 'Invoice records · USD' }).innerText()).includes('PAID'));
    assert.ok((await page.getByRole('table', { name: 'Change quote records · USD' }).innerText()).includes('$300.00'));
  });
  steps.push({ step: 'simulation-payment-and-analytics', invoiceCents: 30000, status: 'PAID', dueCents: 0, approvedQuoteCents: 30000, baseProjectCents: 120000, baseInvoiceCreated: false, unchangedDeliveryPlan: true });
  assert.ok(!existsSync(resolve(run, 'blocked-fetch.log'))); assert.deepEqual(browserErrors, []);
  assert.ok(external.every(host => ['fonts.googleapis.com','fonts.gstatic.com'].includes(host)), 'Unexpected external browser request attempted');
  const staticAssets = files(app, '.next/static').filter(file => ['.js','.css'].includes(extname(file))).map(file => { const data = readFileSync(resolve(app, file)); return { file, bytes: data.length, gzipBytes: gzipSync(data).length }; });
  const databaseFiles = readdirSync(run).filter(name => /^fictional\.sqlite(?:-wal|-shm)?$/.test(name)).map(name => ({ name, bytes: statSync(resolve(run,name)).size }));
  const workspaceAssets = new Set(routeAssets[0].assets.map(asset => asset.path));
  for (const route of routeAssets) {
    const additional = route.assets.filter(asset => !workspaceAssets.has(asset.path));
    route.additionalToWorkspace = { bytes: additional.reduce((n,a)=>n+a.bytes,0), gzipBytes: additional.reduce((n,a)=>n+a.gzipBytes,0) };
  }
  const report = { mode: 'isolated simulation', buildDirectory: app, node: process.version, browser: browser.version(), steps, memory,
    memoryMeaning: 'Single owned Windows Next production process; discrete working-set/private-byte observations, not continuous peak, Linux capacity or browser heap.',
    assetMeaning: 'Unique requested JS/CSS file bytes and per-file gzip estimates per page; shared browser context with routing/cache disabled. Not wire transfer, total page assets, vendor-only attribution or normal cached navigation.',
    routeAssets, bundle: { count: staticAssets.length, bytes: staticAssets.reduce((n,a)=>n+a.bytes,0), gzipBytes: staticAssets.reduce((n,a)=>n+a.gzipBytes,0), largest: staticAssets.sort((a,b)=>b.bytes-a.bytes).slice(0,8) },
    databaseFiles, externalHostsBlocked: [...new Set(external)], browserErrors, blockedProviderFetch: false, success: true };
  writeFileSync(resolve(run, 'summary.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify({ run, success: true, steps: steps.length, memory, routeAssets: routeAssets.map(({label,bytes,gzipBytes})=>({label,bytes,gzipBytes})), bundle: { bytes: report.bundle.bytes, gzipBytes: report.bundle.gzipBytes }, databaseFiles }));
} catch (error) {
  process.exitCode = 1; writeFileSync(resolve(run, 'failure.json'), JSON.stringify({ checkpoint, failureKind: error.name, steps, memory, externalHostsBlocked: [...new Set(external)], browserErrors },null,2));
  console.error('Isolated rehearsal stopped; inspect its fictional receipts. No automatic retry or provider fallback.');
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null && server.signalCode === null) {
    const stopped = spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { env, windowsHide: true, stdio: 'ignore', timeout: 10000 });
    if (stopped.status !== 0 && server.exitCode === null) process.exitCode = 1;
  }
  const closed = await new Promise(done => { const socket = createConnection({host:'127.0.0.1',port}); socket.setTimeout(2000);
    socket.once('connect',()=>{socket.destroy();done(false);});socket.once('error',error=>done(error.code==='ECONNREFUSED'));socket.once('timeout',()=>{socket.destroy();done(false);}); });
  writeFileSync(resolve(run, 'cleanup.json'), JSON.stringify({ closed },null,2)); if (!closed) process.exitCode = 1;
}
