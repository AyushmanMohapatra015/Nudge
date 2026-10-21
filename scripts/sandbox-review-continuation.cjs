// Local decisions only. Never renews a provider grant, attempt budget or manifest deadline.
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { openSession } = require('./sandbox-rehearsal-controller.cjs');
const reject = () => { throw Error('Provider-free review boundary rejected.'); };
const osName = /^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i;
function eligible(session, now) {
  const s = session.snapshot();
  if (s.phase !== 'review' || now < s.expiresAt || s.approval || s.invoiceId ||
      s.attempts.ai !== 1 || ['oauth', 'create', 'send', 'read'].some(k => s.attempts[k] !== 0)) reject();
  return s;
}
function environment(session, os = {}, now = Date.now()) {
  if (!Number.isSafeInteger(now)) reject();
  eligible(session, now);
  return {
    ...Object.fromEntries(Object.entries(os).filter(([key]) => osName.test(key))),
    NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NUDGE_MODE: 'sandbox',
    NUDGE_DB_PATH: path.join(session.directory, 'fictional.sqlite'),
    NUDGE_ADMIN_TOKEN: randomUUID() + randomUUID(), NUDGE_AI_PROVIDER: 'elastic', NUDGE_AI_ENABLED: 'false',
    NUDGE_LOCAL_REVIEW_SOURCE: session.directory,
    NUDGE_LOCAL_REVIEW_DEADLINE: String(now + 600000),
  };
}
function validate(session, env, now = Date.now()) {
  eligible(session, now);
  const deadline = Number(env.NUDGE_LOCAL_REVIEW_DEADLINE);
  if (!Number.isSafeInteger(deadline) || deadline <= now || deadline > now + 600000 ||
      env.NUDGE_LOCAL_REVIEW_SOURCE !== session.directory || env.NUDGE_DB_PATH !== path.join(session.directory, 'fictional.sqlite') ||
      env.NUDGE_MODE !== 'sandbox' || env.NUDGE_AI_ENABLED !== 'false' ||
      typeof env.NUDGE_ADMIN_TOKEN !== 'string' || !/^[a-f0-9-]{72}$/.test(env.NUDGE_ADMIN_TOKEN) ||
      Object.keys(env).some(k => /^(ELASTIC_|PAYPAL_|ANTHROPIC_|OPENAI_)/.test(k) && env[k]) ||
      env.NUDGE_REHEARSAL_LIVE_SESSION) reject();
}
async function denyProviderFetch() { reject(); }
module.exports = { environment, validate, denyProviderFetch };
if (process.env.NUDGE_LOCAL_REVIEW_SOURCE) {
  const session = openSession(process.env.NUDGE_LOCAL_REVIEW_SOURCE);
  validate(session, process.env);
  // No original fetch is retained or delegated, including loopback requests made by the app.
  globalThis.fetch = denyProviderFetch;
}
