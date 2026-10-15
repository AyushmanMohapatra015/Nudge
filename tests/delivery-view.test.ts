import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliveryViewSchema, deliverySelection, deliveryChartTasks } from '../lib/delivery-view';
import { deliveryStateFixture } from './fixtures/delivery-state';

test('delivery browser projection rejects private/unknown fields and preserves version choices', () => {
  const { plan } = deliveryStateFixture();
  const view = { version: 10, mode: 'demo', asOf: '2026-10-15T00:00:00.000Z', stateSource: 'local-records', remoteCheckedAt: null,
    status: 'ready', plan, previewStale: false, extras: [], invoices: [], planning: { agreementAccepted: true, clauses: [], eligibleExtras: [] } };
  const parsed = deliveryViewSchema.parse(view);
  assert.deepEqual(deliverySelection(parsed, 'original')?.snapshot, plan.original?.snapshot);
  assert.deepEqual(deliverySelection(parsed, 'current')?.snapshot, plan.current?.snapshot);
  assert.deepEqual(deliverySelection(parsed, 'preview')?.snapshot, plan.preview?.candidate.snapshot);
  for (const extra of [{ clientToken: 'should-not-appear' }, { remoteCheckedAt: '2026-10-15T00:00:00.000Z' }, { stateSource: 'remote' }, { version: -1 }])
    assert.equal(deliveryViewSchema.safeParse({ ...view, ...extra }).success, false);
  assert.equal(deliveryViewSchema.safeParse({ ...view, invoices: [{ payUrl: 'https://private.example' }] }).success, false);
  const { plan: _plan, previewStale: _stale, ...empty } = view;
  assert.equal(deliverySelection(deliveryViewSchema.parse({ ...empty, status: 'unconfigured' }), 'current'), null);
  assert.equal(deliveryViewSchema.safeParse({ ...view, status: 'review-needed' }).success, false);
});

test('chart projection keeps UTC day boundaries, omits unknown dates and never mutates the saved schedule', () => {
  const { plan } = deliveryStateFixture();
  const snapshot = structuredClone(plan.current!.snapshot);
  snapshot.tasks.push({ ...snapshot.tasks[0], id: '55555555-5555-4555-8555-555555555555', label: 'Unknown dates', startDate: null, endDateExclusive: null });
  const before = JSON.stringify(snapshot), tasks = deliveryChartTasks(snapshot);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].startDate, '2026-10-16T00:00:00.000Z');
  assert.equal(tasks[0].endDate, '2026-10-21T00:00:00.000Z');
  assert.equal(tasks[0].manuallyScheduled, true);
  tasks[0].name = 'Edited chart copy';
  assert.equal(JSON.stringify(snapshot), before);
});
