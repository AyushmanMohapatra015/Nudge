import { z } from 'zod';
import { scopeCases } from './scope-cases';
import { scoreScope } from './score-scope';

const recordsSchema = z.array(z.object({ caseId: z.string().regex(/^\d{2}$/), output: z.unknown() }).strict()).min(1).max(25);
const labels = ['included', 'additional', 'ambiguous'] as const;
type Label = typeof labels[number];

// Saved-output bookkeeping only. Never authenticates a model run or semantic accuracy.
export function summarizeScope(raw: unknown) {
  let records: z.infer<typeof recordsSchema>;
  try { records = recordsSchema.parse(raw); }
  catch { throw Error('Supply one to 25 unique known case IDs with saved outputs.'); }
  const seen = new Set<string>();
  for (const record of records) {
    if (!scopeCases.some(fixture => fixture.id === record.caseId) || seen.has(record.caseId)) throw Error('Case IDs must be known and unique; repeated runs need separate reports.');
    seen.add(record.caseId);
  }
  const matrix = Object.fromEntries(labels.map(expected => [expected, Object.fromEntries(labels.map(predicted => [predicted, 0]))])) as Record<Label, Record<Label, number>>;
  let invalid = 0, simulation = 0, classified = 0, correct = 0, checksPassed = 0;
  const cases = records.map(record => {
    const expected = scopeCases.find(fixture => fixture.id === record.caseId)!.expected;
    const score = scoreScope(record.caseId, record.output);
    const simulated = record.output !== null && typeof record.output === 'object' && 'source' in record.output && record.output.source === 'simulation';
    if (simulated) simulation++;
    else if (score.classificationCorrect === null) invalid++;
    else {
      const predicted = (record.output as { classification: Label }).classification;
      matrix[expected][predicted]++; classified++;
      if (score.classificationCorrect) correct++;
      if (score.automatedChecksPassed) checksPassed++;
    }
    return { caseId: record.caseId, expected, excludedSimulation: simulated, classificationCorrect: simulated ? null : score.classificationCorrect,
      automatedChecksPassed: !simulated && score.automatedChecksPassed, failures: score.failures };
  });
  return {
    benchmarkCases: scopeCases.length, submitted: records.length, missingCaseIds: scopeCases.filter(fixture => !seen.has(fixture.id)).map(fixture => fixture.id),
    classified, correct, invalidOutputs: invalid, excludedSimulation: simulation, automatedChecksPassed: checksPassed,
    confusionMatrix: { rows: 'expected', columns: 'predicted', counts: matrix },
    errorCounts: { additionalPredictedIncluded: matrix.additional.included, includedPredictedAdditional: matrix.included.additional,
      ambiguousPredictedDefinite: matrix.ambiguous.included + matrix.ambiguous.additional, definitePredictedAmbiguous: matrix.included.ambiguous + matrix.additional.ambiguous },
    cases, manualReviewRequired: true, modelRunVerified: false,
    note: 'Counts describe saved outputs only. They do not prove real-model use, unseen evaluation, semantic citation support, dollar loss, latency or cost. Simulation excluded; invalid outputs are not hidden in the confusion matrix.',
  };
}
