import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, lstatSync, realpathSync, existsSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { createServer, createConnection } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (process.platform !== 'win32' || process.argv.length !== 3) throw Error('Windows performance review requires one verified disposable app-source build');
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
const run = resolve(root, 'data/route-performance', randomUUID()); mkdirSync(run, { recursive: true });
const env = {}; for (const [key, value] of Object.entries(process.env)) if (/^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)) env[key] = value;
const guard = resolve(root, 'scripts/postman-no-network.cjs').split(sep).join('/');
if (/["\r\n]/.test(guard)) throw Error('Unsupported guard path');
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NUDGE_MODE: 'demo', NUDGE_AI_ENABLED: 'false',
  NUDGE_DB_PATH: resolve(run, 'fictional.sqlite'), NUDGE_POSTMAN_RUN_DIR: run, NODE_OPTIONS: `--require "${guard}"` });
const port = await new Promise((done, reject) => { const reservation = createServer(); reservation.once('error', reject); reservation.listen(0, '127.0.0.1', () => { const port = reservation.address().port; reservation.close(() => done(port)); }); });
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: app, env, windowsHide: true, stdio: ['ignore', 'ignore', 'ignore'] });
let browser, context, started = false, checkpoint = 'startup'; server.once('error', () => { started = false; });
const results = [], external = [], browserErrors = [];
async function json(path, data) {
  const response = await fetch(origin + path, { method: data ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(15000), headers: data ? { 'content-type': 'application/json', origin } : {}, ...(data ? { body: JSON.stringify(data) } : {}) });
  assert.equal(response.status, 200); return response.json();
}
const stamp = page => page.evaluate(() => performance.now());
const painted = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
async function measure(path, rate, repetition) {
  checkpoint = `${path} CPU${rate} sample${repetition}`;
  context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  context.setDefaultTimeout(45000);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    external.push(url.hostname); return route.fulfill({status:200,contentType:'text/css',body:''});
  });
  await context.addInitScript(() => {
    window.__nudgePerf = { longTasks: [], lcp: null };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__nudgePerf.longTasks.push({ start: entry.startTime, duration: entry.duration }); }).observe({type:'longtask',buffered:true});
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__nudgePerf.lcp = entry.startTime; }).observe({type:'largest-contentful-paint',buffered:true});
  });
  const page = await context.newPage();
  page.on('pageerror', error => browserErrors.push(error.name));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate});
  await cdp.send('Performance.enable');
  await page.goto(origin + path, {waitUntil:'domcontentloaded',timeout:45000});
  if (path === '/delivery') await page.getByRole('table',{name:'Current delivery dates'}).waitFor();
  else await page.getByRole('button',{name:'Load interactive reports',exact:true}).waitFor();
  await painted(page); const nativeReadyMs = await stamp(page);
  const nativeResources = await page.evaluate(() => performance.getEntriesByType('resource').filter(e=>e.name.includes('/_next/static/')).map(e=>new URL(e.name).pathname));
  let chartStart = 0;
  if (path === '/delivery') { chartStart = await stamp(page); await page.getByRole('button',{name:'Show Gantt timeline',exact:true}).click(); await page.getByRole('status').filter({hasText:'Read-only timeline ready.'}).waitFor(); }
  else { chartStart = await stamp(page); await page.getByRole('button',{name:'Load interactive reports',exact:true}).click(); await page.getByRole('region',{name:'AG Studio report builder'}).locator('.ag-studio-layout-widget').first().waitFor(); }
  await painted(page); const chartReadyMs = await stamp(page);
  const interactionStart = await stamp(page);
  if (path === '/delivery') {
    await page.getByRole('button',{name:'Hide Gantt timeline',exact:true}).click();
    await page.getByRole('button',{name:'Show Gantt timeline',exact:true}).waitFor();
    assert.equal(await page.locator('.b-gantt').count(),0);
  } else {
    await page.getByRole('button',{name:'Edit report layout',exact:true}).click();
    await page.getByRole('button',{name:'Finish editing layout',exact:true}).waitFor();
  }
  await painted(page); const interactionEnd = await stamp(page);
  const browserMetrics = await page.evaluate(() => ({
    ...window.__nudgePerf,
    paints: performance.getEntriesByType('paint').map(e=>({name:e.name,start:e.startTime})),
    navigation: performance.getEntriesByType('navigation').map(e=>({responseStart:e.responseStart,domContentLoaded:e.domContentLoadedEventEnd})),
    resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/_next/static/')).map(e=>({path:new URL(e.name).pathname,encodedBytes:e.encodedBodySize,decodedBytes:e.decodedBodySize,transferBytes:e.transferSize}))
  }));
  const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.filter(m=>['ScriptDuration','TaskDuration','JSHeapUsedSize'].includes(m.name)).map(m=>[m.name,m.value]));
  const longTasks = browserMetrics.longTasks;
  const result = {path,rate,repetition,nativeReadyMs,chartReadyMs,chartActivationMs:chartReadyMs-chartStart,interactionMs:interactionEnd-interactionStart,
    longTaskCount:longTasks.length,maxLongTaskMs:Math.max(0,...longTasks.map(t=>t.duration)),blockingTimeMs:longTasks.reduce((sum,t)=>sum+Math.max(0,t.duration-50),0),
    nativeResources,browserMetrics,metrics};
  results.push(result); await context.close(); context=null;
  console.log(JSON.stringify({path,rate,repetition,nativeReadyMs:Math.round(nativeReadyMs),chartReadyMs:Math.round(chartReadyMs),interactionMs:Math.round(result.interactionMs)}));
}
try {
  for(let i=0;i<80;i++) { if(server.exitCode!==null)throw Error('Server exited'); try {if((await fetch(origin+'/api/health',{signal:AbortSignal.timeout(1000)})).ok){started=true;break;}}catch{} await new Promise(done=>setTimeout(done,250)); }
  assert.ok(started);const initial=await json('/api/workspace');assert.equal(initial.mode,'demo');assert.equal(initial.aiEnabled,false);assert.ok(Object.values(initial.connections).every(value=>value===false));
  await json('/api/workspace',{type:'approveAgreement'});let state=await json('/api/workspace');
  await json('/api/client/'+encodeURIComponent(state.clientToken),{type:'acceptAgreement'});state=await json('/api/workspace');
  const preview=await json('/api/delivery-plan',{type:'stage',expectedWorkspaceVersion:state.version,expectedPlanRevision:0,expectedPreviewId:null,calendar:{timezone:'Asia/Kolkata',weekdays:[1,2,3,4,5],holidays:[]},candidate:{tasks:[{key:'new:website',label:'Fictional website delivery',kind:'base',proposalId:null,references:['S1'],duration:3,startDate:'2026-10-19',endDateExclusive:'2026-10-22'}],dependencies:[]}});
  await json('/api/delivery-plan',{type:'apply',expectedWorkspaceVersion:preview.version,previewId:preview.plan.preview.id,confirmed:true});
  const before=await json('/api/workspace');
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',env:Object.fromEntries(Object.entries(env).filter(([key])=>key!=='NODE_OPTIONS'))});
  for(const rate of [1,4]) for(let repetition=1;repetition<=3;repetition++) for(const path of ['/delivery','/analytics']) await measure(path,rate,repetition);
  assert.deepEqual(await json('/api/workspace'),before,'Read-only performance interactions changed stored workspace');
  assert.deepEqual(browserErrors,[]);assert.ok(!existsSync(resolve(run,'blocked-fetch.log')));
  assert.ok(external.every(host=>['fonts.googleapis.com','fonts.gstatic.com'].includes(host)));
  writeFileSync(resolve(run,'summary.json'),JSON.stringify({success:true,results,browser:browser.version(),node:process.version,buildDirectory:app,externalHostsBlocked:[...new Set(external)],browserErrors,blockedProviderFetch:false,
    method:'Three sequential samples per route/rate, new contexts, routing disables HTTP cache, reduced motion, local loopback without network throttling. CPU4x is emulation, not a physical mobile device. Locator/action/paint timings include automation overhead, are not INP. ScriptDuration is cumulative script execution, not isolated parse time; long-task excess is observation-window blocking, not Lighthouse TBT. LCP candidate ends at interaction. No warm-cache/hosted/load/large dataset claim.'},null,2));
  console.log(JSON.stringify({success:true,run,samples:results.length}));
} catch(error) {
  process.exitCode=1;writeFileSync(resolve(run,'failure.json'),JSON.stringify({checkpoint,failureKind:error.name,completedSamples:results.length,browserErrors},null,2));
  console.error('Performance review stopped; inspect ignored fictional receipts.');
} finally {
  if(browser)await browser.close();
  if(server.exitCode===null && server.signalCode===null){const stopped=spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{env,windowsHide:true,stdio:'ignore',timeout:10000});if(stopped.status!==0 && server.exitCode===null)process.exitCode=1;}
  const closed=await new Promise(done=>{const socket=createConnection({host:'127.0.0.1',port});socket.setTimeout(2000);socket.once('connect',()=>{socket.destroy();done(false);});socket.once('error',error=>done(error.code==='ECONNREFUSED'));socket.once('timeout',()=>{socket.destroy();done(false);});});
  writeFileSync(resolve(run,'cleanup.json'),JSON.stringify({closed},null,2));if(!closed)process.exitCode=1;
}
