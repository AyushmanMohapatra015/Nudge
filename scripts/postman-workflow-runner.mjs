import { createHash } from 'node:crypto';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { resolve, sep } from 'node:path';

// M6 review: original 31 steps retained; 16 delivery-only steps added. All
// requests remain on the owned origin; the hostile Origin value is a header,
// not an outbound destination. Runtime baseline/command variables stay local.
const reviewedDigest = '93773f154bff183d857d9f545720c2b7d4853d5d51920b6fb1345e90bacd5f80';
export function verifyWorkflowCollection(collection) {
  if (createHash('sha256').update(JSON.stringify(collection)).digest('hex') !== reviewedDigest) throw Error('Workflow collection changed. Review before running.');
}

/** @returns {NodeJS.ProcessEnv} */
export function isolatedWorkflowEnv(parent, projectRoot, runDir) {
  const root = resolve(projectRoot), directory = resolve(runDir);
  if (!directory.startsWith(resolve(root, 'data/postman-workflow') + sep)) throw Error('Disposable workflow directory required.');
  // Codex/Next's inherited upgrade nudge can fetch npm advisories during a
  // build; the isolated workflow runs its own dependency audit separately.
  const env = Object.fromEntries(Object.entries(parent).filter(([key]) => !/^(PAYPAL_|ELASTIC_|ANTHROPIC_|ASTRO_|NUDGE_|POSTMAN_|NEXT_PUBLIC_|__NEXT_AGENT_UPGRADE$|NODE_OPTIONS$|HTTP_PROXY$|HTTPS_PROXY$|ALL_PROXY$|NO_PROXY$|NODE_ENV$|PORT$)/i.test(key)));
  const guard = resolve(root, 'scripts/postman-no-network.cjs').split(sep).join('/');
  if (/["\r\n]/.test(guard)) throw Error('Unsupported guard path.');
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NUDGE_MODE: 'demo', NUDGE_AI_ENABLED: 'false', NUDGE_AI_PROVIDER: 'anthropic', NUDGE_DB_PATH: resolve(directory, 'workflow.sqlite'), NUDGE_POSTMAN_RUN_DIR: directory, NODE_OPTIONS: `--require "${guard}"` };
}

export function runWorkflowCollection(newman, collection, origin, workingDir) {
  verifyWorkflowCollection(collection);
  const url = new URL(origin);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Owned loopback server required.');
  const expected = collection.item.map(item => Number(item.event[0].script.exec[0].match(/HTTP (\d{3})/)[1]));
  const httpAgent = new HttpAgent(), httpsAgent = new HttpsAgent();
  const connect = httpAgent.createConnection;
  httpAgent.createConnection = function (options, callback) {
    if (options.host !== '127.0.0.1' || Number(options.port) !== Number(url.port)) throw Error('Non-workflow destination blocked.');
    return connect.call(this, options, callback);
  };
  httpsAgent.createConnection = () => { throw Error('HTTPS destinations blocked for local workflow.'); };
  return new Promise(resolveResult => {
    newman.run({ collection: structuredClone(collection), envVar: [{ key: 'base_url', value: url.origin }], reporters: [], iterationCount: 1,
      timeout: 90000, timeoutRequest: 10000, timeoutScript: 3000, abortOnFailure: true, abortOnError: true, bail: ['failure'],
      ignoreRedirects: true, insecure: false, insecureFileRead: false, workingDir, requestAgents: { http: httpAgent, https: httpsAgent },
    }, (error, summary) => {
      httpAgent.destroy(); httpsAgent.destroy();
      const executions = summary?.run?.executions || [];
      const requests = executions.map((e, index) => ({ step: index + 1, status: Number.isInteger(e.response?.code) ? e.response.code : null, expected: expected[index] ?? null }));
      const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
      const assertions = count(summary?.run?.stats?.assertions?.total), failedAssertions = count(summary?.run?.stats?.assertions?.failed);
      const failedSteps = [...new Set((summary?.run?.failures || []).map(f => f.cursor?.position).filter(n => Number.isSafeInteger(n) && n >= 0 && n < expected.length).map(n => n + 1))];
      const success = !error && summary?.run?.failures?.length === 0 && requests.length === expected.length && requests.every(r => r.status === r.expected) && assertions === 77 && failedAssertions === 0;
      resolveResult({ tool: 'Postman Newman', environment: 'isolated local simulation', requests, assertions, failedAssertions, failedSteps, success });
    });
  });
}
