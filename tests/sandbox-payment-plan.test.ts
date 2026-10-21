import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { prepare, verify } = require('../scripts/sandbox-payment-plan.cjs');
const { reviewedApproval } = require('../scripts/sandbox-rehearsal-controller.cjs');
function fixture() {
  const now = Date.parse('2026-10-21T07:00:00Z');
  const agreement = { title: 'Fictional project', clientEmail: 'sb-fictional@personal.example.com', clauses: [{ id: 'S2', text: 'Booking excluded.' }] };
  const deliverables = ['Appointment booking with available time slots'];
  const state: any = { id: 'fictional-session', version: 3, expiresAt: now - 1000, phase: 'review', fixture: { merchantEmail: 'fictional@business.example.com', agreement }, attempts: { ai: 1, oauth: 0, create: 0, send: 0, read: 0 } };
  const workspace: any = { mode: 'sandbox', agreementStatus: 'accepted', agreement: structuredClone(agreement), proposals: [{ id: 'fictional-proposal', status: 'accepted', amountCents: 30000, deliverables, analysis: { source: 'elastic', classification: 'additional', references: ['S2'], deliverables }, scopeReview: { id: 'fictional-review', classification: 'additional', rationale: 'S2 explicitly excludes this requested booking work.', references: ['S2'], deliverables } }], invoices: [] };
  return { now, state, workspace, session: { snapshot: () => structuredClone(state) } };
}
test('offline plan matches existing exact-body validation and preserves source state without authorising activation', () => {
  const f = fixture(), before = structuredClone({ state: f.state, workspace: f.workspace }), plan = prepare(f);
  assert.equal(plan.activationPermitted, false); assert.equal(plan.kind, 'matched-payment-preparation-only');
  assert.deepEqual(plan.proposedApproval, reviewedApproval(f.state.fixture, f.workspace, 'fictional-proposal', '2026-10-28'));
  assert.equal(plan.proposedApproval.body.items[0].unit_amount.value, '300.00'); assert.equal(verify(plan, f), true);
  assert.deepEqual({ state: f.state, workspace: f.workspace }, before);
});
test('changed amount, recipient, unaccepted status, missing review and existing invoice reject preparation', () => {
  for (const mutate of [
    (f: any) => { f.workspace.proposals[0].amountCents = 30100; },
    (f: any) => { f.workspace.agreement.clientEmail = 'changed@example.com'; },
    (f: any) => { f.workspace.proposals[0].status = 'approved'; },
    (f: any) => { delete f.workspace.proposals[0].scopeReview; },
    (f: any) => { f.workspace.invoices.push({ id: 'already-created' }); },
    (f: any) => { f.workspace.processing = { operation: 'createInvoice' }; },
  ]) { const f = fixture(); mutate(f); assert.throws(() => prepare(f)); }
});
test('used or changed source authority cannot create a replacement financial budget', () => {
  for (const mutate of [
    (f: any) => { f.state.attempts.create = 1; },
    (f: any) => { f.state.attempts.oauth = 1; },
    (f: any) => { f.state.attempts.ai = 0; },
    (f: any) => { f.state.phase = 'payment'; },
    (f: any) => { f.state.expiresAt = f.now + 1; },
    (f: any) => { f.state.approval = {}; },
  ]) { const f = fixture(); mutate(f); assert.throws(() => prepare(f)); }
});
test('verification binds original response, review, ledger, workspace and UTC due-date day', () => {
  for (const mutate of [
    (f: any) => { f.workspace.proposals[0].analysis.summary = 'changed'; },
    (f: any) => { f.workspace.proposals[0].scopeReview.rationale += ' Changed.'; },
    (f: any) => { f.state.version++; },
    (f: any) => { f.workspace.proposals[0].clientExplanation = { message: 'changed' }; },
    (f: any) => { f.now += 86400000; },
  ]) { const f = fixture(), plan = prepare(f); mutate(f); assert.throws(() => verify(plan, f)); }
  const f = fixture(), plan = prepare(f); plan.activationPermitted = true; assert.throws(() => verify(plan, f));
});
