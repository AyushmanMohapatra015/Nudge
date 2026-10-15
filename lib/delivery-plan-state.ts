import { z } from 'zod';
import type { Workspace } from './domain';
import { deliveryCalendarSchema, deliverySnapshotSchema, validateDeliverySnapshot,
  type DeliverySnapshot, type DeliveryValidation } from './delivery-plan';

const taskSchema = deliverySnapshotSchema.shape.tasks.element;
const edgeSchema = deliverySnapshotSchema.shape.dependencies.element;
const stamp = z.string().datetime().refine(value => {
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
});
const version = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const revision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const dateOrNull = taskSchema.shape.endDateExclusive;
const warningSchema = z.object({ code: z.literal('awaiting-acceptance'), taskId: z.string().uuid() }).strict();
const impactSchema = z.object({
  taskChanges: z.array(z.object({ id: z.string().uuid(), before: taskSchema.nullable(), after: taskSchema }).strict()).max(80),
  dependenciesAdded: z.array(edgeSchema).max(160), dependenciesRemoved: z.array(edgeSchema).max(160),
  previousFinishDateExclusive: dateOrNull, proposedFinishDateExclusive: dateOrNull,
  finishDeltaCalendarDays: z.number().int().min(-30_000).max(30_000).nullable(),
  unscheduledCount: z.number().int().min(0).max(80), unresolvedDependencyCount: z.number().int().min(0).max(160),
}).strict();
export type DeliveryImpact = z.infer<typeof impactSchema>;
const previewSchema = z.object({
  id: z.string().uuid(), kind: z.enum(['initialize', 'change']), stagedAt: stamp, actor: z.literal('You'),
  baseWorkspaceVersion: version, stagedWorkspaceVersion: version, basePlanRevision: revision,
  candidate: z.object({ calendar: deliveryCalendarSchema, snapshot: deliverySnapshotSchema }).strict(),
  diff: impactSchema, warnings: z.array(warningSchema).max(80),
}).strict();
const stateSchema = z.object({
  schemaVersion: z.literal(1), revision,
  calendar: deliveryCalendarSchema.nullable(),
  original: z.object({ calendar: deliveryCalendarSchema, snapshot: deliverySnapshotSchema, createdAt: stamp, actor: z.literal('You') }).strict().nullable(),
  current: z.object({ snapshot: deliverySnapshotSchema, appliedAt: stamp, actor: z.literal('You') }).strict().nullable(),
  preview: previewSchema.optional(),
}).strict();
export type DeliveryPlan = z.infer<typeof stateSchema>;
// Shape validation for the read-only browser projection; server authority checks
// still run in validateStoredDeliveryPlan before the API exposes any plan.
export const deliveryPlanStateSchema = stateSchema;
export type DeliveryPreview = z.infer<typeof previewSchema>;

const edgeKey = (edge: DeliverySnapshot['dependencies'][number]) => `${edge.predecessorId}:${edge.successorId}`;
const sortedEdges = (edges: DeliverySnapshot['dependencies']) => [...edges].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
const finishOf = (snapshot: DeliverySnapshot | null) => !snapshot || snapshot.tasks.some(t => t.endDateExclusive === null) ? null :
  snapshot.tasks.map(t => t.endDateExclusive!).sort().at(-1)!;
const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
function sameSnapshot(left: DeliverySnapshot, right: DeliverySnapshot) {
  const canonical = (s: DeliverySnapshot) => ({ tasks: [...s.tasks].map(t => ({ ...t, references: [...t.references].sort() }))
    .sort((a, b) => a.id.localeCompare(b.id)), dependencies: sortedEdges(s.dependencies) });
  return equal(canonical(left), canonical(right));
}

/** Derives review evidence from validated data, not browser-supplied savings or dates. */
export function deliveryImpact(current: DeliverySnapshot | null, candidate: DeliveryValidation): DeliveryImpact {
  const previous = current ? deliverySnapshotSchema.parse(current) : null;
  const before = new Map(previous?.tasks.map(t => [t.id, t]) || []);
  const oldEdges = new Set(previous?.dependencies.map(edgeKey) || []);
  const newEdges = new Set(candidate.snapshot.dependencies.map(edgeKey));
  const previousFinishDateExclusive = finishOf(previous), proposedFinishDateExclusive = candidate.finishDateExclusive;
  return structuredClone({
    taskChanges: candidate.snapshot.tasks.filter(task => !equal(before.get(task.id), task)).map(task => ({
      id: task.id, before: before.get(task.id) || null, after: task,
    })).sort((a, b) => a.id.localeCompare(b.id)),
    dependenciesAdded: sortedEdges(candidate.snapshot.dependencies.filter(edge => !oldEdges.has(edgeKey(edge)))),
    dependenciesRemoved: sortedEdges(previous?.dependencies.filter(edge => !newEdges.has(edgeKey(edge))) || []),
    previousFinishDateExclusive, proposedFinishDateExclusive,
    finishDeltaCalendarDays: previousFinishDateExclusive && proposedFinishDateExclusive ?
      (Date.parse(`${proposedFinishDateExclusive}T00:00:00.000Z`) - Date.parse(`${previousFinishDateExclusive}T00:00:00.000Z`)) / 86_400_000 : null,
    unscheduledCount: candidate.snapshot.tasks.filter(task => task.startDate === null).length,
    unresolvedDependencyCount: candidate.unresolvedDependencies.length,
  });
}

function check(condition: unknown): asserts condition { if (!condition) throw Error('Stored delivery plan requires review.'); }
type PlanAuthority = Pick<Workspace, 'version' | 'agreementStatus' | 'agreement' | 'proposals'>;

/** No store access, mutation, migration or I/O. Stale previews remain reviewable, never rebased. */
export function validateStoredDeliveryPlan(input: unknown, authority: PlanAuthority): DeliveryPlan {
  try {
    check(version.safeParse(authority.version).success);
    const plan = stateSchema.parse(input);
    check(plan.revision <= authority.version);
    if (plan.revision === 0) {
      check(plan.calendar === null && plan.original === null && plan.current === null && plan.preview?.kind === 'initialize');
    } else {
      check(plan.calendar && plan.original && plan.current);
      const original = validateDeliverySnapshot(plan.original.calendar, plan.original.snapshot, authority, { phase: 'apply' });
      const current = validateDeliverySnapshot(plan.calendar, plan.current.snapshot, authority, {
        phase: 'apply', current: original.snapshot, frozenCalendar: original.calendar,
      });
      check(plan.original.createdAt <= plan.current.appliedAt);
      if (plan.revision === 1) check(sameSnapshot(original.snapshot, current.snapshot) && plan.original.createdAt === plan.current.appliedAt);
    }
    if (plan.preview) {
      const preview = plan.preview;
      check(preview.basePlanRevision === plan.revision && preview.baseWorkspaceVersion < Number.MAX_SAFE_INTEGER &&
        preview.stagedWorkspaceVersion === preview.baseWorkspaceVersion + 1 && preview.stagedWorkspaceVersion <= authority.version);
      check(preview.kind === (plan.revision === 0 ? 'initialize' : 'change'));
      if (plan.current) check(plan.current.appliedAt <= preview.stagedAt);
      check(new Set(preview.warnings.map(w => w.taskId)).size === preview.warnings.length);
      const stale = preview.stagedWorkspaceVersion !== authority.version;
      // A later client decision legitimately changes a tentative preview's warning.
      // Reconstruct only its recorded approval state; the stale version still blocks apply in B4.
      const warningIds = new Set(preview.warnings.map(w => w.taskId));
      const warnedProposals = new Set(preview.candidate.snapshot.tasks.filter(t => warningIds.has(t.id) && t.kind === 'extra').map(t => t.proposalId));
      const replayAuthority = stale ? { ...authority, proposals: authority.proposals.map(p =>
        warnedProposals.has(p.id) && ['approved', 'accepted', 'declined'].includes(p.status) ? { ...p, status: 'approved' as const } : p) } : authority;
      const candidate = validateDeliverySnapshot(preview.candidate.calendar, preview.candidate.snapshot, replayAuthority,
        plan.current && plan.calendar ? { phase: 'preview', current: plan.current.snapshot, frozenCalendar: plan.calendar } : { phase: 'preview' });
      const sortWarnings = (warnings: typeof preview.warnings) => [...warnings].sort((a, b) => a.taskId.localeCompare(b.taskId));
      check(equal(sortWarnings(preview.warnings), sortWarnings(candidate.warnings)));
      check(equal(preview.diff, deliveryImpact(plan.current?.snapshot || null, candidate)));
    }
    return plan;
  } catch { throw Error('Stored delivery plan requires review.'); }
}

export type DeliveryPlanRead = { status: 'unconfigured' } | { status: 'review-needed' } |
  { status: 'ready'; plan: DeliveryPlan; previewStale: boolean };
export function readDeliveryPlan(authority: PlanAuthority & { deliveryPlan?: unknown }): DeliveryPlanRead {
  if (authority.deliveryPlan === undefined) return { status: 'unconfigured' };
  try {
    const plan = validateStoredDeliveryPlan(authority.deliveryPlan, authority);
    return { status: 'ready', plan, previewStale: !!plan.preview && plan.preview.stagedWorkspaceVersion !== authority.version };
  } catch { return { status: 'review-needed' }; }
}
