# R7b2: sign-in, loading, empty and uncertain states

October12,2026. Bounded product-state review on the isolated fictional production app. This is not hosted/session-cookie, live AI, real PayPal, human usefulness or manual accessibility sign-off.

## Findings and fixes

- After successful sign-in followed by a failed workspace read, the login form previously hid its connection error. It now shows that error and a separate connection-retry button; retry does not submit the token again.
- Sign-in disables the token field while pending, marks its form busy and exposes an access-check status. A rejected token remains editable for a reviewed retry, while successful sign-in clears it. Existing immediate pending guards prevent duplicate submissions.
- Initial owner/client read retry now recovers focus to the resulting main heading when the retry control disappears. Recovery does not move focus away from another connected control.
- An empty Activity view now explains that no activity has been recorded and where decisions/payment updates will appear. Existing project, approval, payment and draft-client empty states were checked for guidance and approval gates.
- Pending owner/client writes expose a saving status and ask users to wait. Transport failures or malformed JSON action responses are described as unconfirmed outcomes; the browser cannot infer that the server did nothing. Successful subsequent reads preserve the unresolved action notice until dismissal or another action; no automatic write replay is introduced.
- The interrupted-action recovery form now respects connection-error locking as well as its own busy state. Running/unknown process ownership does not expose an unlock action; an exited-process fixture requires a note and explicit confirmation. No fixture recovery action was executed.

## Checked scenarios

Ten new browser scenarios cover owner/client initial retry focus, pending/rejected sign-in and successful sign-in with read failure, empty states, three process-ownership states, uncertain invoice/reminder gates, and two completed-local-action/lost-response journeys. Existing read-lifecycle checks also assert saving-status visibility while writes are held.

Sign-in and process-ownership fixtures are intercepted browser responses, not a real account or crashed process. Uncertain-send/reminder UI fixtures verify warnings, disabled repeat buttons and review-input gates without sending, resolving or paying an invoice. Lost-response cases execute the real local approve/accept route, then discard its response: reads must reconcile state, with one write and one new audit entry. These are agreement decisions with fictional data, not new PayPal webhook/payment evidence.

The final35-case Edge run passed together:25prior regressions and10new readiness-state cases, including the two lost-response journeys. TypeScript, rebuilt isolated production app, Postman31requests/50assertions and real process restart pass; provider-fetch attempt false. Current targeted source scan reviewed243files with zero findings; history/remote clearance remains separate. The earlier33-case run also passed before the saving/unconfirmed-response follow-up. No additional backend test suite was rerun for this frontend change; earlier backend evidence remains baseline.

Generated artifacts remain ignored, and temporary test servers were cleaned up without touching ordinary dev/manual sessions. No AI allowance, real payment, provider operation or private workspace data was used.

## Limits

- A write that never settles remains pending; the browser does not impose a timeout then resend it. Read deadlines do not cancel writes or server-side remote work. Existing processing/uncertain-invoice recovery requires authoritative checks, not elapsed time alone.
- The review verifies the exercised presentations and gates, not every status/browser/provider failure. End-to-end real authentication/cookies and hosted operation require their own deployment evidence. New findings can reopen this checklist.
- Screen-reader speech, actual200/400% zoom and physical touch remain in TESTING_CHECKPOINT.md. Known Studio edit-mode nested-button findings remain unresolved; no WCAG conformance claim is made.
- Backend implementations are unchanged. Existing backend tests remain prior baseline evidence; there is no new live provider, allowance or subscription activation.

Next planned work: R8 privacy disclosures, data lifecycle/recovery documentation and sanitized runtime-log review, using fictional isolated fixtures. Source/history privacy gates and sponsor permissions remain distinct.
