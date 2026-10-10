# Studio snapshot analyst: offline preparation

## Offline bridge checkpoint — October 10

See STUDIO_AGENT_BRIDGE.md: the actual harness now exercises the guarded reply contract via intercepted fictional requests, with eight browser scenarios and four unit cases. The bridge is prepared but unregistered, production has no adapter, and no live AI is activated. Earlier next-bridge notes below are superseded; persisted allowance/activation controls and existing external gates remain prerequisites.

## Backend guard checkpoint — October 10

STUDIO_AGENT_TRANSPORT.md records the new owner/origin/sandbox-only POST handler and mock-tested transport limits. Production registers no adapter; flags cannot enable it. Shared summary validation now serves both the tool and transport. All105 offline tests/typecheck, six harness and four Analytics/HTTP checks, final isolated build and Postman31/50 pass. Current transport returns a bounded reply contract, not AG-UI events; an offline bridge test is next. Request caps are process-local, and reported-token validation is not a verified spending cap. All live allowance/external checkpoints remain open.

## Actual runner and harness verification — October 9

The prepared definition now has offline integration evidence through the installed Studio3.0.0 runtime. `tests/fixtures/studio-agent.ts` creates a real native Studio instance, `createAiHarness` and `clientToolRunner`. A scripted event generator substitutes for a model; it is test code, not a website feature. No built-in agent or additional tool is offered to the scripted turn.

Six browser journeys pass: initial automatic totals read, requested tool execution and resumed response; stale-version rejection; extra-argument rejection; unknown send-invoice tool rejection; a repeating loop stopped after exactly three turns; and cooperative cancellation with no later requested tool execution. The automatic preflight read is separate from turns: a three-turn loop executes at most four reads in this fixture. Successful results reach the subsequent turn, and failed results reach it as errors. Unknown-tool errors are plain text, whereas the custom tool returns structured errors; tests assert both actual formats. The turn-limit error is rendered as a readable instruction to narrow the request.

Each scenario blocks all browser network requests and asserts no request attempts or browser runtime errors. The normal case also deletes its harness thread; every case closes its session, disposes the harness and destroys Studio. Fictional snapshot totals stay unchanged; the stale fixture deliberately increments only its version to exercise rejection. No application server, database, local `.env`, licence key or provider settings are loaded. Cancellation evidence is for a scripted generator that honours the abort signal, not for an uncooperative remote service.

Run after `npm ci`, with Edge installed (or set `NUDGE_BROWSER_PATH` to a supported browser executable):

```powershell
node node_modules/@playwright/test/cli.js test --config playwright.studio-agent.config.ts
```

The standalone configuration starts no web server. esbuild0.28.2 is declared as a pinned development dependency to bundle the fixture; it was already installed transitively, and no runtime dependency or website registration was added. Bundles and traces stay in ignored `data/studio-agent-results/`. Six final browser journeys and TypeScript pass; the prior97 offline tests and Analytics build/browser evidence remain baseline results, not new runs this checkpoint.

This establishes actual framework/session/tool interoperability, not live model quality, useful natural-language reasoning, prompt-injection resistance or a cost ceiling. AI remains paused. Next bounded backend task: design and test an owner-authenticated transport with mocked responses and explicit request/usage limits before considering any live connection. Preserve allowance, accessibility, licensing/hosting, fresh webhook and research checkpoints.

The initial definition-only checkpoint below describes the preceding stage; its statement that harness execution was unverified is superseded by these six offline tests.

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
