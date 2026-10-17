import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { isolatedWorkflowEnv, verifyWorkflowCollection, runWorkflowCollection } from '../scripts/postman-workflow-runner.mjs';

const collection = () => JSON.parse(readFileSync('postman/nudge-workflow.postman_collection.json', 'utf8'));
test('workflow rejects changed scripts/destinations and non-loopback origins before any request', () => {
  const original = collection(); verifyWorkflowCollection(original); let calls = 0;
  const newman = { run() { calls++; } };
  for (const origin of ['https://external.example', 'http://localhost:3200', 'http://127.0.0.1:3200/path', 'http://key@127.0.0.1:3200', 'http://127.0.0.1:3200?key=x']) assert.throws(() => runWorkflowCollection(newman, original, origin, resolve('data')), /loopback/);
  for (const change of ['url', 'script']) {
    const c = structuredClone(original);
    if (change === 'url') c.item[0].request.url = 'https://external.example';
    else c.item[0].event[0].script.exec.push('pm.sendRequest("https://external.example");');
    assert.throws(() => runWorkflowCollection(newman, c, 'http://127.0.0.1:3200', resolve('data')), /Review/);
  }
  assert.equal(calls, 0); assert.ok(original.variable.every((v: { value: string }) => v.value === ''));
});
test('workflow retains fail-stop/no-export bounds, blocks other destinations and sanitizes failures', async () => {
  const c = collection(); let fail = false, wrongCount = false, incomplete = false;
  const newman = { run(options: any, callback: (error: unknown, summary: unknown) => void) {
    assert.equal(options.iterationCount, 1); assert.equal(options.abortOnFailure, true); assert.equal(options.abortOnError, true);
    assert.deepEqual(options.bail, ['failure']); assert.deepEqual(options.reporters, []); assert.equal(options.ignoreRedirects, true);
    assert.equal(options.insecureFileRead, false); assert.equal(options.timeout, 90000); assert.equal(options.timeoutRequest, 10000);
    assert.deepEqual(options.envVar, [{ key: 'base_url', value: 'http://127.0.0.1:3200' }]);
    assert.throws(() => options.requestAgents.http.createConnection({ host: 'external.example', port: 3200 }), /blocked/);
    assert.throws(() => options.requestAgents.http.createConnection({ host: '127.0.0.1', port: 3000 }), /blocked/);
    assert.throws(() => options.requestAgents.https.createConnection({}), /blocked/);
    const expected: number[] = c.item.map((item: any) => Number(item.event[0].script.exec[0].match(/HTTP (\d{3})/)[1]));
    callback(fail ? Error('secret-looking-error') : null, { run: { executions: (fail ? [500] : incomplete ? expected.slice(0, -1) : expected).map(code => ({ response: { code, body: 'private-response' } })), failures: fail ? [{ message: 'secret-looking-error', cursor: { position: 0 } }] : [], stats: { assertions: { total: fail ? 1 : wrongCount ? 50 : 77, failed: fail ? 1 : 0 } } } });
  } };
  const result = await runWorkflowCollection(newman, c, 'http://127.0.0.1:3200', resolve('data'));
  assert.equal(result.success, true); assert.equal(result.requests.length, 47);
  wrongCount = true;
  assert.equal((await runWorkflowCollection(newman, c, 'http://127.0.0.1:3200', resolve('data'))).success, false);
  wrongCount = false; incomplete = true;
  assert.equal((await runWorkflowCollection(newman, c, 'http://127.0.0.1:3200', resolve('data'))).success, false);
  incomplete = false;
  fail = true;
  const failed = await runWorkflowCollection(newman, c, 'http://127.0.0.1:3200', resolve('data'));
  assert.equal(failed.success, false); assert.deepEqual(failed.failedSteps, [1]);
  assert.equal(JSON.stringify(failed).includes('secret-looking'), false); assert.equal(JSON.stringify(failed).includes('private-response'), false);
});
test('disposable workflow strips inherited credentials and blocks provider fetches before transport', () => {
  const dir = resolve('data/postman-workflow', 'guard-test-' + randomUUID()); mkdirSync(dir, { recursive: true });
  const env = isolatedWorkflowEnv({ ...process.env, PAYPAL_CLIENT_SECRET: 'fictional-secret', elastic_api_key: 'fictional-key', NUDGE_DB_PATH: './data/nudge.sqlite', NUDGE_AI_ENABLED: 'true', HTTP_PROXY: 'http://external.example', NODE_OPTIONS: '--inspect' }, process.cwd(), dir);
  assert.equal(env.PAYPAL_CLIENT_SECRET, undefined); assert.equal(env.elastic_api_key, undefined); assert.equal(env.HTTP_PROXY, undefined);
  assert.equal(env.NUDGE_MODE, 'demo'); assert.equal(env.NUDGE_AI_ENABLED, 'false'); assert.equal(env.NUDGE_DB_PATH, resolve(dir, 'workflow.sqlite'));
  assert.throws(() => isolatedWorkflowEnv({}, process.cwd(), resolve('data/nudge.sqlite')), /Disposable/);
  const child = spawnSync(process.execPath, ['-e', "Promise.allSettled([fetch('https://external.example'),fetch('http://127.0.0.1:9')]).then(r=>console.log(r.every(x=>x.status==='rejected'&&x.reason.message==='Provider fetch disabled in isolated workflow.')))"], { env, encoding: 'utf8', timeout: 10000 });
  assert.equal(child.status, 0, child.stderr); assert.equal(child.stdout.trim(), 'true');
  assert.equal(readFileSync(resolve(dir, 'blocked-fetch.log'), 'utf8'), 'blocked\nblocked\n');
});
