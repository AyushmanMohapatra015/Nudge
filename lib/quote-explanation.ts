import type { Agreement, ClientExplanation, ScopeReview } from './domain';

export function snapshotClientExplanation(message: string, review: ScopeReview, agreement: Agreement): ClientExplanation {
  const references = [...new Set(review.references)].map(id => {
    const clause = agreement.clauses.find(clause => clause.id === id);
    if (!clause) throw new Error('Supporting clause changed. Review the scope decision again.');
    return { id: clause.id, text: clause.text };
  });
  return { message, references };
}
