// Offline only: no fetch, credential output, file writes or model calls.
const checks = [];
const add = (name, ok) => checks.push({ name, ok });
add('Elastic provider selected', process.env.NUDGE_AI_PROVIDER === 'elastic');
add('AI remains paused for configuration review', process.env.NUDGE_AI_ENABLED !== 'true');
let validOrigin = false;
try {
  const url = new URL(process.env.ELASTIC_KIBANA_URL || '');
  validOrigin = url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/' && !url.port &&
    ['.elastic.cloud', '.elastic-cloud.com', '.cloud.es.io'].some(suffix => url.hostname.endsWith(suffix));
} catch { /* Never print the supplied value or parser error. */ }
add('Kibana HTTPS Cloud origin has valid shape', validOrigin);
const agent = process.env.ELASTIC_AGENT_ID || '';
add('Dedicated agent identifier has valid shape', /^[a-zA-Z0-9_-]{1,128}$/.test(agent) && agent !== 'elastic-ai-agent');
const key = process.env.ELASTIC_API_KEY || '';
add('API key is present without whitespace', Boolean(key) && !/\s/.test(key));
const space = process.env.ELASTIC_SPACE_ID;
add('Optional space identifier has valid shape', !space || /^[a-zA-Z0-9_-]{1,128}$/.test(space));
const inferenceId = process.env.ELASTIC_INFERENCE_ID;
add('Optional inference endpoint identifier has valid shape', !inferenceId || /^[a-zA-Z0-9_.-]{1,256}$/.test(inferenceId));
console.log(`Model routing: ${inferenceId ? 'explicit inference endpoint configured' : 'Elastic feature assignment (no explicit override)'}. Endpoint availability is not verified offline.`);
for (const { name, ok } of checks) console.log(`${ok ? 'PASS' : 'CHECK'}: ${name}`);
console.log('Offline configuration check only. Does not verify credentials, permissions, model access, allowance or API compatibility.');
console.log('Keep AI paused until the first free test is authorized. No provider request or workspace change occurred.');
if (checks.some(check => !check.ok)) process.exitCode = 1;
