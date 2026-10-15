import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftDelivery, blankDeliveryTask, deliveryDraftCommand } from '../lib/delivery-draft';
import { deliveryViewSchema } from '../lib/delivery-view';
import { readDeliveryResponse, verifyDeliveryOutcome } from '../lib/delivery-response';
import { deliveryStateFixture } from './fixtures/delivery-state';

function fixture(initial = false) {
  const { workspace, plan } = deliveryStateFixture();
  const base = { version: 10, mode: 'demo', asOf: '2026-10-16T00:00:00.000Z', stateSource: 'local-records', remoteCheckedAt: null, extras: [], invoices: [],
    planning: { agreementAccepted: true, clauses: workspace.agreement.clauses, eligibleExtras: [{ proposalId: workspace.proposals[0].id, status: 'approved', references: ['S3'], deliverables: ['Booking extra'] }] } };
  return deliveryViewSchema.parse(initial ? { ...base, status: 'unconfigured' } : { ...base, status: 'ready', plan, previewStale: false });
}
test('owner draft calculates full working days, preserves unknown dates, and creates no server identities', () => {
  const view = fixture(true), draft = draftDelivery(view, 'Asia/Kolkata');
  draft.holidays = '2026-10-19';
  Object.assign(draft.tasks[0], { label: 'Website delivery', duration: '3', references: ['S1'], startDate: '2026-10-16', scheduled: true });
  draft.tasks.push({ ...blankDeliveryTask('new:later', 'base'), label: 'Later work', duration: '2', references: ['S1'] });
  const before = JSON.stringify({ view, draft }), command = deliveryDraftCommand(view, draft);
  assert.equal(command.candidate.tasks[0].endDateExclusive, '2026-10-22');
  assert.equal(command.candidate.tasks[1].endDateExclusive, null);
  assert.equal(command.candidate.tasks[0].key, 'new:task0');
  assert.equal(command.expectedWorkspaceVersion, 10);
  assert.equal(JSON.stringify({ view, draft }), before);
  const unaccepted = structuredClone(view); unaccepted.planning.agreementAccepted = false;
  assert.throws(() => draftDelivery(unaccepted, 'UTC'), /accepted/);
});
test('draft editing preserves known provenance and calendar, rejects forged extras and invalid graph decisions', () => {
  const view = fixture(), draft = draftDelivery(view, 'UTC');
  const good = deliveryDraftCommand(view, draft);
  assert.equal(good.expectedPreviewId, view.status === 'ready' ? view.plan.preview!.id : '');
  assert.equal(good.candidate.tasks[1].proposalId, view.planning.eligibleExtras[0].proposalId);
  const bad = (change: (d: typeof draft) => void) => { const copy = structuredClone(draft); change(copy); assert.throws(() => deliveryDraftCommand(view, copy)); };
  bad(d => { d.timezone = 'UTC'; });
  bad(d => { d.tasks[0].references = ['S3']; });
  bad(d => { d.tasks[1].proposalId = '99999999-9999-4999-8999-999999999999'; });
  bad(d => { d.tasks.shift(); });
  bad(d => { d.tasks.forEach(task => { task.scheduled = false; }); d.tasks[0].predecessors = [d.tasks[1].key]; });
  bad(d => { d.tasks[0].predecessors = ['missing']; });
  bad(d => { d.tasks[0].duration = '1.5'; });
  bad(d => { d.tasks[0].label = '<script>alert(1)</script>'; });
  bad(d => { d.tasks[0].startDate = '2026-10-17'; });
});
test('mutation response must confirm the exact command version, mode and preview transition', () => {
  const before = fixture(true), draft = draftDelivery(before, 'UTC');
  Object.assign(draft.tasks[0], { label: 'Website delivery', duration: '2', references: ['S1'] });
  const command = deliveryDraftCommand(before, draft), ready = fixture();
  if (ready.status !== 'ready') throw Error('Fixture');
  ready.version = 11; ready.plan.revision = 0; ready.plan.preview!.baseWorkspaceVersion = 10; ready.plan.preview!.stagedWorkspaceVersion = 11;
  assert.equal(verifyDeliveryOutcome(before, command, ready), ready);
  assert.throws(() => verifyDeliveryOutcome(before, command, { ...ready, version: 12 }));
  assert.throws(() => verifyDeliveryOutcome(before, command, { ...ready, mode: 'sandbox' }));
  assert.throws(() => verifyDeliveryOutcome(before, { ...command, expectedPreviewId: ready.plan.preview!.id }, ready));
});
test('delivery response reader rejects oversized, malformed and unexpected-private-field bodies', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(1_048_577)); }, cancel() { cancelled = true; } });
  await assert.rejects(readDeliveryResponse(new Response(stream))); assert.equal(cancelled, true);
  await assert.rejects(readDeliveryResponse(new Response(new Uint8Array([0xff]))));
  await assert.rejects(readDeliveryResponse(Response.json({ ...fixture(), ownerToken: 'fictional-field-must-be-rejected' })));
  assert.equal((await readDeliveryResponse(Response.json(fixture(true)))).status, 'unconfigured');
});
