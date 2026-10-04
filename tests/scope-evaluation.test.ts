import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreementSchema } from '../lib/domain';
import { scopeAgreement, scopeCases } from '../evaluation/scope-cases';
import { scoreScope } from '../evaluation/score-scope';

const output = { classification: 'additional', summary: 'Booking functionality is explicitly excluded from the approved agreement.', references: ['S5'], questions: [], deliverables: ['Appointment booking with time slots'] };
test('all 25 scope cases have unique labels and real required clauses; scorer detects wrong or fabricated evidence', () => {
  agreementSchema.parse(scopeAgreement);
  assert.equal(scopeCases.length, 25); assert.equal(new Set(scopeCases.map(c => c.id)).size, 25);
  for (const c of scopeCases) { assert.ok(c.requiredReferences.length); assert.ok(c.requiredReferences.every(id => scopeAgreement.clauses.some(s => s.id === id))); }
  assert.equal(scoreScope('08', output).automatedChecksPassed, true);
  assert.equal(scoreScope('08', { ...output, classification: 'included' }).classificationCorrect, false);
  for (const candidate of [{ ...output, references: ['S99'] }, { ...output, references: ['S1'] }, { ...output, references: ['S5', 'S5'] }, { ...output, priceCents: 90000 }, { ...output, source: 'simulation' }]) assert.equal(scoreScope('08', candidate).automatedChecksPassed, false);
  assert.throws(() => scoreScope('99', output), /Unknown/);
});
test('automated scope checks never establish semantic safety or genuine model usage', () => {
  const ambiguous = { ...output, classification: 'ambiguous', references: ['S5', 'S7'] };
  assert.equal(scoreScope('21', ambiguous).automatedChecksPassed, false);
  const unclearQuestion = scoreScope('21', { ...ambiguous, questions: ['What colour is your logo?'] });
  assert.equal(unclearQuestion.automatedChecksPassed, true); assert.equal(unclearQuestion.manualReviewRequired, true);
  const inventedTerms = scoreScope('08', { ...output, summary: 'Booking is excluded by S5. The extra is approved and priced at USD 900.' });
  assert.equal(inventedTerms.automatedChecksPassed, true); assert.equal(inventedTerms.manualReviewRequired, true); assert.equal(inventedTerms.modelRunVerified, false);
  assert.ok(inventedTerms.manualChecks.some(x => x.includes('No invented price')));
});
