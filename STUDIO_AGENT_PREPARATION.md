# Studio snapshot analyst: offline preparation

October 9, 2026. `lib/studio-analyst.ts` prepares a definition against the installed AG Studio3.0.0 `AgAiAgentDefinition` and `AgAiTool` contracts. It is not imported by the website, registered with a harness, or connected to a model. Existing Analytics remains unchanged.

The intended first experience is explaining stored invoice and quote totals with their timestamp and provenance. Dashboard creation/delegation can follow a separately reviewed permission design; this first definition cannot modify reports or financial records.

## Enforced local boundaries

- Exactly one client tool, `nudge_snapshot_totals`. No built-in query, widget-edit, delegation, external, payment or contact tools are supplied.
- Strict `expectedVersion` argument validation; unknown names, extra arguments, invalid integers and stale versions return fixed errors. Invalid requests fail before reading data.
- Each schema, initial tool call and execution reads the current supplied snapshot. Execution checks cancellation before and after reading. Invalid snapshots hide the tool schema rather than exposing malformed data.
- Tool output projects only snapshot version, demo/sandbox mode, timestamp, USD and seven integer-cent/count totals. It omits individual rows, names, email, tokens, URLs, IDs, raw errors and unexpected runtime keys. The result is detached from its source.
- Numeric validation requires nonnegative safe integers. Overdue plus unknown-date balances cannot exceed outstanding totals; awaiting-acceptance quote value cannot exceed approved quote value.
- Static instructions distinguish stored records from live PayPal status, full-workspace totals from filtered reports, and quote values from payments. They prohibit unsupported actions and invented forecasts.
- `maxTurns: 3` is configured for a future Studio-owned loop. A definition does not execute or enforce a spending budget on its own; a custom runner must enforce its own run limits.

The getter is trusted application code. This module is not an authentication boundary and must receive only an already owner-authorized snapshot. Before any remote integration, require server-side authentication, rederive permitted data from stored records, retain the existing AI enable flag and quotas, keep credentials server-side, bound request size/time/cost and reject arbitrary tools. The current definition supplies no transport or endpoint.

## Evidence

Five new offline tests directly exercise the definition/tool contract: minimal roster/schema, current and stale versions, non-mutation and detached outputs, invalid/injected arguments and unknown actions, privacy projection, sanitized errors, malformed totals/provenance and cancellation. All97 offline tests and TypeScript pass. The final detached-output assertion was also rerun in the focused five-test suite. Network is explicitly forbidden during the tool execution regression.

These tests do not instantiate Studio's harness or runner, verify live model reasoning, establish prompt-injection resistance, or prove human usefulness. No new browser/build claim is made for this inactive module; the prior production/build/browser results remain the Analytics baseline. No packages, local environment, licence, account, subscription, model requests, PayPal actions or ordinary workspace records changed.

The implementation follows [AG Studio's agent contract](https://www.ag-grid.com/studio/react/ai-agents/): a definition specifies instructions/tools; a runner supplies execution. Installed type declarations were checked directly against that documentation.

Next bounded task: use an offline scripted response with the actual Studio runner/harness to verify tool execution, stale/cancelled calls and bounded termination. Keep this honestly labelled as offline integration evidence. Live Elastic/Studio-agent verification still requires the existing allowance checkpoint; do not enable AI automatically. Vendor/manual accessibility, hosting/licence, fresh-payment webhook and freelancer research checkpoints remain open.
