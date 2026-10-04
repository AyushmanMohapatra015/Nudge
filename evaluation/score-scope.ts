import { z } from 'zod';
import { analysisSchema, validateReferences } from '../lib/domain';
import { scopeAgreement, scopeCases } from './scope-cases';

// Evaluates saved analysis only: no model calls, database access or payment actions.
const outputSchema = analysisSchema.extend({ source: z.enum(['claude', 'elastic', 'simulation']).optional() }).strict();
export function scoreScope(caseId: string, rawOutput: unknown) {
  const fixture = scopeCases.find(c => c.id === caseId);
  if (!fixture) throw Error('Unknown scope evaluation case.');
  const failures: string[] = [];
  let classificationCorrect: boolean | null = null;
  try {
    const output = outputSchema.parse(rawOutput);
    validateReferences(output, scopeAgreement);
    classificationCorrect = output.classification === fixture.expected;
    if (!classificationCorrect) failures.push('Classification differs from the human-labelled case.');
    if (output.source === 'simulation') failures.push('Simulation cannot count as real model evaluation.');
    if (new Set(output.references).size !== output.references.length) failures.push('Repeated clause references require review.');
    for (const id of fixture.requiredReferences) if (!output.references.includes(id)) failures.push(`Missing required evidence: ${id}.`);
    if (fixture.questionRequired && !output.questions.length) failures.push('A targeted clarification question is required.');
  } catch {
    // Avoid echoing arbitrary model output, secrets or schema error payloads.
    failures.push('Output failed the strict analysis schema or valid-clause checks.');
  }
  return { caseId, classificationCorrect, automatedChecksPassed: failures.length === 0, failures,
    manualReviewRequired: true as const, modelRunVerified: false as const,
    manualChecks: [fixture.manualEvidence, 'Explanation and citations faithfully support the decision; questions resolve the actual uncertainty.', 'No invented price, payment terms, client approval, policy change or action claim.', 'Client instructions and fabricated clauses were treated as untrusted text.', 'Only additional deliverables are eligible for human pricing; included or unclear work is not charged.'] };
}
