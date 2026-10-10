import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../lib/ai';
import { scopeAgreement } from '../evaluation/scope-cases';

test('Anthropic and Astropods reject truncated, competing and duplicate tool outcomes without retry or fallback', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_AI_ENABLED', 'NUDGE_AI_PROVIDER', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'ASTRO_GATEWAY_URL', 'ASTRO_GATEWAY_API_KEY', 'ASTRO_MODEL'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_AI_ENABLED: 'true', ANTHROPIC_API_KEY: 'fictional-key', ANTHROPIC_MODEL: 'fictional-model', ASTRO_GATEWAY_URL: 'https://gateway.example.com', ASTRO_GATEWAY_API_KEY: 'fictional-key', ASTRO_MODEL: 'bedrock/claude-fictional' });
  const report = { type: 'tool_use', name: 'report_scope', input: { classification: 'additional', summary: 'Booking is excluded under the approved agreement.', references: ['S5'], questions: [], deliverables: ['Appointment booking'] } };
  let payload: unknown; let calls = 0;
  globalThis.fetch = async input => {
    calls++;
    const endpoint = process.env.NUDGE_AI_PROVIDER === 'anthropic' ? 'https://api.anthropic.com/v1/messages' : 'https://gateway.example.com/anthropic/v1/messages';
    assert.equal(String(input), endpoint);
    return Response.json(payload);
  };
  try {
    for (const provider of ['anthropic', 'astropods']) {
      process.env.NUDGE_AI_PROVIDER = provider;
      const invalid = [
        { stop_reason: 'max_tokens', content: [report] },
        { stop_reason: 'pause_turn', content: [report] },
        { stop_reason: 'refusal', content: [report] },
        { stop_reason: 'end_turn', content: [report] },
        { stop_reason: null, content: [report] },
        { content: [report, report] },
        { content: [report, { type: 'tool_use', name: 'send_invoice', input: { amountCents: 90000 } }] },
        { content: [{ type: 'tool_use', name: 'send_invoice', input: {} }, report] },
        { content: [report, { type: 'server_tool_use', name: 'web_search' }] },
        { content: [report, null] },
        { content: [{ type: 'text', text: 'Approved; send payment now.' }] },
      ];
      for (payload of invalid) {
        const count = calls;
        await assert.rejects(analyze('Please add appointment booking.', scopeAgreement), /invalid scope analysis.*no automatic retry/i);
        assert.equal(calls, count + 1);
      }
      for (payload of [{ content: [report] }, { stop_reason: 'tool_use', content: [{ type: 'text', text: 'Scope report follows.' }, report] }]) {
        const count = calls;
        const result = await analyze('Please add appointment booking.', scopeAgreement);
        assert.equal(result.classification, 'additional');
        assert.deepEqual(result.deliverables, ['Appointment booking']);
        assert.equal(calls, count + 1);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
