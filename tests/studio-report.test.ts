import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownerAnalytics } from '../lib/owner-analytics';
import { studioData } from '../lib/studio-report';
import type { Workspace } from '../lib/domain';

test('Studio preserves partial-payment cents through aggregation and formats USD without copying snapshot metadata', () => {
  const workspace: Workspace = { version: 1, mode: 'demo', clientToken: 'private-token', agreementStatus: 'accepted',
    agreement: { title: 'private-title', clientName: 'private-name', clientEmail: 'private@example.com', amountCents: 10000, clauses: [] },
    proposals: [], audit: [], policies: { protectedClient: false, reminderLimit: 3, cooldownDays: 7 },
    invoices: [123, 456].map((outstandingCents, index) => ({ id: `private-${index}`, proposalId: 'private-proposal', status: 'PARTIALLY_PAID', amountCents: 10000,
      outstandingCents, createdAt: '2026-10-01', dueDate: '2026-10-06', reminders: 0 })) };
  const source = studioData(ownerAnalytics(workspace, new Date('2026-10-07T00:00:00Z'))).sources[0];
  assert.ok('data' in source);
  const total = source.data.reduce((value, row) => value + Number(row.receivableCents), 0);
  assert.equal(total, 579);
  const field = source.fields!.find(field => field.id === 'receivableCents')!;
  const formatter = field.createValueFormatter!(undefined, {} as never) as (value: number) => string;
  assert.equal(formatter(total), '$5.79'); assert.equal(formatter(1), '$0.01');
  assert.equal(JSON.stringify(source.data).includes('private'), false);
  assert.equal(source.data[0].receivableUsd, 1.23);
  assert.deepEqual(Object.keys(source.data[0]), ['record', 'status', 'age', 'receivableCents', 'receivableUsd', 'dueDate']);
});
