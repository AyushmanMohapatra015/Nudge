import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createInvoice, recoverInvoice, sendInvoice } from '../lib/paypal';
import type { Agreement, Invoice, Proposal } from '../lib/domain';

test('lost create and send responses cannot cause blind duplicate operations', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/invoice-recovery-${randomUUID()}.sqlite`,
    PAYPAL_CLIENT_ID: 'test-id', PAYPAL_CLIENT_SECRET: 'test-secret', PAYPAL_MERCHANT_EMAIL: 'merchant@example.com' });
  let creates = 0, sends = 0, remoteStatus = 'DRAFT', failRead = false;
  let recoveryDetails: Record<string, any> = {};
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'test-token', expires_in: 3600 });
    if (url.endsWith('/v2/invoicing/invoices') && init?.method === 'POST') {
      creates++; throw new Error('Creation response lost');
    }
    if (url.endsWith('/INV2-RECOVER-CREATE')) {
      assert.equal(init?.method, 'GET');
      return Response.json(recoveryDetails);
    }
    if (url.endsWith('/INV2-RECOVERY/send')) {
      sends++; remoteStatus = 'SENT'; throw new Error('Send response lost');
    }
    if (url.endsWith('/INV2-RECOVERY')) {
      if (failRead) throw new Error('Status lookup unavailable');
      return Response.json({ id: 'INV2-RECOVERY', amount: { currency_code: 'USD', value: '100.00' }, status: remoteStatus, due_amount: { currency_code: 'USD', value: remoteStatus === 'PAID' ? '0.00' : '100.00' } });
    }
    throw new Error('Unexpected mocked request');
  };
  try {
    const agreement: Agreement = { title: 'Fictional website', clientName: 'Fictional buyer', clientEmail: 'buyer@example.com', amountCents: 10000,
      clauses: [{ id: 'S1', text: 'Five brochure pages.' }, { id: 'S2', text: 'Booking is excluded.' }] };
    const proposal: Proposal = { id: randomUUID(), request: 'Booking', amountCents: 10000, deliverables: ['Booking page'], status: 'accepted',
      analysis: { classification: 'additional', summary: 'Booking is explicitly excluded.', references: ['S2'], questions: [], deliverables: ['Booking page'], source: 'simulation' } };
    await assert.rejects(createInvoice(agreement, proposal), /PayPal request failed or timed out/);
    await assert.rejects(createInvoice(agreement, proposal), /unresolved outcome/);
    assert.equal(creates, 1);
    recoveryDetails = { id: 'INV2-RECOVER-CREATE', status: 'DRAFT', detail: { invoice_number: `N-${proposal.id.slice(0, 16)}`,
      currency_code: 'USD', payment_term: { due_date: '2026-11-01' } }, amount: { currency_code: 'USD', value: '100.00' },
      invoicer: { email_address: 'merchant@example.com' }, primary_recipients: [{ billing_info: { email_address: 'wrong@example.com' } }],
      items: [{ name: 'Approved additional work', description: 'Booking page', quantity: '1', unit_amount: { currency_code: 'USD', value: '100.00' } }] };
    await assert.rejects(recoverInvoice(agreement, proposal, 'INV2-RECOVER-CREATE'), /does not match/);
    recoveryDetails.primary_recipients[0].billing_info.email_address = 'buyer@example.com';
    recoveryDetails.amount.value = '99.00';
    await assert.rejects(recoverInvoice(agreement, proposal, 'INV2-RECOVER-CREATE'), /does not match/);
    recoveryDetails.amount.value = '100.00';
    recoveryDetails.detail.invoice_number = 'UNRELATED';
    await assert.rejects(recoverInvoice(agreement, proposal, 'INV2-RECOVER-CREATE'), /does not match/);
    recoveryDetails.detail.invoice_number = `N-${proposal.id.slice(0, 16)}`;
    recoveryDetails.items[0].description = 'Unapproved work';
    await assert.rejects(recoverInvoice(agreement, proposal, 'INV2-RECOVER-CREATE'), /does not match/);
    recoveryDetails.items[0].description = 'Booking page';
    assert.equal((await recoverInvoice(agreement, proposal, 'INV2-RECOVER-CREATE')).status, 'DRAFT');
    assert.equal((await createInvoice(agreement, proposal)).id, 'INV2-RECOVER-CREATE');
    assert.equal(creates, 1);
    const draft: Invoice = { id: 'INV2-RECOVERY', proposalId: proposal.id, status: 'DRAFT', amountCents: 10000, outstandingCents: 10000,
      dueDate: '2026-11-01', createdAt: new Date().toISOString(), reminders: 0 };
    await assert.rejects(sendInvoice(draft), /PayPal request failed or timed out/);
    assert.equal((await sendInvoice(draft)).status, 'UNPAID');
    assert.equal(sends, 1);
    remoteStatus = 'PAID';
    assert.equal((await sendInvoice(draft)).outstandingCents, 0);
    assert.equal(sends, 1);
    remoteStatus = 'CANCELLED';
    await assert.rejects(sendInvoice(draft), /not a sendable draft/);
    failRead = true;
    await assert.rejects(sendInvoice(draft), /PayPal request failed/);
    assert.equal(sends, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
