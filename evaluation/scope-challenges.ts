import { analysisSchema, validateReferences, type Analysis } from '../lib/domain';
import { scopeAgreement, scopeCases } from './scope-cases';
import { z } from 'zod';

// Small development regression suite, frozen before live execution. Not held-out data.
export type ScopeChallenge = {
  id: string; request: string; expected: Analysis['classification']; references: string[];
  needsQuestion: boolean; mockDeliverable: string; mockQuestion?: string; manualChecks: string[];
};
const existing = (id: string) => scopeCases.find(c => c.id === id)!;
export const scopeChallenges: ScopeChallenge[] = [
  { id: 'mixed-checkout', request: existing('23').request, expected: 'additional', references: ['S3', 'S5'], needsQuestion: false,
    mockDeliverable: 'Online checkout', manualChecks: ['Explain that the first-round heading colour change is included.', 'List checkout only as additional; do not include the colour change in deliverables.'] },
  { id: 'revision-count', request: existing('19').request, expected: 'ambiguous', references: ['S3'], needsQuestion: true,
    mockDeliverable: 'Another revision round', mockQuestion: 'How many revision rounds have already been used?', manualChecks: ['Ask how many rounds have been used, without assuming both are finished.', 'Do not automatically classify the requested round as additional.'] },
  { id: 'booking-button', request: existing('21').request, expected: 'ambiguous', references: ['S5', 'S7'], needsQuestion: true,
    mockDeliverable: 'Booking button', mockQuestion: 'Is this an external booking link or a built-in scheduling system?', manualChecks: ['Distinguish an external link from implementing booking.', 'Do not infer a scheduling system from the word button.'] },
  { id: 'post-launch-form', request: existing('22').request, expected: 'ambiguous', references: ['S5', 'S6'], needsQuestion: true,
    mockDeliverable: 'Repair the broken form after launch', mockQuestion: 'Is this a defect in the agreed form or new maintenance work?', manualChecks: ['Ask whether the repair concerns the agreed deliverable or new maintenance.', 'Do not assume defect repair is an extra just because launch has happened.'] },
  { id: 'unlisted-blog', request: existing('18').request, expected: 'ambiguous', references: ['S1', 'S7'], needsQuestion: true,
    mockDeliverable: 'Blog page', mockQuestion: 'Does this replace an agreed page or expand the agreed scope?', manualChecks: ['Use the named-page scope and clarification rule without inventing an explicit blog exclusion.', 'Ask a relevant scope question, not a budget question.'] },
  { id: 'mixed-unknown-revision', request: 'Add appointment booking with time slots and another round of heading-colour revisions. I have not said how many revision rounds we have used.',
    expected: 'additional', references: ['S3', 'S5'], needsQuestion: true, mockDeliverable: 'Appointment booking with time slots', mockQuestion: 'How many included revision rounds have already been used?',
    manualChecks: ['Booking is explicitly additional; revision status remains unresolved.', 'List booking only among additional deliverables, and ask about the revision count.', 'Do not charge for the unresolved revision or treat it as already included.'] },
];

export function scoreScopeChallenge(id: string, raw: unknown) {
  const fixture = scopeChallenges.find(c => c.id === id);
  if (!fixture) throw Error('Unknown scope challenge.');
  const failures: string[] = [];
  let classificationCorrect = false;
  try {
    const output = analysisSchema.extend({ source: analysisSource }).strict().parse(raw);
    validateReferences(output, scopeAgreement);
    classificationCorrect = output.classification === fixture.expected;
    if (!classificationCorrect) failures.push('Classification differs from the engineering expectation.');
    for (const reference of fixture.references) if (!output.references.includes(reference)) failures.push(`Missing required reference: ${reference}.`);
    if (fixture.needsQuestion ? !output.questions.length : output.questions.length !== 0) failures.push('Clarification presence differs from the expected scope uncertainty.');
  } catch { failures.push('Strict schema or clause validation failed.'); }
  return { caseId: id, classificationCorrect, automatedChecksPassed: failures.length === 0, failures,
    manualReviewRequired: true, modelRunVerified: false,
    manualChecks: [...fixture.manualChecks, 'Every citation supports the explanation; no invented price, approval, deadline or external action.', 'Questions address scope uncertainty and deliverables add no unrequested implementation choices.'] };
}

// Deliberately accepts only the real adapter label. The runner separately records mock/live provenance;
// no scorer can authenticate model execution from a source label alone.
const analysisSource = z.literal('elastic');
