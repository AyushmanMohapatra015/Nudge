// Read-only sandbox verification. Never creates/sends invoices or writes workspace state.
import { paypal, reconcileInvoice } from '../lib/paypal';
import type { Invoice } from '../lib/domain';

async function main() {
  const [id, centsText, expectedStatus] = process.argv.slice(2);
  if (!id || !/^INV2-[A-Z0-9-]+$/.test(id) || !centsText || !/^[1-9]\d*$/.test(centsText)) throw new Error('Usage: supply a sandbox invoice ID, approved total in integer cents, and optional expected status.');
  const amountCents = Number(centsText);
  if (!Number.isSafeInteger(amountCents) || amountCents < 100 || amountCents > 10000000) throw new Error('Approved total must be between 100 and 10000000 cents.');
  if (expectedStatus && !['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OTHER'].includes(expectedStatus)) throw new Error('Unsupported expected status.');
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) throw new Error('Sandbox credentials are required; never put them in command arguments.');
  let remote: Record<string, any>;
  try { remote = await paypal(`/v2/invoicing/invoices/${id}`); }
  catch { throw new Error('Sandbox invoice lookup failed. No invoice or workspace was changed; check connectivity and sandbox app access.'); }
  const fixture: Invoice = { id, proposalId: 'read-only-verification', amountCents, outstandingCents: amountCents, status: 'UNPAID', createdAt: '2026-10-04T00:00:00.000Z', dueDate: '2026-10-04', reminders: 0 };
  const result = reconcileInvoice(fixture, remote);
  if (expectedStatus && result.status !== expectedStatus) throw new Error('Reconciled status differs from the expected fixture status. No workspace was changed.');
  console.log(JSON.stringify({ environment: 'sandbox', invoiceId: id, approvedTotalCents: amountCents, status: result.status, outstandingCents: result.outstandingCents, integrityCheck: 'PASS', workspaceChanged: false }, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Read-only sandbox verification failed.'); process.exitCode = 1; });
