import { spawn, execFileSync } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, lstatSync, realpathSync, symlinkSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPublicSource } from './check-public-source.mjs';
import { isolatedWorkflowEnv } from './postman-workflow-runner.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let child;
async function stopOwned() {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') {
    await new Promise(done => { const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); killer.once('error', done); killer.once('exit', done); });
  } else child.kill('SIGTERM');
  await Promise.race([new Promise(done => child.once('exit', done)), new Promise(done => setTimeout(done, 3000))]);
  if (child.exitCode === null && child.signalCode === null) throw Error('owned-process-still-running');
}
async function main() {
  if (process.argv.length !== 2) throw Error('arguments');
  const npmCli = process.env.npm_execpath;
  if (!npmCli || !lstatSync(npmCli).isFile()) throw Error('Run using npm run verify:clean.');
  const review = checkPublicSource(root);
  if (review.findings.length || review.historicalSensitivePaths.length) throw Error('source-review');
  const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  const pendingDeleted = new Set(review.pendingDeletedPaths);
  const paths = [...new Set(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean))].filter(path => !pendingDeleted.has(path)).sort();
  if (paths.length > 2000) throw Error('source-bound');
  const runDir = resolve(root, 'data/postman-workflow', 'clean-' + randomUUID()), source = resolve(runDir, 'source');
  mkdirSync(source, { recursive: true });
  const digest = createHash('sha256'); let bytes = 0;
  for (const path of paths) {
    const from = resolve(root, path), to = resolve(source, path);
    if (!from.startsWith(root + sep) || !to.startsWith(source + sep) || /(^|[\\/])(?:data|node_modules|\.git|\.next)([\\/]|$)/.test(path) || /(^|[\\/])\.env/.test(path) && path !== '.env.example') throw Error('source-path');
    const stat = lstatSync(from);
    if (!stat.isFile() || stat.isSymbolicLink() || !realpathSync(from).startsWith(root + sep) || stat.size > 2 * 1024 * 1024 || (bytes += stat.size) > 16 * 1024 * 1024) throw Error('source-file');
    const content = readFileSync(from);
    digest.update(path + '\0').update(String(content.length) + '\0').update(content);
    mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to);
  }
  const sourceManifest = { scope: 'Current tracked and non-ignored working-tree source snapshot; not a remote clone or Git archive', head: git(['rev-parse', 'HEAD']).trim(), files: paths.length, bytes, sourceSha256: digest.digest('hex'), paths };
  writeFileSync(resolve(runDir, 'source-manifest.json'), JSON.stringify(sourceManifest, null, 2));
  // Newman is verification tooling only; application dependencies are freshly
  // installed below, never linked to the original application's node_modules.
  mkdirSync(resolve(source, 'data'), { recursive: true });
  symlinkSync(resolve(root, 'data/postman-runner'), resolve(source, 'data/postman-runner'), process.platform === 'win32' ? 'junction' : 'dir');
  // Install hooks need system/runtime paths, not unrelated shell credentials or
  // inherited npm settings. Explicit npm config/cache flags below remain authoritative.
  const systemEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|TMPDIR|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)));
  const env = isolatedWorkflowEnv(systemEnv, root, runDir);
  // The coordinator needs loopback fetch and npm registry access. The reviewed
  // workflow runner applies its fetch guard to its own build/server children.
  delete env.NODE_OPTIONS;
  writeFileSync(resolve(runDir, 'empty-user.npmrc'), '');
  writeFileSync(resolve(runDir, 'empty-global.npmrc'), '');
  const results = [];
  async function step(name, args, timeout = 180000) {
    console.log('Clean source: ' + name + '.');
    const started = Date.now(); let log = '';
    await new Promise((done, reject) => {
      child = spawn(process.execPath, [npmCli, ...args], { cwd: source, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const append = chunk => { if (log.length < 2 * 1024 * 1024) log += chunk.toString().slice(0, 2 * 1024 * 1024 - log.length); };
      child.stdout.on('data', append); child.stderr.on('data', append);
      const timer = setTimeout(() => { void stopOwned().then(() => reject(Error(name + '-timeout')), () => reject(Error(name + '-stop-failed'))); }, timeout);
      child.once('error', () => { clearTimeout(timer); reject(Error(name + '-start')); });
      child.once('exit', code => { clearTimeout(timer); writeFileSync(resolve(runDir, name + '.log'), log, { flag: 'wx' }); code === 0 ? done() : reject(Error(name + '-failed')); });
    });
    results.push({ check: name, passed: true, elapsedMs: Date.now() - started });
    console.log(name + ' passed.');
  }
  await step('locked-install', ['ci', '--ignore-scripts', '--prefer-offline', '--include=dev', '--no-audit', '--no-fund', '--fetch-retries=0', '--fetch-timeout=120000', '--cache', resolve(root, 'data/clean-source-npm-cache'), '--userconfig', resolve(runDir, 'empty-user.npmrc'), '--globalconfig', resolve(runDir, 'empty-global.npmrc'), '--registry', 'https://registry.npmjs.org'], 600000);
  if (lstatSync(resolve(source, 'node_modules')).isSymbolicLink()) throw Error('fresh-dependencies');
  // npm ran the parent before its helper in observed fresh installs. Unpacking
  // alone is not a working trial: complete every normal lifecycle, helper first.
  const lifecycleConfig = ['--foreground-scripts', '--ignore-scripts=false', '--no-audit', '--no-fund', '--userconfig', resolve(runDir, 'empty-user.npmrc'), '--globalconfig', resolve(runDir, 'empty-global.npmrc')];
  await step('trial-helper-lifecycle', ['rebuild', '@bryntum/gantt-trial-lib', ...lifecycleConfig]);
  const preparedHelper = readFileSync(resolve(source, 'node_modules/@bryntum/gantt-trial-lib/build.js'), 'utf8');
  if (preparedHelper.includes('%UUID%')) throw Error('trial-helper-unprepared');
  await step('dependency-lifecycles', ['rebuild', ...lifecycleConfig]);
  // Check only preparation markers, never copy generated trial identifiers into
  // reports or modify vendor files. A successful install alone is insufficient.
  const packageVersion = name => JSON.parse(readFileSync(resolve(source, 'node_modules', name, 'package.json'), 'utf8')).version;
  const gantt = readFileSync(resolve(source, 'node_modules/@bryntum/gantt/gantt.module.js'), 'utf8');
  const helper = readFileSync(resolve(source, 'node_modules/@bryntum/gantt-trial-lib/build.js'), 'utf8');
  const preparation = {
    ganttVersion: packageVersion('@bryntum/gantt'),
    reactVersion: packageVersion('@bryntum/gantt-react'),
    helperVersion: packageVersion('@bryntum/gantt-trial-lib'),
    helperPrepared: !helper.includes('%UUID%'),
    preparedHelperUnchanged: helper === preparedHelper,
    bundlePrepared: !gantt.includes('%UUID%') && !gantt.includes('%LICENSE%'),
  };
  preparation.success = preparation.ganttVersion === '7.3.7' && preparation.reactVersion === '7.3.7' && preparation.helperVersion === '1.0.1' && preparation.helperPrepared && preparation.preparedHelperUnchanged && preparation.bundlePrepared;
  writeFileSync(resolve(runDir, 'trial-preparation.json'), JSON.stringify(preparation, null, 2));
  if (!preparation.success) throw Error('trial-preparation');
  results.push({ check: 'trial-preparation', passed: true });
  console.log('Trial preparation passed.');
  await step('typecheck', ['run', 'typecheck']);
  await step('offline-tests', ['test']);
  await step('production-workflow', ['run', 'postman:workflow']);
  writeFileSync(resolve(runDir, 'summary.json'), JSON.stringify({ ...sourceManifest, results, success: true, environmentPolicy: 'System-variable allowlist; no inherited provider, npm-config or unrelated credentials', applicationDependencies: 'Fresh npm ci, no original node_modules link', verificationTooling: 'Existing pinned local Newman 6.2.1 runner', artifactDirectory: runDir }, null, 2));
  console.log(JSON.stringify({ checks: results, success: true, artifactDirectory: runDir }));
}
main().catch(async () => { try { await stopOwned(); } catch { console.error('Owned verification process exit remains unconfirmed.'); } console.error('Clean-source verification stopped; inspect the ignored step logs. No raw errors printed or automatic retry.'); process.exitCode = 1; });
