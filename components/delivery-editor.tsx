'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { blankDeliveryTask, deliveryDraftCalendar, deliveryDraftCommand, type DeliveryDraft, type DeliveryDraftTask } from '@/lib/delivery-draft';
import { deliveryEndDate } from '@/lib/delivery-plan';
import type { DeliveryView } from '@/lib/delivery-view';
import type { DeliveryCommand } from '@/lib/delivery-plan-actions';

export default function DeliveryEditor({ view, draft, busy, saving, onChange, onCancel, onStage }: {
  view: DeliveryView; draft: DeliveryDraft; busy: boolean; saving: boolean; onChange: (draft: DeliveryDraft) => void;
  onCancel: () => void; onStage: (command: Extract<DeliveryCommand, { type: 'stage' }>) => void;
}) {
  const sequence = useRef(0), [error, setError] = useState(''), [reviewedVersion, setReviewedVersion] = useState<number>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const plan = view.status === 'ready' ? view.plan : undefined;
  const applied = new Set(plan?.current?.snapshot.tasks.map(task => task.id) ?? []);
  const changed = draft.basedOnVersion !== view.version;
  const update = (next: DeliveryDraft) => { setError(''); setReviewedVersion(undefined); onChange(next); };
  const changeTask = (key: string, changes: Partial<DeliveryDraftTask>) => update({ ...draft, tasks: draft.tasks.map(task => task.key === key ? { ...task, ...changes } : task) });
  const add = (kind: DeliveryDraftTask['kind']) => {
    let key: string; do { key = `new:task${++sequence.current}`; } while (draft.tasks.some(task => task.key === key));
    update({ ...draft, tasks: [...draft.tasks, blankDeliveryTask(key, kind)] });
  };
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (changed && reviewedVersion !== view.version) { setError('Review your preserved entries against the refreshed records before saving a preview.'); return; }
    try { onStage(deliveryDraftCommand(view, draft)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Review the draft before saving.'); }
  };
  const finish = (task: DeliveryDraftTask) => {
    if (!task.scheduled) return 'Not scheduled';
    try { return deliveryEndDate(deliveryDraftCalendar(draft), task.startDate, Number(task.duration)); } catch { return 'Review start, estimate and calendar'; }
  };
  return <form className="delivery-editor" onSubmit={submit} aria-label="Delivery plan draft">
    <h3 ref={heading} tabIndex={-1}>Owner-entered plan</h3><p>These entries are local until you save a preview. Saving does not apply dates, notify clients or move money.</p>
    {plan?.preview && <p className="delivery-warning">Saving will replace the existing saved preview. Applied and original dates stay unchanged.</p>}
    {changed && <div className="delivery-warning"><p>Workspace records changed from version {draft.basedOnVersion} to {view.version}. Your local entries were preserved.</p>
      <label><input type="checkbox" disabled={busy} checked={reviewedVersion === view.version} onChange={e => setReviewedVersion(e.target.checked ? view.version : undefined)} />I reviewed my entries against refreshed version {view.version}.</label></div>}
    {error && <p role="alert" className="delivery-warning">{error}</p>}
    <fieldset disabled={busy} className="delivery-calendar"><legend>Working calendar</legend>
      <p>Monday–Friday, full working days. The calendar is frozen after the initial plan is applied.</p>
      <label>Calendar timezone<input value={draft.timezone} readOnly={!!plan?.current} onChange={e => update({ ...draft, timezone: e.target.value })} required maxLength={80} placeholder="Asia/Kolkata" /></label>
      <label>Excluded holidays (YYYY-MM-DD, one per line)<textarea value={draft.holidays} readOnly={!!plan?.current} onChange={e => update({ ...draft, holidays: e.target.value })} maxLength={400} rows={3} /></label>
    </fieldset>
    {draft.tasks.map((task, index) => <fieldset key={task.key} disabled={busy} className="delivery-task-editor"><legend>Task {index + 1} · {task.kind === 'extra' ? 'extra work' : task.kind === 'milestone' ? 'milestone' : 'base scope'}</legend>
      <label>Task {index + 1} label<input required minLength={3} maxLength={120} value={task.label} onChange={e => changeTask(task.key, { label: e.target.value })} /></label>
      {task.kind === 'extra' && <label>Reviewed change for task {index + 1}<select required value={task.proposalId ?? ''} disabled={!task.key.startsWith('new:')} onChange={e => {
        const extra = view.planning.eligibleExtras.find(extra => extra.proposalId === e.target.value);
        changeTask(task.key, { proposalId: extra?.proposalId ?? null, references: [...(extra?.references ?? [])], label: extra?.deliverables.join('; ').slice(0, 120) ?? task.label });
      }}><option value="">Choose reviewed extra work</option>{view.planning.eligibleExtras.map((extra, i) => <option key={extra.proposalId} value={extra.proposalId}>Change {i + 1}: {extra.deliverables.join('; ')} ({extra.status})</option>)}</select></label>}
      <details><summary>Task {index + 1} scope evidence</summary>
        {view.planning.clauses.map(clause => <label className="delivery-check" key={clause.id}><input type="checkbox" checked={task.references.includes(clause.id)}
          disabled={!task.key.startsWith('new:') || task.kind === 'extra'} onChange={e => changeTask(task.key, { references: e.target.checked ? [...task.references, clause.id] : task.references.filter(ref => ref !== clause.id) })} />{clause.id}: {clause.text}</label>)}
        {!task.key.startsWith('new:') && <p>Saved scope links are preserved. Remove and re-add an unapplied task if its scope was wrong.</p>}
      </details>
      <label>Task {index + 1} estimated working days<input type="number" min={task.kind === 'milestone' ? 0 : 1} max={120} step={1} required readOnly={task.kind === 'milestone'} value={task.duration} onChange={e => changeTask(task.key, { duration: e.target.value })} /></label>
      <label className="delivery-check"><input type="checkbox" checked={task.scheduled} onChange={e => changeTask(task.key, { scheduled: e.target.checked })} />Set a start date for task {index + 1}</label>
      {task.scheduled && <label>Task {index + 1} start date<input type="date" min="2020-01-01" max="2100-12-31" required value={task.startDate} onChange={e => changeTask(task.key, { startDate: e.target.value })} /></label>}
      <p>Finish before (exclusive): <output>{finish(task)}</output></p>
      <details><summary>Task {index + 1} predecessors</summary><p>Finish-to-start only. Dependencies never move dates automatically; adjust your estimates and start dates explicitly.</p>
        {draft.tasks.filter(other => other.key !== task.key).map(other => <label className="delivery-check" key={other.key}><input type="checkbox" checked={task.predecessors.includes(other.key)} onChange={e => changeTask(task.key, { predecessors: e.target.checked ? [...task.predecessors, other.key] : task.predecessors.filter(key => key !== other.key) })} />After {other.label || 'Unnamed task'}</label>)}
      </details>
      {!applied.has(task.key) && <button type="button" className="btn" onClick={() => update({ ...draft, tasks: draft.tasks.filter(other => other.key !== task.key).map(other => ({ ...other, predecessors: other.predecessors.filter(key => key !== task.key) })) })}>Remove task {index + 1}</button>}
    </fieldset>)}
    <div className="delivery-switch">
      {!plan?.current && <button type="button" className="btn" disabled={busy || draft.tasks.length >= 80} onClick={() => add('base')}>Add base task</button>}
      {plan?.current && <button type="button" className="btn" disabled={busy || draft.tasks.length >= 80 || !view.planning.eligibleExtras.length} onClick={() => add('extra')}>Add reviewed extra</button>}
      <button type="button" className="btn" disabled={busy || draft.tasks.length >= 80} onClick={() => add('milestone')}>Add milestone</button>
    </div>
    <div className="delivery-switch"><button className="btn primary" disabled={busy || (changed && reviewedVersion !== view.version)}>{saving ? 'Saving…' : plan?.preview ? 'Save replacement preview' : 'Save delivery preview'}</button>
      <button type="button" className="btn" disabled={busy} onClick={onCancel}>Cancel local edits</button></div>
  </form>;
}
