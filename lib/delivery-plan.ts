import { z } from 'zod';
import type { Workspace } from './domain';

const DAY = 86_400_000;
const dateMin = '2020-01-01', dateMax = '2100-12-31';
function fail(message: string): never { throw new Error(message); }
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return value >= dateMin && value <= dateMax && Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
});
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const plainLabel = z.string().trim().min(3).max(120).refine(value => !/[<>\u0000-\u001f\u007f]|(?:https?:\/\/|www\.)/i.test(value));
export const deliveryCalendarSchema = z.object({
  timezone: z.string().min(1).max(80).refine(value => {
    if (value !== 'UTC' && !value.includes('/')) return false;
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }),
  weekdays: z.tuple([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  holidays: z.array(dateSchema).max(32).refine(unique),
}).strict();
export type DeliveryCalendar = z.infer<typeof deliveryCalendarSchema>;

const taskSchema = z.object({
  id: z.string().uuid(), label: plainLabel,
  kind: z.enum(['base', 'extra', 'milestone']),
  references: z.array(z.string().regex(/^S\d+$/)).max(20).refine(unique),
  proposalId: z.string().uuid().nullable(),
  duration: z.number().int().min(0).max(120),
  startDate: dateSchema.nullable(), endDateExclusive: dateSchema.nullable(),
}).strict();
export const deliverySnapshotSchema = z.object({
  tasks: z.array(taskSchema).min(1).max(80),
  dependencies: z.array(z.object({
    predecessorId: z.string().uuid(), successorId: z.string().uuid(), type: z.literal('finish-to-start'),
  }).strict()).max(160),
}).strict();
export type DeliverySnapshot = z.infer<typeof deliverySnapshotSchema>;
export type DeliveryTask = DeliverySnapshot['tasks'][number];
export type DeliveryAuthority = Pick<Workspace, 'agreementStatus' | 'agreement' | 'proposals'>;
export type DeliveryValidation = {
  calendar: DeliveryCalendar; snapshot: DeliverySnapshot;
  warnings: { code: 'awaiting-acceptance'; taskId: string }[];
  unresolvedDependencies: DeliverySnapshot['dependencies'];
  finishDateExclusive: string | null;
};

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  return result.success ? result.data : fail('Delivery plan has invalid fields.');
}
const ordinal = (value: string) => Date.parse(`${value}T00:00:00.000Z`) / DAY;
const dateAt = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
function working(day: number, holidays: Set<string>) {
  const weekday = new Date(day * DAY).getUTCDay();
  return weekday >= 1 && weekday <= 5 && !holidays.has(dateAt(day));
}
function finish(calendar: DeliveryCalendar, start: string, duration: number) {
  const holidays = new Set(calendar.holidays);
  let day = ordinal(start), remaining = duration;
  if (!working(day, holidays)) fail('Delivery work must start on a working date.');
  if (duration === 0) return start;
  while (remaining > 0) {
    if (day > ordinal(dateMax)) fail('Delivery finish is outside the supported date range.');
    if (working(day, holidays)) remaining--;
    day++;
  }
  const result = dateAt(day);
  if (result > dateMax) fail('Delivery finish is outside the supported date range.');
  return result;
}

/** Civil dates deliberately never use the machine's local timezone or invoice dates. */
export function deliveryEndDate(calendarInput: unknown, startInput: unknown, durationInput: unknown): string {
  const calendar = parse(deliveryCalendarSchema, calendarInput);
  const start = parse(dateSchema, startInput);
  const duration = parse(z.number().int().min(0).max(120), durationInput);
  return finish(calendar, start, duration);
}

/** Validates canonical server task IDs. Public/local-key conversion belongs to B4. No writes or I/O. */
export function validateDeliverySnapshot(calendarInput: unknown, snapshotInput: unknown, authority: DeliveryAuthority,
  options: { phase: 'preview' | 'apply'; current?: DeliverySnapshot; frozenCalendar?: DeliveryCalendar } = { phase: 'preview' }): DeliveryValidation {
  const calendar = parse(deliveryCalendarSchema, calendarInput);
  calendar.holidays.sort();
  const snapshot = parse(deliverySnapshotSchema, snapshotInput);
  if (authority.agreementStatus !== 'accepted') fail('Delivery planning requires an accepted agreement.');
  if (!!options.current !== !!options.frozenCalendar) fail('Applied delivery work requires its frozen calendar.');
  if (options.frozenCalendar) {
    const frozen = parse(deliveryCalendarSchema, options.frozenCalendar);
    frozen.holidays.sort();
    if (JSON.stringify(frozen) !== JSON.stringify(calendar)) fail('The applied delivery calendar cannot be changed.');
  }
  if (!unique(snapshot.tasks.map(t => t.id))) fail('Delivery task identities must be unique.');
  const tasks = new Map(snapshot.tasks.map(t => [t.id, t]));
  const current = options.current ? parse(deliverySnapshotSchema, options.current) : undefined;
  const previous = new Map(current?.tasks.map(t => [t.id, t]) || []);
  if (current && current.tasks.some(t => !tasks.has(t.id))) fail('Applied delivery tasks cannot be removed.');
  if (!snapshot.tasks.some(t => t.kind === 'base')) fail('Delivery plan requires base-scope work.');
  const clauses = new Set(authority.agreement.clauses.map(c => c.id));
  const proposals = new Map(authority.proposals.map(p => [p.id, p]));
  const linked = new Set<string>();
  const warnings: DeliveryValidation['warnings'] = [];
  const dates: string[] = [];
  for (const task of snapshot.tasks) {
    const old = previous.get(task.id);
    if (old && (old.kind !== task.kind || old.proposalId !== task.proposalId ||
      JSON.stringify([...old.references].sort()) !== JSON.stringify([...task.references].sort()))) {
      fail('Applied task scope links cannot be changed.');
    }
    if (task.references.some(ref => !clauses.has(ref))) fail('Delivery task cites an unknown scope clause.');
    if (task.kind === 'extra') {
      if (!current) fail('Initialize the base delivery plan before adding extras.');
      const proposal = task.proposalId ? proposals.get(task.proposalId) : undefined;
      if (!proposal || !['approved', 'accepted'].includes(proposal.status) ||
        !proposal.scopeReview || proposal.scopeReview.classification !== 'additional' ||
        task.references.some(ref => !proposal.scopeReview!.references.includes(ref))) {
        fail('Delivery extra requires an existing reviewed additional-work proposal.');
      }
      if (linked.has(proposal.id)) fail('An extra can have only one delivery task.');
      linked.add(proposal.id);
      if (proposal.status !== 'accepted') {
        if (options.phase === 'apply') fail('Client acceptance is required before applying extra work.');
        warnings.push({ code: 'awaiting-acceptance', taskId: task.id });
      }
    } else if (task.proposalId !== null) fail('Only extra tasks may link to proposals.');
    if (task.kind === 'base') {
      if (!task.references.length) fail('Base delivery work needs scope evidence.');
      if (current && !old) fail('Only extras or milestones can be added to an applied plan.');
    }
    if (task.kind === 'milestone' ? task.duration !== 0 : task.duration < 1) fail('Delivery duration does not match the task kind.');
    if ((task.startDate === null) !== (task.endDateExclusive === null)) fail('Unscheduled tasks must omit both dates.');
    if (task.startDate !== null && task.endDateExclusive !== null) {
      if (finish(calendar, task.startDate, task.duration) !== task.endDateExclusive) fail('Delivery finish does not match the working calendar and duration.');
      dates.push(task.startDate, task.endDateExclusive);
    }
  }
  if (dates.length && Math.max(...dates.map(ordinal)) - Math.min(...dates.map(ordinal)) > 730) fail('Delivery plan exceeds the supported date span.');
  const edges = new Set<string>(), indegree = new Map(snapshot.tasks.map(t => [t.id, 0]));
  const successors = new Map(snapshot.tasks.map(t => [t.id, [] as string[]]));
  const unresolvedDependencies: DeliverySnapshot['dependencies'] = [];
  for (const edge of snapshot.dependencies) {
    const before = tasks.get(edge.predecessorId), after = tasks.get(edge.successorId);
    if (!before || !after || before.id === after.id) fail('Delivery dependency has invalid task links.');
    const key = `${edge.predecessorId}:${edge.successorId}`;
    if (edges.has(key)) fail('Delivery dependencies must be unique.');
    edges.add(key);
    successors.get(before.id)!.push(after.id);
    indegree.set(after.id, indegree.get(after.id)! + 1);
    if (before.endDateExclusive === null || after.startDate === null) unresolvedDependencies.push(edge);
    else if (after.startDate < before.endDateExclusive) fail('Delivery successor starts before its dependency finishes.');
  }
  const queue = [...indegree].filter(([, count]) => count === 0).map(([id]) => id);
  let visited = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    visited++;
    for (const id of successors.get(queue[cursor])!) {
      const count = indegree.get(id)! - 1;
      indegree.set(id, count);
      if (count === 0) queue.push(id);
    }
  }
  if (visited !== tasks.size) fail('Delivery dependencies contain a cycle.');
  if (options.phase === 'apply' && unresolvedDependencies.length) fail('Resolve unscheduled delivery dependencies before applying.');
  const finishDateExclusive = snapshot.tasks.some(t => t.endDateExclusive === null) ? null :
    snapshot.tasks.map(t => t.endDateExclusive!).sort().at(-1)!;
  return { calendar, snapshot, warnings, unresolvedDependencies, finishDateExclusive };
}
