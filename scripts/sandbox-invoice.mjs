// Run only for the explicitly authorized $10 integration fixture, not real client work.
// The operator plays both approval roles for this sandbox test. No buyer password is read.
const buyer = process.argv[2];
const origin = 'http://127.0.0.1:3000';
let cookie = '';
async function call(path, body) {
  const response = await fetch(`${origin}${path}`, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', origin, ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(90000) });
  if (path === '/api/session' && response.ok) cookie = response.headers.get('set-cookie')?.split(';')[0] || '';
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(`Local endpoint ${path} returned ${response.status} instead of JSON. No further step was attempted.`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Local request failed (${response.status}).`);
  return data;
}
try {
  if (process.env.NUDGE_MODE !== 'sandbox') throw new Error('Sandbox mode is required.');
  if (!buyer || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer)) throw new Error('Supply the personal sandbox buyer email as the argument.');
  if (buyer.toLowerCase() === process.env.PAYPAL_MERCHANT_EMAIL?.toLowerCase()) throw new Error('Buyer and merchant must be different sandbox accounts.');
  await call('/api/session', { token: process.env.NUDGE_ADMIN_TOKEN });
  let state = await call('/api/workspace');
  if (state.mode !== 'sandbox' || state.processing) throw new Error('Workspace must be idle and in sandbox mode.');
  const title = 'Sandbox integration test';
  if (state.agreementStatus === 'draft' && !state.invoices.length && !state.proposals.length) {
    state = await call('/api/workspace', { type: 'saveAgreement', agreement: { title, clientName: 'Sandbox buyer', clientEmail: buyer, amountCents: 1000, clauses: [{ id: 'S1', text: 'One sandbox integration test invoice for USD 10.00; no real service is purchased.' }, { id: 'S2', text: 'This fixture uses PayPal sandbox test money only. The operator plays both approval roles for testing.' }] } });
  }
  const verifiedPayer = state.invoices.find(i => i.proposalId === 'base')?.recipientEmail;
  if (state.agreement.title !== title || state.agreement.amountCents !== 1000 || (state.agreement.clientEmail !== buyer && verifiedPayer !== buyer)) throw new Error('Existing workspace is not this $10 integration fixture. Left it unchanged.');
  if (state.agreementStatus === 'draft') state = await call('/api/workspace', { type: 'approveAgreement' });
  if (state.agreementStatus === 'approved') { await call(`/api/client/${state.clientToken}`, { type: 'acceptAgreement' }); state = await call('/api/workspace'); }
  let invoice = state.invoices.find(i => i.proposalId === 'base');
  if (!invoice) { state = await call('/api/workspace', { type: 'createInvoice', id: 'base' }); invoice = state.invoices.find(i => i.proposalId === 'base'); }
  if (!invoice || !invoice.id.startsWith('INV2-') || invoice.amountCents !== 1000) throw new Error('Unexpected invoice. No send was attempted.');
  // Reconcile before sending, including retries after an interrupted send.
  state = await call('/api/workspace', { type: 'syncInvoice', id: invoice.id }); invoice = state.invoices.find(i => i.id === invoice.id);
  if (invoice.status === 'DRAFT') { state = await call('/api/workspace', { type: 'sendInvoice', id: invoice.id }); invoice = state.invoices.find(i => i.id === invoice.id); }
  console.log(JSON.stringify({ invoiceId: invoice.id, amount: '10.00', currency: 'USD', status: invoice.status, paymentUrl: invoice.payUrl || null, environment: 'sandbox', buyerPaymentCompleted: invoice.status === 'PAID' }, null, 2));
} catch { console.error('Sandbox test stopped. Check local configuration and reconcile the existing invoice before retrying; prior actions may have completed.'); process.exitCode = 1; }
