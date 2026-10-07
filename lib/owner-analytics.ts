import type { InvoiceStatus, Proposal, Workspace } from './domain';

export type AgeBucket = 'not-overdue' | '1-30' | '31-60' | '61-90' | '91+' | 'unknown' | 'not-receivable';
export type OwnerAnalytics = {
  version: number;
  mode: Workspace['mode'];
  asOf: string;
  currency: 'USD';
  invoices: {
    recordIndex: number;
    status: InvoiceStatus;
    amountCents: number;
    outstandingCents: number;
    receivableCents: number;
    dueDate: string | null;
    overdueDays: number | null;
    ageBucket: AgeBucket;
    needsStatusReview: boolean;
  }[];
  changes: { recordIndex: number; status: Proposal['status']; approvedCents: number; awaitingAcceptance: boolean }[];
  totals: {
    outstandingCents: number;
    overdueCents: number;
    unknownDueDateCents: number;
    approvedExtraCents: number;
    awaitingAcceptanceCents: number;
    awaitingAcceptanceCount: number;
    statusReviewCount: number;
  };
};

const failure = () => new Error('Analytics records require review before totals can be displayed.');
function cents(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw failure();
  return value;
}
function sum(values: number[]) {
  return values.reduce((total, value) => cents(total + value), 0);
}
function day(value: string): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value ? parsed : null;
}
function unique(ids: string[]) {
  if (new Set(ids).size !== ids.length) throw failure();
}

/** Pure projection for a future authenticated owner surface. Does not read storage,
 * reconcile payments, authorize actions, or establish freshness with PayPal.
 * recordIndex is meaningful only in this workspace version; it is not an action ID.
 */
export function ownerAnalytics(workspace: Workspace, now = new Date()): OwnerAnalytics {
  if (!Number.isFinite(now.getTime())) throw failure();
  const asOf = now.toISOString();
  const today = day(asOf.slice(0, 10));
  if (today === null || !Number.isSafeInteger(workspace.version) || workspace.version < 0
    || !['demo', 'sandbox'].includes(workspace.mode)) throw failure();
  unique(workspace.invoices.map(invoice => invoice.id));
  unique(workspace.proposals.map(proposal => proposal.id));

  const invoices: OwnerAnalytics['invoices'] = workspace.invoices.map((invoice, recordIndex) => {
    if (!['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OTHER'].includes(invoice.status)) throw failure();
    const amountCents = cents(invoice.amountCents);
    const outstandingCents = cents(invoice.outstandingCents);
    if (outstandingCents > amountCents) throw failure();
    const receivable = ['UNPAID', 'PARTIALLY_PAID'].includes(invoice.status) && outstandingCents > 0;
    const due = day(invoice.dueDate);
    const overdueDays = receivable && due !== null ? Math.max(0, (today - due) / 86400000) : null;
    const ageBucket: AgeBucket = !receivable ? 'not-receivable' : overdueDays === null ? 'unknown'
      : overdueDays === 0 ? 'not-overdue' : overdueDays <= 30 ? '1-30'
        : overdueDays <= 60 ? '31-60' : overdueDays <= 90 ? '61-90' : '91+';
    const needsStatusReview = invoice.status === 'OTHER'
      || (invoice.status === 'PAID' && outstandingCents !== 0)
      || (['UNPAID', 'PARTIALLY_PAID'].includes(invoice.status) && outstandingCents === 0);
    return { recordIndex, status: invoice.status, amountCents, outstandingCents,
      receivableCents: receivable ? outstandingCents : 0,
      dueDate: due === null ? null : invoice.dueDate, overdueDays, ageBucket, needsStatusReview };
  });
  const changes: OwnerAnalytics['changes'] = workspace.proposals.map((proposal, recordIndex) => {
    if (!['draft', 'approved', 'accepted', 'declined'].includes(proposal.status)) throw failure();
    const approved = proposal.status === 'approved' || proposal.status === 'accepted';
    const amount = cents(proposal.amountCents);
    return { recordIndex, status: proposal.status, approvedCents: approved ? amount : 0,
      awaitingAcceptance: proposal.status === 'approved' };
  });
  return {
    version: workspace.version, mode: workspace.mode, asOf, currency: 'USD', invoices, changes,
    totals: {
      outstandingCents: sum(invoices.map(row => row.receivableCents)),
      overdueCents: sum(invoices.filter(row => row.overdueDays !== null && row.overdueDays > 0).map(row => row.receivableCents)),
      unknownDueDateCents: sum(invoices.filter(row => row.ageBucket === 'unknown').map(row => row.receivableCents)),
      approvedExtraCents: sum(changes.map(row => row.approvedCents)),
      awaitingAcceptanceCents: sum(changes.filter(row => row.awaitingAcceptance).map(row => row.approvedCents)),
      awaitingAcceptanceCount: changes.filter(row => row.awaitingAcceptance).length,
      statusReviewCount: invoices.filter(row => row.needsStatusReview).length,
    },
  };
}
