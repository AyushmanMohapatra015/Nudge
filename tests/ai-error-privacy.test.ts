import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../lib/ai';
import { extractBrief } from '../lib/brief-extraction';
import type { Agreement } from '../lib/domain';

test('Anthropic and Astropods hide URL, transport, JSON and schema details without retries', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_AI_ENABLED', 'NUDGE_AI_PROVIDER', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'ASTRO_GATEWAY_URL', 'ASTRO_GATEWAY_API_KEY', 'ASTRO_MODEL'];
  const before = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const privateText = 'private-client@example.com secret-token private-notes';
  const agreement: Agreement = { title: 'Fictional site', clientName: 'Fictional buyer', clientEmail: 'fictional@example.com', amountCents: 10000, clauses: [{ id: 'S1', text: 'Two pages included.' }, { id: 'S2', text: 'Booking excluded.' }] };
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_AI_ENABLED: 'true', ANTHROPIC_API_KEY: 'fictional-key', ANTHROPIC_MODEL: 'fictional-model', ASTRO_GATEWAY_URL: 'https://gateway.example.com', ASTRO_GATEWAY_API_KEY: 'fictional-key', ASTRO_MODEL: 'bedrock/claude-fictional' });
  let response: () => Response;
  let calls = 0;
  globalThis.fetch = async (_, init) => { calls++; assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store'); return response(); };
  const expectFailure = async (expected: RegExp) => {
    const count = calls;
    await assert.rejects(analyze('Please add booking.', agreement), error => error instanceof Error && expected.test(error.message) && !error.message.includes(privateText));
    assert.equal(calls, count + 1);
  };
  try {
    for (const provider of ['anthropic', 'astropods']) {
      process.env.NUDGE_AI_PROVIDER = provider;
      response = () => { throw Error(privateText); };
      await expectFailure(/failed or timed out/);
      response = () => new Response(`{"private":"${privateText}",`);
      await expectFailure(/invalid scope analysis/);
      response = () => Response.json({ content: [{ type: 'tool_use', name: 'report_scope', input: { classification: privateText } }] });
      await expectFailure(/invalid scope analysis/);
      response = () => Response.json({ message: privateText }, { status: 429 });
      await expectFailure(/failed \(429\)/);
    }
    process.env.NUDGE_AI_PROVIDER = 'astropods';
    process.env.ASTRO_GATEWAY_URL = privateText;
    const count = calls;
    await assert.rejects(analyze('Please add booking.', agreement), error => error instanceof Error && /valid HTTPS/.test(error.message) && !error.message.includes(privateText));
    assert.equal(calls, count);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});

test('brief extraction hides transport and validation detail while preserving one-attempt behavior', async () => {
  const privateText = 'private-client@example.com secret-token private-notes';
  let calls = 0;
  const options = { provider: 'fictional', model: 'fictional' };
  await assert.rejects(extractBrief('Fictional notes', { ...options, transport: async () => { calls++; throw Error(privateText); } }), error => error instanceof Error && /Check provider access/.test(error.message) && !error.message.includes(privateText));
  assert.equal(calls, 1);
  await assert.rejects(extractBrief('Fictional notes', { ...options, transport: async () => { calls++; return { status: 'complete', output: { currency: privateText } }; } }), error => error instanceof Error && /schema or evidence/.test(error.message) && !error.message.includes(privateText));
  assert.equal(calls, 2);
});
