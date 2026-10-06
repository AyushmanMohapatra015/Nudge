import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analysisSchema, reminderGate, validateReferences, simulatedAnalysis, agreementSchema, type Invoice, type Agreement } from '../lib/domain';
import { reconcileInvoice } from '../lib/paypal';
const agreement: Agreement = { title: 'Website project', clientName: 'Olivia Chen', clientEmail: 'olivia@example.com', amountCents: 120000, clauses: [{ id: 'S1', text: 'Build a five-page marketing website.' }, { id: 'S2', text: 'Booking systems are excluded.' }] };
const unpaid: Invoice = { id: 'INV2-TEST', proposalId: 'test', status: 'UNPAID', amountCents: 120000, outstandingCents: 120000, createdAt: '2026-09-01T00:00:00Z', dueDate: '2026-09-15', reminders: 0 };
const now = new Date('2026-10-03T10:00:00Z');
const policies = { protectedClient: false, reminderLimit: 3, cooldownDays: 7 };
test('late unpaid invoice can be reminded, paid and cancelled invoices cannot', () => {
  assert.deepEqual(reminderGate(unpaid, policies, undefined, now), []);
  for (const status of ['PAID', 'CANCELLED', 'DRAFT', 'OTHER'] as const) assert.ok(reminderGate({ ...unpaid, status }, policies, undefined, now).length);
});
test('hard rules protect VIP clients, respect promises, counts, and cooldowns', () => {
  assert.match(reminderGate(unpaid, { ...policies, protectedClient: true }, undefined, now).join(' '), /protected/);
  assert.match(reminderGate(unpaid, policies, '2026-10-03', now).join(' '), /paused/);
  assert.deepEqual(reminderGate(unpaid, policies, '2026-10-02', now), []);
  assert.match(reminderGate({ ...unpaid, reminders: 3 }, policies, undefined, now).join(' '), /limit/);
  assert.match(reminderGate({ ...unpaid, lastRemindedAt: '2026-10-01T00:00:00Z' }, policies, undefined, now).join(' '), /cooldown/);
});
test('reminders are blocked until after the due date', () => {
  assert.match(reminderGate({ ...unpaid, dueDate: '2026-10-03' }, policies, undefined, now).join(' '), /not overdue/);
});
test('scope analysis rejects fabricated or absent supporting citations', () => {
  const analysis = simulatedAnalysis('Add a booking page', agreement);
  assert.equal(analysis.classification, 'additional');
  assert.equal(validateReferences(analysis, agreement).references[0], 'S2');
  assert.throws(() => validateReferences({ ...analysis, references: ['S99'] }, agreement), /does not exist/);
  assert.throws(() => validateReferences({ ...analysis, references: [] }, agreement), /must cite/);
  assert.throws(() => validateReferences({ ...analysis, references: ['S2', 'S2'] }, agreement), /duplicate/);
});

test('scope output rejects whitespace-only fields and trims usable descriptions before human review', () => {
  const analysis = simulatedAnalysis('Add a booking page', agreement);
  for (const invalid of [
    { ...analysis, summary: ' '.repeat(30) },
    { ...analysis, questions: ['   '] },
    { ...analysis, deliverables: ['   '] },
  ]) assert.equal(analysisSchema.safeParse(invalid).success, false);
  const normalized = analysisSchema.parse({ ...analysis, summary: `  ${analysis.summary}  `, questions: ['  Is a third revision requested?  '], deliverables: ['  Appointment booking  '] });
  assert.equal(normalized.summary, analysis.summary);
  assert.deepEqual(normalized.questions, ['Is a third revision requested?']);
  assert.deepEqual(normalized.deliverables, ['Appointment booking']);
});
test('unclear simulation requests remain ambiguous instead of inventing scope', () => {
  assert.equal(simulatedAnalysis('Please make it feel more modern', agreement).classification, 'ambiguous');
});
test('agreement validation rejects fractional cents and duplicate clause IDs', () => {
  assert.equal(agreementSchema.safeParse({ ...agreement, amountCents: 12.5 }).success, false);
  assert.equal(agreementSchema.safeParse({ ...agreement, clauses: [agreement.clauses[0], agreement.clauses[0]] }).success, false);
});
test('a partial PayPal payment preserves remaining balance rather than marking settled', () => {
  const remote = { id: unpaid.id, amount: { currency_code: 'USD', value: '1200.00' } };
  const invoice = reconcileInvoice(unpaid, { ...remote, status: 'PARTIALLY_PAID', due_amount: { currency_code: 'USD', value: '600.01' } });
  assert.equal(invoice.status, 'PARTIALLY_PAID'); assert.equal(invoice.outstandingCents, 60001);
  assert.equal(reconcileInvoice(unpaid, { ...remote, status: 'PAID' }).outstandingCents, 0);
  assert.equal(reconcileInvoice(unpaid, { ...remote, status: 'REFUNDED' }).status, 'OTHER');
});
