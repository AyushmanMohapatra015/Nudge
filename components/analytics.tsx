'use client';
import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { OwnerAnalytics } from '@/lib/owner-analytics';
import { money } from '@/lib/domain';
import { emptyStudioAllowance, studioAllowanceViewSchema, type StudioAllowanceView } from '@/lib/studio-allowance-view';
const StudioCanvas = dynamic(() => import('./studio-canvas'), { ssr: false, loading: () => <p role="status">Loading interactive reports. The snapshot tables remain available.</p> });
class ReportBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">Interactive reports could not load. Use the snapshot tables below; your records have not changed. <a className="text-btn" href="/analytics">Reload page to retry reports</a></p> : this.props.children; }
}

export default function Analytics({ licenseKey }: { licenseKey?: string }) {
  const [snapshot, setSnapshot] = useState<OwnerAnalytics>();
  const [allowance, setAllowance] = useState<StudioAllowanceView>();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(true); const [edit, setEdit] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [studioEnabled, setStudioEnabled] = useState(false);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setBusy(true); setError(''); setAllowance(undefined); setAnnouncement('Loading local snapshot.'); const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/analytics', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 401 ? 'Your owner session ended. Return to the workspace to sign in.'
        : response.status === 404 ? 'Open your workspace first, then return to Analytics.' : 'Unable to load analytics. Try again shortly.');
      const data = await response.json(); if (data.stateSource !== 'local-records') throw new Error('Unable to load analytics. Try again shortly.');
      if (active.current === controller) {
        const parsed = studioAllowanceViewSchema.safeParse(data.dashboardAllowance);
        setAllowance(parsed.success ? parsed.data : emptyStudioAllowance('unavailable'));
        setSnapshot(data); setAnnouncement(`Local snapshot loaded. Version ${data.version}.`);
      }
    } catch (cause) {
      if (active.current === controller) { setSnapshot(undefined); setError(controller.signal.aborted ? 'Analytics took too long to load. Try again.'
        : cause instanceof Error && ['Your owner session ended. Return to the workspace to sign in.', 'Open your workspace first, then return to Analytics.', 'Unable to load analytics. Try again shortly.'].includes(cause.message)
          ? cause.message : 'Unable to load analytics. Try again shortly.'); }
    } finally { clearTimeout(timeout); if (active.current === controller) setBusy(false); }
  }, []);
  useEffect(() => { void refresh(); return () => { active.current?.abort(); active.current = null; }; }, [refresh]);
  return <main className="analytics-page">
    <a className="skip-link" href="#analytics-reports">Skip to reports</a>
    <p className="analytics-announcement" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <a className="btn" href="/">Back to workspace</a>
    <header className="analytics-heading"><div><p className="eyebrow">NUDGE · AG STUDIO</p><h1>Your work, in perspective.</h1>
      <p>Inspect invoice balances and approved changes. Build reports without changing your financial records.</p></div>
      <button ref={refreshButton} className="btn" onClick={() => { if (!busy) void refresh(); }} aria-disabled={busy}>{busy ? 'Loading…' : 'Refresh local snapshot'}</button>
    </header>
    {error && <div className="error-banner" role="alert">{error}<button className="btn" onClick={() => { void refresh(); refreshButton.current?.focus(); }} disabled={busy}>Try again</button></div>}
    {!snapshot && busy && <p role="status">Loading your local analytics snapshot…</p>}
    {snapshot && <>
      <div className="mode-banner"><span>{snapshot.mode === 'demo' ? 'Illustrative simulation data' : 'PayPal sandbox records'} · Local snapshot, not a live PayPal check. Snapshot version {snapshot.version}.</span></div>
      <p className="analytics-note">Snapshot taken {new Date(snapshot.asOf).toLocaleString()}. Refresh loads stored records only. Use Payments to verify current PayPal status.</p>
      <section className="card analytics-allowance" aria-label="Dashboard AI allowance">
        <h2>Dashboard AI allowance</h2>
        <p>Dashboard AI is not connected.</p>
        <p role="status" aria-live="polite">{!allowance ? 'Refreshing allowance status…'
          : allowance.state === 'simulation' ? 'Simulation mode: no AI calls or request allowance.'
          : allowance.state === 'unapproved' ? 'No dashboard request allowance approved. 0 request slots available.'
          : allowance.state === 'unavailable' ? 'Allowance status is unavailable. Refresh before relying on these counts.'
          : allowance.state === 'expired' ? 'Approval expired. 0 request slots available.'
          : allowance.state === 'exhausted' ? 'Request allowance exhausted. 0 request slots available.'
          : `${allowance.remainingRequests} of ${allowance.maxRequests} request slots remain.`}</p>
        {allowance?.usedRequests !== null && allowance?.usedRequests !== undefined && <p>{allowance.usedRequests} attempts reserved. Failed attempts retain their slot.</p>}
        {allowance?.expiresAt && <p>Approval expiry: <time dateTime={allowance.expiresAt}>{new Date(allowance.expiresAt).toLocaleString(undefined, { timeZone: 'UTC' })} UTC</time>.</p>}
        <p className="analytics-note">These are Nudge dashboard request slots, not provider credits or a spending limit. Refresh the local snapshot to update this view.</p>
      </section>
      <section className="analytics-totals" aria-label="Complete workspace totals">
        {[
          ['Outstanding invoices', money(snapshot.totals.outstandingCents)], ['Overdue balance', money(snapshot.totals.overdueCents)],
          ['Approved extra work', money(snapshot.totals.approvedExtraCents)], ['Awaiting client acceptance', money(snapshot.totals.awaitingAcceptanceCents)],
        ].map(([label, value]) => <div className="card" key={label}><p>{label}</p><strong>{value}</strong></div>)}
      </section>
      <p className="analytics-note">Totals above cover the complete workspace and are unaffected by report filters. Quote values are not payments; they may already be invoiced. Do not add them to outstanding balances.</p>
      {(snapshot.totals.statusReviewCount > 0 || snapshot.totals.unknownDueDateCents > 0) && <p role="status">Review {snapshot.totals.statusReviewCount} invoice status discrepancies. Unknown due dates account for {money(snapshot.totals.unknownDueDateCents)} of outstanding balance.</p>}
      <div className="analytics-controls"><h2 id="analytics-reports" tabIndex={-1}>Invoice and change reports</h2>
        <button className="btn" aria-expanded={studioEnabled} aria-controls="interactive-reports" aria-disabled={studioEnabled} onClick={() => { if (!studioEnabled) setStudioEnabled(true); }}>{studioEnabled ? 'Interactive reports enabled' : 'Load interactive reports'}</button>
        {studioEnabled && <button className="btn" aria-pressed={edit} onClick={() => setEdit(value => !value)}>{edit ? 'Finish editing layout' : 'Edit report layout'}</button>}</div>
      {!studioEnabled && <p className="analytics-note">Read the complete snapshot in the tables below, or load interactive charts and layout tools when you need them.</p>}
      <p className="analytics-note">Report edits stay in this page session. Refreshing the snapshot retains layout; leaving the page resets it. No analytics AI is connected.</p>
      <p className="analytics-note">Select an ageing-chart bar to filter invoice rows. Select it again, or remove its Cross Filter in Filters, to clear the selection. Workspace totals and change quotes stay unchanged.</p>
      <p className="analytics-note">CSV amounts are in USD. Invoice exports follow filters; chart exports retain all highlighted groups. Page filters narrow both. Change quote exports stay independent of invoice filters. Downloaded charts show stored snapshot balances, not current PayPal status.</p>
      {!licenseKey && <p className="analytics-note">Local licence configuration is pending; Studio may display evaluation warnings. Hosted use requires a valid licence.</p>}
      {!snapshot.invoices.length && !snapshot.changes.length && <p role="status">No invoice or change records yet. Return to the workspace to follow the approval workflow.</p>}
      <p id="report-navigation" className="analytics-note">Tab between report controls; Escape leaves a widget. On narrow screens, scroll inside the report area to reach the canvas and panels. The tables below provide the complete snapshot without chart interaction.</p>
      <div id="interactive-reports">{studioEnabled && <section className="analytics-studio" tabIndex={0} aria-describedby="report-navigation" aria-label="AG Studio report builder"><div className="analytics-studio-canvas"><ReportBoundary><StudioCanvas snapshot={snapshot} edit={edit} licenseKey={licenseKey} /></ReportBoundary></div></section>}</div>
      <details className="analytics-tables"><summary>Read complete snapshot as tables</summary>
        <p className="analytics-note">These tables show all stored snapshot records, unaffected by report filters. Quote values are not payments. Record numbers refer only to this snapshot.</p>
        <div className="analytics-table-scroll" role="region" aria-label="Invoice snapshot table" tabIndex={0}><table><caption>Invoice records · USD</caption><thead><tr><th scope="col">Record</th><th scope="col">Status</th><th scope="col">Receivable</th><th scope="col">Due date</th><th scope="col">Status review</th></tr></thead><tbody>
          {snapshot.invoices.map(row => <tr key={row.recordIndex}><th scope="row">Invoice {row.recordIndex + 1}</th><td>{row.status}</td><td>{money(row.receivableCents)}</td><td>{row.dueDate ?? 'Unknown'}</td><td>{row.needsStatusReview ? 'Required' : 'No'}</td></tr>)}
          {!snapshot.invoices.length && <tr><td colSpan={5}>No invoice records.</td></tr>}
        </tbody></table></div>
        <div className="analytics-table-scroll" role="region" aria-label="Change snapshot table" tabIndex={0}><table><caption>Change quote records · USD</caption><thead><tr><th scope="col">Record</th><th scope="col">Status</th><th scope="col">Approved quote</th><th scope="col">Awaiting acceptance</th></tr></thead><tbody>
          {snapshot.changes.map(row => <tr key={row.recordIndex}><th scope="row">Change {row.recordIndex + 1}</th><td>{row.status}</td><td>{money(row.approvedCents)}</td><td>{row.awaitingAcceptance ? 'Yes' : 'No'}</td></tr>)}
          {!snapshot.changes.length && <tr><td colSpan={4}>No change records.</td></tr>}
        </tbody></table></div>
      </details>
    </>}
  </main>;
}
