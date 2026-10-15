# B1b: delivery-plan backend contract

## Implementation checkpoint — B3a, October15

lib/delivery-plan.ts now implements pure canonical calendar/task/dependency schemas and validation, with copied results and no store/network/vendor imports. It checks civil dates, fixed weekdays/explicit holidays, timezone input, bounded graph size/span, computed exclusive finishes, unknown dates, cycles/duplicates/backward edges, immutable applied provenance/calendar and reviewed-extra acceptance. Calendar and current snapshot must be supplied together for changes. Preview warnings identify approved but not accepted extras; apply rejects them. Initial base work may include milestones, but no extra proposal task before an initial plan.

Ten new tests pass, all145offline backend tests pass and TypeScript passes. This is validator evidence only. No deliveryPlan field was added to Workspace, no stored schedule was written, no route/UI/package was added, and no persistence/apply/concurrency scenario is claimed passed. B3b remains to define/validate persisted original/current/preview records and verify actual isolated restart/backward compatibility before B4 commands.

Initial restricted tsx run failed at Windows user lookup; approved offline retry ran successfully. First test/typecheck run found a TypeScript never-returning-helper narrowing issue and a provenance test intercepted by the earlier base-task rule. Helper declaration and fixture were corrected; targeted checks/typecheck and the full suite then passed. No app guard was relaxed. Existing production/browser/Postman evidence is retained without a redundant run because the new standalone validator is not imported by application routes/components yet.

Future canonical validator callers must not accept browser-chosen persisted task IDs: B4 still owns local-key-to-server-UUID mapping, strict command/version checks and apply/discard transactions. Existing accepted legacy proposals without a reviewed additional-work record cannot supply a new extra task automatically; surface that limitation without altering historical acceptance or invoices.

October14,2026. Proposed implementation specification, not implemented API/schema or passed test evidence. Reviewed against lib/domain.ts, lib/store.ts, app/api/workspace/route.ts, app/api/client/[token]/route.ts, lib/reconciliation.ts and lib/owner-analytics.ts. No actual environment/database, package, provider or licence read or changed.

## Scope and authority

One internal delivery plan per existing owner workspace. The owner estimates dates/durations; client agreement/proposal acceptance continues to approve scope and price only. UI labels every date as **Owner plan — not a client-agreed deadline**. Changing internal dates never changes accepted scope, deliverables, price, invoice due dates, payment promises or client acceptance. No payment-gated scheduling, resource allocation, external messages, AI duration estimates or automatic provider operation.

The first release supports base-scope tasks, at most one aggregate task per extra proposal, finish-to-start dependencies, full working days and optional zero-duration milestones. No partial days, lag/lead, recurring tasks, task hierarchies, resource calendars or automatic progress/completion inferred from payment. Bryntum is a projection/editor/preview engine; server validation is authoritative.

## Date and calendar rules

| Field/rule | Contract |
| --- | --- |
| Date | Strict real Gregorian YYYY-MM-DD, canonical round-trip checked; no timestamp, rollover date or implicit current-date default |
| Range | Years2020–2100; a plan's scheduled dates span at most730calendar days; dates in the past are allowed for an original plan |
| Working calendar | Monday–Friday, explicit owner-entered holiday list of at most32unique dates; no inferred national holidays |
| Timezone | Explicit valid IANA timezone chosen/confirmed on first application; Asia/Kolkata may be suggested, never silently inferred from browser location |
| Duration | Integer1–120working days for tasks; exactly0 for milestones. This is an owner estimate, not promised effort or model output |
| Unscheduled | Both startDate/endDateExclusive are null. Duration may be known; no date invented to draw a bar |
| Task start | A working date; reject a weekend/holiday instead of silently moving it |
| Task finish | Exclusive date immediately after the last included working date, not necessarily itself a working date; server computes it from start/duration/calendar |
| Milestone | Start equals exclusive end, on a working date; if unscheduled, both null |
| Dependency | Finish-to-start, zero lag; successor start must be no earlier than predecessor exclusive end. Milestone equality permitted |

For example, a three-day task starting FridayOctober16,2026 works Friday/Monday/Tuesday and has exclusive end WednesdayOctober21. If MondayOctober19 is explicitly a holiday, exclusive end becomes ThursdayOctober22. A one-day Friday task ends exclusively Saturday; a successor starts on the next permitted working date, not an invented Saturday workday.

Pure date arithmetic uses validated civil dates and weekday/day-index operations, never laptop-local midnight/DST differences. The Bryntum adapter must explicitly map these conventions and the working calendar/timezone. Its default duration/end-time semantics must not be trusted to match. If the selected engine configuration cannot reproduce these rules, resolve the adapter mismatch before saving anything; do not silently reinterpret persisted dates.

Calendar and timezone are immutable after the first plan is applied in v1. Editing them would affect every task and needs a separately designed reviewed migration. The initial preview may select them; its first apply freezes them. Owner-declared holidays apply only to this project calendar and are not asserted to be legally required holidays.

## Stored state — proposed optional Workspace.deliveryPlan

Existing workspaces without this optional field read as **not configured**. GET never creates schedule data, increments versions or runs reconciliation. Existing seed and sandbox records keep their current content. Store implementation remains the existing JSON body/BEGIN IMMEDIATE transaction, not a new relational database. Discarding an initialization preview removes the revision0 container entirely, returning to not configured; discarding a later preview preserves the applied plan.

| Proposed record | Fields and invariants |
| --- | --- |
| DeliveryPlan | schemaVersion1; revision; calendar; original; current; optional preview. Before initial apply: revision0 and calendar/original/current null; only initialization preview exists. After first apply these are non-null and calendar freezes. Unsupported/malformed stored versions fail with a generic review-needed state, not fabricated empty data |
| original | Immutable snapshot of the first applied plan/calendar and createdAt/actor. Only base tasks, after agreement acceptance. Never overwritten by later apply |
| current | Current applied tasks/dependencies and appliedAt/actor, revision starts1 and increments on application only |
| preview | Server-generated ID, kind initialize/change, stagedAt/actor, baseWorkspaceVersion, stagedWorkspaceVersion, basePlanRevision, candidate, server-computed diff and validation warnings. At most one, persisted across restart |
| Task | Server UUID; plain-text label3–120characters; kind base/extra/milestone; bounded clause references; optional proposalId; duration; canonical dates/nulls |
| Dependency | Predecessor/successor task IDs, explicit finish-to-start type; unique edge, no self-edge/cycle/unknown task |

Bound each snapshot at80tasks/160dependencies and20clause references per task, validated against actual agreement clauses. No HTML, URLs, invoice objects, freeform client communication, secrets or full AI output are scheduling input. Extra tasks require one existing proposalId and link only to that proposal's reviewed work; one proposal cannot create duplicate extra tasks. Base tasks use existing clause references. Milestones have no proposalId; existing base tasks and milestones retain their kind/ID/links across previews.

During initialization, new task inputs use bounded unique local keys, converted to canonical server UUIDs when staged; dependencies are rewritten using that mapping. Subsequent inputs distinguish existing canonical IDs from newly added local keys. Clients cannot choose IDs for persisted new tasks or rewrite an existing task's source linkage. Apply uses stored canonical candidate data; no second browser-submitted snapshot.

V1 change previews preserve all existing tasks/links, allow date/duration/plain-label adjustments and add extras/milestones; existing task deletion and accepted-extra removal are outside this first release. No extra may be applied until its proposal is accepted. An approved but unaccepted extra may exist only in a preview labelled awaiting client decision; draft/declined/missing proposals are rejected. Agreement acceptance is required before initialization.

An edge involving an unscheduled task yields **unresolved dependency**, not an invented date. Apply permits clearly unscheduled independent tasks, but rejects unresolved edges, cycles, backward edges and inconsistent supplied dates. A graph with zero-duration milestones must still be acyclic. Current/end-of-project summaries are null if any required task is unscheduled; do not display a confident launch date from only the known subset.

## Proposed owner-only endpoint and commands

Prepare a new /api/delivery-plan route, not an extension to the public client endpoint. It does not exist yet. Reuse owner authentication, same-origin mutation check, generic bounded errors, no-store, read/action rate limiting and requireIdle. Strict command schemas reject extra keys. Set a32KiB request-body bound and reject larger/invalid bodies before mutation.

| Command | Input / behavior |
| --- | --- |
| GET | Pure owner projection from current store state; optional empty/unconfigured result, snapshot version/asOf, no schedule writes or AI/PayPal calls |
| stage | expectedWorkspaceVersion, expectedPlanRevision (0 if absent), expectedPreviewId (null if none), candidate and initial calendar if needed. Validate/project/recompute diff inside transaction, replace only the expected preview, log bounded counts, leave original/current unchanged |
| apply | expectedWorkspaceVersion, previewId, confirmed=true. Require exact staged version/current plan revision, current accepted agreement/extra states, idle workspace and a valid complete candidate. Revalidate and apply stored candidate atomically; set original only for first initialization, advance plan revision, clear preview and audit once |
| discard | expectedWorkspaceVersion, previewId, confirmed=true. Remove only that current preview, log discard; original/current/calendar unchanged. Stale preview may be discarded after a current refresh, not applied |

Workspace version advances through existing mutate once per successful command. Stage records stagedWorkspaceVersion=baseWorkspaceVersion+1, matching the post-transaction version. Any subsequent workspace mutation, including client decision or authoritative payment reconciliation, makes apply stale even if unrelated dates did not change. This conservative rule is intentional: refresh and restage against the latest records; no silent rebase. A successful apply cannot be repeated because its preview is consumed. Duplicate stages/competing tabs fail their version/preview checks; refresh inspects the winner. Validation failure rolls back the entire transaction, including audit/version.

Lost response is an uncertain **local** outcome: UI refetches the plan and checks preview/revision before another command. It never automatically replays apply. No processing lock is created because these are bounded synchronous local operations; any existing processing lock blocks writes. Webhook/reconciliation code must not touch plan dates or automatically apply a preview. Restaging can replace a preview explicitly; no hidden merge of edits across tabs.

Server derives original/current/candidate comparison from stored and validated fields, not client-supplied claimed savings or delta. Review lists every changed/added task, old/new dates/durations, unscheduled/unresolved counts and finish-date change. Show calendar-day finish delta with that label; do not call it extra effort/working days. Owner-entered duration is separate. Baseline/current comparison remains available after several changes; baseline is never labelled a client-approved commitment.

## Projection, audit and compatibility

Owner projection contains plan records, validation/diff, snapshot freshness, minimal accepted-extra identity/status and invoice context mapped from stored invoices. Multiple invoices remain multiple rows; do not arbitrarily choose one invoice or add their balances without reviewed accounting semantics. Include status, amount/outstanding cents, ambiguous pending outcome and last known record freshness where available. No payUrl, recipientEmail, clientToken, owner secret, raw webhook payload or full agreement body.

Schedule GET reads local payment state only. A new /api/workspace GET can independently reconcile under its existing behavior; schedule freshness must not imply a fresh PayPal fetch. Unknown/OTHER, partial payment, cancelled or pending-send state is shown accurately, not as scheduling permission. Invoice dueDate and Workspace.promiseDate never become task dates.

Existing clientView is an explicit allowlist; keep schedules/previews out of it and test the exclusion. Existing owner workspace GET spreads the Workspace, so adding deliveryPlan would also expose it to the authenticated owner there; document and test this rather than claiming only the new endpoint contains it. Do not expose schedule state to the minimal analytics/AI projection without a separate review.

Audit titles identify stage/apply/discard and counts/revision; do not copy labels/free text/private links into detail unnecessarily. Schedule writes leave agreement, proposals, invoices, policies, payment promises, processing, remote_operations and webhook_events unchanged. Demo reset already clears all optional workspace fields, so it must also clear schedule data while staying forbidden in sandbox. No side-effectful read-time migration; any future schema upgrade is explicit/versioned and tested with consistent backups.

## Acceptance scenarios for B3–B6

1. Old paid/accepted workspace without plan: GET unconfigured and byte-identical financial state; original version/remote identities preserved.
2. Initial accepted-scope base plan: stage leaves current unset; confirmed apply creates immutable original/current once; restart preserves all records.
3. Friday/weekend/holiday example above and leap-day validity; duration/end inconsistency, impossible dates, half-days, unknown timezone, duplicate holidays and unsupported schemas rejected.
4. New accepted booking extra added in a preview: original dates unchanged, full impact diff shown; discard makes no date/financial change, apply changes internal plan only.
5. Approved/unaccepted extra staged as tentative: apply blocked; client acceptance makes old preview stale and requires restaging. Draft/declined/foreign/missing proposal rejected.
6. Missing dates stay unscheduled; unresolved edge prevents apply; cycle/self/duplicate/missing edge and successor-before-predecessor fail without mutation.
7. Two tabs stage/apply/discard; exactly one expected-version winner, no lost current plan or duplicate extra. Lost response followed by inspection cannot apply twice.
8. Payment update between stage/apply makes preview stale; restage does not alter dates automatically. Paid/part-paid/cancelled/unknown does not authorize schedule changes or mark tasks complete.
9. Existing processing lock blocks all writes; forged IDs/kinds/source links, unknown fields, oversized payload and unconfirmed apply/discard rejected.
10. Pure owner projection and client/analytics omission: no private financial URLs/tokens/freeform agreement or schedule leaks; unauthenticated/cross-origin requests fail.
11. Financial fields/tables unchanged before/after all schedule commands and validation failures; demo reset clears plan, sandbox reset refused. Malformed stored schedule fails closed without erasing other records.
12. Bryntum actual adapter outputs match calendar/date rules across timezone/DST settings; keyboard/text fallback, preview/cancel/refresh/error states tested before claiming interactive scheduling.

No scenario above is marked passed. B1b completes the contract only. Next B2a inspect exact Gantt packages/licence/Next/React guidance without installing; B2b/c owner trial/permissions/judging continuity then gate component work. Pure backend implementation uses this contract in B3; any discovered change is recorded here and in REVIEW_ACTION_PLAN.md before execution.
