# PA-4 / B2: offline saved-output comparison

October29 actual saved-output application: run `node --import tsx scripts/compare-scope-runs.ts evaluation/saved-development-comparison.json`. SAVED_AI_COMPARISON.md records the matching cases, provenance, results and missing coverage. Historical saved results plus a fresh lexical computation do not establish current held-out model quality.

This companion compares supplied saved outputs on the existing 25 development-visible
fictional cases. It makes no model calls and measures no new model performance.
The original handback labelled all tests proposed-not-run. The primary workspace
has since integrated and tested the code offline; see AGENT_RESPONSE_REVIEW.md for
actual counts, fixture corrections and receipts. No provider batch, measured model
performance or platform-race verification follows from these tool tests. The CLI
file-symlink test remains explicitly skipped on this Windows host.

## Original handback file inventory

| Repo-relative file | Lines, including final newline |
| --- | ---: |
| evaluation/compare-scope-runs.ts | 190 |
| scripts/compare-scope-runs.ts | 38 |
| tests/scope-run-comparison.test.ts | 271 |
| EVALUATION_COMPARISON_GUIDE.md | 294 |

These are the agent's original line counts, not counts of the integrated files.
Primary corrections include error-message assertions, credential-free provider-blocked
CLI child environments, retained fictional fixtures instead of recursive deletion,
and an additional complete225-slot control. Preserve the original response files
as review evidence; do not regenerate the packet during integration.

## Reviewed evidence and outcome

Reviewed the B2 assignment and supplied snapshots: package.json; lib/domain.ts;
lib/scope-instructions.ts; evaluation/scope-cases.ts, score-scope.ts,
summarize-scope.ts, scope-challenges.ts and lexical-baseline.ts; scripts/score-scope.ts,
summarize-scope.ts and run-scope-baseline.ts; tests/scope-evaluation.test.ts,
scope-summary.test.ts and scope-challenges.test.ts; BASELINE_EVALUATION.md.
No repository checkout, runtime dependencies, actual saved comparison runs, allowance
confirmation or new provider evidence was supplied. Historical lexical results
(16/25 classification matches; 12/25 automated passes) are packet-reported history,
not a result of this implementation. No backend, prompts, labels or runner changed.

Existing boundaries, not newly discovered product defects:

| Evidence / exact supplied code | Fictional trigger and existing guard | Consequence and companion contract | Confidence / remaining hypothesis |
| --- | --- | --- | --- |
| scoreScope: `validateReferences(output, scopeAgreement);` then `classificationCorrect = output.classification === fixture.expected;` | Case 08 cites S99; catch leaves classificationCorrect null. Existing scope-evaluation test covers fabricated evidence. | Preserve invalidity; exclude from stability and matched predictions. A valid but incomplete S1 citation on case 01 can still classify while failing automated evidence checks. | High from source; runtime unverified. |
| summarizeScope: `if (simulated) simulation++; else if (score.classificationCorrect === null) invalid++;` | A saved object claims simulation, including a malformed object. Existing summary test covers valid simulation. | Simulation takes exclusion precedence over invalid count; no simulation predictions enter comparisons. New proposed malformed-simulation control preserves this order. | High from source; no actual saved run inspected. |
| summarizeScope: `if (fixture.questionRequired && !output.questions.length)` is enforced by scoreScope | Case 21 asks an irrelevant but nonempty question. Existing evaluation test demonstrates an automated pass. | Structural checks do not establish meaning; mandatory manual semantic review remains. | High; actual reviewer judgments absent. |
| summarizeScope schema: `.min(1).max(25)` | Repeat 2 is entirely missing. Empty slices cannot use the summarizer. | Emit missing coverage and null summary, never a measured zero-error competitor. Reuse existing summaries for every nonempty slice. | High; tests proposed. |

These are reasoned source sequences, not executed reproductions. No asynchronous
responses or competing provider activity occur in this pure companion; saved rows
are supplied snapshots, not evidence of provider execution, completeness or order.
No existing guard changes or recovery changes are proposed.

## Strict input schema

The root has exactly records and expectedRepeats (integer 1 through 3).
records has 1 through 225 strict rows, each with required system, caseId, repeat,
output and optional telemetry. system is lexical, plain_llm or nudge; caseId is an
existing two-digit ID 01 through 25; repeat is 1 through expectedRepeats. A
system/caseId/repeat key must be unique. output is unknown: malformed model output
counts as invalid rather than invalidating neighboring rows. output is required,
even when its value is null. The old strict scorer decides output validity.

telemetry has only optional inputTokens/outputTokens (safe nonnegative integers)
and latencyMs (finite nonnegative number). Unknown keys, nonfinite/unsafe values,
invalid indices, duplicate keys and unsafe aggregates cause one generic error.
Empty telemetry is permitted; supplied undefined/null fields are not numeric
observations. Use plain JSON data, not proxies, accessors or executable objects.

This example is explicitly synthetic; it is not an actual lexical or model run:

```json
{
  "expectedRepeats": 1,
  "records": [
    {
      "system": "plain_llm",
      "caseId": "08",
      "repeat": 1,
      "output": {
        "classification": "additional",
        "summary": "Synthetic example: appointment booking is excluded by S5.",
        "references": ["S5"],
        "questions": [],
        "deliverables": ["Appointment booking with time slots"],
        "source": "elastic"
      },
      "telemetry": { "inputTokens": 0, "latencyMs": 0 }
    }
  ]
}
```

The source label is a claim, not authentication. plain_llm is an experimental
group name and may use Elastic. No group/provider mismatch is inferred.

## Commands for the primary workspace

Save an approved synthetic or previously saved input to an explicit local file.
From the repository root, with the existing dependencies installed:

```sh
node node_modules/tsx/dist/cli.mjs scripts/compare-scope-runs.ts /explicit/local/synthetic-comparison.json
node node_modules/tsx/dist/cli.mjs --test tests/scope-run-comparison.test.ts tests/scope-summary.test.ts tests/scope-evaluation.test.ts
npm.cmd run typecheck
```

On a POSIX shell use npm run typecheck in place of npm.cmd. CLI tests spawn the
current Node executable with --import tsx, matching the supplied test pattern.
The CLI prints JSON only to stdout on success, and a fixed generic stderr message
with exit 1 on invalid arguments/input. Invalid model outputs inside a valid
envelope still yield a successful report, so callers must inspect invalid counts.
There is no default input and no automatic report file. No .env, database,
providers, project scan or live runner is loaded. Only explicitly supplied input
is read; tests create fictional files in a fresh temporary directory and remove
only that directory afterward.

The CLI rejects directories and final-component symlinks, checks the opened
descriptor and its identity, and reads at most 262145 bytes, rejecting above
262144 bytes. UTF-8 decoding is strict. POSIX O_NOFOLLOW and O_NONBLOCK tighten
final-component swap handling where supported. This is not a filesystem sandbox:
ancestor directory traversal is caller-controlled. Concurrent same-file content
writes are not authenticated snapshots. Windows inode/flag behavior and symlink
privileges need real-platform checks; the symlink test explicitly skips when
creation is unsupported, rather than claiming enforcement was tested there.

## Report interpretation and denominators

Systems, repeats and known case IDs have stable ordering regardless of input row
order. The pure function copies bookkeeping data and never mutates the input.
Reports contain no raw summaries, questions, deliverables or arbitrary source
strings. Existing scorer failure messages contain only fixed text and known IDs.

| Field / boundary | Exact interpretation |
| --- | --- |
| expectedSlotsAllSystems | 25 x expectedRepeats x 3, including absent groups. |
| expectedSlotsPresentSystems | 25 x expectedRepeats x number of present groups. |
| submittedSlots / missingSlotsAllSystems | Number of rows / all-system expected slots minus rows. No fabricated zero-error measurements. |
| system status absent | No supplied rows; contains no measured summary or stability counts. |
| present system expectedSlots / missingSlots | 25 x expectedRepeats / that total minus supplied group rows. |
| submittedCaseIds | Unique submitted IDs per system; per-repeat IDs count rows, including invalid and simulation. |
| repeat expectedSlots | Always 25. submitted + missing = 25; validPredictionSlots + invalidOutputs + excludedSimulation = submitted. |
| repeat summary | Exact summarizeScope result for supplied slice, including directional confusion/errors. Entirely missing repeat has null summary and zero measured coverage. |
| valid prediction | scoreScope classificationCorrect is non-null and source is not simulation. Automated failures such as missing required citations/questions may remain valid classifications. |
| claimedSources | Only claude/elastic/simulation/absent/unrecognized counts across supplied rows, regardless of score validity. Unknown source can invalidate the strict output. |
| stability benchmarkCases / expectedSlots | Denominators 25 / 25 x expectedRepeats for that present group. Slot missing/invalid/simulation counts remain explicit. |
| allExpectedRepeatsValidCases | Cases with a valid prediction in every expected repeat. With one repeat this is coverage, not stability. |
| comparableCases | Cases with at least two valid predictions, even when a third is missing/invalid/simulated. This is the denominator for agreement/disagreement. |
| agreementCases / disagreementCases | Comparable cases with identical / differing classifications. With expectedRepeats 1 both are null, status not-measured; per-case disagreement is null when incomparable. |
| matched commonCaseIds / commonCases | Intersection of valid predictions for the pair at the same repeat index. Both sides are summarized on exactly these IDs. Zero common cases gives null summaries. |
| matched excludedCases | 25 minus commonCases. Per-side missing/invalid/simulation and validOutsideCommon explain exclusions; validOutsideCommon + invalid + simulation + missing = excludedCases. |
| matched summary missingCaseIds | The original summarizer's complement in all 25 cases, including unmatched cases. Use side missingSlots for actually absent rows. |
| errors | additionalPredictedIncluded, includedPredictedAdditional, ambiguousPredictedDefinite and definitePredictedAmbiguous retain existing counts. No numeric weights or monetary interpretation. |
| telemetry observed / missing | Count with field supplied / submitted rows without field. These do not include unsubmitted slots. A supplied zero counts as observed. |
| telemetry token totals | Sum of supplied observations only; null when no observations. Never a total estimate for missing fields or missing rows. |
| telemetry latency min/max/mean | Over supplied latency observations only, null without observations; observed is the count. No missing-zero imputation. |

Telemetry appears overall, by present system and by repeat. It includes invalid
and simulated submitted rows because those rows can have reported observations;
it does not estimate valid-only model cost. Nonfinite or greater-than-safe totals
are rejected generically, including latency sums used for means. Rejection is
conservative and is not a billing statement. Token pricing is absent.

Agreement is not correctness. Classification matches are not automated-check
passes; neither establishes citation meaning. No percentages, composite winner,
causal benefit or superiority claim is produced from these selected samples.
manualSemanticReviewRequired is true, modelRunVerified false, heldOutEvaluation
false. An arbitrary caller can assign any experimental system label.

## Proposed regression coverage and controls

All tests in tests/scope-run-comparison.test.ts are proposed and unexecuted.
They test a new feature; the before state has no companion/CLI, not a proven
defect in old scorers. Exact equality against summarizeScope documents the old
correct boundary. Controls include valid rows beside malformed rows; real clauses
with missing required evidence; irrelevant meaning despite automated passes;
malformed simulation excluded before invalidity; an Elastic plain_llm row versus
an unknown source; stable wrong labels versus disagreement; missing competitors
and repeats versus matched rows; repeat 1 versus repeat 2; reported zero versus
missing usage; MAX_SAFE_INTEGER versus overflow; frozen/reordered input; secrets
in free text versus generic errors; exact 256 KiB versus oversize; success versus
malformed JSON, directories, missing files, extra arguments, UTF-8 and symlinks.
Tests use all three groups without tuning labels for Nudge to win.

The tests do not perform provider HTTP, call a live runner or need credentials.
They do not prove absence of every possible transitive network effect: the
reviewed import chain is comparison -> existing scorer/summarizer/cases -> domain
and Zod; domain's other imports are type-only. Concurrent file replacement/growth
and real Windows symlink behavior remain primary-platform checks, not mocked
success claims. A file size stat is never the sole byte-bound guard.

## Manual semantic-citation rubric

For every compared saved row, inspect the original agreement, request and output
privately alongside the structural report. Record supports / contradicts /
insufficient for each cited clause and for the explanation as a whole:

- Supports: the clause and supplied facts justify that particular assertion,
  including conditions, revision history and mixed included/additional parts.
- Contradicts: the explanation reverses or conflicts with clause meaning, assumes
  excluded work is included, or charges an unresolved/included part as an extra.
- Insufficient: a valid ID lacks relevant support, facts/counts are missing,
  questions fail to resolve the uncertainty, or citation relevance is unclear.

Check invented prices, approvals, dates, policy/action claims, unrequested
deliverables and instruction injection separately. For mixed work, ensure only
explicitly additional parts enter paid-extra deliverables. Record disagreements
and reviewer rationale; do not coerce semantic judgments into automated scores.
Use an independent reviewer when feasible and disclose developer/AI exposure.
The existing fictional cases were visible to developers and this AI; nothing in
this companion makes them independent, human-authored held-out evidence. Obtain
appropriate consent before any future use of real client material; no private
data is needed here. Do not publish raw private saved outputs or credentials.

## Future live comparison: separate approval required

Do not start a provider batch from this guide. No new live result exists yet.
After owner approval, verify allowance, provider eligibility, expiry, access and
explicit per-run/total request and token caps. The packet reports an Elastic trial
end of November 4, 2026 at 05:29 UTC, but allowance/exhaustion and later access
remain unconfirmed; this text does not authorize usage or promise remaining funds.

Predeclare a small matched subset of the same existing cases and 1-3 repeats;
freeze prompts, agreement, expected labels, provider/model configuration and
group definitions before collection. Record exposure and configuration privately;
the companion intentionally accepts no arbitrary configuration metadata. Distinguish
lexical, plain_llm and Nudge saved groups without assuming different providers.
Use identical case IDs/repeat indices for comparisons and keep all failures and
missing slots. Never silently retry until a preferred answer appears.

Stop before the next request on exhausted/unconfirmed allowance, cap or expiry,
unexpected usage, provider failure, malformed output, invalid citations,
interactive-tool attempt, privacy concern or owner withdrawal. Preserve evidence
of the failed attempt privately and mark missing later slots. Resume only after
separate approval with remaining caps checked; do not erase failed repeats.
Keep normal application AI paused, disable tools/workflows, avoid private data,
and retain human scope/price/payment authority. Review semantic citations before
making any outcome claim. This plan is future conditional work, not measured
evidence or a command to call a provider now.

## Original handback integration manifest

One coherent change: library, CLI, shared test file and guide are integrated
together. All are new files; existing-file diffs are empty. Do not mix PA-1/PA-2
patches. Hashes below are copied from B2, not recomputed checkout hashes.

```json
{
  "task_id": "PA-4",
  "packet_revision": "B2",
  "change_id": "B2-01-03-companion",
  "baseline_files": [
    { "path": "package.json", "sha256": "fa350c9e338389d5fab6c4772858b3c8809e6f560e63c98a5e774887f47dd1d5" },
    { "path": "lib/domain.ts", "sha256": "fa6f642f0ce37949e3225c5cfc83a1e4bc1d95c008bd4f9f2830608704f5d2ac" },
    { "path": "evaluation/scope-cases.ts", "sha256": "a143199b299376a064f9707f351fe6e0c672116c42e4a5a1214a3857b78b5ad0" },
    { "path": "evaluation/score-scope.ts", "sha256": "5a5f54340ba7e1b500cbc135b5b8a49c2ece0bc28e73c9096bc39480b0308ad8" },
    { "path": "evaluation/summarize-scope.ts", "sha256": "abf98398bb368fbb75b7fd2fc1602301ed4fd681722df267f84ea6b7858b4ec8" },
    { "path": "tests/scope-evaluation.test.ts", "sha256": "77829c976560abc82a321b90e3c9092bc09de8a40484004e860931aa6fabc449" },
    { "path": "tests/scope-summary.test.ts", "sha256": "3e91c0f151f87b79753c6b107287d5703604a6c3867288ce1318c14f603d252f" }
  ],
  "files_changed": [],
  "files_added": [
    "evaluation/compare-scope-runs.ts",
    "scripts/compare-scope-runs.ts",
    "tests/scope-run-comparison.test.ts",
    "EVALUATION_COMPARISON_GUIDE.md"
  ],
  "requires": [],
  "conflicts_with": [],
  "dependencies_added": [],
  "test_status": "proposed-not-run",
  "unresolved_questions": [
    "Primary must verify baseline hashes and existing dependency compatibility.",
    "Primary must execute tests/typecheck and verify actual platform file semantics.",
    "Live allowance, consent and independent semantic judgments remain unverified."
  ]
}
```

## Integration handback

Apply in order: evaluation library, CLI, shared tests, guide. Confirm baseline
hashes against the authoritative checkout and confirm all four paths are absent
before adding; an already-existing path is an overlap requiring review, not
permission to overwrite. No package scripts or dependencies are added. The single
manifest avoids shared-test overlap between separately integrated changes.

Run the three exact verification commands above in the primary workspace, then
check wc -l (POSIX) or equivalent newline counts for all four complete files and
their final newlines. The delivered file inventory supplies checked counts; no
new-file diff hunk counts are involved. Do not treat parsing or file availability
as a runtime pass. Acceptance: original scorers/tests unchanged and passing,
new comparison tests passing except explicitly reported platform skips,
typecheck passing, safe missing/invalid reporting, exact matched denominators,
fixed privacy-safe errors, no provider calls and no environment/database changes.

Owner-only work: approve any live usage separately, verify account limits and
platform checks, obtain consent if needed, perform semantic review, and decide
whether evidence supports any later claim. Primary alone edits action-plan,
status and handoffs. Known limits include developer exposure, caller-labelled
provenance, structural-only automated citation checks and platform race behavior.

Surgical reversal: remove only these four newly added files from this change,
after checking they contain no later work. No reset/clean, durable marker removal,
database overwrite or unrelated file deletion is needed.
