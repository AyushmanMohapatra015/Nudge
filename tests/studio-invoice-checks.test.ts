import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownerAnalytics } from '../lib/owner-analytics';
import { invoiceChecksSummary } from '../lib/studio-invoice-checks';
import { invoiceChecksFixture, checksNow } from './fixtures/invoice-checks';
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('invoice checks separate unknown statuses, inconsistent balances and receivable-only invalid dates without exposing records', () => {
  const workspace = invoiceChecksFixture();
  const snapshot = ownerAnalytics(workspace, checksNow), before = structuredClone(snapshot);
  assert.deepEqual(invoiceChecksSummary(snapshot), { version: 7, asOf: checksNow.toISOString(), statusReviewCount: 4,
    unknownDueDateCount: 2, unknownDueDateCents: 579 });
  assert.equal(snapshot.totals.outstandingCents, 20579);
  assert.equal(snapshot.totals.overdueCents, 10000);
  assert.deepEqual(snapshot, before);
  assert.equal(JSON.stringify(invoiceChecksSummary(snapshot)).includes('fictional'), false);
});

test('empty and corrected snapshots clear only these checks, preserving independent balances', () => {
  const workspace = invoiceChecksFixture(); workspace.invoices = [];
  assert.deepEqual(invoiceChecksSummary(ownerAnalytics(workspace, checksNow)), { version: 7, asOf: checksNow.toISOString(),
    statusReviewCount: 0, unknownDueDateCount: 0, unknownDueDateCents: 0 });
  workspace.invoices = invoiceChecksFixture().invoices.slice(-2);
  const snapshot = ownerAnalytics(workspace, checksNow);
  assert.equal(snapshot.totals.outstandingCents, 20000);
  assert.equal(invoiceChecksSummary(snapshot).unknownDueDateCount, 0);
  assert.equal(invoiceChecksSummary(snapshot).statusReviewCount, 0);
});

test('widget missing context asks for refresh rather than displaying reassuring zeros; singular checks keep scope limits', async () => {
  const dir = resolve('data', `invoice-check-render-${randomUUID()}`); mkdirSync(dir);
  const outfile = resolve(dir, 'widget.mjs');
  await build({ entryPoints: ['components/studio-invoice-checks.tsx'], outfile, bundle: true, platform: 'node',
    format: 'esm', packages: 'external', jsx: 'automatic', logLevel: 'silent' });
  const { StudioInvoiceChecks, InvoiceChecksContext } = await import(pathToFileURL(outfile).href);
  const missing = renderToStaticMarkup(createElement(StudioInvoiceChecks));
  assert.ok(missing.includes('Refresh the local snapshot to load invoice checks.'));
  assert.ok(!missing.includes('$0.00') && !missing.includes('No status or due-date issues'));
  const summary = { version: 8, asOf: checksNow.toISOString(), statusReviewCount: 1, unknownDueDateCount: 1, unknownDueDateCents: 1 };
  const singular = renderToStaticMarkup(createElement(InvoiceChecksContext.Provider, { value: summary }, createElement(StudioInvoiceChecks)));
  assert.ok(singular.includes('1 invoice needs') && singular.includes('1 invoice has'));
  assert.ok(singular.includes('$0.01') && singular.includes('unaffected by report filters'));
  assert.ok(singular.includes('do not establish current PayPal status or reminder eligibility'));
});
