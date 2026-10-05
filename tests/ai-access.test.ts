import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { analyze } from '../lib/ai';
import { GET, POST } from '../app/api/workspace/route';
import { read, mutate } from '../lib/store';
import { sessionToken } from '../lib/auth';

test('configured credentials cannot consume AI allowance without a server enable flag; browser payloads cannot bypass the hold', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_AI_ENABLED', 'NUDGE_AI_PROVIDER', 'NUDGE_ADMIN_TOKEN', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'ASTRO_GATEWAY_URL', 'ASTRO_GATEWAY_API_KEY', 'ASTRO_MODEL', 'ELASTIC_KIBANA_URL', 'ELASTIC_API_KEY', 'ELASTIC_AGENT_ID'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]])), originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/ai-access-${randomUUID()}.sqlite`, NUDGE_ADMIN_TOKEN: 'fictional-owner-secret-long-enough', ANTHROPIC_API_KEY: 'mock-key', ANTHROPIC_MODEL: 'mock-model', ASTRO_GATEWAY_URL: 'https://gateway.example.com', ASTRO_GATEWAY_API_KEY: 'mock-gateway-key', ASTRO_MODEL: 'bedrock/claude-haiku-4-5' });
  let calls = 0;
  Object.assign(process.env, { ELASTIC_KIBANA_URL: 'https://scope.elastic.cloud', ELASTIC_API_KEY: 'mock-key', ELASTIC_AGENT_ID: 'nudge-scope' });
  globalThis.fetch = async () => { calls++; throw new Error('Network forbidden'); };
  const request = (body?: unknown) => new NextRequest('http://localhost:3000/api/workspace', { method: body ? 'POST' : 'GET', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', cookie: `nudge_session=${sessionToken()}`, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    mutate(s => { s.agreementStatus = 'accepted'; });
    const original = read();
    for (const provider of ['anthropic', 'astropods', 'elastic']) {
      process.env.NUDGE_AI_PROVIDER = provider;
      for (const value of [undefined, 'false', '1', 'TRUE', ' true ']) {
        if (value === undefined) delete process.env.NUDGE_AI_ENABLED; else process.env.NUDGE_AI_ENABLED = value;
        await assert.rejects(analyze('Add appointment booking.', original.agreement), /AI calls are paused/);
      }
    }
    const response = await POST(request({ type: 'analyze', request: 'Add appointment booking.', aiEnabled: true, NUDGE_AI_ENABLED: 'true' }));
    assert.equal(response.status, 400); assert.match((await response.json()).error, /AI calls are paused/);
    assert.deepEqual(read(), original, 'paused call must not create a lock, audit success or proposal');
    const view = await (await GET(request())).json();
    assert.equal(view.connections.ai, true, 'credentials can be configured while usage is paused');
    assert.equal(view.aiEnabled, false);
    assert.equal(view.aiProviderLabel, 'Elastic Agent Builder');
    process.env.NUDGE_AI_PROVIDER = 'private-invalid-provider-value';
    const invalidView = await (await GET(request())).json();
    assert.equal(invalidView.aiProviderLabel, 'Unrecognized AI provider');
    assert.equal(JSON.stringify(invalidView).includes('private-invalid-provider-value'), false);
    assert.equal(calls, 0);
    process.env.NUDGE_MODE = 'demo';
    assert.equal((await analyze('Add appointment booking.', original.agreement)).source, 'simulation');
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
