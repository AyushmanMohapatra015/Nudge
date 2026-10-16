'use client';
import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserRead } from '@/lib/browser-read';
import { deliverySelection, type DeliverySelection, type DeliveryView } from '@/lib/delivery-view';
import { readDeliveryResponse, verifyDeliveryOutcome } from '@/lib/delivery-response';
import { draftDelivery, type DeliveryDraft } from '@/lib/delivery-draft';
import type { DeliveryCommand } from '@/lib/delivery-plan-actions';
import DeliveryEditor from './delivery-editor';
import { money } from '@/lib/domain';
const DeliveryChart = dynamic(() => import('./delivery-chart'), { ssr: false,
  loading: () => <p role="status">Loading the read-only timeline. The date table remains available.</p> });
class ChartBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">The timeline could not load. Use the date table below; your saved plan has not changed. <a className="text-btn" href="/delivery">Reload page to retry timeline</a></p> : this.props.children; }
}

export default function Delivery() {
  const [reader] = useState(() => new BrowserRead());
  const [view, setView] = useState<DeliveryView>();
  const [busy, setBusy] = useState(true), [error, setError] = useState('');
  const [selected, setSelected] = useState<DeliverySelection>('current'), [showChart, setShowChart] = useState(false);
  const [draft, setDraft] = useState<DeliveryDraft | null>(null), [saving, setSaving] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false), [confirmation, setConfirmation] = useState<'apply' | 'discard' | null>(null);
  const [notice, setNotice] = useState('');
  const mutation = useRef<AbortController | null>(null), reading = useRef(false);
  const noticeHeading = useRef<HTMLParagraphElement>(null), actionControl = useRef<Element | null>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const refresh = useCallback(() => {
    if (mutation.current || reading.current) return Promise.resolve();
    reading.current = true;
    setBusy(true); setError(''); setView(undefined); setShowChart(false);
    setConfirmation(null); setNotice('');
    return reader.run(async signal => {
      const response = await fetch('/api/delivery-plan', { credentials: 'same-origin', cache: 'no-store', signal, redirect: 'error' });
      if (!response.ok) throw Error(response.status === 401 ? 'Your owner session ended. Return to the workspace to sign in.' :
        response.status === 404 ? 'Open your workspace first, then return to Delivery.' : 'Delivery is unavailable. Try again shortly.');
      return readDeliveryResponse(response);
    }, snapshot => { reading.current = false; setNeedsRefresh(false); setView(snapshot); setSelected(snapshot.status === 'ready' && !snapshot.plan.current && snapshot.plan.preview ? 'preview' : 'current'); setBusy(false); }, cause => {
      reading.current = false;
      const message = cause instanceof Error ? cause.message : '';
      setError(['Your owner session ended. Return to the workspace to sign in.', 'Open your workspace first, then return to Delivery.', 'Delivery is unavailable. Try again shortly.', 'Connection timed out. Try again.'].includes(message)
        ? message : 'Delivery could not be loaded safely. Try again or review the workspace.'); setView(undefined); setBusy(false);
    });
  }, [reader]);
  useEffect(() => { void refresh(); return () => { reader.cancel(); reading.current = false; mutation.current?.abort(); mutation.current = null; }; }, [reader, refresh]);
  useEffect(() => {
    if (!notice) return;
    const active = document.activeElement;
    if (actionControl.current && (active === actionControl.current || active === document.body || !active?.isConnected)) noticeHeading.current?.focus();
    actionControl.current = null;
  }, [notice]);
  const command = async (payload: DeliveryCommand) => {
    if (!view || busy || reading.current || mutation.current || needsRefresh) return;
    if (payload.expectedWorkspaceVersion !== view.version) return;
    const controller = new AbortController(); mutation.current = controller;
    actionControl.current = document.activeElement; setSaving(true); setError(''); setNotice(''); setConfirmation(null);
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const body = JSON.stringify(payload);
      if (new TextEncoder().encode(body).length > 32 * 1024) throw Error('Draft too large.');
      const response = await fetch('/api/delivery-plan', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        headers: { 'content-type': 'application/json' }, signal: controller.signal, body });
      if (!response.ok) throw Error(response.status === 409 ? 'Stored records changed or an action is running.' : response.status === 401 ? 'Your owner session ended.' : 'The delivery command was not confirmed.');
      const next = verifyDeliveryOutcome(view, payload, await readDeliveryResponse(response));
      if (mutation.current !== controller) return;
      setView(next); setDraft(null); setShowChart(false); setSelected(payload.type === 'stage' ? 'preview' : 'current');
      setNotice(payload.type === 'stage' ? 'Preview saved. Applied dates are unchanged.' : payload.type === 'apply' ? 'Internal plan applied. No client or payment action occurred.' : 'Preview discarded. Applied dates are unchanged.');
    } catch (cause) {
      if (mutation.current !== controller) return;
      setNeedsRefresh(true);
      const known = cause instanceof Error && ['Draft too large.', 'Stored records changed or an action is running.', 'Your owner session ended.'].includes(cause.message) ? cause.message + ' ' : '';
      setError(known + 'Refresh the saved records before another action. Your local entries are preserved; do not repeat an unconfirmed request.');
    } finally { clearTimeout(timer); if (mutation.current === controller) { mutation.current = null; setSaving(false); } }
  };
  const selection = view ? deliverySelection(view, selected) : null;
  const stale = view?.status === 'ready' && selected === 'preview' && view.previewStale;
  return <main className="delivery-page">
    <a className="skip-link" href="#delivery-records">Skip to delivery records</a>
    <a className="text-btn" href="/">← Back to workspace</a>
    <header className="delivery-heading"><div><p className="eyebrow">AGREED WORK. A VISIBLE PLAN.</p><h1>Delivery, with room to review.</h1>
      <p>Your internal plan. These dates are not client-agreed deadlines.</p></div>
      <button className="btn" ref={refreshButton} aria-disabled={busy || saving} onClick={() => { if (!busy && !saving) void refresh(); }}>{busy ? 'Loading…' : 'Refresh delivery snapshot'}</button>
    </header>
    <p className="delivery-announcement" role="status" aria-live="polite">{busy ? 'Loading stored delivery records.' : view ? 'Local delivery snapshot loaded.' : ''}</p>
    {error && <div className="error-banner" role="alert"><span>{error}</span><button className="btn" aria-disabled={busy} onClick={() => { if (!busy) void refresh(); refreshButton.current?.focus(); }}>Try again</button></div>}
    {saving && <p role="status" className="delivery-warning">Saving the local plan decision. Do not repeat it while the outcome is pending.</p>}
    {notice && <p ref={noticeHeading} role="status" tabIndex={-1} className="delivery-warning">{notice}</p>}
    {view && <>
      <p className="mode-banner">{view.mode === 'demo' ? 'Simulation records' : 'Sandbox owner records'} · Local snapshot version {view.version}. No PayPal lookup on this page.</p>
      <p className="delivery-note">Loaded {new Date(view.asOf).toLocaleString()}. Refresh checks stored records only. Payments never reschedule work or approve delivery commitments.</p>
      <section id="delivery-records" tabIndex={-1} className="card delivery-section" aria-labelledby="delivery-plan-heading">
        <h2 id="delivery-plan-heading">Internal delivery plan</h2>
        {view.status === 'unconfigured' && <div className="delivery-empty"><h3>No delivery plan saved yet.</h3><p>No dates have been inferred from invoices or payment promises. Enter your own estimates, save a preview, then review before applying.</p></div>}
        {view.status === 'review-needed' && <div role="alert"><h3>Stored delivery plan needs review.</h3><p>The saved record could not be validated. No timeline is shown and no record has been changed.</p></div>}
        {view.status !== 'review-needed' && !view.planning.agreementAccepted && <p className="delivery-warning">The client must accept the agreement before delivery planning is available. Review the agreement in your workspace.</p>}
        {view.status !== 'review-needed' && view.planning.agreementAccepted && !draft && <button className="btn" disabled={busy || saving || needsRefresh} onClick={() => {
          try { setDraft(draftDelivery(view, Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')); setConfirmation(null); setNotice(''); }
          catch { setError('Planning is unavailable. Refresh and review the saved records.'); }
        }}>{view.status === 'unconfigured' ? 'Plan base scope' : 'Edit delivery preview'}</button>}
        {draft && view.status !== 'review-needed' && view.planning.agreementAccepted && <DeliveryEditor view={view} draft={draft} busy={busy || saving || needsRefresh} saving={saving}
          onChange={next => { setDraft(next); setConfirmation(null); }} onCancel={() => { setDraft(null); setNotice('Local edits cancelled. No saved records changed.'); actionControl.current = document.activeElement; }} onStage={payload => { void command(payload); }} />}
        {view.status === 'ready' && <>
          <div className="delivery-switch" role="group" aria-label="Plan version">
            {(['current', 'original', 'preview'] as const).map(key => <button key={key} className="btn" aria-pressed={selected === key}
              disabled={key === 'original' ? !view.plan.original : key === 'preview' ? !view.plan.preview : !view.plan.current}
              onClick={() => { setSelected(key); setShowChart(false); setConfirmation(null); }}>{key === 'current' ? 'Current plan' : key === 'original' ? 'Original plan' : 'Proposed preview'}</button>)}
          </div>
          <p className="delivery-note">Applied revision {view.plan.revision}. Original dates are preserved separately. A preview has not changed the applied plan.</p>
          {stale && <p className="delivery-warning" role="alert">This preview is stale. Other workspace records changed after it was staged. Refresh and review before planning further; this page cannot apply it.</p>}
          {view.plan.preview && !draft && <fieldset disabled={busy || saving || needsRefresh} className="delivery-decisions"><legend>Decide on the saved preview</legend>
            <p>Only this internal plan changes. Client commitments, accepted prices and payments stay unchanged.</p>
            {selected !== 'preview' && <p>Select Proposed preview and inspect its dates before applying.</p>}
            {(view.previewStale || view.plan.preview.warnings.length > 0 || view.plan.preview.diff.unresolvedDependencyCount > 0) && <p className="delivery-warning">Apply is blocked until the preview is current, linked extra work is accepted and scheduled dependencies are resolved. Refresh and restage after resolving blockers.</p>}
            <label className="delivery-check"><input type="checkbox" checked={confirmation === 'apply'} disabled={selected !== 'preview' || view.previewStale || view.plan.preview.warnings.length > 0 || view.plan.preview.diff.unresolvedDependencyCount > 0 || !view.planning.agreementAccepted} onChange={e => setConfirmation(e.target.checked ? 'apply' : null)} />I reviewed this preview and want to apply it internally.</label>
            <button className="btn primary" disabled={selected !== 'preview' || confirmation !== 'apply' || view.previewStale || view.plan.preview.warnings.length > 0 || view.plan.preview.diff.unresolvedDependencyCount > 0 || !view.planning.agreementAccepted}
              onClick={() => { void command({ type: 'apply', expectedWorkspaceVersion: view.version, previewId: view.plan.preview!.id, confirmed: true }); }}>Apply internal plan</button>
            <label className="delivery-check"><input type="checkbox" checked={confirmation === 'discard'} onChange={e => setConfirmation(e.target.checked ? 'discard' : null)} />Discard this saved preview; keep applied dates.</label>
            <button className="btn" disabled={confirmation !== 'discard'} onClick={() => { void command({ type: 'discard', expectedWorkspaceVersion: view.version, previewId: view.plan.preview!.id, confirmed: true }); }}>Discard saved preview</button>
          </fieldset>}
          {selection ? <>
            <h3>{selected === 'preview' ? 'Proposed dates — not applied' : selected === 'original' ? 'Original owner plan' : 'Current owner plan'}</h3>
            <p className="delivery-note">Calendar: {selection.calendar.timezone} · Monday–Friday, full working days. Finish boundaries are exclusive. Dates are calendar days, not payment due dates.</p>
            <p className="delivery-note">Excluded holidays: {selection.calendar.holidays.length ? selection.calendar.holidays.join(', ') : 'None recorded'}.</p>
            {view.plan.preview && selected === 'preview' && <p className="delivery-warning">{view.plan.preview.diff.finishDeltaCalendarDays === null ? 'Finish impact is not established.' : `Finish-boundary change: ${view.plan.preview.diff.finishDeltaCalendarDays > 0 ? '+' : ''}${view.plan.preview.diff.finishDeltaCalendarDays} calendar days.`} {view.plan.preview.warnings.length > 0 ? `${view.plan.preview.warnings.length} task(s) await client acceptance of extra work.` : ''} Work acceptance does not approve these dates.</p>}
            {!stale && selection.snapshot.tasks.some(task => task.startDate) && <button className="btn" aria-expanded={showChart} onClick={() => setShowChart(value => !value)}>{showChart ? 'Hide Gantt timeline' : 'Show Gantt timeline'}</button>}
            {showChart && !stale && <><p id="delivery-chart-help" className="delivery-note">The visual timeline has known accessibility limitations. All saved dates and dependencies are available below. <a className="text-btn" href="#delivery-date-table">Skip timeline to date table</a></p><div className="delivery-chart-frame" tabIndex={0} role="region" aria-label="Read-only delivery timeline; scroll horizontally for dates" aria-describedby="delivery-chart-help">
              <ChartBoundary key={`${view.version}-${selected}`}><DeliveryChart snapshot={selection.snapshot} calendar={selection.calendar} /></ChartBoundary>
            </div></>}
            <div id="delivery-date-table" className="delivery-table-scroll" tabIndex={0} role="region" aria-label="Delivery date table"><table className="delivery-table">
              <caption>{selected === 'preview' ? 'Proposed delivery dates, not applied' : selected === 'original' ? 'Original delivery dates' : 'Current delivery dates'}</caption>
              <thead><tr><th scope="col">Work and scope</th><th scope="col">Starts</th><th scope="col">Finish before (exclusive)</th><th scope="col">Owner estimate</th></tr></thead>
              <tbody>{selection.snapshot.tasks.map(task => <tr key={task.id}><th scope="row">{task.label}<small>{task.kind === 'extra' ? 'Extra work' : task.kind === 'milestone' ? 'Milestone' : 'Base scope'} · {task.references.join(', ') || 'No clause reference'}</small>
                {task.proposalId && <details><summary>Change reference and decision</summary><p>{task.proposalId}</p><p>{view.extras.find(extra => extra.proposalId === task.proposalId)?.status ?? 'Decision unavailable'}</p></details>}</th>
                <td>{task.startDate ?? 'Not scheduled'}</td><td>{task.endDateExclusive ?? 'Not scheduled'}</td><td>{task.kind === 'milestone' ? 'Milestone' : `${task.duration} working day${task.duration === 1 ? '' : 's'}`}</td></tr>)}</tbody>
            </table></div>
            <p className="delivery-note">{selection.snapshot.dependencies.length} finish-to-start dependencies recorded. Unscheduled work stays in the table and is omitted from the chart. The table is the saved date reference.</p>
            {selection.snapshot.dependencies.length > 0 && <ul aria-label="Finish-to-start dependencies">{selection.snapshot.dependencies.map(edge => <li key={`${edge.predecessorId}-${edge.successorId}`}>
              {selection.snapshot.tasks.find(task => task.id === edge.successorId)?.label} starts after {selection.snapshot.tasks.find(task => task.id === edge.predecessorId)?.label} finishes.
            </li>)}</ul>}
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
