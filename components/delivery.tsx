'use client';
import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserRead } from '@/lib/browser-read';
import { deliveryViewSchema, deliverySelection, type DeliverySelection, type DeliveryView } from '@/lib/delivery-view';
import { money } from '@/lib/domain';
const DeliveryChart = dynamic(() => import('./delivery-chart'), { ssr: false,
  loading: () => <p role="status">Loading the read-only timeline. The date table remains available.</p> });
class ChartBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">The timeline could not load. Use the date table below; your saved plan has not changed.</p> : this.props.children; }
}

export default function Delivery() {
  const [reader] = useState(() => new BrowserRead());
  const [view, setView] = useState<DeliveryView>();
  const [busy, setBusy] = useState(true), [error, setError] = useState('');
  const [selected, setSelected] = useState<DeliverySelection>('current'), [showChart, setShowChart] = useState(false);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const refresh = useCallback(() => {
    setBusy(true); setError(''); setView(undefined); setShowChart(false);
    return reader.run(async signal => {
      const response = await fetch('/api/delivery-plan', { credentials: 'same-origin', cache: 'no-store', signal, redirect: 'error' });
      if (!response.ok) throw Error(response.status === 401 ? 'Your owner session ended. Return to the workspace to sign in.' :
        response.status === 404 ? 'Open your workspace first, then return to Delivery.' : 'Delivery is unavailable. Try again shortly.');
      if (!response.body) throw Error('Invalid delivery snapshot.');
      const stream = response.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true }); let text = '', bytes = 0;
      for (;;) { const part = await stream.read(); if (part.done) break; bytes += part.value.byteLength;
        if (bytes > 1_048_576) { await stream.cancel(); throw Error('Invalid delivery snapshot.'); } text += decoder.decode(part.value, { stream: true }); }
      text += decoder.decode();
      return deliveryViewSchema.parse(JSON.parse(text));
    }, snapshot => { setView(snapshot); setSelected(snapshot.status === 'ready' && !snapshot.plan.current && snapshot.plan.preview ? 'preview' : 'current'); setBusy(false); }, cause => {
      const message = cause instanceof Error ? cause.message : '';
      setError(['Your owner session ended. Return to the workspace to sign in.', 'Open your workspace first, then return to Delivery.', 'Delivery is unavailable. Try again shortly.', 'Connection timed out. Try again.'].includes(message)
        ? message : 'Delivery could not be loaded safely. Try again or review the workspace.'); setView(undefined); setBusy(false);
    });
  }, [reader]);
  useEffect(() => { void refresh(); return () => reader.cancel(); }, [reader, refresh]);
  const selection = view ? deliverySelection(view, selected) : null;
  const stale = view?.status === 'ready' && selected === 'preview' && view.previewStale;
  return <main className="delivery-page">
    <a className="skip-link" href="#delivery-records">Skip to delivery records</a>
    <a className="text-btn" href="/">← Back to workspace</a>
    <header className="delivery-heading"><div><p className="eyebrow">AGREED WORK. A VISIBLE PLAN.</p><h1>Delivery, with room to review.</h1>
      <p>Your internal plan. These dates are not client-agreed deadlines.</p></div>
      <button className="btn" ref={refreshButton} aria-disabled={busy} onClick={() => { if (!busy) void refresh(); }}>{busy ? 'Loading…' : 'Refresh delivery snapshot'}</button>
    </header>
    <p className="delivery-announcement" role="status" aria-live="polite">{busy ? 'Loading stored delivery records.' : view ? 'Local delivery snapshot loaded.' : ''}</p>
    {error && <div className="error-banner" role="alert"><span>{error}</span><button className="btn" aria-disabled={busy} onClick={() => { if (!busy) void refresh(); refreshButton.current?.focus(); }}>Try again</button></div>}
    {view && <>
      <p className="mode-banner">{view.mode === 'demo' ? 'Simulation records' : 'Sandbox owner records'} · Local snapshot version {view.version}. No PayPal lookup on this page.</p>
      <p className="delivery-note">Loaded {new Date(view.asOf).toLocaleString()}. Refresh checks stored records only. Payments never reschedule work or approve delivery commitments.</p>
      <section id="delivery-records" tabIndex={-1} className="card delivery-section" aria-labelledby="delivery-plan-heading">
        <h2 id="delivery-plan-heading">Internal delivery plan</h2>
        {view.status === 'unconfigured' && <div className="delivery-empty"><h3>No delivery plan saved yet.</h3><p>No dates have been inferred from invoices or payment promises. This view is read-only; planning controls are not available yet.</p></div>}
        {view.status === 'review-needed' && <div role="alert"><h3>Stored delivery plan needs review.</h3><p>The saved record could not be validated. No timeline is shown and no record has been changed.</p></div>}
        {view.status === 'ready' && <>
          <div className="delivery-switch" role="group" aria-label="Plan version">
            {(['current', 'original', 'preview'] as const).map(key => <button key={key} className="btn" aria-pressed={selected === key}
              disabled={key === 'original' ? !view.plan.original : key === 'preview' ? !view.plan.preview : !view.plan.current}
              onClick={() => { setSelected(key); setShowChart(false); }}>{key === 'current' ? 'Current plan' : key === 'original' ? 'Original plan' : 'Proposed preview'}</button>)}
          </div>
          <p className="delivery-note">Applied revision {view.plan.revision}. Original dates are preserved separately. A preview has not changed the applied plan.</p>
          {stale && <p className="delivery-warning" role="alert">This preview is stale. Other workspace records changed after it was staged. Refresh and review before planning further; this page cannot apply it.</p>}
          {selection ? <>
            <h3>{selected === 'preview' ? 'Proposed dates — not applied' : selected === 'original' ? 'Original owner plan' : 'Current owner plan'}</h3>
            <p className="delivery-note">Calendar: {selection.calendar.timezone} · Monday–Friday, full working days. Finish boundaries are exclusive. Dates are calendar days, not payment due dates.</p>
            <p className="delivery-note">Excluded holidays: {selection.calendar.holidays.length ? selection.calendar.holidays.join(', ') : 'None recorded'}.</p>
            {view.plan.preview && selected === 'preview' && <p className="delivery-warning">{view.plan.preview.diff.finishDeltaCalendarDays === null ? 'Finish impact is not established.' : `Finish-boundary change: ${view.plan.preview.diff.finishDeltaCalendarDays > 0 ? '+' : ''}${view.plan.preview.diff.finishDeltaCalendarDays} calendar days.`} {view.plan.preview.warnings.length > 0 ? `${view.plan.preview.warnings.length} task(s) await client acceptance of extra work.` : ''} Work acceptance does not approve these dates.</p>}
            {!stale && selection.snapshot.tasks.some(task => task.startDate) && <button className="btn" aria-expanded={showChart} onClick={() => setShowChart(value => !value)}>{showChart ? 'Hide Gantt timeline' : 'Show Gantt timeline'}</button>}
            {showChart && !stale && <div className="delivery-chart-frame" tabIndex={0} role="region" aria-label="Read-only delivery timeline; scroll horizontally for dates">
              <ChartBoundary key={`${view.version}-${selected}`}><DeliveryChart snapshot={selection.snapshot} calendar={selection.calendar} /></ChartBoundary>
            </div>}
            <div className="delivery-table-scroll" tabIndex={0} role="region" aria-label="Delivery date table"><table className="delivery-table">
              <caption>{selected === 'preview' ? 'Proposed delivery dates, not applied' : selected === 'original' ? 'Original delivery dates' : 'Current delivery dates'}</caption>
              <thead><tr><th scope="col">Work and scope</th><th scope="col">Starts</th><th scope="col">Finish before (exclusive)</th><th scope="col">Owner estimate</th></tr></thead>
              <tbody>{selection.snapshot.tasks.map(task => <tr key={task.id}><th scope="row">{task.label}<small>{task.kind === 'extra' ? 'Extra work' : task.kind === 'milestone' ? 'Milestone' : 'Base scope'} · {task.references.join(', ') || 'No clause reference'}</small>
                {task.proposalId && <details><summary>Change reference and decision</summary><p>{task.proposalId}</p><p>{view.extras.find(extra => extra.proposalId === task.proposalId)?.status ?? 'Decision unavailable'}</p></details>}</th>
                <td>{task.startDate ?? 'Not scheduled'}</td><td>{task.endDateExclusive ?? 'Not scheduled'}</td><td>{task.kind === 'milestone' ? 'Milestone' : `${task.duration} working day${task.duration === 1 ? '' : 's'}`}</td></tr>)}</tbody>
            </table></div>
            <p className="delivery-note">{selection.snapshot.dependencies.length} finish-to-start dependencies recorded. Unscheduled work stays in the table and is omitted from the chart. The table is the saved date reference.</p>
          </> : <p>No applied dates yet. Select the proposed preview to inspect it.</p>}
        </>}
      </section>
      <section className="card delivery-section" aria-labelledby="delivery-payments"><h2 id="delivery-payments">Payment context</h2><p>Stored invoice records only. A payment is not approval of a delivery date.</p>
        {view.invoices.length ? <ul className="delivery-invoices">{view.invoices.map(invoice => <li key={invoice.recordIndex}>Invoice {invoice.recordIndex + 1}: {invoice.status.replaceAll('_', ' ')} · {money(invoice.outstandingCents)} outstanding of {money(invoice.amountCents)} (USD){invoice.pendingOutcome && <strong> · An external action outcome is uncertain; review it in Payments.</strong>}</li>)}</ul> : <p>No invoice records.</p>}
        <a className="text-btn" href="/">Return to workspace for approvals and payment checks →</a>
      </section>
    </>}
  </main>;
}
