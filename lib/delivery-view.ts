import { z } from 'zod';
import { deliveryPlanStateSchema } from './delivery-plan-state';
import type { DeliverySnapshot } from './delivery-plan';

export const deliveryPlanningSchema = z.object({
  agreementAccepted: z.boolean(),
  clauses: z.array(z.object({ id: z.string().regex(/^S\d+$/), text: z.string().min(5).max(500) }).strict()).max(12),
  eligibleExtras: z.array(z.object({ proposalId: z.string().uuid(), status: z.enum(['approved', 'accepted']),
    references: z.array(z.string().regex(/^S\d+$/)).max(20), deliverables: z.array(z.string().min(3).max(250)).min(1).max(8),
  }).strict()).max(1000),
}).strict();
const base = z.object({
  version: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER), mode: z.enum(['demo', 'sandbox']),
  asOf: z.string().datetime(), stateSource: z.literal('local-records'), remoteCheckedAt: z.null(),
  planning: deliveryPlanningSchema,
  extras: z.array(z.object({ proposalId: z.string().min(1).max(100), status: z.enum(['approved', 'accepted', 'declined']) }).strict()).max(1000),
  invoices: z.array(z.object({ recordIndex: z.number().int().nonnegative(), proposalId: z.string().min(1).max(100),
    status: z.enum(['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OTHER']),
    amountCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    outstandingCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), pendingOutcome: z.boolean(),
  }).strict()).max(1000),
});
export const deliveryViewSchema = z.discriminatedUnion('status', [
  base.extend({ status: z.literal('unconfigured') }).strict(),
  base.extend({ status: z.literal('review-needed') }).strict(),
  base.extend({ status: z.literal('ready'), plan: deliveryPlanStateSchema, previewStale: z.boolean() }).strict(),
]);
export type DeliveryView = z.infer<typeof deliveryViewSchema>;
export type DeliverySelection = 'current' | 'original' | 'preview';
export function deliverySelection(view: DeliveryView, selected: DeliverySelection) {
  if (view.status !== 'ready') return null;
  const { plan } = view;
  if (selected === 'original') return plan.original;
  if (selected === 'preview') return plan.preview ? { calendar: plan.preview.candidate.calendar, snapshot: plan.preview.candidate.snapshot } : null;
  return plan.current && plan.calendar ? { calendar: plan.calendar, snapshot: plan.current.snapshot } : null;
}
/** Civil days are deliberately represented on a UTC chart axis, never browser-local parsing. */
export function deliveryChartTasks(snapshot: DeliverySnapshot) {
  return snapshot.tasks.filter(task => task.startDate !== null && task.endDateExclusive !== null).map(task => ({
    id: task.id, name: task.label, startDate: `${task.startDate}T00:00:00.000Z`,
    endDate: `${task.endDateExclusive}T00:00:00.000Z`, manuallyScheduled: true,
    ...(task.kind === 'milestone' ? { duration: 0 } : {}),
  }));
}
