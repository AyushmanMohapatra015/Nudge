'use client';
import { createContext, useContext } from 'react';
import type { InvoiceChecksSummary } from '@/lib/studio-invoice-checks';
import { money } from '@/lib/domain';

export const InvoiceChecksContext = createContext<InvoiceChecksSummary | null>(null);

export function StudioInvoiceChecks() {
  const summary = useContext(InvoiceChecksContext);
  return <section className="studio-invoice-checks" aria-label="Invoice checks">
    <h2>Invoice checks</h2>
    <p className="studio-checks-scope">Complete workspace · unaffected by report filters</p>
    {summary ? <>
      <ul className="studio-checks-list">
        <li><h3>Status needs review</h3>
          <p>{summary.statusReviewCount} {summary.statusReviewCount === 1 ? 'invoice needs' : 'invoices need'} status review.</p>
          <p>Review Payments and verify status before relying on a balance or repeating an uncertain action.</p></li>
        <li><h3>Receivable due date unknown</h3>
          <p>{summary.unknownDueDateCount} {summary.unknownDueDateCount === 1 ? 'invoice has' : 'invoices have'} an unknown due date: <strong>{money(summary.unknownDueDateCents)} USD</strong> in recorded receivables.</p>
          <p>Review the invoice due date. These balances cannot be placed in an overdue-age group.</p></li>
      </ul>
      {summary.statusReviewCount === 0 && summary.unknownDueDateCount === 0 && <p>No status or due-date issues are flagged in this snapshot.</p>}
      <p className="studio-checks-note">Checks are independent; do not add their counts. Stored records do not establish current PayPal status or reminder eligibility.</p>
      <p className="studio-checks-note">Snapshot version {summary.version} · <time dateTime={summary.asOf}>{new Date(summary.asOf).toLocaleString()}</time></p>
      <a href="/">Open workspace to review Payments</a>
    </> : <p>Refresh the local snapshot to load invoice checks.</p>}
  </section>;
}
