# Website AI preparation: attempt limit and offline rehearsal

## October19 live follow-up: E6 complete

The owner explicitly resumed checks within the active trial. One fictional comparison was then performed through the **actual website**, not the direct adapter harness. This section supersedes the older next-boundary statements below for that completed attempt only. Numerical account fair-use/exhaustion terms and judging-period extension remain unconfirmed. The exact last-reported dashboard expiry is November4,2026 05:29UTC, despite the owner's later shorthand November3; neither a possible form extension nor key lifetime extends confirmed free service.

Receipt: `data/ai-website-check/e949247a-73f4-4693-9e71-a324a31692cd/summary.json`. The screenshot `live-website-draft.png` was visually inspected: fictional accepted agreement, additional-work draft, S2 evidence, human-review form, disabled price/approval and no invoice/payment. It has a conspicuous bounded-live-check label; it is not the final demo recording. These local artifacts remain under ignored data; no key, private endpoint, conversation ID or provider reasoning is copied into this document.

- Live HTTP200/completed; exactly one reserved conversation attempt, no automatic retry or follow-up comparison.
- The model classified appointment booking as **additional**, cited S2's explicit exclusion, returned a neutral booking deliverable and no unnecessary clarification question. This supports this one straightforward development case, not broader accuracy, novelty or user impact.
- Provider-reported usage: **21,848 input tokens and 447 output tokens**. Cost, remaining quota, per-internal-model attribution and account billing behavior are unknown. A conversation may contain multiple internal model calls; the one-attempt guard is not a token/spend/account-wide cap.
- The requested endpoint was `.anthropic-claude-5-sonnet-chat_completion`, explicitly selected only in the disposable child. Success verifies that route, not every model/feature assignment. Receipt `modelVerified:true` means a live response through the requested endpoint; orchestration models were not independently identified.
- All61 runtime files and build inputs matched the retained passing production copy. The new database and generated owner session were isolated. Child environment received only necessary Elastic settings and OS variables; no PayPal credentials, normal database path or existing owner token. Normal `.env.local`, application source, configuration, packages and database were not changed.
- Browser external fetches were blocked (only expected font hosts attempted), with zero page errors. Browser closed, owned server tree stopped successfully and TCP independently confirmed ECONNREFUSED. Normal developer server was not stopped. Live access ended with that child; ordinary AI remains paused.

Separate operator tools: `scripts/elastic-live-review.cjs` retains the exact-body/shared-ledger guard and adds bounded response inspection that saves only HTTP/status/numeric usage. `scripts/check-elastic-website-live.mjs` runs the reviewed fixture through website login/comparison, checks the unpriced review gate, and closes its own server. The stub-only helper remains stub-only. A failed transport also consumes the live slot. Only the live child can use the key, kept in memory/environment; the config/usage artifacts do not contain it.

Eight offline safety tests pass together (five existing gate tests plus three new response-observer tests), including response preservation with sanitized usage, provider-error/unknown-usage handling, response-size bound and transport failure with no retry. TypeScript passes. The known Windows restricted-loader ENOMEM occurred before tests; approved outside-sandbox tests passed. A Python executable was unavailable while preparing the runner; Node performed the file preparation instead, before any provider call. The live run passed on its first attempt. The harmless native-TS module-type warning remains; no package settings were altered to hide it. No application change required a new production build or broad regression run.

The live runner now requires an explicit `--live-once` argument as an additional accidental-use guard (syntax checked after adding it, without another inference). **Do not rerun merely to reproduce this documentation.** A new invocation creates a new ledger and could consume more allowance; the ledger is per operator run, not a permanent account quota. Any later authorized run uses:

```powershell
node scripts/check-elastic-website-live.mjs data/postman-workflow/<matching-verified-run>/app-source --live-once
```

Next: E4 read-only reconciliation against Agent Builder usage for this one conversation/round. Record unknowns rather than making another model call to investigate usage. E3 free-use/exhaustion and judging access, the matched same-quote PayPal/video flow, manual checks and publication gates remain open. No further AI batch, new sponsor integration or design rewrite follows automatically from this success.

## Historical offline preparation

October19,2026. Two preparation tasks completed at the owner's request: a tested one-attempt transport gate and an isolated rehearsal through the actual owner website/server/Elastic adapter. **No real model ran. This does not complete E6 live website verification.** Application runtime source, dependencies, ordinary environment and database remain unchanged.

## 1. Attempt gate

`scripts/elastic-one-attempt-guard.cjs` exports a fetch wrapper which permits only the reviewed exact endpoint, POST method, redirect policy, model/agent, private/local execution, canonical instructions, tool/skill/capability restrictions and fictional scope input. It rejects altered input/authority before transport. An exclusively created file reserves the only attempt **before** delegate execution; transport failure does not replenish it. The same ledger protects competing processes and subsequent wrappers using that ledger.

Five meaningful offline tests in `tests/elastic-attempt-guard.test.ts` pass:

- Altered destination/method/model/payload/tool authority or redirect policy does not reach transport; the one valid request is permitted once.
- Transport error consumes the slot, including after a new wrapper is created.
- An unavailable ledger fails closed without transport.
- Two independent Node processes dispatch only once using the shared ledger.
- The offline preloader rejects a live-transport configuration before application code starts.

The preloader is **stub-only**: it does not retain or call the original fetch. The exported delegate gate is reusable, but no live transport/approval path was added by this task. This is an operator verification aid, not a permanent application-wide or account-wide quota. It does not impose a numerical token/billing cap, sandbox every networking API, or prevent an operator from creating another ledger. Actual live transport/model/free-use and explicit resumption still require their own reviewed step. Nothing here enables normal website AI.

## 2. Actual website wiring, fictional response

`scripts/check-elastic-website-offline.mjs` verifies a source/config match with an existing passing disposable production build, then starts a new loopback sandbox-mode instance with a new SQLite fixture, generated owner token and **fake Elastic credentials**. It never loads `.env.local`, actual keys, PayPal credentials or the ordinary database. AI is enabled only in that disposable child so the real adapter path can execute against the stub preloader; normal configuration remains paused.

The fixture is the proposed five-page USD1200 marketing website with S2 explicitly excluding appointment booking. After local scope setup/acceptance, Playwright performs actual owner login and clicks Compare with agreement with the exact booking request. Only its supplied structured response is returned locally; no provider is contacted.

Observed checks:

- Request traverses the real website POST/server route and Elastic adapter, whose output schema/reference checks accept the fictional response. The result appears as one draft with S2, amount0, no human review, disabled price/approval and no invoice.
- A second website comparison cannot dispatch another response through the consumed ledger. The page shows the adapter error, clears processing and preserves the original draft; no simulation replacement or new proposal appears.
- Browser external requests are intercepted (only expected font hosts attempted), with zero page errors. The Node preloader has no real fetch delegate. Neither PayPal nor another sponsor component is activated.
- Browser and owned loopback server both closed, with independent TCP ECONNREFUSED confirmation in the runner. The owner development server was not reused/stopped.

Receipt: `data/ai-website-check/1a48eff7-f65a-4f07-bb17-320acd905f7c/summary.json`; `modelVerified:false`, `realInferenceRequests:0`. The screenshot was inspected and prominently labels itself an offline fictional-response rehearsal. Because adapter code assigns the Elastic source label, that UI label alone is not live-provider evidence. Do not use this screenshot as a real Elastic demo or submission proof.

The optional runner was verified with Node24.12.0 and existing Edge. It uses native loading of the TS instructions module and emits Node's module-type warning; this is tooling-only and no package/module/build setting was changed to suppress it. No fresh install, production rebuild, full offline suite or Postman rerun was necessary: all61 app/components/lib runtime files and relevant config match the prior `ac26f1fb-c1a2-4392-870f-4e4e67848d70` passing production receipt. New helper/tests are outside application runtime.

TypeScript passes. The restricted test loader initially failed before tests with the known Windows uv_os_get_passwd/ENOMEM issue; approved outside-sandbox runs passed. Typecheck then caught missing NODE_ENV in a filtered test-child environment; adding the explicit test value fixed it. The final five tests and typecheck pass. The browser rehearsal did not need rerunning after this test-only typing correction.

To repeat the offline rehearsal against a **matching verified** disposable production build:

```powershell
node scripts/check-elastic-website-offline.mjs data/postman-workflow/<verified-run-id>/app-source
```

The runner accepts a build path only, has no live-mode option and creates a fresh fictional fixture/ledger. Do not run it with a real environment file or replace its stub with a provider to bypass the live-use checkpoint. The existing successful build can be reused while source/config match; stale source is rejected.

## Next boundary

E5c/E6a preparation is complete, while E3/E5b/E6 remain open. Confirm current free-use/exhaustion terms, exact model routing, actual key expiry and explicit resumption; then review a separate live runner using the proven attempt gate before permitting one conversation request. One conversation can entail several model calls, and an unsuccessful attempt can consume allowance. Capture actual usage and pause again; do not run a benchmark batch or repeat the direct adapter harness instead of the website.

Existing sponsor/judging access, real PayPal demo evidence, manual Narrator/actual zoom/touch, publication and final video checks remain separate. No user findings or model-quality claim is added.
