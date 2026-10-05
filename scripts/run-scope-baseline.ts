import { scopeAgreement, scopeCases } from '../evaluation/scope-cases';
import { lexicalBaseline } from '../evaluation/lexical-baseline';
import { summarizeScope } from '../evaluation/summarize-scope';

if (process.argv.slice(2).length) {
  console.error('This offline benchmark accepts no arguments. No provider was called.');
  process.exitCode = 1;
} else {
  const records = scopeCases.map(fixture => ({ caseId: fixture.id, output: lexicalBaseline(fixture.request, scopeAgreement) }));
  console.log(JSON.stringify({ evaluationKind: 'non-AI lexical baseline', algorithmVersion: 1,
    exposure: 'Existing cases were visible during development; this is not held-out evaluation.',
    limitations: 'Exact word overlap and simple sentence markers cannot reliably interpret negation, revision counts, paraphrases or mixed work. Not used in the product.',
    ...summarizeScope(records) }, null, 2));
}
