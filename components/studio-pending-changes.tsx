'use client';
import { createContext, useContext } from 'react';
import type { OwnerAnalytics } from '@/lib/owner-analytics';
import { money } from '@/lib/domain';

type PendingChangesSummary = Pick<OwnerAnalytics['totals'], 'awaitingAcceptanceCount' | 'awaitingAcceptanceCents'>;
export const PendingChangesContext = createContext<PendingChangesSummary | null>(null);

/** Read-only, full-workspace summary. Never treats a quote as money received. */
export function StudioPendingChanges() {
  const totals = useContext(PendingChangesContext);
  return <section className="studio-pending-changes" aria-label="Changes awaiting client acceptance">
    <h2>Awaiting client acceptance</h2>
    <p className="studio-pending-scope">Complete workspace · unaffected by report filters</p>
    {totals ? <>
      <p className="studio-pending-value">{money(totals.awaitingAcceptanceCents)} <span>USD in approved quotes</span></p>
      <p>{totals.awaitingAcceptanceCount === 0 ? 'No approved changes are awaiting a client decision.'
        : `${totals.awaitingAcceptanceCount} approved ${totals.awaitingAcceptanceCount === 1 ? 'change is' : 'changes are'} waiting for a client decision.`}</p>
      <p className="studio-pending-note">Quote value, not payments received. Accepted, declined and draft changes are excluded.</p>
      <a href="/">Open workspace to review changes</a>
    </> : <p>Refresh the local snapshot to load this summary.</p>}
  </section>;
}
