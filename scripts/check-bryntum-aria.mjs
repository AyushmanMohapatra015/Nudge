import { createServer } from 'node:http';
import { createConnection } from 'node:net';
import { readFileSync, mkdirSync, writeFileSync, realpathSync, existsSync } from 'node:fs';
import { resolve, dirname, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from '@playwright/test';
import axe from 'axe-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = realpathSync(resolve(root, 'node_modules/@bryntum/gantt'));
if (JSON.parse(readFileSync(resolve(vendor, 'package.json'), 'utf8')).version !== '7.3.7') throw Error('Review the reproduction before changing vendor versions');
const fixture = resolve(root, 'tests/fixtures/bryntum-aria');
const run = resolve(root, 'data/bryntum-aria', randomUUID()); mkdirSync(run, { recursive: true });
const env = {}; for (const [key, value] of Object.entries(process.env)) if (/^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)) env[key] = value;
const contentTypes = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const vendorFiles = new Set(['gantt.module.js', 'gantt.css', 'stockholm-light.css',
  'fontawesome/css/fontawesome.css', 'fontawesome/css/solid.css',
  'fontawesome/webfonts/fa-solid-900.woff2', 'fontawesome/webfonts/fa-solid-900.ttf']);
const server = createServer((request, response) => {
  try {
    if (request.method !== 'GET') { response.writeHead(405); response.end(); return; }
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    let file;
    if (path === '/') file = resolve(fixture, 'index.html');
    else if (path === '/fixture.mjs') file = resolve(fixture, 'fixture.mjs');
    else if (path.startsWith('/vendor/') && vendorFiles.has(path.slice(8))) {
      file = realpathSync(resolve(vendor, path.slice(8))); if (!file.startsWith(vendor + sep)) throw Error('Unsupported asset');
    }
    if (!file || !existsSync(file)) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'content-type': contentTypes[extname(file)], 'cache-control': 'no-store' }); response.end(readFileSync(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
const port = server.address().port, origin = `http://127.0.0.1:${port}`;
let browser; const results = [], external = [], errors = [], localFailures = [];
try {
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', env });
  for (const mode of ['readonly', 'editable']) {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push({ mode, name: error.name }));
    page.on('response', response => { if (response.status() >= 400) localFailures.push({ mode, path: new URL(response.url()).pathname, status: response.status() }); });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      external.push({ mode, host: url.hostname }); return route.abort();
    });
    await page.goto(origin + '/?mode=' + mode);
    await page.waitForFunction(() => window.fixtureReady?.count === 1, undefined, { timeout: 15000 });
    await page.addScriptTag({ content: axe.source });
    const data = await page.evaluate(async () => {
      const report = await window.axe.run(document, { runOnly: { type: 'rule', values: ['aria-required-children', 'aria-required-parent', 'aria-valid-attr-value'] } });
      return { ready: window.fixtureReady, findings: report.violations.map(v => ({ id: v.id, impact: v.impact,
        nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) })) };
    });
    if (data.ready.readOnly !== (mode === 'readonly') || data.findings.length !== 1 || data.findings[0].id !== 'aria-required-children' ||
      data.findings[0].nodes.length !== 2 || !data.findings[0].nodes.every(node => node.target.length === 1 && typeof node.target[0] === 'string' &&
        (node.target[0] === '.b-grid-panel-body' || /^#b-gantt-\d+-normalSubgrid$/.test(node.target[0])))) throw Error('Observed finding changed; review before claiming reproduction');
    results.push({ mode, ...data }); await page.close();
  }
  if (external.length || errors.length || localFailures.length) throw Error('Isolated reproduction had unexpected loading errors');
  const report = { product: 'Bryntum Gantt', version: '7.3.7', browser: browser.version(), axe: axe.version,
    framework: 'plain JavaScript; no Nudge or React', results, external, errors, localFailures };
  writeFileSync(resolve(run, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ run, results: results.map(r => ({ mode: r.mode, findings: r.findings.map(v => ({ id: v.id, count: v.nodes.length })) })), external: external.length, errors: errors.length }));
} catch {
  writeFileSync(resolve(run, 'failure.json'), JSON.stringify({ external, errors, localFailures }, null, 2));
  process.exitCode = 1; console.error('Reproduction did not complete. Inspect only its isolated diagnostic receipt.');
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
  const closed = await new Promise(done => {
    const socket = createConnection({ host: '127.0.0.1', port }); socket.setTimeout(2000);
    socket.once('connect', () => { socket.destroy(); done(false); });
    socket.once('error', error => done(error.code === 'ECONNREFUSED'));
    socket.once('timeout', () => { socket.destroy(); done(false); });
  });
  writeFileSync(resolve(run, 'cleanup.json'), JSON.stringify({ closed }, null, 2));
  if (!closed) { process.exitCode = 1; console.error('Owned loopback endpoint closure not confirmed.'); }
}
