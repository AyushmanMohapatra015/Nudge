import type { Agreement, Invoice, Proposal } from './domain';
import { utcDate } from './domain';
import { cacheOperation, cachedOperation, mode } from './store';
import { createHash } from 'node:crypto';
const base = 'https://api-m.sandbox.paypal.com';
let cachedToken: { token: string; expires: number } | undefined;
async function token() {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.token;
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Set PayPal sandbox client ID and secret in .env.local.');
  const response = await fetch(`${base}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`PayPal authentication failed (${response.status}). Check sandbox credentials.`);
  const data = await response.json(); cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 }; return cachedToken.token;
}
export async function paypal(path: string, method = 'GET', body?: unknown, key?: string): Promise<Record<string, any>> {
  const response = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${await token()}`, 'content-type': 'application/json', Prefer: 'return=representation', ...(key ? { 'PayPal-Request-Id': createHash('sha256').update(key).digest('hex').slice(0, 32) } : {}) }, ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000), cache: 'no-store' });
  const text = await response.text(); const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const details = data.details?.map((d: { field?: string; issue?: string; description?: string }) => [d.field, d.issue, d.description].filter(Boolean).join(': ')).join('; ');
    throw new Error(`PayPal ${data.name || response.status}: ${details || data.message || 'Request failed'}. Reference: ${data.debug_id || 'unavailable'}`);
  }
  return data;
}
export async function createInvoice(agreement: Agreement, proposal: Proposal): Promise<Invoice> {
  const key = `invoice-${proposal.id}`;
  const saved = cachedOperation<Invoice>(key); if (saved) return saved;
  const dueDate = utcDate(new Date(Date.now() + 7 * 86400000));
  const originalProject = proposal.id.startsWith('base-');
  let id = `SIM-${proposal.id.slice(0, 8)}`, payUrl: string | undefined;
  if (mode() === 'sandbox') {
    if (!process.env.PAYPAL_MERCHANT_EMAIL) throw new Error('PAYPAL_MERCHANT_EMAIL is required.');
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(process.env.PAYPAL_MERCHANT_EMAIL)) throw new Error('PAYPAL_MERCHANT_EMAIL must contain only the sandbox business email, without a dashboard URL, account ID, or extra text.');
    const attemptKey = `attempt-${key}`;
    if (cachedOperation(attemptKey)) throw new Error('An earlier invoice creation has an unresolved outcome. Inspect the PayPal sandbox invoice list before retrying; automatic recreation is blocked.');
    // A lost creation response must not trigger another POST merely because no ID was saved.
    cacheOperation(attemptKey, { startedAt: new Date().toISOString(), invoiceNumber: `N-${proposal.id.slice(0, 16)}` });
    const data = await paypal('/v2/invoicing/invoices', 'POST', { detail: { invoice_number: `N-${proposal.id.slice(0, 16)}`, currency_code: 'USD', note: `${originalProject ? 'Approved project' : 'Approved change to'} ${agreement.title}. ${proposal.deliverables.join('; ')}`.slice(0, 4000), payment_term: { term_type: 'DUE_ON_DATE_SPECIFIED', due_date: dueDate } }, invoicer: { email_address: process.env.PAYPAL_MERCHANT_EMAIL }, primary_recipients: [{ billing_info: { email_address: agreement.clientEmail } }], items: [{ name: originalProject ? 'Approved project work' : 'Approved additional work', description: proposal.deliverables.join('; ').slice(0, 1000), quantity: '1', unit_amount: { currency_code: 'USD', value: (proposal.amountCents / 100).toFixed(2) } }], configuration: { allow_tip: false } }, key);
    const selfLink = data.href || data.links?.find((l: { rel: string }) => l.rel === 'self')?.href;
    id = data.id || selfLink?.split('/').pop();
    if (!id || !/^INV2-[A-Z0-9-]+$/.test(id)) throw new Error('PayPal invoice ID missing from response. Inspect the sandbox invoice list before retrying.');
    // Persist the returned identity before any follow-up GET can fail.
    cacheOperation(key, { id, proposalId: proposal.id, status: 'DRAFT', amountCents: proposal.amountCents, outstandingCents: proposal.amountCents, createdAt: new Date().toISOString(), dueDate, reminders: 0 });
    const detail = await paypal(`/v2/invoicing/invoices/${id}`);
    payUrl = detail.detail?.metadata?.recipient_view_url;
  }
  const invoice: Invoice = { id, proposalId: proposal.id, status: 'DRAFT', amountCents: proposal.amountCents, outstandingCents: proposal.amountCents, payUrl, createdAt: new Date().toISOString(), dueDate, reminders: 0 };
  cacheOperation(key, invoice); return invoice;
}
export async function sendInvoice(invoice: Invoice): Promise<Invoice> {
  if (mode() === 'demo') return { ...invoice, status: 'UNPAID' };
  // Recover a previous successful send before considering another notification.
  const current = await syncInvoice(invoice);
  if (['UNPAID', 'PARTIALLY_PAID', 'PAID'].includes(current.status)) return current;
  if (current.status !== 'DRAFT') throw new Error('PayPal invoice is not a sendable draft. Reconcile its status before proceeding.');
  await paypal(`/v2/invoicing/invoices/${invoice.id}/send`, 'POST', { send_to_recipient: true, send_to_invoicer: true }, `send-${invoice.id}`);
  return { ...current, status: 'UNPAID', remoteStatus: 'SENT' };
}
export function reconcileInvoice(invoice: Invoice, remote: Record<string, any>): Invoice {
  const status = ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'].includes(remote.status) ? remote.status as Invoice['status'] : remote.status === 'SENT' || remote.status === 'SCHEDULED' ? 'UNPAID' : 'OTHER';
  const rawOutstanding = remote.due_amount?.value;
  const outstandingCents = status === 'PAID' || status === 'CANCELLED' ? 0 : typeof rawOutstanding === 'string' && /^\d+(\.\d{1,2})?$/.test(rawOutstanding) ? Math.round(Number(rawOutstanding) * 100) : invoice.outstandingCents;
  return { ...invoice, status, remoteStatus: remote.status, outstandingCents, payUrl: remote.detail?.metadata?.recipient_view_url || invoice.payUrl };
}
export async function syncInvoice(invoice: Invoice) { return mode() === 'demo' ? invoice : reconcileInvoice(invoice, await paypal(`/v2/invoicing/invoices/${invoice.id}`)); }
export async function verifyWebhook(headers: Headers, event: unknown, rawBody?: string) {
  if (!process.env.PAYPAL_WEBHOOK_ID) throw new Error('PAYPAL_WEBHOOK_ID is required for verification.');
  const required = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'];
  if (required.some(h => !headers.get(h))) return false;
  const metadata = { auth_algo: headers.get(required[0]), cert_url: headers.get(required[1]), transmission_id: headers.get(required[2]), transmission_sig: headers.get(required[3]), transmission_time: headers.get(required[4]), webhook_id: process.env.PAYPAL_WEBHOOK_ID };
  // Preserve the signed event bytes: validation/parsing must not reorder or reformat them.
  const body = rawBody === undefined ? { ...metadata, webhook_event: event } : `${JSON.stringify(metadata).slice(0, -1)},"webhook_event":${rawBody}}`;
  const result = await paypal('/v1/notifications/verify-webhook-signature', 'POST', body);
  return result.verification_status === 'SUCCESS';
}
