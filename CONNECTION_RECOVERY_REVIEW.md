# R7a: owner and client connection recovery

October 11, 2026. This is a bounded browser/UI review using isolated fictional records. R6 hands-on accessibility and the remaining R7 states are separate open checkpoints.

## Findings and changes

Owner and client refresh failures previously shared the action-error state. Successful reads did not clear old connection errors, and using a blanket error clear would instead hide unresolved action failures. They now have a separate connection-error state: a successful read clears that state while preserving an action error until explicitly dismissed or a new action begins.

After an observed failed refresh, previously loaded records remain visible with an explanatory connection banner and Retry connection. Mutation/decision controls pause until a successful read. Owner/client handlers also guard against actions while that connection error is present. This is an additional UI safeguard; existing server authorization, scope approval, link validation and idempotency remain authoritative.

Owner read authorization failure removes the loaded workspace and shows the protected sign-in form. Action authorization failure does the same and explains that the session expired. No owner token is added to source or tests.

Client GET or decision POST returning 404/410 removes previously displayed project data and resets consent. The error asks the client to obtain a current link. The server currently uses 404 for missing, rotated and expired links; the UI does not claim to distinguish their causes. A separate 410 case verifies a terminal response is handled too. Retry rechecks the same link; it cannot repair or renew it.

## Verification scope

Six new browser cases cover initial owner read recovery with no mutation; background owner read failure/recovery with action-error preservation; action session expiry; background client read failure/recovery with decision-error preservation; actual fictional link rotation while an already loaded client page is open; and an invalid-link decision response hiding stale controls. The rotation case uses the real local route and new stored token; other failures are browser-intercepted fictional responses. Neither pattern proves hosted connectivity or a real signed-in sandbox session.

All six new recovery checks passed in the final targeted Edge run. The preceding broader run passed 13 existing checks (nine accessibility, one client-link and three keyboard journey/focus checks). Its six new cases initially failed because a global alert locator also selected Next's route announcer; assertions were scoped to application surfaces without changing the production app or weakening expected messages. There are 19 distinct passing checks across these two runs, not one final combined all-green run.

TypeScript, isolated production build and Postman 31 requests/50 assertions pass. A real process restart preserved compared paid/approved/audit/client-access state; no provider-fetch attempt occurred. Current targeted source privacy check reviewed236 files with zero findings; history/remote privacy clearance remains separate. Backend code is unchanged, so129offline tests remain prior baseline evidence. Generated configs, traces and SQLite fixtures stay under ignored data directories. No ordinary environment/database or provider operation was used.

## Remaining limits and next checks

- UI invalidation occurs when the response is observed, normally on the existing five-second polling cadence. It does not erase information already viewed or revoke separate PayPal payment URLs. Server-side validation already rejects invalid-link decisions independently of the UI.
- These reads still use the existing polling implementation. Hung requests, overlapping/out-of-order reads, offline browser transitions and cancellation need their own bounded review; this task does not claim they are resolved.
- Complete the remaining R7b loading, empty, sign-in retry, busy/double-action and uncertain-operation presentation checks. Existing operation/backend tests are evidence for their tested cases, not blanket product sign-off.
- Actual Narrator announcements, real browser zoom and physical touch remain R6b/c owner-assisted checks. Existing Studio vendor findings remain open.
- No SQLite-to-PostgreSQL migration, live AI activation, sponsor signup, deployment or public exposure is part of this task. Hosting/database choice remains a deployment decision under D, with persistence/transaction/concurrency checks if a migration is selected.
