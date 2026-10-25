# External agent response review — October25

Status: PA-1/PA-2 responses received and reviewed. No returned application patch has been applied. Demo scripting remains deferred by the owner. This review uses the current repository and fictional offline reproductions, not either agent's unexecuted test claims.

## PA-2 integration outcome — supersedes initial proposal-only status

B-01 is now integrated and verified: `components/client-page.tsx`, new `lib/client-invoice-presentation.ts` and new `tests/browser/client-invoice-presentation.spec.ts`. The component changes only the presentation import and two existing rendering blocks. Accepted-change receipts no longer imply an invoice has yet to be prepared; invoice status/caption/fallback messages distinguish due, partial, settled, cancelled and needs-confirmation states. Payment URLs/eligibility, pricing, requests, polling, consent, locks and recovery code are unchanged. No CSS, backend, dependency or configuration changes.

The pre-edit component hash matched B1. Original agent response/packet baselines remain preserved; the current component intentionally differs after integration. Primary review found that B's new-file hunk counts omit final lines despite passing `git apply --check`; the missing helper/test tails were restored from the complete response. A temporary duplicate test-tail placement was corrected. Final TypeScript and execution pass. Added one fictional320px screenshot capture for visual review; the screenshot shows readable wrapping, an unclipped payment control and visible keyboard focus. It does not establish physical touch/actual zoom/Narrator results.

Verification:

- TypeScript passes on final source.
- Fresh isolated production build and Postman Newman workflow pass:47requests/77assertions, restart persistence true, provider-fetch guard quiet. Receipt: `data/postman-workflow/89513601-ffa6-4b66-b1a6-15a32f24d67c/summary.json`.
- Seventeen targeted Playwright checks pass together: seven new presentation checks (one pure helper check and six browser cases), six connection/recovery, three acceptance/payment-policy workflow and one actual client-link replacement check. Both demo/sandbox presentation fixtures are mocked client projections; the actual test server is isolated demo mode, not a live sandbox transaction.
- Browser receipt/results: `data/client-presentation-browser/550ff412-ceb8-49e0-a00f-b9a34a93157b/`. Source-matched production copy, credential-free whitelisted child environment, provider fetch blocked, final owned TCP endpoint confirmed closed. The private runner is `data/agent-response-review/check-client-browser.mjs`, adapted from the existing reviewed Analytics runner. No ordinary data/env, real AI/PayPal, account or billing changes.

PA-1 decisions below remain unchanged. Manual R6, sponsor/judge access, publication and final video are still open; demo scripting stays deferred. Successful UI tests are not real-user validation.

## Inputs and integrity

Owner supplied `Agent1/Response1_Agent1.txt` (PA-1/A2) and `Agent2/Response1_Agent2.txt` (PA-2/B1). Preserve the originals. SHA-256:

- Agent A: `802aa94f70c23e95fec8bee03edf6af08bef9aebbc237e520ad51830a73ede21`
- Agent B: `9949cb746b0aa598575c50843e39d04df9071e55859879ad09a34aab72e2be64`

All13 baseline entries across the four manifests match current files (10 unique source paths). Proposed new paths were unused at review. Both agents correctly labelled tests proposed/not run. Private parsing receipts and reproduction source are under ignored `data/agent-response-review/`; no credentials, ordinary database or real provider calls are needed.

Patch syntax/applicability was checked without application using `git apply --check`. A-01/A-02 and all three B-01 diff blocks pass this limited check; A-03 fails with `corrupt patch at line39`. Successful parsing does not establish correctness or passing tests.

## PA-1 decisions

| Finding | Independently established | Decision |
| --- | --- | --- |
| A-01: missing create response / incomplete cached draft | A lost create response leaves the finite controller without an authorised invoice ID; arbitrary recovery GETs are rejected before delegation. Separately, a failed post-create GET leaves a cached draft without a payment URL. The cached draft is recoverable with the existing fully validated `recoverInvoice`; our reproduction recovers PAID/$0 without another create. | **Do not apply as supplied.** The limitation is real, but a general/permanent app deadlock is not established. The proposed controller patch expands reads to any syntactically valid INV2 candidate before checking identity; it binds using only invoice number, unlike the app's full merchant/recipient/work/amount checks. A future operator recovery capability needs an explicit candidate-bound read plan, not implicit broader financial-session authority. Automatic cached-draft hydration may be reconsidered separately if it fixes an observed user problem. |
| A-02: pending send remains when remote reads DRAFT | Existing lost-response regression intentionally preserves `pendingSend` on DRAFT and blocks repeat sends. A later SENT lookup clears it. The reproduction passes unchanged. A failure before actual send dispatch can also leave a conservative block; that narrower usability issue is not the same as a dispatched-but-uncertain send. | **Reject the supplied blanket DRAFT-clear patch.** A status read is not proof that an earlier delayed request cannot still complete. Normal application safety must not depend on the optional rehearsal controller's send counter. Distinguishing a proven pre-dispatch failure would require separate durable phase evidence and targeted delay/crash tests; do not clear markers based on DRAFT alone. The proposed test asserts the new behavior without testing this counterexample. |
| A-03: stale parent version / leftover lock | Reproduced stale-handle cleanup rejection after child transport advances the manifest. Reopening the session closes it successfully. The actual `scripts/serve-sandbox-payment.mjs` already reopens immediately before cleanup. A lock left by process death is a separate possible operator-recovery limitation, not reproduced here. | **Defer broad version relaxation; no current launcher blocker established.** Proposed patch is also syntactically corrupt. Its version changes do not repair a leftover `manifest.lock`. Preserve fail-closed locking/version behavior and the current reopen pattern. Do not delete a lock without proving ownership/process state. |

The detailed failure matrix is useful review material, but its suggested recovery paths depend on the rejected/deferred patches. It must not become an operational runbook unchanged. A-02's heading also promises cache updates which its diff does not implement. A-03's manifest leaves unresolved questions empty although the narrative acknowledges missing launcher code. These are reasons for primary verification rather than automatic adoption.

No report establishes duplicated live invoices, a live payment compromise or a failure of the completed matched sandbox journey. Do not describe the hypothetical failure cases as production incidents.

## PA-2 decision and next integration task

**Accept B-01's presentation approach for a controlled integration next, not as already shipped.** Current source confirms the stale accepted-change message and misleading cancelled/unknown invoice fallback. The supplied proposal stays within presentation ownership and preserves payment link eligibility, networking, human decisions and existing design.

The proposal adds a small status-to-copy helper, neutral acceptance receipt, accurate remaining/total captions, cancelled/unknown messages and fictional route-mocked browser tests. It does not infer invoice/proposal association, infer PAID from zero balance, validate new URLs or change financial authority. Backend URL policy remains outside this task.

Integration checklist:

- [x] Rechecked current component hash before edits; preserved incoming owner changes.
- [x] Read installed Next client/testing guidance and integrated only the three selected files; retained original response/packet baselines.
- [x] Reviewed fixtures/assertions, corrected new-file patch truncation and inspected actual320px screenshot; no broad nonmutation/accessibility claim.
- [x] Final TypeScript and fresh isolated production/Postman verification pass, with no ordinary workspace/provider activation.
- [x] All17 targeted checks pass including existing recovery/acceptance/link replacement; manual accessibility remains separate.
- [x] Recorded adopted files, receipts and limitations here and in the action plan/status/handoffs.

## Executed verification and limits

Five checks passed together: three primary-authored offline reproductions (`data/agent-response-review/reproduce.test.ts`) plus the existing `tests/invoice-send-outcome.test.ts` and `tests/invoice-recovery.test.ts`. Reproductions cover unbound controller recovery refusal, stale-handle/reopen cleanup and fully validated recovery of a cached incomplete draft. The two existing tests cover lost create/send response and durable repeat-send refusal including later SENT reconciliation.

This is not five newly added product tests or execution of the agents' suggested tests. The approved run used explicit fictional transports and isolated SQLite/controller fixtures; no live provider, licence activation, service, browser or normal database/env change. No application source changed, so no redundant build/typecheck/browser run was needed for this review. Earlier R10b verification remains separate.

Only current intended documentation should be staged. Raw agent response directories are owner-managed input; review their contents before any future public release. This is not the separately deferred complete Git-history/publication audit. Manual R6 and sponsor/judge-access gates remain pending.
