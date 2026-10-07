import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Invoice, Proposal, Workspace } from '../lib/domain';
import { ownerAnalytics } from '../lib/owner-analytics';

const now = new Date('2026-10-07T12:34:56Z');
const invoice = (id: string, status: Invoice['status'], outstandingCents: number, dueDate = '2026-10-06'): Invoice => ({
  id, proposalId: 'private-proposal', status, amountCents: 10000, outstandingCents, dueDate,
  createdAt: '2026-10-01T00:00:00Z', reminders: 0, payUrl: 'https://private.example/payment-secret',
  recipientEmail: 'private@example.com', pendingReminder: { draftId: 'private-draft', startedAt: 'private-time' },
});
const proposal = (id: string, status: Proposal['status'], amountCents: number): Proposal => ({
  id, status, amountCents, request: 'private request', deliverables: ['private work'],
  analysis: { classification: 'additional', summary: 'private model reasoning', references: ['S1'], questions: [], deliverables: ['private work'], source: 'simulation' },
});
const workspace = (): Workspace => ({ version: 3, mode: 'sandbox', clientToken: 'private-token',
  agreementStatus: 'accepted', agreement: { title: 'private-project', clientName: 'private-name', clientEmail: 'private@example.com', amountCents: 10000, clauses: [{ id: 'S1', text: 'private clause' }] },
  baseInvoiceKey: 'private-key', proposals: [], invoices: [], audit: [{ id: 'private-id', time: 'private-time', actor: 'You', title: 'private-title', detail: 'private-detail' }],
  policies: { protectedClient: true, reminderLimit: 3, cooldownDays: 7 }, integrationError: 'private provider error',
});

test('analytics separates receivables, partial balances, approvals and private record data without writes or network', () => {
  const state = workspace();
  state.invoices = [invoice('a', 'UNPAID', 10000), invoice('b', 'PARTIALLY_PAID', 123), invoice('c', 'PAID', 0),
    invoice('d', 'DRAFT', 10000), invoice('e', 'CANCELLED', 10000), invoice('f', 'OTHER', 10000),
    invoice('g', 'UNPAID', 2, '2026-10-07'), invoice('h', 'UNPAID', 3, '2026-10-08')];
  state.proposals = [proposal('a', 'draft', 999), proposal('b', 'approved', 1), proposal('c', 'accepted', 2), proposal('d', 'declined', 999)];
  const before = structuredClone(state), oldFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw Error('Network forbidden'); };
  try {
    const result = ownerAnalytics(state, now);
    assert.deepEqual(result.totals, { outstandingCents: 10128, overdueCents: 10123, unknownDueDateCents: 0,
      approvedExtraCents: 3, awaitingAcceptanceCents: 1, awaitingAcceptanceCount: 1, statusReviewCount: 1 });
    assert.equal(result.invoices[1].receivableCents, 123);
    assert.equal(result.invoices[6].ageBucket, 'not-overdue');
    assert.equal(result.invoices[7].ageBucket, 'not-overdue');
    assert.equal(result.mode, 'sandbox'); assert.equal(result.version, 3);
    assert.equal(JSON.stringify(result).includes('private'), false);
    assert.deepEqual(Object.keys(result.invoices[0]), ['recordIndex', 'status', 'amountCents', 'outstandingCents', 'receivableCents', 'dueDate', 'overdueDays', 'ageBucket', 'needsStatusReview']);
    assert.deepEqual(state, before);
    result.invoices[0].outstandingCents = 0; result.changes[1].approvedCents = 0;
    assert.deepEqual(state, before);
  } finally { globalThis.fetch = oldFetch; }
});

test('ageing uses UTC calendar days with exact bucket edges and visibly unknown invalid dates', () => {
  const state = workspace();
  const days = [0, 1, 30, 31, 60, 61, 90, 91];
  state.invoices = days.map((days, index) => invoice(String(index), 'UNPAID', 1,
    new Date(Date.parse('2026-10-07T00:00:00Z') - days * 86400000).toISOString().slice(0, 10)));
  for (const value of ['2026-02-30', '2026-10-07T00:00:00Z', 'private-invalid-date']) state.invoices.push(invoice(value, 'UNPAID', 1, value));
  const result = ownerAnalytics(state, new Date('2026-10-07T00:01:00Z'));
  assert.deepEqual(result.invoices.slice(0, 8).map(row => row.ageBucket), ['not-overdue', '1-30', '1-30', '31-60', '31-60', '61-90', '61-90', '91+']);
  assert.equal(result.totals.outstandingCents, 11); assert.equal(result.totals.overdueCents, 7);
  assert.equal(result.totals.unknownDueDateCents, 3);
  for (const row of result.invoices.slice(8)) { assert.equal(row.dueDate, null); assert.equal(row.overdueDays, null); assert.equal(row.ageBucket, 'unknown'); }
  state.invoices = [invoice('leap', 'UNPAID', 1, '2024-02-29')];
  assert.equal(ownerAnalytics(state, new Date('2024-03-01T00:00:00Z')).invoices[0].overdueDays, 1);
});

test('inconsistent status needs review; unsafe money, duplicates and aggregate overflow reject without leaking inputs', () => {
  const state = workspace();
  state.invoices = [invoice('a', 'PAID', 1), invoice('b', 'UNPAID', 0)];
  assert.equal(ownerAnalytics(state, now).totals.statusReviewCount, 2);
  assert.equal(ownerAnalytics(state, now).totals.outstandingCents, 0);
  const reject = () => assert.throws(() => ownerAnalytics(state, now), { message: 'Analytics records require review before totals can be displayed.' });
  for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 10001]) {
    state.invoices = [invoice('private-sensitive-id', 'UNPAID', value)]; reject();
  }
  state.invoices = [invoice('duplicate', 'UNPAID', 1), invoice('duplicate', 'UNPAID', 1)]; reject();
  state.invoices = []; state.proposals = [proposal('duplicate', 'approved', 1), proposal('duplicate', 'accepted', 1)]; reject();
  state.proposals = [proposal('a', 'approved', Number.MAX_SAFE_INTEGER), proposal('b', 'accepted', 1)]; reject();
  state.proposals = []; state.invoices = [invoice('a', 'UNPAID', Number.MAX_SAFE_INTEGER), invoice('b', 'UNPAID', 1)];
  state.invoices[0].amountCents = Number.MAX_SAFE_INTEGER; reject();
  state.invoices = []; assert.throws(() => ownerAnalytics(state, new Date('invalid')));
  assert.deepEqual(ownerAnalytics(state, now).totals, { outstandingCents: 0, overdueCents: 0, unknownDueDateCents: 0, approvedExtraCents: 0,
    awaitingAcceptanceCents: 0, awaitingAcceptanceCount: 0, statusReviewCount: 0 });
});
