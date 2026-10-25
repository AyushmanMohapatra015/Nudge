// Explicit child binding only. Importing does not load credentials, start a process or retain fetch.
const path = require('node:path');
const { openSession } = require('./sandbox-rehearsal-controller.cjs');
function bindPaymentChild(env, transport, now = Date.now) {
  if (typeof transport !== 'function') throw Error('Explicit payment transport required');
  const directory = env.NUDGE_PAYMENT_SESSION, id = env.NUDGE_PAYMENT_GRANT;
  const session = openSession(directory, now), state = session.snapshot();
  session.environment(env, {}, id); // Validates the current permission and merchant.
  if (env.NUDGE_MODE !== 'sandbox' || env.NUDGE_AI_ENABLED !== 'false' ||
      env.NUDGE_DB_PATH !== path.join(session.directory, 'fictional.sqlite') || env.NUDGE_ADMIN_TOKEN !== state.ownerToken ||
      !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET ||
      Object.keys(env).some(k => /^(ELASTIC_|ANTHROPIC_|OPENAI_)/.test(k) && env[k]) ||
      env.NUDGE_REHEARSAL_LIVE_SESSION || env.NUDGE_REHEARSAL_OFFLINE_SESSION || env.NUDGE_LOCAL_REVIEW_SOURCE) throw Error('Payment child environment rejected');
  return { expiresAt: state.paymentContinuation.expiresAt,
    fetch: (url, options) => openSession(directory, now).paymentFetch(transport, id)(url, options) };
}
function armDeadline(expiresAt, { now = Date.now, schedule = setTimeout, stop = () => process.exit(0) } = {}) {
  const delay = expiresAt - now();
  if (!Number.isSafeInteger(expiresAt) || delay <= 0 || delay > 600000) throw Error('Invalid payment child deadline');
  const timer = schedule(stop, delay); timer.unref?.(); return timer;
}
module.exports = { bindPaymentChild, armDeadline };
