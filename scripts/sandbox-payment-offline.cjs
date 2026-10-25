// Stub-only preloader. No real fetch is retained and no environment file is read here.
const fs = require('node:fs');
const path = require('node:path');
const { openSession } = require('./sandbox-rehearsal-controller.cjs');
const { bindPaymentChild, armDeadline } = require('./sandbox-payment-child.cjs');
const session = openSession(process.env.NUDGE_PAYMENT_SESSION), state = session.snapshot();
if (state.fixture.agreement.clientEmail !== 'sb-fictional@personal.example.com' || state.fixture.merchantEmail !== 'fictional-merchant@business.example.com' ||
    process.env.PAYPAL_CLIENT_ID !== 'fictional-paypal-id' || process.env.PAYPAL_CLIENT_SECRET !== 'fictional-paypal-no-access') throw Error('Only disposable fictional payment settings allowed');
const remotePath = path.join(session.directory, 'offline-remote.json');
if (fs.lstatSync(remotePath).isSymbolicLink()) throw Error('Invalid fictional remote path');
const binding = bindPaymentChild(process.env, async (url, options) => {
  const remote = JSON.parse(fs.readFileSync(remotePath, 'utf8'));
  if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'fictional-no-access', expires_in: 3600 });
  if (url.endsWith('/v2/invoicing/invoices') && options.method === 'POST') {
    remote.created = true; fs.writeFileSync(remotePath, JSON.stringify(remote)); return Response.json({ id: 'INV2-FICTIONAL-CONTINUATION' });
  }
  if (url.endsWith('/send')) { remote.sent = true; fs.writeFileSync(remotePath, JSON.stringify(remote)); return new Response(null, { status: 202 }); }
  if (!remote.created) throw Error('Fictional invoice not created');
  return Response.json({ id: 'INV2-FICTIONAL-CONTINUATION', status: remote.paid ? 'PAID' : remote.sent ? 'SENT' : 'DRAFT', amount: { currency_code: 'USD', value: '300.00' }, due_amount: { currency_code: 'USD', value: remote.paid ? '0.00' : '300.00' }, detail: { metadata: { recipient_view_url: 'https://www.sandbox.paypal.com/invoice/p/fictional-not-payable' } } });
});
globalThis.fetch = binding.fetch;
armDeadline(binding.expiresAt);
