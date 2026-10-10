import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Deliberately bounded local review aid, not a comprehensive secret scanner.
// Reports locations/categories only; never emits matching text or secret values.
export function sensitivePath(path) {
  return /(^|\/)(?:data|node_modules|\.next|test-results)(?:\/|$)/i.test(path) ||
    /(^|\/)\.env(?:$|\.)/i.test(path) && path !== '.env.example' ||
    /\.(?:sqlite(?:-wal|-shm)?|db|pem|p12|pfx|key)$/i.test(path);
}

export function sourceFindings(path, text) {
  const rules = [
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['provider-token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|sk-ant-[A-Za-z0-9_-]{20,})\b/],
    ['embedded-licence', /\[TRIAL\]_this_|\[v3\]_\[[A-Za-z0-9]+\]_[A-Za-z0-9+/=]{20,}/],
    // The explicit fictional fixture name is not a generated buyer account.
    ['sandbox-account', /\bsb-(?!fictional@)[A-Za-z0-9]+@(?:personal|business)\.example\.com\b/],
    ['private-client-url', /(?:https?:\/\/[^\s"'`<>]+)?\/(?:api\/)?client\/(?:[a-f0-9]{48}(?![a-f0-9])|[a-f0-9]{8}-[a-f0-9-]{27,})/i],
    ['temporary-public-tunnel', /https?:\/\/[A-Za-z0-9.-]+\.(?:trycloudflare\.com|ngrok-free\.app|ngrok\.io)\b/i],
    ['sandbox-payment-url', /https:\/\/www\.sandbox\.paypal\.com\/invoice\/p\/#[A-Za-z0-9]+/i],
    ['operational-invoice-id', /\bINV2-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}\b/],
  ];
  const findings = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [category, pattern] of rules) if (pattern.test(line)) findings.push({ path, line: index + 1, category });
    if (path === '.env.example' && /^(?:PAYPAL_(?:CLIENT_ID|CLIENT_SECRET|MERCHANT_EMAIL|WEBHOOK_ID)|POSTMAN_INVOICE_ID|ANTHROPIC_API_KEY|ASTRO_GATEWAY_API_KEY|ELASTIC_API_KEY|NUDGE_ADMIN_TOKEN|NUDGE_AG_STUDIO_LICENSE|NUDGE_SANDBOX_REFERENCE_INVOICE_ID)\s*=\s*[^\s#]/.test(line)) findings.push({ path, line: index + 1, category: 'filled-example-secret-or-identifier' });
  });
  return findings;
}

export function checkPublicSource(root) {
  const directory = realpathSync(root);
  const git = args => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  const paths = [...new Set(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean))];
  if (paths.length > 2000) throw Error('Review file limit exceeded.');
  const findings = []; let reviewedFiles = 0, bytes = 0;
  for (const path of paths) {
    if (sensitivePath(path)) { findings.push({ path, category: 'tracked-sensitive-file' }); continue; }
    const target = resolve(directory, path);
    if (!target.startsWith(directory + sep)) throw Error('Tracked path outside workspace.');
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || !realpathSync(target).startsWith(directory + sep)) throw Error('Unsupported tracked file.');
    if (stat.size > 2 * 1024 * 1024 || (bytes += stat.size) > 16 * 1024 * 1024) throw Error('Review size limit exceeded.');
    findings.push(...sourceFindings(path, readFileSync(target, 'utf8')));
    reviewedFiles++;
  }
  // Path inventory only: historical file contents, author identities and remote
  // hosting are not inspected. Sensitive historical paths are never opened.
  const history = git(['log', '--all', '--pretty=format:', '--name-only', '--diff-filter=A']);
  const historicalSensitivePaths = [...new Set(history.split(/\r?\n/).filter(Boolean).filter(sensitivePath))];
  return { scope: 'Tracked and non-ignored candidate working-tree text; local-history path inventory', reviewedFiles, findings, historicalSensitivePaths, historyContentScanned: false, remoteInspected: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw Error('No arguments supported.');
    const report = checkPublicSource(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
    console.log(JSON.stringify(report, null, 2));
    if (report.findings.length || report.historicalSensitivePaths.length) process.exitCode = 1;
  } catch {
    console.error('Public-source review could not complete. No matching content or raw errors printed.');
    process.exitCode = 1;
  }
}
