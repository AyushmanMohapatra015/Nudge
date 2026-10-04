import { test } from 'node:test';
import assert from 'node:assert/strict';
import { briefCases } from '../evaluation/brief-cases';
import { scoreBrief } from '../evaluation/score-brief';
import type { StructuredBrief } from '../lib/brief-extraction';
const empty = (): StructuredBrief => ({ title: null, suggestedTitle: false, clientName: null, clientEmail: null, amountText: null, currency: null, clauses: [], evidence: [], unresolved: [] });

test('evaluation detects source-supported budget misinterpretation rather than only malformed output', () => {
  const fixture = briefCases.find(c => c.id === 'B03')!;
  const evidence = (field: 'currency' | 'amountText', excerpt: string) => ({ field, clauseIndex: null, excerpt, start: fixture.notes.indexOf(excerpt), end: fixture.notes.indexOf(excerpt) + excerpt.length });
  const raw = { ...empty(), currency: 'USD', amountText: '1,200', evidence: [evidence('currency', 'USD'), evidence('amountText', '1,200')] };
  const report = scoreBrief('B03', raw);
  assert.equal(report.automatedChecksPassed, false);
  assert.ok(report.failures.some(f => f.includes('amountCents')));
  assert.equal(report.manualReviewRequired, true);
  assert.equal(scoreBrief('B03', { ...raw, amountText: null, evidence: [evidence('currency', 'USD')] }).automatedChecksPassed, true);
});
test('evaluation rejects selected contact recipients and injected actions, and preserves mandatory manual review', () => {
  const fixture = briefCases.find(c => c.id === 'B07')!;
  const email = 'designer@example.com', start = fixture.notes.indexOf(email);
  const selected = { ...empty(), clientName: 'Fictional Studio', clientEmail: email, evidence: [
    { field: 'clientName', clauseIndex: null, excerpt: 'Fictional Studio', start: fixture.notes.indexOf('Fictional Studio'), end: fixture.notes.indexOf('Fictional Studio') + 'Fictional Studio'.length },
    { field: 'clientEmail', clauseIndex: null, excerpt: email, start, end: start + email.length },
  ] };
  assert.ok(scoreBrief('B07', selected).failures.some(f => f.startsWith('clientEmail')));
  assert.equal(scoreBrief('B10', { ...empty(), approveAgreement: true }).automatedChecksPassed, false);
  const incomplete = scoreBrief('B02', empty());
  assert.equal(incomplete.automatedChecksPassed, true);
  assert.equal(incomplete.manualReviewRequired, true);
  assert.ok(incomplete.manualChecks.length > 0);
  assert.equal(scoreBrief('B01', empty()).automatedChecksPassed, false, 'empty responses cannot pass complete briefs');
  assert.equal(briefCases.length, 12);
  assert.equal(new Set(briefCases.map(c => c.id)).size, 12);
  assert.throws(() => scoreBrief('unknown', empty()), /Unknown brief case/);
});
