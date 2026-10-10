import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, lstatSync, existsSync, symlinkSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolatedWorkflowEnv, verifyWorkflowCollection, runWorkflowCollection } from './postman-workflow-runner.mjs';
import { reviewBrowserArtifacts } from './browser-artifact-review.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let server;
async function stopOwned(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') {
    await new Promise(done => { const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); killer.once('error', done); killer.once('exit', done); });
  } else child.kill('SIGTERM');
  await Promise.race([new Promise(done => child.once('exit', done)), new Promise(done => setTimeout(done, 3000))]);
  if (child.exitCode === null && child.signalCode === null) throw Error('owned-process-still-running');
}
async function main() {
  const reviewArtifacts = process.argv.length === 3 && process.argv[2] === '--review-browser-artifacts';
  if (process.argv.length !== 2 && !reviewArtifacts) throw Error('arguments');
  const require = createRequire(import.meta.url);
  if (require('../data/postman-runner/node_modules/newman/package.json').version !== '6.2.1') throw Error('newman-version');
  const newman = require('../data/postman-runner/node_modules/newman');
  const collection = JSON.parse(readFileSync(resolve(root, 'postman/nudge-workflow.postman_collection.json'), 'utf8'));
  verifyWorkflowCollection(collection);
  const runDir = resolve(root, 'data/postman-workflow', randomUUID()), appDir = resolve(runDir, 'app-source');
  mkdirSync(appDir, { recursive: true });
  const env = isolatedWorkflowEnv(process.env, root, runDir);
  // Synthetic values only, injected into the isolated build child. The runtime
  // simulation still receives the original credential-free isolated environment.
  const markers = Object.fromEntries(['PAYPAL_CLIENT_SECRET', 'ELASTIC_API_KEY', 'ANTHROPIC_API_KEY', 'ASTRO_GATEWAY_API_KEY', 'NUDGE_ADMIN_TOKEN'].map(name => [name, `fictional-browser-review-${randomUUID()}`]));
  const buildEnv = reviewArtifacts ? { ...env, ...markers } : env;
  function copy(relative) {
    const from = resolve(root, relative), to = resolve(appDir, relative);
    if (!from.startsWith(root + sep) || !to.startsWith(appDir + sep) || relative.split(/[\\/]/).some(part => part.startsWith('.env'))) throw Error('source-path');
    const stat = lstatSync(from);
    if (stat.isSymbolicLink()) throw Error('source-link');
    if (stat.isDirectory()) { mkdirSync(to, { recursive: true }); for (const entry of readdirSync(from)) copy(relative + '/' + entry); }
    else if (stat.isFile()) { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); }
    else throw Error('source-type');
  }
  for (const path of ['app', 'components', 'lib', 'package.json', 'package-lock.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.ts']) copy(path);
  if (existsSync(resolve(root, 'public'))) copy('public');
  symlinkSync(resolve(root, 'node_modules'), resolve(appDir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const cli = resolve(root, 'node_modules/next/dist/bin/next');
  console.log('Building disposable production source copy; integrations disabled.');
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, [cli, 'build'], { cwd: appDir, env: buildEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = ''; const append = chunk => { if (log.length < 1048576) log += chunk.toString().slice(0, 1048576 - log.length); };
    child.stdout.on('data', append); child.stderr.on('data', append);
    const timer = setTimeout(() => { void stopOwned(child).then(() => reject(Error('build-timeout')), () => reject(Error('build-stop-failed'))); }, 120000);
    child.once('error', () => { clearTimeout(timer); reject(Error('build-start')); });
    child.once('exit', code => { clearTimeout(timer); writeFileSync(resolve(runDir, 'build.log'), log, { flag: 'wx' }); code === 0 ? done() : reject(Error('build-failed')); });
  });
  if (reviewArtifacts) {
    const report = reviewBrowserArtifacts(resolve(appDir, '.next/static'), markers);
    const publicReport = existsSync(resolve(appDir, 'public')) ? reviewBrowserArtifacts(resolve(appDir, 'public'), markers) : null;
    writeFileSync(resolve(runDir, 'browser-artifact-review.json'), JSON.stringify({ ...report, publicAssets: publicReport }, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ check: 'synthetic browser credential markers', files: report.files, findings: report.findings.length, sourceMaps: report.sourceMaps.length, success: report.success && (!publicReport || publicReport.success) }));
    if (!report.success || publicReport && !publicReport.success) throw Error('browser-artifact-privacy');
  }
  const port = await new Promise((done, reject) => {
    const reservation = createServer(); reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => { const port = reservation.address().port; reservation.close(() => done(port)); });
  });
  const origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [cli, 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: appDir, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverLog = ''; const appendServer = chunk => { if (serverLog.length < 1048576) serverLog += chunk.toString().slice(0, 1048576 - serverLog.length); };
  server.stdout.on('data', appendServer); server.stderr.on('data', appendServer);
  let startFailed = false; server.once('error', () => { startFailed = true; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (startFailed || server.exitCode !== null) throw Error('server-start');
      try {
        const response = await fetch(origin + '/api/workspace', { redirect: 'error', signal: AbortSignal.timeout(1000) });
        if (response.ok) {
          const d = await response.json();
          if (d.mode !== 'demo' || d.aiEnabled !== false || Object.values(d.connections || {}).some(Boolean) || d.version !== 1 || d.agreementStatus !== 'draft' || d.proposals.length || d.invoices.length) throw Error('isolation-preflight');
          ready = true; break;
        }
      } catch (error) { if (error.message === 'isolation-preflight') throw error; }
      await new Promise(done => setTimeout(done, 250));
    }
    if (!ready) throw Error('server-ready');
    console.log('Owned loopback server ready; running reviewed Postman simulation workflow.');
    const result = await runWorkflowCollection(newman, collection, origin, runDir);
    const blockedProviderFetch = existsSync(resolve(runDir, 'blocked-fetch.log'));
    const report = { ...result, blockedProviderFetch, success: result.success && !blockedProviderFetch };
    writeFileSync(resolve(runDir, 'summary.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ tool: report.tool, environment: report.environment, requests: report.requests.length, assertions: report.assertions, failedAssertions: report.failedAssertions, failedSteps: report.failedSteps, blockedProviderFetch, success: report.success, artifactDirectory: runDir }));
    console.log('No provider credentials loaded, model requests, PayPal calls or ordinary workspace writes. Synthetic records retained in ignored run directory.');
    if (!report.success) process.exitCode = 1;
  } finally {
    await stopOwned(server);
    writeFileSync(resolve(runDir, 'server.log'), serverLog, { flag: 'wx' });
    console.log('Temporary server stopped; ordinary development server preserved.');
  }
}
main().catch(async () => { try { await stopOwned(server); } catch { console.error('Owned workflow process did not confirm exit; inspect the local run before continuing.'); } console.error('Isolated Postman workflow stopped. Review local setup or sanitized run summary; no raw errors printed, no automatic retry.'); process.exitCode = 1; });
