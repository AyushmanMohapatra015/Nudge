import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSandboxConnectivity } from '../scripts/paypal-connectivity.mjs';

test('connectivity helper hides private errors and performs only bounded sandbox auth/list requests', async () => {
  const config = { clientId: 'fictional-client', clientSecret: 'fictional-secret', merchantEmail: 'merchant@example.com' };
  const privateText = 'private-buyer@example.com secret-token';
  let requests: string[] = [];
  let auth: () => Response = () => Response.json({ access_token: 'fictional-token' });
  let invoices: () => Response = () => Response.json({ privateText });
  const forward: typeof fetch = async (request, init) => {
    const input = String(request);
    assert.ok(init);
    assert.ok(input.startsWith('https://api-m.sandbox.paypal.com/'));
    assert.equal(init.redirect, 'error');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal);
    requests.push(input);
    if (input.endsWith('/oauth2/token')) { assert.equal(init.method, 'POST'); assert.equal(init.body, 'grant_type=client_credentials'); return auth(); }
    assert.equal(init.method, 'GET');
    return invoices();
  };
  assert.equal((await checkSandboxConnectivity(config, forward)).success, true);
  assert.equal(requests.length, 2);
  for (const failure of [() => { throw Error(privateText); }, () => new Response(`{"secret":"${privateText}",`), () => Response.json({ message: privateText }, { status: 401 }), () => Response.json({ access_token: { secret: privateText } })]) {
    auth = failure; requests = [];
    const result = await checkSandboxConnectivity(config, forward);
    assert.equal(result.success, false);
    assert.equal(JSON.stringify(result).includes(privateText), false);
    assert.equal(requests.length, 1);
  }
  auth = () => Response.json({ access_token: 'fictional-token' });
  invoices = () => { throw Error(privateText); };
  requests = [];
  assert.equal((await checkSandboxConnectivity(config, forward)).success, false);
  assert.equal(requests.length, 2);
  requests = [];
  assert.equal((await checkSandboxConnectivity({ ...config, merchantEmail: 'not-an-email' }, forward)).success, false);
  assert.equal(requests.length, 0);
});

test('webhook helper catches private transport errors without registration, files or retries', async () => {
  const originalFetch = globalThis.fetch, originalError = console.error, originalArgs = process.argv;
  const previousMode = process.env.NUDGE_MODE, previousExit = process.exitCode;
  const previousId = process.env.PAYPAL_CLIENT_ID, previousSecret = process.env.PAYPAL_CLIENT_SECRET;
  const messages: string[] = [];
  let calls = 0;
  process.env.NUDGE_MODE = 'sandbox';
  process.env.PAYPAL_CLIENT_ID = 'fictional-client'; process.env.PAYPAL_CLIENT_SECRET = 'fictional-secret';
  process.argv = ['node', 'manage-sandbox-webhook.mjs', 'events', 'INV2-FICTIONAL'];
  console.error = value => { messages.push(String(value)); };
  globalThis.fetch = async () => { calls++; throw Error('private-buyer@example.com secret-token'); };
  try {
    // CLI imported in this isolated test process; fetch never reaches the network.
    await import('../scripts/manage-sandbox-webhook.mjs');
    assert.equal(calls, 1);
    assert.equal(process.exitCode, 1);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /earlier remote action may have completed/);
    assert.doesNotMatch(messages[0], /private-buyer|secret-token/);
  } finally {
    globalThis.fetch = originalFetch; console.error = originalError; process.argv = originalArgs; process.exitCode = previousExit;
    if (previousMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = previousMode;
    if (previousId === undefined) delete process.env.PAYPAL_CLIENT_ID; else process.env.PAYPAL_CLIENT_ID = previousId;
    if (previousSecret === undefined) delete process.env.PAYPAL_CLIENT_SECRET; else process.env.PAYPAL_CLIENT_SECRET = previousSecret;
  }
});
