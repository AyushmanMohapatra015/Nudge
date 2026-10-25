// Verification only: one OAuth request and one exact-invoice GET, each reserved before dispatch.
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const { openSession } = require('./sandbox-rehearsal-controller.cjs');
function paidReadOnlyFetch({ session, transport, expiresAt, now = Date.now }) {
  const initial = session.snapshot(), base = 'https://api-m.sandbox.paypal.com';
  if (typeof transport !== 'function' || initial.phase !== 'closed' || initial.attempts.create !== 1 || initial.attempts.send !== 1 ||
      !/^INV2-[A-Z0-9-]+$/.test(initial.invoiceId || '') || !Number.isSafeInteger(expiresAt) || expiresAt <= now() || expiresAt > now() + 180000) throw Error('Read-only verification boundary rejected');
  return async (url, options = {}) => {
    if (now() >= expiresAt || !isDeepStrictEqual(session.snapshot(), initial) || options.redirect !== 'error' || !options.signal || options.signal.aborted) throw Error('Read-only verification boundary rejected');
    let kind;
    if (url === base + '/v1/oauth2/token' && options.method === 'POST' && options.body === 'grant_type=client_credentials') kind = 'auth';
    else if (url === base + '/v2/invoicing/invoices/' + initial.invoiceId && options.method === 'GET' && options.body === undefined) kind = 'detail';
    else throw Error('Only authentication and the linked invoice GET are allowed');
    // Exclusive creation prevents a repeat from another worker/restart, including lost responses.
    fs.writeFileSync(path.join(session.directory, 'paid-verify-' + kind + '.attempt'), JSON.stringify({ kind, reservedAt: new Date(now()).toISOString() }), { flag: 'wx', mode: 0o600 });
    const response = await transport(url, options), receipt = { kind, httpStatus: response.status };
    if (!response.ok || kind === 'auth') {
      fs.writeFileSync(path.join(session.directory, 'paid-verify-' + kind + '-http.json'), JSON.stringify(receipt), { flag: 'wx', mode: 0o600 }); return response;
    }
    const reader = response.body?.getReader(); if (!reader) throw Error('Missing invoice detail body');
    const chunks = []; let bytes = 0;
    for (;;) { const p = await reader.read(); if (p.done) break; bytes += p.value.byteLength; if (bytes > 131072) { await reader.cancel(); throw Error('Invoice detail exceeds verification bound'); } chunks.push(p.value); }
    const buffer = Buffer.concat(chunks), remote = JSON.parse(buffer.toString('utf8'));
    receipt.invoiceIdentityMatched = remote.id === initial.invoiceId;
    if (!receipt.invoiceIdentityMatched) throw Error('Invoice identity mismatch');
    receipt.remoteStatus = typeof remote.status === 'string' ? remote.status.slice(0, 30) : 'unknown';
    fs.writeFileSync(path.join(session.directory, 'paid-verify-detail-http.json'), JSON.stringify(receipt), { flag: 'wx', mode: 0o600 });
    return new Response(buffer, { status: response.status, headers: { 'content-type': 'application/json' } });
  };
}
module.exports = { paidReadOnlyFetch };
if (process.env.NUDGE_PAID_VERIFICATION_RUN) {
  const env = process.env, session = openSession(env.NUDGE_PAID_VERIFICATION_RUN), s = session.snapshot(), expiresAt = Number(env.NUDGE_PAID_VERIFY_UNTIL);
  if (env.NUDGE_MODE !== 'sandbox' || env.NUDGE_AI_ENABLED !== 'false' || env.NUDGE_DB_PATH !== path.join(session.directory, 'fictional.sqlite') ||
      !env.NUDGE_ADMIN_TOKEN || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || env.PAYPAL_MERCHANT_EMAIL !== s.fixture.merchantEmail ||
      Object.keys(env).some(k => /^(ELASTIC_|ANTHROPIC_|OPENAI_)/.test(k) && env[k]) || env.NUDGE_PAYMENT_SESSION || env.NUDGE_REHEARSAL_LIVE_SESSION) throw Error('Read-only child environment rejected');
  globalThis.fetch = paidReadOnlyFetch({ session, transport: globalThis.fetch.bind(globalThis), expiresAt });
  setTimeout(() => process.exit(0), Math.max(1, expiresAt - Date.now())).unref();
}
