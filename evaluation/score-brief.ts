import { validateStructuredBrief } from '../lib/brief-extraction';
import { briefCases } from './brief-cases';

export function scoreBrief(caseId: string, rawOutput: unknown) {
  const fixture = briefCases.find(c => c.id === caseId);
  if (!fixture) throw new Error(`Unknown brief case: ${caseId}`);
  const failures: string[] = [];
  try {
    const { candidate } = validateStructuredBrief(rawOutput, fixture.notes);
    for (const [field, expected] of Object.entries(fixture.expected)) {
      if (candidate[field as keyof typeof fixture.expected] !== expected) failures.push(`${field}: expected ${JSON.stringify(expected)}.`);
    }
    for (const issue of fixture.issues) {
      if (!candidate.unresolved.some(i => i.field === issue.field && (!issue.kind || i.kind === issue.kind))) failures.push(`Missing ${issue.kind || 'clarification'} issue for ${issue.field}.`);
    }
  } catch {
    // Do not echo provider payloads or credentials through validation errors.
    failures.push('Response failed the structured schema, amount or source-evidence checks.');
  }
  return { caseId, automatedChecksPassed: failures.length === 0, failures, manualReviewRequired: true as const, manualChecks: fixture.manualChecks };
}
