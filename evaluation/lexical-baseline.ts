import type { Agreement } from '../lib/domain';

const stopWords = new Set('a an and are as at be by can do for from i in is it me my of on or please so the these this to we with you your'.split(' '));
function words(text: string) {
  return new Set((text.toLowerCase().match(/[a-z]+/g) || []).filter(word => !stopWords.has(word)));
}

// Generic lexical retrieval. No case IDs, expected labels, model, store or payment tools.
export function lexicalBaseline(request: string, agreement: Agreement) {
  const query = words(request);
  const candidates = agreement.clauses.flatMap(clause => clause.text.split(/[.!?]+/).filter(sentence => sentence.trim()).map(sentence => {
    const terms = words(sentence);
    const shared = [...query].filter(word => terms.has(word)).length;
    const score = query.size && terms.size ? shared / Math.sqrt(query.size * terms.size) : 0;
    const classification = /\b(excluded|exclude|excludes)\b/i.test(sentence) ? 'additional' as const : /\b(clarification|clarify)\b/i.test(sentence) ? 'ambiguous' as const : /\b(included|includes|deliver|supplies)\b/i.test(sentence) ? 'included' as const : 'ambiguous' as const;
    return { id: clause.id, score, classification };
  })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const best = candidates[0];
  const tied = best && best.score > 0 ? candidates.filter(candidate => Math.abs(candidate.score - best.score) < 1e-9) : [];
  const classification = tied.length && new Set(tied.map(candidate => candidate.classification)).size === 1 ? tied[0].classification : 'ambiguous';
  return { classification, summary: 'Non-AI lexical comparison only. Human review must check meaning, conditions, negation and mixed requests.',
    references: [...new Set(tied.map(candidate => candidate.id))], questions: classification === 'ambiguous' ? ['Which agreed deliverables and conditions apply to this request?'] : [],
    deliverables: ['Review the requested work manually'] };
}
