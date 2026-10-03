import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createInvoice, sendInvoice } from '../lib/paypal';
import type { Agreement, Invoice, Proposal } from '../lib/domain';

test('lost create and send responses cannot cause blind duplicate operations', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/invoice-recovery-${randomUUID()}.sqlite`,
    PAYPAL_CLIENT_ID: 'test-id', PAYPAL_CLIENT_SECRET: 'test-secret', PAYPAL_MERCHANT_EMAIL: 'merchant@example.com' });
  let creates = 0, sends = 0, remoteStatus = 'DRAFT', failRead = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'test-token', expires_in: 3600 });
    if (url.endsWith('/v2/invoicing/invoices') && init?.method === 'POST') {
      creates++; throw new Error('Creation response lost');
    }
    if (url.endsWith('/INV2-RECOVERY/send')) {
      sends++; remoteStatus = 'SENT'; throw new Error('Send response lost');
    }
    if (url.endsWith('/INV2-RECOVERY')) {
      if (failRead) throw new Error('Status lookup unavailable');
      return Response.json({ status: remoteStatus, due_amount: { value: '100.00' } });
    }
    throw new Error('Unexpected mocked request');
  };
  try {
    const agreement: Agreement = { title: 'Fictional website', clientName: 'Fictional buyer', clientEmail: 'buyer@example.com', amountCents: 10000,
      clauses: [{ id: 'S1', text: 'Five brochure pages.' }, { id: 'S2', text: 'Booking is excluded.' }] };
    const proposal: Proposal = { id: randomUUID(), request: 'Booking', amountCents: 10000, deliverables: ['Booking page'], status: 'accepted',
      analysis: { classification: 'additional', summary: 'Booking is explicitly excluded.', references: ['S2'], questions: [], deliverables: ['Booking page'], source: 'simulation' } };
    await assert.rejects(createInvoice(agreement, proposal), /response lost/);
    await assert.rejects(createInvoice(agreement, proposal), /unresolved outcome/);
    assert.equal(creates, 1);
    const draft: Invoice = { id: 'INV2-RECOVERY', proposalId: proposal.id, status: 'DRAFT', amountCents: 10000, outstandingCents: 10000,
      dueDate: '2026-11-01', createdAt: new Date().toISOString(), reminders: 0 };
    await assert.rejects(sendInvoice(draft), /Send response lost/);
    assert.equal((await sendInvoice(draft)).status, 'UNPAID');
    assert.equal(sends, 1);
    remoteStatus = 'PAID';
    assert.equal((await sendInvoice(draft)).outstandingCents, 0);
    assert.equal(sends, 1);
    remoteStatus = 'CANCELLED';
    await assert.rejects(sendInvoice(draft), /not a sendable draft/);
    failRead = true;
    await assert.rejects(sendInvoice(draft), /lookup unavailable/);
    assert.equal(sends, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
