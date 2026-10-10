import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sandboxReferenceInvoiceId } from '../scripts/sandbox-fixture-config';
import { preparePaymentWebhookFixture } from '../scripts/prepare-payment-webhook';
import { sandboxWebhookInvoiceFixture } from '../scripts/sandbox-webhook-invoice';
import { mutate, read } from '../lib/store';

test('sandbox fixture reference requires a bounded explicit identifier and hides invalid values', () => {
  for (const value of ['', 'https://private.example/invoice', 'INV2-lowercase', ' INV2-FICTIONAL', 'INV2-FICTIONAL\nprivate', 'INV2-' + 'A'.repeat(100), 'INV2-']) {
    assert.throws(() => sandboxReferenceInvoiceId(value), error => error instanceof Error && /Configure NUDGE_SANDBOX_REFERENCE_INVOICE_ID/.test(error.message) && (!value || !error.message.includes(value)));
  }
  assert.equal(sandboxReferenceInvoiceId('INV2-FICTIONAL-REFERENCE'), 'INV2-FICTIONAL-REFERENCE');
});

test('both operator helpers refuse absent, mismatched or ineligible references without guessing, locking or network calls', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_SANDBOX_REFERENCE_INVOICE_ID', 'PAYPAL_WEBHOOK_ID'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]])), fetchBefore = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/fixture-reference-${randomUUID()}.sqlite`, PAYPAL_WEBHOOK_ID: 'mock-registration' });
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Network forbidden'); };
  const helpers = [preparePaymentWebhookFixture, sandboxWebhookInvoiceFixture];
  try {
    mutate(s => {
      s.agreement.title = 'Sandbox integration test';
      s.invoices = [{ id: 'INV2-FICTIONAL-REFERENCE', proposalId: 'base', status: 'PAID', amountCents: 1000, outstandingCents: 0, recipientEmail: 'sb-fictional@personal.example.com', createdAt: '2026-10-04', dueDate: '2026-10-11', reminders: 0 }];
    });
    const original = read();
    for (const helper of helpers) {
      const baseline = read();
      await assert.rejects(helper(false), /confirmation/);
      for (const value of [undefined, '', 'https://private.example/invoice']) {
        if (value === undefined) delete process.env.NUDGE_SANDBOX_REFERENCE_INVOICE_ID; else process.env.NUDGE_SANDBOX_REFERENCE_INVOICE_ID = value;
        await assert.rejects(helper(true), /Configure NUDGE_SANDBOX_REFERENCE_INVOICE_ID/);
        assert.deepEqual(read(), baseline);
      }
      process.env.NUDGE_SANDBOX_REFERENCE_INVOICE_ID = 'INV2-FICTIONAL-OTHER';
      await assert.rejects(helper(true), /verified|Verified/);
      assert.deepEqual(read(), baseline);
      process.env.NUDGE_SANDBOX_REFERENCE_INVOICE_ID = 'INV2-FICTIONAL-REFERENCE';
      for (const change of [
        { status: 'UNPAID' as const }, { amountCents: 900 }, { recipientEmail: 'ordinary-fictional@example.com' },
      ]) {
        mutate(s => { s.invoices[0] = { ...original.invoices[0], ...change }; });
        const invalid = read();
        await assert.rejects(helper(true), /verified|Verified/);
        assert.deepEqual(read(), invalid);
      }
      mutate(s => { s.invoices = original.invoices; });
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = fetchBefore;
    for (const n of names) { if (before[n] === undefined) delete process.env[n]; else process.env[n] = before[n]; }
  }
});
