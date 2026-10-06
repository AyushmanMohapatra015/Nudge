# Mixed and ambiguous scope regression checks

October 7, 2026. Six fictional development cases were selected before live execution, using the seven-clause agreement in [AI_EVALUATION.md](AI_EVALUATION.md). Five reuse previously visible cases; one combines excluded booking with an unknown revision count. These are debugging regressions, not a held-out benchmark or user research. Labels and required citations stayed fixed throughout this task; prompts changed after observed failures.

## Observed failures and changes

- The mixed colour/checkout response completed with the correct analysis but wrapped JSON in a Markdown block. The adapter previously rejected it. It now accepts bare JSON or one complete, standalone JSON code block, followed by the same strict schema and citation validation. It still rejects prose around the block, multiple blocks, other code languages, invented fields, invalid references, interactive outcomes and tool calls. The exact observed analysis passes an offline adapter regression; that original live attempt remains recorded as rejected.
- “Add another revision round” was incorrectly treated as beyond the two-round allowance without a used count. The shared instructions now distinguish a written limit from evidence that it has been reached. A separately reviewed retry correctly returned ambiguous and asked for the count.
- “Add a booking button” was incorrectly treated as a booking system, with prose surrounding the JSON. The response was rejected. The shared instructions now distinguish an external-service link from implementing booking and require a JSON-only final message. A reviewed retry correctly returned ambiguous and asked which was intended.
- The policy also distinguishes defect repair from ongoing maintenance, missing page descriptions from established scope expansion, and known extras from unresolved parts of a mixed request. The saved-agent instruction copy was regenerated from the canonical source; no remote agent settings were edited.

Instructions guide the model; they do not enforce semantic accuracy. Existing human scope review and pricing approval remain mandatory. All additional proposals start as zero-price drafts. This evaluation does not access the workspace database or PayPal.

## Reviewed case evidence

| Case | Latest reviewed response | Evidence boundary |
| --- | --- | --- |
| Heading colour in round one + checkout | Additional; S3/S5; no questions; checkout only in extra deliverables | Correct model analysis recovered read-only; original adapter rejected its wrapper. Formatting fix verified offline against that analysis, not by a fresh live call |
| Another revision round, used count absent | Ambiguous; S3; asks used count and whether edits are minor | Live adapter and frozen checks pass under the first policy revision; earlier wrong output retained |
| Booking button, implementation unspecified | Ambiguous; S5; asks external link versus built-in booking | Live adapter passes; frozen citation check fails because S7 is omitted. Agent inspection finds S5 supports the explanation; the failed check was not erased or relabelled |
| Broken form after launch | Ambiguous; S5/S6; asks original defect versus subsequent maintenance | Live adapter and frozen checks pass under the final policy revision |
| Unspecified blog page | Ambiguous; S1/S7; asks replacement versus expansion | Live adapter and frozen checks pass under the final policy revision |
| Booking with time slots + unknown revision count | Additional; S5/S3; asks count; only booking is an extra | Live adapter and frozen checks pass under the final policy revision; unresolved revision is excluded from paid extras |

The coding agent inspected each latest response against the predeclared semantic rubric, including relevant citations, missing facts, mixed-work separation and invented price/approval/action terms. Independent human review remains pending. Original result files retain their pending-review field; the inspection is a separate local record tied to source-file hashes.

There were eight conversation HTTP requests across five separately reviewed runs: two transport rejections, one accepted but incorrectly classified revision response, one accepted booking response missing the rubric's S7 citation, and four accepted responses passing all frozen automated checks. Do not present this as “6/6 live passes.” The six latest reviewed analyses span three prompt versions; only five completed through the live adapter, while the first was recovered and replayed offline. Repeated-run stability, held-out accuracy, prompt injection, baseline superiority and the website AI journey remain unverified.

## Usage and safeguards

This task reported **106,332 input / 3,339 output tokens** across eight conversation requests. Each agent round may contain multiple internal model calls; requested Sonnet routing does not establish the identity of every internal call. Monetary cost and remaining fair-use capacity are unknown. Earlier tasks' usage is separate, and some historical failed-request counts remain unknown. [Elastic's monitoring guide](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/monitor-usage) explains round-level usage.

Every run stopped on its first validation or scoring failure. A retry or continuation happened only after diagnosis, a reviewed change or semantic inspection, and separate execution approval. No automatic retry, model fallback, conversation continuation, billing activation, credential change, PayPal request, private workspace read, remote agent edit or persistent environment edit occurred. `NUDGE_AI_ENABLED=false` remains unchanged for the ordinary website. Trial access through November 3 is confirmed by owner/support; exact fair-use limits and judging continuity remain separate checkpoints.

## Reproducible runner

Source: [evaluation/scope-challenges.ts](evaluation/scope-challenges.ts), [scripts/run-scope-challenges.ts](scripts/run-scope-challenges.ts), and [tests/scope-challenges.test.ts](tests/scope-challenges.test.ts).

Offline harness verification needs no credentials:

```powershell
node --import tsx scripts/run-scope-challenges.ts --mock
node --import tsx scripts/run-scope-challenges.ts --mock --cases=revision-count
```

Do not run live mode without reviewing usage and a request allowance. It loads server-only configuration from your ignored environment file and consumes trial usage:

```powershell
node --env-file=.env.local --import tsx scripts/run-scope-challenges.ts --live --inference-id=.anthropic-claude-5-sonnet-chat_completion --cases=revision-count
```

The runner accepts at most six known, unique cases, sends at most one isolated request per selected case and writes a new ignored UUID directory with exclusive-create attempt/result/failure/summary records. It records the instruction hash, requested model, latency, reported tokens and fixed outcome diagnostics without saving raw responses or private reasoning. No result authenticates model execution from its source label alone; mock provenance is explicit. Missing usage stops later calls. Observed input/output thresholds also stop later calls, but cannot cap a request already running or enforce a monetary/provider quota.

All **78 offline server tests**, TypeScript checks and the final isolated production build pass. Tests include a captured-response formatting regression, rejected unsafe wrappers and fail-stop/subset/provenance behavior. A structurally valid but unsafe mixed deliverable deliberately passes the automated scorer, demonstrating why semantic review is required. The build reuses installed dependencies and preserves the active development cache; no fresh install or hosted deployment is claimed.

Next: independently review these cases, review owner-visible trial usage, then verify one isolated owner website request with the verified model configured locally. Plan unseen cases and stability/injection comparisons separately; no more live calls follow automatically from this document.
