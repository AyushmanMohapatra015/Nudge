# Antigravity work: recovered artifacts and continuation checkpoint

Later October 17 F2r-b: Codex prepared and verified a separate revised candidate under ignored data/frontend-revision/2026-10-17-v1; original Antigravity artifacts remain unchanged. FRONTEND_REVISION_REVIEW.md records 20 layout/axe viewport observations, 18 passing interaction checks, visual review, reset defect correction and next small F2s application slice. Do not ask the external agent to duplicate this completed revision or copy its old source snapshot into the app. No revised source was merged. Local revised artifact copies are not part of the documentation commit.

Later October17 frontend deliverables received: FRONTEND_DESIGN_BRIEF.md and FRONTEND_MOCKUP.html now exist; the earlier absence below describes the recovery-time snapshot. All310original manifest files remain unchanged. FRONTEND_DESIGN_REVIEW.md records an actual offline Edge1440/390inspection, preserved input hashes/copies, visual judgment and required revisions (mobile overflow, price/gate inconsistency, client shell, factual/a11y claims). No design file or app code modified/merged. The candidate is useful but not implementation-ready; actual UI-only/unsaved work still cannot be inferred from files.

Inspected October 17, 2026 at the owner's request after Antigravity stopped because its token allowance expired. This is a filesystem recovery and targeted static source cross-check. No code from the review folder was run, no source was merged, and no application, provider, licence, account or private database was changed. Pre-existing M6/Postman and documentation edits in Nudge were preserved.

Later October17 R10c follow-up: [RECONCILIATION_CONCURRENCY_REVIEW.md](RECONCILIATION_CONCURRENCY_REVIEW.md) records implemented wait/failure/recovery regressions, seven passing focused outcomes/TypeScript and rejection of a disposable missing-guard mutant. This supersedes observation15's pending-test status below; the recovery task itself remained read-only for runtime source. R10b and the other unresolved gates remain open.

## What was actually saved

Review folder: `D:\Nudge-Antigravity-Review`.

| Item | Observed state |
| --- | --- |
| Original review snapshot | All310manifest-listed files are present and byte-for-byte unchanged |
| Original manifest | Matches the separately retained preparation-stage manifest |
| Added files | Exactly one: REVIEW_FINDINGS.md |
| Saved report | 33,896bytes;16numbered finding/observation sections, positive-review areas and a concluding summary |
| Frontend design brief or mockup | No FRONTEND_DESIGN_BRIEF.md, FRONTEND_MOCKUP.html or other added frontend artifact found |
| Implementation changes in review folder | None against the original manifest |
| Current Nudge runtime comparison | All61files under app/components/lib in the review snapshot match the corresponding active files |
| Generated/dependency/private folders | None encountered by the bounded recursive inventory; no links followed |
| Agent tests/runtime results | Report explicitly states static analysis only; none established by these artifacts |

The report has an ending summary rather than an obvious interrupted sentence. This supports that a backend review document was saved; it does not prove the agent completed every intended task or actually inspected every file it says it read. Agent conversation state, unsaved editor buffers, UI-only plans and artifacts stored outside this folder were not available in the requested scope. Their existence/content is unknown. If the Antigravity UI still shows a design or plan, export/save that artifact explicitly; no broad filesystem/account access is needed just to recover a visible document.

The review snapshot predates Nudge's later Bryntum judge guide, M6 collection extension and other recent documentation. Its old31/50Postman counts are not a regression in the current47/77workflow. Do not copy the entire older folder back into Nudge.

## Preservation and integrity

Original report remains untouched at `D:\Nudge-Antigravity-Review\REVIEW_FINDINGS.md`.

A byte-identical second copy and inventory were saved inside the main workspace:

- `data/antigravity-preservation/eb991af6-6a9d-426f-9180-aee6d5cb316d/artifacts/REVIEW_FINDINGS.md`
- `data/antigravity-preservation/eb991af6-6a9d-426f-9180-aee6d5cb316d/inventory.json`
- `data/antigravity-preservation/eb991af6-6a9d-426f-9180-aee6d5cb316d/original-review-manifest.json`

Report SHA-256: `e9490ddc064d2e6561d82f6a9ce0d8de9a9045c33d8f0ebbb0714a00a1e2a429`.

The archive records every discovered file hash, added/changed/missing inventory and current runtime comparison. A targeted known-pattern scan of the added report found no findings; this is not a comprehensive privacy/security guarantee. Original bytes were compared with the backup after copying. The audit/preservation helper is retained locally as `data/preserve-antigravity-progress.mjs`; it is our inspection tool, not an Antigravity output.

Final read-only recheck compared all312discovered files with the saved inventory: zero mismatches and no file-count change; original report and backup hashes match. The current-source privacy helper reviewed316candidate files with no known-pattern findings or sensitive historical paths; historical contents/remotes remain unreviewed by that helper. Local document links and whitespace checks pass. No application/browser/provider tests were run for this recovery-only task.

**The raw archive is ignored by Git and is local, not a cloud backup.** This tracked record and resume prompt preserve the useful conclusions and next steps. Keep the original review folder/archive; do not delete them when committing the documentation. Public disclosure or redistribution of the full raw report has not been reviewed or performed.

## All numbered observations, with current triage

These are assessments from static source reading, not newly reproduced exploits or passing tests. Antigravity's severity labels are its opinions and are not automatically accepted as confirmed project defects.

| # | Report topic | Source cross-check and disposition |
| --- | --- | --- |
| 1 | Raw clientToken in owner workspace response | Confirmed field exists in authenticated owner view; it is a bearer secret. However, components/workspace.tsx directly uses it for client links and passes it to ClientLinkSettings for rotation. The suggested omit-field patch is incomplete and would break those features. Treat as an exposure-minimisation/threat-model follow-up, not a demonstrated unauthenticated access bypass. No fix applied. |
| 2 | Demo mode skips owner auth/defaults to demo | Intentional documented simulation boundary. The report's deployment suggestion omits existing Render startup protection: scripts/render-config.mjs requires sandbox mode and a private owner token, called by scripts/start-render.mjs, with tests/render-config.test.ts. That prepared path is not a deployed/verified host and does not guard arbitrary alternative start commands. Keep deployment-mode checks in D; no new application change justified here. |
| 3 | Requests with absent Origin can pass sameOrigin | Confirmed implementation choice. Sandbox owner authentication/client bearer checks still apply; this alone is not an authentication bypass. Keep as existing defence-in-depth/compatibility context; do not blindly require browser headers on every client. |
| 4 | Two outer read() calls in reconciliation | The transactional mutate rechecks version/processing before writes. The report itself concludes no corruption defect. A local-variable refactor would be optional clarity work, not a required security fix. |
| 5 | Zero parser vs minimum invoice total | Correct separation: zero can be an outstanding balance while approved invoice totals have a minimum. No new defect established. |
| 6 | Busy webhook transaction yields503 | Intentional retry/rollback behaviour, with existing tests/webhook.test.ts checking no event is recorded during processing. The report's claim that finishing before mutate itself causes a rejection is not established: requireIdle reads state inside that transaction. Do not change transaction/retry sequencing based on that sentence. |
| 7 | External send outside local transaction with pendingSend | Existing intent/uncertainty/recovery design, covered by invoice-send-outcome tests and processing docs. Local transactions cannot make a remote call atomic. No new bug established by the report. |
| 8 | Attempt cache marker separate from workspace transaction | Conservative persisted-attempt/recovery boundary. The report describes a crash-window trade-off, not a demonstrated duplicate creation. Preserve recovery gates; no automatic replay or transaction refactor. |
| 9 | Process-wide rate windows | Already documented single-process limitation. Trusted-edge/shared limiting is a deployment consideration; do not add unsupported per-IP trust or claim multi-tenant/distributed protection. |
| 10 | Raw JSON splicing for webhook verification | Current route parses/validates JSON before passing raw text; source comments explain precision preservation. The report finds no new defect. Its broad claims about PayPal signing/serialization requirements were not independently verified in this recovery task; preserve the existing implementation/evidence instead of treating that explanation as an API specification. |
| 11 | Owner connection-presence booleans | Confirmed status booleans, not credential values. Intended owner-only feedback; no new secret exposure demonstrated. |
| 12 | Cancelled invoice has zero collectible balance | Existing domain behaviour keeps CANCELLED distinct from PAID, with payment-integrity coverage. No new defect established. |
| 13 | Provider HTTP/error details in owner response | Existing privacy tests/documents apply; the report presents no concrete newly leaked secret. General handling is not universally cleared by these examples. Preserve as review context, not evidence that all possible errors are safe. |
| 14 | No explicit literal UNPAID/smaller-balance case | A possible explicit-case improvement, with important overlap: tests/payment-integrity.test.ts already rejects status SENT using a smaller balance from snapshot(); lib/paypal.ts normalises SENT to UNPAID before the same guard. The smaller-balance rejection branch is already exercised. A literal UNPAID alias case would clarify status coverage, not establish an untested branch or money bug. |
| 15 | Missing concurrent reconciliation coalescing test | Useful candidate from the recovery pass, since sequential throttle could hide a missing guard. Subsequent R10c now tests controlled leader/follower waiting beyond throttle, failure nonmutation and recovery; seven focused outcomes pass and a missing-guard mutant is caught. See RECONCILIATION_CONCURRENCY_REVIEW.md; no active backend fix was required. |
| 16 | Constant-time token equality | Positive existing observation in lib/auth.ts/lib/client-access.ts; no defect claimed. It is not independent security certification. |

The report also positively describes human review, owner-controlled prices, accepted-work invoice gates, authoritative money/status checks, webhook deduplication, transactions and processing recovery. Retain these as useful review commentary; they do not replace the actual test receipts or close live/judge/user checkpoints.

## Follow-ups worth retaining

### A. Review owner-link exposure before proposing a change

Inspect app/api/workspace/route.ts, components/workspace.tsx, components/client-link-settings.tsx, lib/client-access.ts and current client/link/session tests. Identify the intended trusted owner/browser boundary, accidental logging/demo disclosure risks, how links are shown/copied and what a separate explicit reveal would reduce. The full URL contains the same bearer secret; masking a token is insufficient to generate a working client link. A script with full owner-session access may still invoke an explicit reveal endpoint, so define the threat rather than promise isolation from browser compromise. Preserve expiry, rotation, stable invoice identity and existing approvals. No new endpoint, schema or UI contract is authorised by this recovery record alone.

### B. Consider a meaningful in-flight regression

This proposal was implemented after recovery as R10c. A fresh fictional sandbox-mode test database, controlled time and manually released promises check waiting, one lookup/mutation/audit, shared failure and later recovery. The follower's injected time exceeds the throttle interval, and the missing-guard mutant is rejected. See RECONCILIATION_CONCURRENCY_REVIEW.md for actual results and limits; this is not a live provider or HTTP concurrency check.

### C. Optional explicit UNPAID spelling check

If refining payment tests, add the explicit alias case to the existing invalid-data table and preserve its nonmutation assertion. Explain the existing SENT overlap. Do not write a new feature or claim a discovered reconciliation defect just to increase test counts.

These items were recorded in REVIEW_ACTION_PLAN.md during recovery. Subsequent R10c is complete within its focused-test scope; R10b and optional alias clarification remain distinct. Neither recovery nor the later test work resumes deferred E/H/R6/provider work.

## Resume the frontend work without repeating the backend review

Use [ANTIGRAVITY_RESUME_PROMPT.md](ANTIGRAVITY_RESUME_PROMPT.md) as a compact new assignment. It preserves the earlier frontend brief, limits the initial reading and requires early saved checkpoints. The requested outputs remain FRONTEND_DESIGN_BRIEF.md and FRONTEND_MOCKUP.html; neither exists in the inspected folder.

Keep the sanitized review folder as the only workspace. Existing review-only AGENTS instructions restrict writes to REVIEW_FINDINGS.md; the owner must explicitly provide the new design assignment's two-file output permission and keep actual outside-folder/terminal/network/account restrictions. This recovery task did not alter those settings or instructions. No whole-folder copy, automatic merge, dependency install or broad terminal permission is needed for the design pass.

After a design is saved, inspect the fictional offline mockup and brief before selecting changes to the real frontend. Financial/approval logic, actual sponsor components, native accessible fallbacks and known performance/accessibility limits remain authoritative in Nudge. F2 is still pending; recovery of a report is not frontend completion. A3b/D4b and all other pending sponsor/live/manual/publication gates remain unchanged.
