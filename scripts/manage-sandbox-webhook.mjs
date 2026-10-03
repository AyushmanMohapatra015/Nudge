// Sandbox-only webhook setup/replay. Never prints credentials or event payloads.
import { readFileSync, writeFileSync } from 'node:fs';
const base = 'https://api-m.sandbox.paypal.com';
const [command, argument] = process.argv.slice(2);
if (process.env.NUDGE_MODE !== 'sandbox') throw Error('Sandbox mode required.');
const response = await fetch(`${base}/v1/oauth2/token`, {
  method: 'POST', headers: { authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=client_credentials', signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw Error(`Sandbox authentication failed (${response.status}).`);
const { access_token } = await response.json();
async function api(path, method = 'GET', body) {
  const result = await fetch(base + path, { method, headers: { authorization: `Bearer ${access_token}`, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000) });
  if (!result.ok) throw Error(`Sandbox webhook request failed (${result.status}).`);
  const text = await result.text();
  return text ? JSON.parse(text) : {};
}
if (command === 'register') {
  const url = new URL(argument);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.trycloudflare.com') || url.pathname !== '/api/paypal/webhook' || url.search || url.username || url.password) throw Error('Expected the approved temporary HTTPS webhook-only URL.');
  const existing = await api('/v1/notifications/webhooks');
  let hook = existing.webhooks?.find(h => h.url === url.href);
  if (!hook) hook = await api('/v1/notifications/webhooks', 'POST', { url: url.href, event_types: ['INVOICING.INVOICE.PAID', 'INVOICING.INVOICE.CANCELLED', 'INVOICING.INVOICE.REFUNDED', 'INVOICING.INVOICE.UPDATED', 'INVOICING.INVOICE.SENT'].map(name => ({ name })) });
  if (!hook.id || !/^[A-Za-z0-9-]+$/.test(hook.id)) throw Error('Unexpected webhook ID.');
  const env = readFileSync('.env.local', 'utf8');
  const line = `PAYPAL_WEBHOOK_ID=${hook.id}`;
  writeFileSync('.env.local', /^PAYPAL_WEBHOOK_ID=.*$/m.test(env) ? env.replace(/^PAYPAL_WEBHOOK_ID=.*$/m, line) : `${env}\n${line}\n`);
  writeFileSync('data/sandbox-webhook-registration.json', JSON.stringify({ id: hook.id, url: hook.url }, null, 2));
  console.log('Sandbox webhook registered; local configuration updated. Restart the app before delivery testing.');
} else if (command === 'events') {
  const data = await api('/v1/notifications/webhooks-events?page_size=100');
  const events = data.events?.filter(e => e.event_type.startsWith('INVOICING.INVOICE.') && (e.resource?.id === argument || e.resource?.invoice?.id === argument)) || [];
  console.log(JSON.stringify(events.map(e => ({ id: e.id, type: e.event_type, invoiceId: e.resource?.invoice?.id || e.resource?.id }))));
} else if (command === 'resend') {
  if (!argument || !/^[A-Za-z0-9-]+$/.test(argument) || !process.env.PAYPAL_WEBHOOK_ID) throw Error('Event ID and configured webhook required.');
  await api(`/v1/notifications/webhooks-events/${argument}/resend`, 'POST', { webhook_ids: [process.env.PAYPAL_WEBHOOK_ID] });
  console.log('Requested authentic sandbox event redelivery; local audit confirmation is still required.');
} else if (command === 'cleanup') {
  const registration = JSON.parse(readFileSync('data/sandbox-webhook-registration.json', 'utf8'));
  if (registration.id !== process.env.PAYPAL_WEBHOOK_ID) throw Error('Registration mismatch; cleanup refused.');
  const hook = await api(`/v1/notifications/webhooks/${registration.id}`);
  if (hook.url !== registration.url) throw Error('Remote registration changed; cleanup refused.');
  await api(`/v1/notifications/webhooks/${registration.id}`, 'DELETE');
  const env = readFileSync('.env.local', 'utf8');
  writeFileSync('.env.local', env.replace(/^PAYPAL_WEBHOOK_ID=.*$/m, 'PAYPAL_WEBHOOK_ID='));
  console.log('Temporary sandbox webhook removed; restart the app to reload configuration.');
} else throw Error('Use register, events, resend, or cleanup.');
