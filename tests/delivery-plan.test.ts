import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Workspace } from '../lib/domain';
import { deliveryEndDate, validateDeliverySnapshot, type DeliveryCalendar, type DeliverySnapshot, type DeliveryTask } from '../lib/delivery-plan';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const P = '44444444-4444-4444-8444-444444444444';
const calendar = (): DeliveryCalendar => ({ timezone: 'Asia/Kolkata', weekdays: [1, 2, 3, 4, 5], holidays: [] });
const task = (patch: Partial<DeliveryTask> = {}): DeliveryTask => ({ id: A, label: 'Build website', kind: 'base',
  references: ['S1'], proposalId: null, duration: 3, startDate: '2026-10-16', endDateExclusive: '2026-10-21', ...patch });
const snapshot = (...tasks: DeliveryTask[]): DeliverySnapshot => ({ tasks: tasks.length ? tasks : [task()], dependencies: [] });
function authority(): Workspace {
  return { version: 4, mode: 'sandbox', clientToken: 'private-marker', agreementStatus: 'accepted',
    agreement: { title: 'Private project', clientName: 'Private client', clientEmail: 'fictional@example.com', amountCents: 120000,
      clauses: [{ id: 'S1', text: 'Five website pages.' }, { id: 'S3', text: 'Booking is excluded.' }] },
    proposals: [{ id: P, request: 'Private request', status: 'accepted', amountCents: 30000, deliverables: ['Booking'],
      analysis: { source: 'simulation', classification: 'additional', summary: 'Private output', references: ['S3'], questions: [], deliverables: ['Booking'] },
      scopeReview: { id: 'review', actor: 'You', reviewedAt: '2026-10-15T00:00:00Z', classification: 'additional',
        rationale: 'Reviewed booking exclusion', references: ['S3'], clarification: '', deliverables: ['Booking'] } }],
    invoices: [{ id: 'INV2-FICTIONAL', proposalId: P, status: 'PAID', amountCents: 30000, outstandingCents: 0,
      payUrl: 'https://private.example/payment', createdAt: '2026-10-15T00:00:00Z', dueDate: '2026-10-20', reminders: 0 }],
    policies: { protectedClient: true, cooldownDays: 7, reminderLimit: 3 }, promiseDate: '2026-10-30',
    audit: [{ id: 'audit', time: '2026-10-15T00:00:00Z', actor: 'You', title: 'Private history', detail: 'private-marker' }] };
}
const applied = (current = snapshot()) => ({ phase: 'preview' as const, current, frozenCalendar: calendar() });
const extra = () => task({ id: B, kind: 'extra', label: 'Add booking', references: ['S3'], proposalId: P });

test('civil-date calculation handles weekends, explicit holidays, leap days and DST-zone calendars', () => {
  assert.equal(deliveryEndDate(calendar(), '2026-10-16', 3), '2026-10-21');
  assert.equal(deliveryEndDate({ ...calendar(), holidays: ['2026-10-19'] }, '2026-10-16', 3), '2026-10-22');
  assert.equal(deliveryEndDate(calendar(), '2026-10-16', 1), '2026-10-17');
  assert.equal(deliveryEndDate(calendar(), '2024-02-29', 1), '2024-03-01');
  for (const timezone of ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata']) {
    assert.equal(deliveryEndDate({ ...calendar(), timezone }, '2026-03-06', 2), '2026-03-10');
  }
  assert.equal(deliveryEndDate(calendar(), '2026-10-16', 0), '2026-10-16');
});

test('invalid dates, calendars, durations and overflow are rejected rather than normalized', () => {
  for (const date of ['2026-02-29', '2024-02-30', '2026-13-01', '2026-1-01', '2026-10-16T00:00:00Z', '2019-12-31', '2101-01-01', '2026-10-17']) {
    assert.throws(() => deliveryEndDate(calendar(), date, 1));
  }
  for (const duration of [-1, 0.5, 121, NaN, Infinity, '3']) assert.throws(() => deliveryEndDate(calendar(), '2026-10-16', duration));
  for (const bad of [{ ...calendar(), timezone: 'Invalid/Timezone' }, { ...calendar(), timezone: 'EST' },
    { ...calendar(), weekdays: [0, 1, 2, 3, 4] }, { ...calendar(), holidays: ['2026-10-19', '2026-10-19'] },
    { ...calendar(), holidays: ['2026-02-30'] }, { ...calendar(), autoSend: true }]) {
    assert.throws(() => deliveryEndDate(bad, '2026-10-16', 1));
  }
  assert.throws(() => deliveryEndDate({ ...calendar(), holidays: ['2026-10-16'] }, '2026-10-16', 1));
  assert.throws(() => deliveryEndDate(calendar(), '2100-12-31', 120));
});

test('validation is pure, clones its outputs and never substitutes payment dates or leaks authority records', () => {
  const owner = authority(), input = snapshot(), cal = calendar();
  const before = structuredClone({ owner, input, cal }), oldFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw Error('Network forbidden'); };
  try {
    const result = validateDeliverySnapshot(cal, input, owner, { phase: 'apply' });
    assert.equal(result.finishDateExclusive, '2026-10-21');
    assert.deepEqual(result.warnings, []);
    assert.equal(JSON.stringify(result).includes('private'), false);
    result.snapshot.tasks[0].label = 'Changed output'; result.calendar.holidays.push('2026-10-19');
    assert.deepEqual({ owner, input, cal }, before);
    assert.equal('deliveryPlan' in owner, false, 'legacy workspace not migrated on validation');
  } finally { globalThis.fetch = oldFetch; }
});

test('unknown dates remain unknown and only dependency-free unscheduled tasks can be applied', () => {
  const unscheduled = task({ id: B, label: 'Future milestone', kind: 'milestone', duration: 0, references: [], startDate: null, endDateExclusive: null });
  const input = snapshot(task(), unscheduled);
  assert.equal(validateDeliverySnapshot(calendar(), input, authority(), { phase: 'apply' }).finishDateExclusive, null);
  input.dependencies.push({ predecessorId: A, successorId: B, type: 'finish-to-start' });
  assert.equal(validateDeliverySnapshot(calendar(), input, authority()).unresolvedDependencies.length, 1);
  assert.throws(() => validateDeliverySnapshot(calendar(), input, authority(), { phase: 'apply' }), /unscheduled/);
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task({ startDate: null })), authority()), /both dates/);
});

test('dependencies reject unknown, self, duplicate, backward and cyclic links, including zero-duration cycles', () => {
  const marker = (id: string) => task({ id, kind: 'milestone', duration: 0, references: [], startDate: '2026-10-21', endDateExclusive: '2026-10-21' });
  const edge = (predecessorId: string, successorId: string) => ({ predecessorId, successorId, type: 'finish-to-start' as const });
  const owner = authority();
  for (const dependencies of [[edge(A, C)], [edge(A, A)], [edge(A, B), edge(A, B)], [edge(B, A)]]) {
    assert.throws(() => validateDeliverySnapshot(calendar(), { ...snapshot(task(), marker(B)), dependencies }, owner));
  }
  assert.throws(() => validateDeliverySnapshot(calendar(), { ...snapshot(task(), marker(B), marker(C)),
    dependencies: [edge(B, C), edge(C, B)] }, owner), /cycle/);
  const valid = validateDeliverySnapshot(calendar(), { ...snapshot(task(), marker(B)), dependencies: [edge(A, B)] }, owner, { phase: 'apply' });
  assert.equal(valid.finishDateExclusive, '2026-10-21');
});

test('only reviewed accepted extras may apply, while approved extras retain explicit preview warnings', () => {
  const owner = authority(), candidate = snapshot(task(), extra());
  assert.equal(validateDeliverySnapshot(calendar(), candidate, owner, { ...applied(), phase: 'apply' }).warnings.length, 0);
  owner.proposals[0].status = 'approved';
  assert.deepEqual(validateDeliverySnapshot(calendar(), candidate, owner, applied()).warnings, [{ code: 'awaiting-acceptance', taskId: B }]);
  assert.throws(() => validateDeliverySnapshot(calendar(), candidate, owner, { ...applied(), phase: 'apply' }), /acceptance/);
  for (const status of ['draft', 'declined'] as const) {
    owner.proposals[0].status = status;
    assert.throws(() => validateDeliverySnapshot(calendar(), candidate, owner, applied()), /reviewed/);
  }
  owner.proposals[0].status = 'accepted'; delete owner.proposals[0].scopeReview;
  assert.throws(() => validateDeliverySnapshot(calendar(), candidate, owner, applied()), /reviewed/);
  assert.throws(() => validateDeliverySnapshot(calendar(), candidate, authority()), /Initialize/);
});

test('proposal links and task provenance cannot be forged, duplicated or silently replaced', () => {
  const owner = authority();
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task(), extra(), { ...extra(), id: C }), owner, applied()), /only one/);
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task(), { ...extra(), proposalId: C }), owner, applied()), /reviewed/);
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task(), { ...extra(), references: ['S1'] }), owner, applied()), /reviewed/);
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task({ references: ['S3'] })), owner, applied()), /scope links/);
  const twoBase = snapshot(task(), task({ id: B }));
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task({ kind: 'milestone', duration: 0 }), task({ id: B })), owner, applied(twoBase)), /scope links/);
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task({ id: B })), owner, applied()), /removed/);
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task(), task({ id: B })), owner, applied()), /Only extras/);
});

test('calendar is frozen for applied plans, with explicit complete current-plan context required', () => {
  const owner = authority(), input = snapshot();
  assert.throws(() => validateDeliverySnapshot({ ...calendar(), timezone: 'UTC' }, input, owner, applied()), /calendar cannot/);
  assert.throws(() => validateDeliverySnapshot({ ...calendar(), holidays: ['2026-10-19'] }, input, owner, applied()), /calendar cannot/);
  assert.throws(() => validateDeliverySnapshot(calendar(), input, owner, { phase: 'preview', current: input }), /frozen calendar/);
  assert.throws(() => validateDeliverySnapshot(calendar(), input, owner, { phase: 'preview', frozenCalendar: calendar() }), /frozen calendar/);
  const cal = { ...calendar(), holidays: ['2026-12-25', '2026-12-24'] };
  const before = structuredClone(cal);
  validateDeliverySnapshot({ ...cal, holidays: [...cal.holidays].reverse() }, input, owner, { ...applied(), frozenCalendar: cal });
  assert.deepEqual(cal, before);
});

test('strict shape, evidence and graph-size limits reject forged fields with bounded generic errors', () => {
  const owner = authority();
  const invalid: unknown[] = [
    { ...snapshot(), autoPay: 'private-marker' }, snapshot({ ...task(), label: '<script>private-marker</script>' }),
    snapshot({ ...task(), references: [] }), snapshot({ ...task(), references: ['S1', 'S1'] }), snapshot({ ...task(), references: ['S99'] }),
    snapshot({ ...task(), duration: 0 }), snapshot({ ...task(), id: 'forged' }), snapshot(task(), task()),
    snapshot({ ...task(), endDateExclusive: '2026-10-20' }), snapshot({ ...task(), proposalId: P }),
    snapshot({ ...task(), kind: 'milestone', duration: 3 }), snapshot({ ...task(), label: 'https://private.example' }),
    { tasks: [], dependencies: [] }, { tasks: Array.from({ length: 81 }, () => task()), dependencies: [] },
    { ...snapshot(), dependencies: Array.from({ length: 161 }, () => ({ predecessorId: A, successorId: B, type: 'finish-to-start' })) },
  ];
  for (const input of invalid) {
    assert.throws(() => validateDeliverySnapshot(calendar(), input, owner), error => {
      assert.ok(error instanceof Error); assert.ok(error.message.length < 150); assert.equal(error.message.includes('private'), false); return true;
    });
  }
  owner.agreementStatus = 'approved';
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(), owner), /accepted agreement/);
  assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task(), task({ id: B, startDate: '2029-01-01', endDateExclusive: '2029-01-04' })), authority()), /date span/);
});

test('financial statuses do not approve extras, move dates or mark work complete', () => {
  for (const status of ['PAID', 'PARTIALLY_PAID', 'UNPAID', 'CANCELLED', 'OTHER'] as const) {
    const owner = authority(); owner.invoices[0].status = status; owner.invoices[0].outstandingCents = status === 'PAID' ? 0 : 123;
    owner.invoices[0].pendingSend = { key: 'uncertain', startedAt: '2026-10-15T00:00:00Z' };
    const before = structuredClone(owner);
    const result = validateDeliverySnapshot(calendar(), snapshot(task(), extra()), owner, { ...applied(), phase: 'apply' });
    assert.equal(result.snapshot.tasks[1].endDateExclusive, '2026-10-21');
    assert.equal('percentDone' in result.snapshot.tasks[1], false); assert.deepEqual(owner, before);
    owner.proposals[0].status = 'approved';
    assert.throws(() => validateDeliverySnapshot(calendar(), snapshot(task(), extra()), owner, { ...applied(), phase: 'apply' }), /acceptance/);
  }
});
