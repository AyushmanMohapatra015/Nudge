// Recovery tool restricted to the explicitly authorized, unsent $10 sandbox fixture.
// It changes the invoice payer, not the already accepted project scope or price.
import { randomUUID } from 'node:crypto';
import { read, mutate, requireIdle, log, mode } from '../lib/store';
import { paypal, reconcileInvoice } from '../lib/paypal';

async function main() {
  const buyer = process.argv[2];
  if (mode() !== 'sandbox' || !buyer || !/^sb-[A-Za-z0-9]+@personal\.example\.com$/.test(buyer)) throw new Error('Supply the generated personal sandbox email in sandbox mode.');
  if (buyer === process.env.PAYPAL_MERCHANT_EMAIL) throw new Error('Buyer must be separate from the merchant.');
  const key = randomUUID();
  const snapshot = mutate(s => {
    requireIdle(s);
    if (s.agreement.title !== 'Sandbox integration test' || s.agreement.amountCents !== 1000 || s.proposals.length || s.invoices.length !== 1) throw new Error('Recovery is restricted to the single $10 integration fixture. Nothing changed.');
    const invoice = s.invoices[0];
    if (invoice.proposalId !== 'base' || invoice.amountCents !== 1000 || !/^INV2-[A-Z0-9-]+$/.test(invoice.id)) throw new Error('Unexpected test invoice. Nothing changed.');
    s.processing = { key, operation: 'sandboxRecipientCorrection', startedAt: new Date().toISOString() };
    return structuredClone(s);
  });
  try {
    const invoice = snapshot.invoices[0];
    const remote = await paypal(`/v2/invoicing/invoices/${invoice.id}`);
    if (remote.status !== 'DRAFT' || remote.amount?.currency_code !== 'USD' || Number(remote.amount?.value) !== 10 || remote.items?.length !== 1) throw new Error('PayPal invoice must still be an unsent $10 USD draft. No update attempted.');
    if (remote.primary_recipients?.[0]?.billing_info?.email_address !== buyer) {
      const detail: Record<string, unknown> = {};
      for (const field of ['currency_code', 'invoice_number', 'invoice_date', 'note', 'terms_and_conditions', 'payment_term', 'reference', 'memo']) if (remote.detail[field] !== undefined) detail[field] = remote.detail[field];
      await paypal(`/v2/invoicing/invoices/${invoice.id}?send_to_recipient=false&send_to_invoicer=false`, 'PUT', { detail, invoicer: remote.invoicer, primary_recipients: [{ billing_info: { email_address: buyer } }], items: remote.items, configuration: { allow_tip: false } }, `recipient-${invoice.id}-${buyer}`);
    }
    const checked = await paypal(`/v2/invoicing/invoices/${invoice.id}`);
    if (checked.primary_recipients?.[0]?.billing_info?.email_address !== buyer || checked.status !== 'DRAFT' || Number(checked.amount?.value) !== 10 || checked.amount?.currency_code !== 'USD') throw new Error('Updated invoice could not be verified. No send attempted.');
    mutate(s => {
      s.invoices[0] = { ...reconcileInvoice(s.invoices[0], checked), recipientEmail: buyer };
      s.processing = undefined; s.integrationError = undefined;
      log(s, 'Operator · sandbox test', 'Test invoice payer corrected', `The unsent $10 invoice ${invoice.id} now uses the new personal sandbox buyer. Approved scope and price were preserved. No invoice update notification was sent.`, key);
    });
    console.log(JSON.stringify({ invoiceId: invoice.id, status: 'DRAFT', amount: '10.00', environment: 'sandbox', recipientVerified: true, duplicateInvoiceCreated: false }));
  } catch (error) {
    mutate(s => { if (s.processing?.key === key) { s.processing = undefined; log(s, 'System', 'Test recipient correction did not finish', 'Reconcile the PayPal draft before repeating a correction.', key); } });
    throw error;
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Sandbox recovery failed.'); process.exitCode = 1; });
