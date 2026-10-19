import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const guardPath = resolve('scripts/elastic-one-attempt-guard.cjs');
const { createOneAttemptFetch } = require(guardPath);
function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), 'nudge-attempt-'));
  const policy = { endpoint: 'https://fictional.elastic.cloud/api/agent_builder/converse', agentId: 'fictional-agent', inferenceId: 'fictional-model', instructions: 'Fictional scope-only instructions', input: { approvedAgreement: { title: 'Fictional website', clauses: [{ id: 'S2', text: 'Booking is excluded.' }] }, clientRequest: 'Add booking.' }, ledgerPath: resolve(directory, 'attempt.json') };
  const body = { agent_id: policy.agentId, _execution_mode: 'local', inference_id: policy.inferenceId, access_control: { access_mode: 'private' }, configuration_overrides: { instructions: policy.instructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false }, input: JSON.stringify(policy.input) };
  const options = { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000), body: JSON.stringify(body) };
  return { directory, policy, body, options };
}
test('attempt guard rejects changed destination, method, payload and tool authority before transport', async () => {
  const { policy, options, body } = fixture(); let calls = 0;
  const fetch = createOneAttemptFetch({ ...policy, delegate: async () => { calls++; return new Response('{}'); } });
  const bad = [
    [policy.endpoint + '/extra', options], [policy.endpoint, { ...options, method: 'GET' }],
    [policy.endpoint, { ...options, body: JSON.stringify({ ...body, amountCents: 30000 }) }],
    [policy.endpoint, { ...options, body: JSON.stringify({ ...body, configuration_overrides: { ...body.configuration_overrides, tools: [{ tool_ids: ['payment'] }] } }) }],
    [policy.endpoint, { ...options, body: JSON.stringify({ ...body, inference_id: 'different-model' }) }],
    [policy.endpoint, { ...options, redirect: 'follow' }],
  ];
  for (const [url, opts] of bad) await assert.rejects(fetch(url, opts), /rejected/);
  assert.equal(calls, 0); assert.equal(existsSync(policy.ledgerPath), false);
  await fetch(policy.endpoint, options); await assert.rejects(fetch(policy.endpoint, options), /unavailable/); assert.equal(calls, 1);
});
test('transport failure consumes the slot, including a new guard after restart', async () => {
  const { policy, options } = fixture(); let calls = 0;
  const delegate = async () => { calls++; throw Error('Fictional timeout'); };
  await assert.rejects(createOneAttemptFetch({ ...policy, delegate })(policy.endpoint, options), /timeout/);
  await assert.rejects(createOneAttemptFetch({ ...policy, delegate })(policy.endpoint, options), /unavailable/);
  assert.equal(calls, 1); assert.equal(JSON.parse(readFileSync(policy.ledgerPath, 'utf8')).reserved, true);
});
test('an unwritable or unavailable ledger fails closed without transport', async () => {
  const { directory, policy, options } = fixture(); let calls = 0;
  const fetch = createOneAttemptFetch({ ...policy, ledgerPath: resolve(directory, 'missing', 'attempt.json'), delegate: async () => { calls++; return new Response('{}'); } });
  await assert.rejects(fetch(policy.endpoint, options), /unavailable/); assert.equal(calls, 0);
});
test('independent processes competing for one ledger dispatch only once', async () => {
  const { directory, policy, body } = fixture(); const config = resolve(directory, 'config.json'), dispatch = resolve(directory, 'dispatch.log');
  writeFileSync(config, JSON.stringify({ policy, body, dispatch }));
  const code = `const fs=require('node:fs');const {createOneAttemptFetch}=require(process.argv[1]);const c=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const f=createOneAttemptFetch({...c.policy,delegate:async()=>{fs.appendFileSync(c.dispatch,'sent\\n');return new Response('{}')}});f(c.policy.endpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(5000),body:JSON.stringify(c.body)}).then(()=>process.exitCode=0,e=>process.exitCode=e.message==='Review attempt unavailable'?2:3);`;
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(SystemRoot|WINDIR|TEMP|TMP|PATH|PATHEXT|COMSPEC|LOCALAPPDATA|APPDATA|USERPROFILE)$/i.test(key))), NODE_ENV: 'test' as const };
  const run = () => new Promise<number | null>((done, reject) => { const child = spawn(process.execPath, ['-e', code, guardPath, config], { env, windowsHide: true, stdio: 'ignore' }); child.once('error', reject); child.once('exit', done); });
  assert.deepEqual((await Promise.all([run(), run()])).sort(), [0, 2]); assert.equal(readFileSync(dispatch, 'utf8'), 'sent\n');
});

test('offline preloader refuses a live-transport configuration before starting application code', async () => {
  const root = resolve('data/ai-website-check'); mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(resolve(root, 'guard-test-')), config = resolve(directory, 'config.json'), ledger = resolve(directory, 'attempt.json');
  writeFileSync(config, JSON.stringify({ transport: 'live', ledgerPath: ledger }));
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(SystemRoot|WINDIR|TEMP|TMP|PATH|PATHEXT|COMSPEC|LOCALAPPDATA|APPDATA|USERPROFILE)$/i.test(key))), NODE_ENV: 'test' as const };
  const result = await new Promise<{ code: number | null; error: string }>((done, reject) => {
    const child = spawn(process.execPath, ['--require', guardPath, '-e', "process.stdout.write('application-started')"], { env: { ...env, NUDGE_OFFLINE_AI_REVIEW_CONFIG: config }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', error = ''; child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { error += chunk; });
    child.once('error', reject); child.once('exit', code => { assert.equal(output, ''); done({ code, error }); });
  });
  assert.equal(result.code, 1); assert.match(result.error, /Only offline transport is supported/); assert.equal(existsSync(ledger), false);
});
