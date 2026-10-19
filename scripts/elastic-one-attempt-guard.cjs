// Operator test helper, not an application-wide usage/billing limit.
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve, sep } = require('node:path');
const { isDeepStrictEqual } = require('node:util');

function createOneAttemptFetch({ endpoint, agentId, inferenceId, instructions, input, ledgerPath, delegate }) {
  if (typeof delegate !== 'function' || !require('node:path').isAbsolute(ledgerPath)) throw Error('Invalid attempt guard configuration');
  const expected = {
    agent_id: agentId, _execution_mode: 'local', inference_id: inferenceId,
    access_control: { access_mode: 'private' },
    configuration_overrides: { instructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false },
    input: JSON.stringify(input),
  };
  return async function guardedFetch(url, options = {}) {
    let body;
    try { body = JSON.parse(options.body); } catch { throw Error('Review request rejected'); }
    if (typeof url !== 'string' || url !== endpoint || options.method !== 'POST' || options.redirect !== 'error' ||
        !isDeepStrictEqual(body, expected) || !options.signal || options.signal.aborted) throw Error('Review request rejected');
    // Exclusive creation shares the budget across workers/restarts and consumes it
    // BEFORE transport. Errors/timeouts are never grounds to replenish the slot.
    try { writeFileSync(ledgerPath, JSON.stringify({ reserved: true, at: new Date().toISOString() }), { flag: 'wx' }); }
    catch { throw Error('Review attempt unavailable'); }
    return delegate(url, options);
  };
}
module.exports = { createOneAttemptFetch };

if (process.env.NUDGE_OFFLINE_AI_REVIEW_CONFIG) {
  const root = resolve(__dirname, '../data/ai-website-check');
  const configPath = resolve(process.env.NUDGE_OFFLINE_AI_REVIEW_CONFIG);
  if (!configPath.startsWith(root + sep)) throw Error('Disposable offline config required');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (config.transport !== 'stub' || !resolve(config.ledgerPath).startsWith(root + sep)) throw Error('Only offline transport is supported');
  // Deliberately never retain/delegate to the real fetch in this preloader.
  globalThis.fetch = createOneAttemptFetch({ ...config, delegate: async () => new Response(JSON.stringify(config.response), { status: 200, headers: { 'content-type': 'application/json' } }) });
}
