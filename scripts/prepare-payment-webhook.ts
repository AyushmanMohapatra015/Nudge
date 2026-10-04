// Operator-only USD 1 sandbox fixture. Creates a draft; sending and buyer payment stay separate.
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { mode, mutate, mutateOwned, read, requireIdle, log } from '../lib/store';
import { processingOwner } from '../lib/processing';
import { createInvoice, syncInvoice } from '../lib/paypal';
import type { Proposal } from '../lib/domain';

export async function preparePaymentWebhookFixture(confirmed: boolean) {
  if (!confirmed) throw Error('Explicit USD 1 sandbox fixture confirmation required.');
  if (mode() !== 'sandbox' || !process.env.PAYPAL_WEBHOOK_ID) throw Error('Active sandbox webhook registration required before creating the fixture.');
  const fixtureId = 'webhook-payment-002';
  const key = randomUUID();
  const snapshot = mutate(s => {
    requireIdle(s);
    const original = s.invoices.find(i => i.id === '[historical sandbox invoice redacted]');
    if (s.agreement.title !== 'Sandbox integration test' || !original || original.status !== 'PAID' || original.amountCents !== 1000 || !/^sb-[A-Za-z0-9]+@personal\.example\.com$/.test(original.recipientEmail || '')) throw Error('Existing verified sandbox fixture and generated sandbox buyer required.');
    if (s.invoices.some(i => i.proposalId === fixtureId)) throw Error('Fresh-payment fixture already exists. Use that invoice; creation is blocked.');
    s.processing = { key, operation: 'preparePaymentWebhookFixture', startedAt: new Date().toISOString(), owner: processingOwner() };
    return structuredClone(s);
  });
  try {
    const buyer = snapshot.invoices.find(i => i.id === '[historical sandbox invoice redacted]')!.recipientEmail!;
    const proposal: Proposal = { id: fixtureId, request: 'Operator-confirmed fresh sandbox payment webhook test', amountCents: 100, deliverables: ['USD 1.00 sandbox test money only; no real work or goods.'], status: 'accepted', acceptedAt: new Date().toISOString(), analysis: { classification: 'additional', summary: 'Synthetic test fixture. Operator acts as both approvers; no AI analysis or real client acceptance is claimed.', references: [], questions: [], deliverables: ['USD 1.00 sandbox test money only; no real work or goods.'], source: 'simulation' } };
    const invoice = await createInvoice({ ...snapshot.agreement, title: 'SANDBOX ONLY - fresh payment webhook test', clientEmail: buyer }, proposal);
    if (invoice.amountCents !== 100 || !/^INV2-[A-Z0-9-]+$/.test(invoice.id) || invoice.status !== 'DRAFT') throw Error('Unexpected fixture result; review cached sandbox invoice identity before any further action.');
    // Persist the returned identity before the extra authoritative validation request.
    mutateOwned(key, s => {
      s.proposals.push(proposal);
      s.invoices.push({ ...invoice, recipientEmail: buyer });
      log(s, 'Operator', 'Fresh sandbox payment fixture drafted', 'USD 1.00 test money only. Synthetic approval by operator; sending and buyer payment have not been performed.', fixtureId);
    });
    const reconciled = await syncInvoice({ ...invoice, recipientEmail: buyer });
    mutateOwned(key, s => { s.invoices = s.invoices.map(i => i.id === invoice.id ? reconciled : i); delete s.processing; });
    return { invoiceId: invoice.id, status: reconciled.status, amountCents: 100, environment: 'sandbox', sentByScript: false, paidByScript: false };
  } catch (error) {
    if (read().processing?.key === key) mutateOwned(key, s => { delete s.processing; });
    throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  preparePaymentWebhookFixture(process.argv.length === 3 && process.argv[2] === '--confirm-sandbox-fixture')
    .then(result => console.log(JSON.stringify(result)))
    .catch(() => { console.error('Fixture preparation failed. No send or payment was attempted. Inspect existing fixture/cached identity before retrying; never share raw credentials or provider payloads.'); process.exitCode = 1; });
}
