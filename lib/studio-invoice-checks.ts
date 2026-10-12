import type { OwnerAnalytics } from './owner-analytics';

export function invoiceChecksSummary(snapshot: OwnerAnalytics) {
  return {
    version: snapshot.version, asOf: snapshot.asOf,
    statusReviewCount: snapshot.totals.statusReviewCount,
    unknownDueDateCount: snapshot.invoices.filter(row => row.ageBucket === 'unknown').length,
    unknownDueDateCents: snapshot.totals.unknownDueDateCents,
  };
}
export type InvoiceChecksSummary = ReturnType<typeof invoiceChecksSummary>;
