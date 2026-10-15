import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Workspace } from './domain';
import { db, mode, log, requireIdle } from './store';
import { deliveryCalendarSchema, deliverySnapshotSchema, validateDeliverySnapshot, type DeliverySnapshot, type DeliveryValidation } from './delivery-plan';
import { readDeliveryPlan, validateStoredDeliveryPlan, deliveryImpact, type DeliveryPlan } from './delivery-plan-state';
import { deliveryPlanningSchema } from './delivery-view';

const version = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER - 1);
const reference = z.union([z.string().uuid(), z.string().regex(/^new:[A-Za-z0-9_-]{1,40}$/)]);
const inputTask = deliverySnapshotSchema.shape.tasks.element.omit({ id: true }).extend({ key: reference }).strict();
export const deliveryCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stage'), expectedWorkspaceVersion: version,
    expectedPlanRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1), expectedPreviewId: z.string().uuid().nullable(),
    calendar: deliveryCalendarSchema,
    candidate: z.object({ tasks: z.array(inputTask).min(1).max(80), dependencies: z.array(z.object({
      predecessorKey: reference, successorKey: reference, type: z.literal('finish-to-start'),
    }).strict()).max(160) }).strict(),
  }).strict(),
  z.object({ type: z.literal('apply'), expectedWorkspaceVersion: version, previewId: z.string().uuid(), confirmed: z.literal(true) }).strict(),
  z.object({ type: z.literal('discard'), expectedWorkspaceVersion: version, previewId: z.string().uuid(), confirmed: z.literal(true) }).strict(),
]);
export type DeliveryCommand = z.infer<typeof deliveryCommandSchema>;
export class DeliveryCommandError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
function conflict(): never { throw new DeliveryCommandError('Delivery state changed. Refresh and review before trying again.', 409); }
function invalid(): never { throw new DeliveryCommandError('Delivery preview is invalid. Review its dates, scope links and calendar.', 400); }

/** Does not call read(), which would seed a missing workspace. */
function existingWorkspace(): Workspace {
  const row = db().prepare('SELECT body FROM workspaces WHERE mode = ?').get(mode()) as { body: string } | undefined;
  if (!row) throw new DeliveryCommandError('Open the workspace before planning delivery.', 404);
  const state: Workspace = JSON.parse(row.body);
  if (state.mode !== mode() || !Number.isSafeInteger(state.version) || state.version < 1) throw Error('Invalid workspace');
  return state;
}

const invoiceContext = z.array(z.object({
  recordIndex: z.number().int().nonnegative(), proposalId: z.string().min(1).max(100),
  status: z.enum(['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OTHER']),
  amountCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  outstandingCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), pendingOutcome: z.boolean(),
}).strict());
const extraContext = z.array(z.object({ proposalId: z.string().min(1).max(100), status: z.enum(['approved', 'accepted', 'declined']) }).strict());

export function deliveryPlanView(state: Workspace) {
  const status = readDeliveryPlan(state);
  const extras = extraContext.parse(state.proposals.filter(p => p.status !== 'draft').map(p => ({ proposalId: p.id, status: p.status })));
  const invoices = invoiceContext.parse(state.invoices.map((invoice, recordIndex) => ({
    recordIndex, proposalId: invoice.proposalId, status: invoice.status, amountCents: invoice.amountCents,
    outstandingCents: invoice.outstandingCents, pendingOutcome: !!(invoice.pendingSend || invoice.pendingReminder),
  })));
  const planning = deliveryPlanningSchema.parse({ agreementAccepted: state.agreementStatus === 'accepted',
    clauses: state.agreement.clauses.map(({ id, text }) => ({ id, text })),
    eligibleExtras: state.proposals.filter(p => ['approved', 'accepted'].includes(p.status) && p.scopeReview?.classification === 'additional')
      .map(p => ({ proposalId: p.id, status: p.status, references: p.scopeReview!.references, deliverables: p.deliverables })),
  });
  return { version: state.version, mode: state.mode, asOf: new Date().toISOString(), stateSource: 'local-records' as const,
    remoteCheckedAt: null, ...status, extras, invoices, planning };
}
export const readDeliveryPlanView = () => deliveryPlanView(existingWorkspace());

function canonicalCandidate(action: Extract<DeliveryCommand, { type: 'stage' }>, plan?: DeliveryPlan): DeliverySnapshot {
  const prior = new Map([...(plan?.current?.snapshot.tasks || []), ...(plan?.preview?.candidate.snapshot.tasks || [])].map(task => [task.id, task]));
  const ids = new Map<string, string>();
  for (const task of action.candidate.tasks) {
    if (ids.has(task.key)) invalid();
    if (task.key.startsWith('new:')) ids.set(task.key, randomUUID());
    else {
      const original = prior.get(task.key);
      if (!original || original.kind !== task.kind || original.proposalId !== task.proposalId ||
        JSON.stringify([...original.references].sort()) !== JSON.stringify([...task.references].sort())) invalid();
      ids.set(task.key, task.key);
    }
  }
  const tasks = action.candidate.tasks.map(({ key, ...task }) => ({ ...task, id: ids.get(key)! }));
  const dependencies = action.candidate.dependencies.map(edge => {
    const predecessorId = ids.get(edge.predecessorKey), successorId = ids.get(edge.successorKey);
    if (!predecessorId || !successorId) invalid();
    return { predecessorId, successorId, type: edge.type };
  });
  return { tasks, dependencies };
}

/** Called only inside the local transaction. No remote operations or automatic replay. */
function changePlan(state: Workspace, action: DeliveryCommand) {
  if (state.version !== action.expectedWorkspaceVersion) conflict();
  try { requireIdle(state); } catch { throw new DeliveryCommandError('An action is already running. Refresh before planning delivery.', 409); }
  const current = readDeliveryPlan(state);
  if (current.status === 'review-needed') throw new DeliveryCommandError('Stored delivery plan requires review before changes.', 409);
  const plan = current.status === 'ready' ? current.plan : undefined;
  const now = new Date().toISOString();
  if (action.type === 'stage') {
    if (action.expectedPlanRevision !== (plan?.revision || 0) || action.expectedPreviewId !== (plan?.preview?.id || null)) conflict();
    let validated: DeliveryValidation;
    try {
      validated = validateDeliverySnapshot(action.calendar, canonicalCandidate(action, plan), state,
        plan?.current && plan.calendar ? { phase: 'preview', current: plan.current.snapshot, frozenCalendar: plan.calendar } : { phase: 'preview' });
    } catch { invalid(); }
    const next: DeliveryPlan = plan || { schemaVersion: 1, revision: 0, calendar: null, original: null, current: null };
    next.preview = { id: randomUUID(), kind: next.revision === 0 ? 'initialize' : 'change', stagedAt: now, actor: 'You',
      baseWorkspaceVersion: state.version, stagedWorkspaceVersion: state.version + 1, basePlanRevision: next.revision,
      candidate: { calendar: validated.calendar, snapshot: validated.snapshot },
      diff: deliveryImpact(next.current?.snapshot || null, validated), warnings: validated.warnings };
    state.deliveryPlan = validateStoredDeliveryPlan(next, { ...state, version: state.version + 1 });
    log(state, 'You', 'Delivery preview staged', `${validated.snapshot.tasks.length} tasks reviewed; internal applied dates unchanged.`, next.preview.id);
  } else {
    if (!plan?.preview || plan.preview.id !== action.previewId) conflict();
    if (action.type === 'discard') {
      if (plan.revision === 0) delete state.deliveryPlan;
      else { delete plan.preview; state.deliveryPlan = plan; }
      log(state, 'You', 'Delivery preview discarded', 'Internal applied dates preserved; no client or payment action.', action.previewId);
    } else {
      if (current.status !== 'ready' || current.previewStale) conflict();
      let validated: DeliveryValidation;
      try {
        validated = validateDeliverySnapshot(plan.preview.candidate.calendar, plan.preview.candidate.snapshot, state,
          plan.current && plan.calendar ? { phase: 'apply', current: plan.current.snapshot, frozenCalendar: plan.calendar } : { phase: 'apply' });
      } catch { throw new DeliveryCommandError('Delivery preview cannot be applied. Resolve acceptance or scheduling blockers and restage.', 400); }
      if (!plan.original) plan.original = { calendar: structuredClone(validated.calendar), snapshot: structuredClone(validated.snapshot), createdAt: now, actor: 'You' };
      plan.calendar = validated.calendar;
      plan.current = { snapshot: validated.snapshot, appliedAt: now, actor: 'You' };
      plan.revision++;
      delete plan.preview;
      state.deliveryPlan = validateStoredDeliveryPlan(plan, { ...state, version: state.version + 1 });
      log(state, 'You', 'Delivery plan applied', `Internal plan revision ${plan.revision}; not a client-agreed deadline. No payment action.`, action.previewId);
    }
  }
}

export function executeDeliveryCommand(input: unknown) {
  const parsed = deliveryCommandSchema.safeParse(input);
  if (!parsed.success) throw new DeliveryCommandError('Invalid delivery command.', 400);
  const connection = db(); connection.exec('BEGIN IMMEDIATE');
  try {
    const state = existingWorkspace();
    changePlan(state, parsed.data);
    state.version++;
    // Construct/validate the response before commit, so invalid projections roll back too.
    const result = deliveryPlanView(state);
    connection.prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(JSON.stringify(state), mode());
    connection.exec('COMMIT');
    return result;
  } catch (error) { connection.exec('ROLLBACK'); throw error; }
}
