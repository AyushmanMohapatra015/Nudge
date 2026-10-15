import { deliveryCalendarSchema, deliveryEndDate } from './delivery-plan';
import type { DeliveryCommand } from './delivery-plan-actions';
import type { DeliveryView } from './delivery-view';

export type DeliveryDraftTask = { key: string; label: string; kind: 'base' | 'extra' | 'milestone'; proposalId: string | null;
  references: string[]; duration: string; startDate: string; scheduled: boolean; predecessors: string[] };
export type DeliveryDraft = { basedOnVersion: number; timezone: string; holidays: string; tasks: DeliveryDraftTask[] };
export const blankDeliveryTask = (key: string, kind: DeliveryDraftTask['kind']): DeliveryDraftTask => ({ key, kind, label: '', proposalId: null,
  references: [], duration: kind === 'milestone' ? '0' : '', startDate: '', scheduled: false, predecessors: [] });
export function draftDelivery(view: DeliveryView, timezone: string): DeliveryDraft {
  if (view.status === 'review-needed' || !view.planning.agreementAccepted) throw Error('An accepted agreement and a valid stored plan are required.');
  const plan = view.status === 'ready' ? view.plan : undefined;
  const source = plan?.preview?.candidate ?? (plan?.current && plan.calendar ? { calendar: plan.calendar, snapshot: plan.current.snapshot } : null);
  return { basedOnVersion: view.version, timezone: source?.calendar.timezone ?? timezone, holidays: source?.calendar.holidays.join('\n') ?? '',
    tasks: source ? source.snapshot.tasks.map(task => ({ key: task.id, label: task.label, kind: task.kind, proposalId: task.proposalId,
      references: [...task.references], duration: String(task.duration), startDate: task.startDate ?? '', scheduled: task.startDate !== null,
      predecessors: source.snapshot.dependencies.filter(edge => edge.successorId === task.id).map(edge => edge.predecessorId),
    })) : [blankDeliveryTask('new:task0', 'base')] };
}
export function deliveryDraftCalendar(draft: DeliveryDraft) {
  const result = deliveryCalendarSchema.safeParse({ timezone: draft.timezone, weekdays: [1, 2, 3, 4, 5],
    holidays: draft.holidays.split(/[\s,]+/).filter(Boolean) });
  if (!result.success) throw Error('Review the timezone and holidays. Use unique YYYY-MM-DD dates, up to 32 holidays.');
  return result.data;
}
/** Builds a candidate only; no UUID allocation, I/O, authority decision or mutation. */
export function deliveryDraftCommand(view: DeliveryView, draft: DeliveryDraft): Extract<DeliveryCommand, { type: 'stage' }> {
  if (!view.planning.agreementAccepted || view.status === 'review-needed') throw Error('Planning requires an accepted agreement and a valid saved plan.');
  const calendar = deliveryDraftCalendar(draft), plan = view.status === 'ready' ? view.plan : undefined;
  if (!draft.tasks.length || draft.tasks.length > 80) throw Error('A plan needs between 1 and 80 tasks.');
  const keys = new Set(draft.tasks.map(task => task.key));
  if (keys.size !== draft.tasks.length) throw Error('Task references must be unique.');
  const existing = new Map([...(plan?.current?.snapshot.tasks ?? []), ...(plan?.preview?.candidate.snapshot.tasks ?? [])].map(task => [task.id, task]));
  const knownClauses = new Set(view.planning.clauses.map(clause => clause.id));
  const extras = new Set<string>();
  const tasks = draft.tasks.map((task, index) => {
    const fail = (message: string): never => { throw Error(`Task ${index + 1}: ${message}`); };
    const label = task.label.trim();
    if (label.length < 3 || label.length > 120 || /[<>\u0000-\u001f\u007f]|https?:\/\/|www\./i.test(label)) fail('use a plain label of 3–120 characters without links.');
    if (task.references.some(ref => !knownClauses.has(ref)) || new Set(task.references).size !== task.references.length) fail('review the clause references.');
    if (task.kind !== 'milestone' && !task.references.length) fail('select supporting scope evidence.');
    const prior = existing.get(task.key);
    if (plan?.current && task.kind === 'base' && !prior) fail('only reviewed extras or milestones can be added to an applied plan.');
    if (!task.key.startsWith('new:') && (!prior || prior.kind !== task.kind || prior.proposalId !== task.proposalId ||
      JSON.stringify([...prior.references].sort()) !== JSON.stringify([...task.references].sort()))) fail('saved scope links changed; remove an unapplied task and add it again, or reload the applied plan.');
    if (task.kind === 'extra') {
      if (!plan?.current) fail('apply the initial base plan before adding extra work.');
      const extra = view.planning.eligibleExtras.find(extra => extra.proposalId === task.proposalId);
      if (!extra) return fail('choose reviewed additional work that is approved or accepted.');
      if (task.references.some(ref => !extra.references.includes(ref))) fail('choose supporting references from the reviewed change.');
      if (extras.has(extra.proposalId)) fail('this extra is already linked to another task.'); extras.add(extra.proposalId);
    } else if (task.proposalId !== null) fail('only extra work can link to a change.');
    if (!/^\d{1,3}$/.test(task.duration) || Number(task.duration) > 120 || (task.kind === 'milestone' ? Number(task.duration) !== 0 : Number(task.duration) < 1)) fail('enter 1–120 whole working days, or zero for a milestone.');
    if (task.predecessors.some(key => !keys.has(key) || key === task.key) || new Set(task.predecessors).size !== task.predecessors.length) fail('review the predecessor tasks.');
    let endDateExclusive: string | null = null;
    if (task.scheduled) { try { endDateExclusive = deliveryEndDate(calendar, task.startDate, Number(task.duration)); } catch { fail('review the start date, duration and working calendar.'); } }
    return { key: task.key, label, kind: task.kind, proposalId: task.proposalId, references: [...task.references], duration: Number(task.duration),
      startDate: task.scheduled ? task.startDate : null, endDateExclusive };
  });
  const current = plan?.current?.snapshot.tasks ?? [];
  if (!tasks.some(task => task.kind === 'base')) throw Error('Keep at least one base-scope task.');
  if (current.some(task => !keys.has(task.id))) throw Error('Applied tasks cannot be removed.');
  if (plan?.calendar && JSON.stringify({ ...calendar, holidays: [...calendar.holidays].sort() }) !== JSON.stringify({ ...plan.calendar, holidays: [...plan.calendar.holidays].sort() })) throw Error('The applied working calendar is frozen.');
  const dependencies = draft.tasks.flatMap(task => task.predecessors.map(key => ({ predecessorKey: key, successorKey: task.key, type: 'finish-to-start' as const })));
  if (dependencies.length > 160) throw Error('A plan supports up to 160 dependencies.');
  const incoming = new Map(tasks.map(task => [task.key, 0]));
  const outgoing = new Map(tasks.map(task => [task.key, [] as string[]]));
  const byKey = new Map(tasks.map(task => [task.key, task]));
  for (const edge of dependencies) {
    const before = byKey.get(edge.predecessorKey)!, after = byKey.get(edge.successorKey)!;
    if (before.endDateExclusive && after.startDate && before.endDateExclusive > after.startDate) throw Error('A successor starts before its predecessor finishes.');
    incoming.set(edge.successorKey, incoming.get(edge.successorKey)! + 1); outgoing.get(edge.predecessorKey)!.push(edge.successorKey);
  }
  const queue = [...incoming].filter(([, count]) => count === 0).map(([key]) => key);
  for (let i = 0; i < queue.length; i++) for (const key of outgoing.get(queue[i])!) { incoming.set(key, incoming.get(key)! - 1); if (incoming.get(key) === 0) queue.push(key); }
  if (queue.length !== tasks.length) throw Error('Dependencies contain a cycle.');
  return { type: 'stage', expectedWorkspaceVersion: view.version, expectedPlanRevision: plan?.revision ?? 0,
    expectedPreviewId: plan?.preview?.id ?? null, calendar, candidate: { tasks, dependencies } };
}
