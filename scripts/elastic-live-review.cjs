// Explicit operator-only verification transport. No automatic retries.
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve, sep } = require('node:path');
const { createOneAttemptFetch } = require('./elastic-one-attempt-guard.cjs');

function observedTransport(delegate, save) {
  return async (url, options) => {
    const receipt = { attempted: true, httpStatus: null, inputTokens: null, outputTokens: null, status: 'unknown', cost: 'unknown' };
    try {
      const response = await delegate(url, options);
      receipt.httpStatus = response.status;
      if (!response.body) return response;
      const reader = response.body.getReader(), parts = []; let bytes = 0;
      for (;;) {
        const part = await reader.read(); if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > 131072) { await reader.cancel(); throw Error('Review response exceeded limit'); }
        parts.push(part.value);
      }
      const buffer = Buffer.concat(parts);
      try {
        const data = JSON.parse(buffer.toString('utf8'));
        const count = n => Number.isSafeInteger(n) && n >= 0 ? n : null;
        receipt.inputTokens = count(data.model_usage?.input_tokens);
        receipt.outputTokens = count(data.model_usage?.output_tokens);
        receipt.status = ['completed', 'failed', 'awaiting_prompt'].includes(data.status) ? data.status : 'unknown';
      } catch { /* Never save raw responses, provider errors, IDs or reasoning. */ }
      return new Response(buffer, { status: response.status, headers: { 'content-type': 'application/json' } });
    } finally { save(receipt); }
  };
}
module.exports = { observedTransport };

if (process.env.NUDGE_LIVE_AI_REVIEW_CONFIG) {
  const root = resolve(__dirname, '../data/ai-website-check');
  const configPath = resolve(process.env.NUDGE_LIVE_AI_REVIEW_CONFIG);
  if (!configPath.startsWith(root + sep)) throw Error('Disposable live configuration required');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (config.transport !== 'live-once' || !resolve(config.ledgerPath).startsWith(root + sep) ||
      !resolve(config.usagePath).startsWith(root + sep)) throw Error('Invalid review configuration');
  const destination = new URL(config.endpoint);
  if (destination.protocol !== 'https:' || destination.username || destination.password || destination.port || destination.search || destination.hash ||
      !['.elastic.cloud', '.elastic-cloud.com', '.cloud.es.io'].some(s => destination.hostname.endsWith(s)) ||
      !/^\/(?:s\/[a-zA-Z0-9_-]+\/)?api\/agent_builder\/converse$/.test(destination.pathname)) throw Error('Invalid review destination');
  const original = globalThis.fetch.bind(globalThis);
  globalThis.fetch = createOneAttemptFetch({ ...config, delegate: observedTransport(original,
    receipt => writeFileSync(config.usagePath, JSON.stringify(receipt, null, 2), { flag: 'wx' })) });
}
