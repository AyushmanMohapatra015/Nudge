import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync, existsSync, mkdirSync, lstatSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolatedWorkflowEnv } from './postman-workflow-runner.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let server;
async function stopOwned() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  if (process.platform === 'win32') {
    await new Promise(done => { const child = spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); child.once('error', done); child.once('exit', done); });
  } else server.kill('SIGTERM');
}
function sameSource(source) {
  let files = 0, bytes = 0;
  function compare(relative) {
    const from = resolve(root, relative), to = resolve(source, relative);
    if (!from.startsWith(root + sep) || !to.startsWith(source + sep)) return false;
    if (!existsSync(from)) return !existsSync(to);
    const stat = lstatSync(from);
    if (stat.isSymbolicLink() || !existsSync(to) || lstatSync(to).isSymbolicLink()) return false;
    if (stat.isDirectory()) {
      if (!lstatSync(to).isDirectory()) return false;
      const currentNames = readdirSync(from).sort(), builtNames = readdirSync(to).sort();
      return JSON.stringify(currentNames) === JSON.stringify(builtNames) && currentNames.every(name => compare(relative + '/' + name));
    }
    if (!stat.isFile() || ++files > 2000 || (bytes += stat.size) > 16 * 1024 * 1024) return false;
    return readFileSync(from).equals(readFileSync(to));
  }
  if (!['app', 'components', 'lib', 'public', 'package-lock.json', 'next.config.ts', 'tsconfig.json'].every(compare)) return false;
  // Adding an operator npm script does not change compiled application code.
  // Dependency, engine or version changes still invalidate the cached build.
  const current = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const built = JSON.parse(readFileSync(resolve(source, 'package.json'), 'utf8'));
  return ['dependencies', 'devDependencies', 'engines', 'version'].every(field => JSON.stringify(current[field]) === JSON.stringify(built[field]));
}
async function main() {
  if (process.argv.length !== 2) throw Error('arguments');
  const directory = resolve(root, 'data/postman-workflow');
  const candidates = readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory() && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(entry.name));
  if (candidates.length > 2000) throw Error('review-bound');
  let source;
  for (const entry of candidates.sort((a, b) => lstatSync(resolve(directory, b.name)).mtimeMs - lstatSync(resolve(directory, a.name)).mtimeMs)) {
    const run = resolve(directory, entry.name), app = resolve(run, 'app-source');
    if (!existsSync(resolve(run, 'summary.json')) || !existsSync(resolve(app, '.next/BUILD_ID'))) continue;
    const summary = JSON.parse(readFileSync(resolve(run, 'summary.json'), 'utf8'));
    if (summary.success === true && summary.restartPersistence === true && summary.blockedProviderFetch === false && sameSource(app)) { source = app; break; }
  }
  if (!source) throw Error('current-verified-build');
  const run = resolve(directory, 'manual-a11y-' + randomUUID()); mkdirSync(run, { recursive: true });
  const env = isolatedWorkflowEnv(process.env, root, run);
  server = spawn(process.execPath, [resolve(source, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3117'], { cwd: source, env, windowsHide: true, stdio: 'inherit' });
  server.once('error', () => { console.error('Manual review server could not start.'); process.exitCode = 1; });
  server.once('exit', code => { process.exitCode = code === 0 || code === null ? 0 : 1; });
  process.once('SIGINT', () => { void stopOwned(); });
  process.once('SIGTERM', () => { void stopOwned(); });
  console.log('Open http://127.0.0.1:3117 for fictional local accessibility review. AI and payments are simulated; ordinary workspace data is untouched. Stop with Ctrl+C.');
}
main().catch(() => { console.error('Manual review not started. Run npm run postman:workflow to prepare a verified current build, then retry. No raw errors or credentials printed.'); process.exitCode = 1; });
