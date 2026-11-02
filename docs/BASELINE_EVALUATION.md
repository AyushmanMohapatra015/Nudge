# Non-AI scope baseline

Run date: October 5, 2026. Command: `npm run evaluation:baseline`.

## What runs

Algorithm version 1 splits the supplied agreement clauses into sentences, lowercases alphabetic words, removes a small fixed list of function words and ranks sentences by set-word overlap divided by the square root of the two set sizes. It uses explicit included/excluded/clarification sentence markers to assign a class. No overlap or conflicting tied classes produce ambiguous. It returns retrieved clause IDs and generic manual-review text, not a client-facing explanation.

The classifier receives request and agreement only. It does not access case IDs or expected labels; the runner joins outputs to the existing human-labelled cases afterward. It uses no model, embedding service, environment file, database, PayPal or network. It is evaluation tooling and is not connected to the website or used as an AI fallback.

## Observed existing-benchmark results

| Expected → predicted | Included | Additional | Ambiguous |
| --- | ---: | ---: | ---: |
| Included | 7 | 0 | 0 |
| Additional | 5 | 7 | 1 |
| Ambiguous | 2 | 1 | 2 |

- All 25 cases submitted, no missing or schema/invalid-clause outputs.
- Classification matched 16/25 labels; 12/25 passed all automated checks, including required evidence/question presence.
- Five additional cases predicted included; zero included cases predicted additional.
- Three ambiguous cases predicted definite; one definite case predicted ambiguous.

These are measured results for this lexical baseline on the already-visible fictional benchmark. They are not live AI results, held-out performance, user validation, semantic explanation quality or dollar-loss estimates. The existing cases were inspected during development; no unseen-case claim is made. The rules were not changed after this initial run to raise its score. Keep comparisons on the same cases and report development exposure; evaluate fresh held-out cases separately when ready.

## Limits and next comparison

Exact words miss paraphrases, counts, negation, context, mixed requests and implied work. Tests deliberately show that “do not add” can still match an exclusion. Ties yield a generic question rather than useful reasoning. Matching a label or real clause ID does not make the explanation safe. Manual review remains required, and modelRunVerified stays false. This baseline does not show that an LLM is better; that requires actual matched model measurements and semantic review after allowance confirmation.

All 70 server tests and TypeScript checks pass. The executable command was run successfully; an initial Windows sandbox restriction blocked tsx, then the same offline command ran with approval. No credentials, workspace data, model credits or payments used. Application/UI unchanged; previous browser/build verification remains current for those surfaces. Plain LLM baseline and repeated live runs remain conditional on confirmed allowance.
