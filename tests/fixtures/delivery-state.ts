import type { Workspace } from '../../lib/domain';
import { validateDeliverySnapshot, type DeliveryCalendar, type DeliverySnapshot } from '../../lib/delivery-plan';
import { deliveryImpact, type DeliveryPlan } from '../../lib/delivery-plan-state';

export const baseTaskId = '11111111-1111-4111-8111-111111111111';
export const extraTaskId = '22222222-2222-4222-8222-222222222222';
export const proposalId = '44444444-4444-4444-8444-444444444444';
export const planStamp = '2026-10-15T00:00:00.000Z';
export function deliveryStateFixture() {
  const calendar: DeliveryCalendar = { timezone: 'Asia/Kolkata', weekdays: [1, 2, 3, 4, 5], holidays: [] };
  const snapshot: DeliverySnapshot = { tasks: [{ id: baseTaskId, label: 'Fictional website', kind: 'base',
    references: ['S1'], proposalId: null, duration: 3, startDate: '2026-10-16', endDateExclusive: '2026-10-21' }], dependencies: [] };
  const workspace: Workspace = { version: 10, mode: 'sandbox', clientToken: 'fictional-client-token',
    clientLinkExpiresAt: '2099-01-01T00:00:00.000Z', baseInvoiceKey: 'fictional-original-base-key', agreementStatus: 'accepted',
    agreement: { title: 'Fictional website', clientName: 'Fictional client', clientEmail: 'buyer@example.com', amountCents: 120000,
      clauses: [{ id: 'S1', text: 'Five pages included.' }, { id: 'S3', text: 'Booking is excluded.' }] },
    proposals: [{ id: proposalId, request: 'Add booking', status: 'approved', amountCents: 30000, deliverables: ['Booking'],
      analysis: { source: 'simulation', classification: 'additional', summary: 'Booking is excluded.', references: ['S3'], questions: [], deliverables: ['Booking'] },
      scopeReview: { id: 'fictional-review', classification: 'additional', rationale: 'Booking is excluded.', references: ['S3'],
        clarification: '', deliverables: ['Booking'], reviewedAt: planStamp, actor: 'You' } }],
    invoices: [{ id: 'INV2-FICTIONAL', proposalId: 'fictional-base', status: 'PAID', amountCents: 120000, outstandingCents: 0,
      dueDate: '2026-10-14', createdAt: planStamp, reminders: 0, payUrl: 'https://private.example/fictional-payment' }],
    audit: [{ id: 'fictional-audit', time: planStamp, actor: 'You', title: 'Original history', detail: 'Fictional history retained' }],
    policies: { protectedClient: true, cooldownDays: 7, reminderLimit: 3 }, promiseDate: '2026-11-01' };
  const candidate: DeliverySnapshot = { tasks: [...structuredClone(snapshot.tasks), { id: extraTaskId, label: 'Booking extra', kind: 'extra',
    references: ['S3'], proposalId, duration: 3, startDate: '2026-10-21', endDateExclusive: '2026-10-24' }],
    dependencies: [{ predecessorId: baseTaskId, successorId: extraTaskId, type: 'finish-to-start' }] };
  const validated = validateDeliverySnapshot(calendar, candidate, workspace, { phase: 'preview', current: snapshot, frozenCalendar: calendar });
  const plan: DeliveryPlan = { schemaVersion: 1, revision: 1, calendar, original: { calendar: structuredClone(calendar), snapshot: structuredClone(snapshot), createdAt: planStamp, actor: 'You' },
    current: { snapshot, appliedAt: planStamp, actor: 'You' }, preview: { id: '33333333-3333-4333-8333-333333333333', kind: 'change', actor: 'You',
      stagedAt: '2026-10-15T01:00:00.000Z', baseWorkspaceVersion: 9, stagedWorkspaceVersion: 10, basePlanRevision: 1,
      candidate: { calendar: structuredClone(calendar), snapshot: validated.snapshot }, diff: deliveryImpact(snapshot, validated), warnings: validated.warnings } };
  return { workspace, plan };
}
