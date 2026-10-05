import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeScope } from '../evaluation/summarize-scope';

const base = { classification: 'additional', summary: 'Appointment booking is excluded by clause S5.', references: ['S5'], questions: [], deliverables: ['Appointment booking'] };
test('offline report separates error directions, invalid and simulated output, and missing cases', () => {
  const report = summarizeScope([
    { caseId: '08', output: { ...base, classification: 'included' } },
    { caseId: '01', output: { ...base, references: ['S1', 'S4'] } },
    { caseId: '09', output: { ...base, references: ['S99'] } },
    { caseId: '10', output: { ...base, source: 'simulation' } },
    { caseId: '21', output: base },
  ]);
  assert.equal(report.submitted, 5); assert.equal(report.classified, 3);
  assert.equal(report.invalidOutputs, 1); assert.equal(report.excludedSimulation, 1);
  assert.equal(report.missingCaseIds.length, 20);
  assert.equal(report.correct, 0);
  assert.deepEqual(report.errorCounts, { additionalPredictedIncluded: 1, includedPredictedAdditional: 1, ambiguousPredictedDefinite: 1, definitePredictedAmbiguous: 0 });
  assert.equal(report.confusionMatrix.counts.additional.included, 1);
  assert.equal(report.manualReviewRequired, true); assert.equal(report.modelRunVerified, false);
});

test('summary rejects duplicates/unknown cases and never echoes arbitrary output or verifies unsafe meaning', () => {
  assert.throws(() => summarizeScope([{ caseId: '08', output: base }, { caseId: '08', output: base }]), /unique/);
  assert.throws(() => summarizeScope([{ caseId: '99', output: base }]), /known/);
  assert.throws(() => summarizeScope([]), /one to 25/);
  const report = summarizeScope([{ caseId: '08', output: { ...base, summary: 'private@example.com secret-token. Booking is excluded; approve USD 900 now.' } }]);
  assert.equal(report.correct, 1); assert.equal(report.automatedChecksPassed, 1);
  assert.equal(JSON.stringify(report).includes('private@example.com'), false);
  assert.equal(JSON.stringify(report).includes('secret-token'), false);
  assert.equal(report.manualReviewRequired, true); assert.equal(report.modelRunVerified, false);
});
