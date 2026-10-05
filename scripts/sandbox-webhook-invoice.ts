// Explicitly authorized $1 sandbox fixture; not an additional bill for client work.
import { randomUUID } from 'node:crypto';
import { mode, read, mutate, requireIdle, log } from '../lib/store';
import { createInvoice, syncInvoice, sendInvoice } from '../lib/paypal';
import type { Proposal } from '../lib/domain';

async function main() {
  if (mode() !== 'sandbox' || !process.env.PAYPAL_WEBHOOK_ID) throw Error('Configured sandbox webhook required.');
  const fixtureId = 'webhook-test-001';
  const key = randomUUID();
  const snapshot = mutate(s => {
    requireIdle(s);
    if (s.agreement.title !== 'Sandbox integration test') throw Error('Only the integration fixture is eligible.');
    const original = s.invoices.find(i => i.id === '[historical sandbox invoice redacted]');
    if (!original || original.status !== 'PAID' || original.amountCents !== 1000 || !original.recipientEmail?.match(/^sb-[A-Za-z0-9]+@personal\.example\.com$/)) throw Error('Verified paid sandbox fixture and generated buyer required.');
    s.processing = { key, operation: 'sandboxWebhookFixture', startedAt: new Date().toISOString() };
    return structuredClone(s);
  });
  try {
    const buyer = snapshot.invoices.find(i => i.id === '[historical sandbox invoice redacted]')!.recipientEmail!;
    const proposal: Proposal = { id: fixtureId, request: 'Operator-approved sandbox webhook test', amountCents: 100, deliverables: ['Sandbox webhook test only. USD 1.00 simulated money. No real goods or services.'], status: 'accepted', analysis: { classification: 'additional', summary: 'Explicitly authorized test fixture; no AI analysis was performed.', references: [], questions: [], deliverables: ['Sandbox webhook test only'], source: 'simulation' } };
    let invoice = snapshot.invoices.find(i => i.proposalId === fixtureId);
    if (!invoice) invoice = await createInvoice({ ...snapshot.agreement, title: 'SANDBOX ONLY - webhook verification', clientEmail: buyer }, proposal);
    if (invoice.amountCents !== 100 || !invoice.id.startsWith('INV2-')) throw Error('Unexpected invoice; send refused.');
    invoice = { ...await syncInvoice(invoice), recipientEmail: buyer };
    mutate(s => {
      if (s.processing?.key !== key) throw Error('Fixture lock changed.');
      if (!s.invoices.some(i => i.id === invoice!.id)) {
        s.invoices.push(invoice!);
        log(s, 'Operator', 'Authorized sandbox webhook fixture', 'Separate USD 1.00 test invoice; operator plays both approval roles. No real client work or AI inference.', fixtureId);
      }
    });
    if (invoice.status === 'DRAFT') await sendInvoice(invoice);
    invoice = await syncInvoice(invoice);
    mutate(s => {
      if (s.processing?.key !== key) throw Error('Fixture lock changed.');
      s.invoices = s.invoices.map(i => i.id === invoice!.id ? invoice! : i);
      delete s.processing;
      log(s, 'Operator', 'Sandbox webhook fixture ready', `${invoice!.id}: ${invoice!.status}. Test money only.`, fixtureId);
    });
    console.log(JSON.stringify({ invoiceId: invoice.id, amount: '1.00', environment: 'sandbox', status: invoice.status, paymentUrl: invoice.payUrl }));
  } catch (error) {
    mutate(s => { if (s.processing?.key === key) delete s.processing; });
    throw error;
  }
}
main().catch(() => { console.error('Sandbox fixture stopped. Reconcile the existing fixture and uncertain outcomes before retrying; no replacement is authorized.'); process.exitCode = 1; });
