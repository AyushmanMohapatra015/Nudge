import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../lib/ai';
import type { Agreement } from '../lib/domain';

test('Astropods uses its documented auth and tool format, rejects bad citations and never hides failure', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_AI_PROVIDER', 'ASTRO_GATEWAY_URL', 'ASTRO_GATEWAY_API_KEY', 'ASTRO_MODEL'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_AI_PROVIDER: 'astropods', ASTRO_GATEWAY_URL: 'https://gateway.example.com', ASTRO_GATEWAY_API_KEY: 'test-key', ASTRO_MODEL: 'bedrock/claude-haiku-4-5' });
  const agreement: Agreement = { title: 'Example website', clientName: 'Fictional client', clientEmail: 'fictional@example.com', amountCents: 10000, clauses: [{ id: 'S1', text: 'Five marketing pages included.' }, { id: 'S2', text: 'Booking systems excluded.' }] };
  let reference = 'S2';
  let status = 200;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://gateway.example.com/anthropic/v1/messages');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('x-bf-vk'), 'test-key');
    assert.equal(headers.get('x-api-key'), null);
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.model, 'bedrock/claude-haiku-4-5');
    assert.deepEqual(payload.tool_choice, { type: 'tool', name: 'report_scope' });
    return Response.json({ content: [{ type: 'tool_use', name: 'report_scope', input: { classification: 'additional', summary: 'Booking systems are excluded under the approved agreement.', references: [reference], questions: [], deliverables: ['Booking integration'] } }] }, { status });
  };
  try {
    assert.equal((await analyze('Please add a booking system.', agreement)).classification, 'additional');
    reference = 'S99';
    await assert.rejects(analyze('Please add a booking system.', agreement), /does not exist/);
    status = 429;
    await assert.rejects(analyze('Please add a booking system.', agreement), /AI request failed/);
    process.env.ASTRO_GATEWAY_URL = 'http://gateway.example.com';
    await assert.rejects(analyze('Please add a booking system.', agreement), /HTTPS/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
