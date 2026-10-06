// Preloaded only into disposable Postman workflow build/server processes.
// Covers Nudge's fetch-based providers, not an operating-system network sandbox.
const { appendFileSync } = require('node:fs');
const { resolve } = require('node:path');
globalThis.fetch = async () => {
  if (process.env.NUDGE_POSTMAN_RUN_DIR) appendFileSync(resolve(process.env.NUDGE_POSTMAN_RUN_DIR, 'blocked-fetch.log'), 'blocked\n');
  throw new Error('Provider fetch disabled in isolated workflow.');
};
