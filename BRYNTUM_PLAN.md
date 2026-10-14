# Bryntum: owner-reviewed delivery impact

October14 B1b complete: BRYNTUM_BACKEND_CONTRACT.md defines optional versioned SQLite JSON schedule, immutable original/internal current/preview, owner calendar/civil-date/exclusive-end rules, accepted-extra linkage, stage/apply/discard/version/idle gates, pure minimal projection and12future acceptance scenarios. Current source inspected: workspace GET spreads optional fields, client view is allowlisted, payment promise differs from delivery; payment mutations stale previews. No implementation/schema/package/licence/provider change, no scenarios claimed passed. Next B2a exact Gantt package/licence/React/installedNext guide inspection without installation, then B2b/c owner trial/judging permissions. Zapier remains researched, not activated. R6 Narrator/zoom/touch, H/E and Render external gates remain open.

October13,2026. Owner selects Bryntum planning now and defers user research until later. This explicitly supersedes the earlier research-before-planning prerequisite, without claiming the need is validated. No package installed, trial claimed, code/schema changed, AI called or sponsor contacted.

## Product decision

Adopt a bounded **Bryntum Gantt** workstream: show original owner-planned delivery work and a proposed schedule for an accepted extra, so a freelancer can see and review the date impact before changing the internal plan. Gantt fits tasks/dependencies; Scheduler is better for resource bookings, which Nudge does not currently manage. One project/owner workspace is enough; do not introduce a multi-client staffing product.

The [official sponsor brief](https://paypalaihackathon.devpost.com/details/bryntum) explicitly includes agency delivery timelines, but its examples do not establish demand, prize eligibility or contractual authority. [Gantt documentation](https://bryntum.com/products/gantt/docs/) describes tasks, dependencies and scheduling. A strong integration would use the timeline, constrained dependency preview and original-versus-proposed comparison; a decorative bar chart alone is not sufficient justification for commercial dependencies.

Example, fictional only: the owner schedules website work and launch; an accepted booking extra needs an owner-estimated three working days. A preview shows the possible effect on the internal launch plan. The owner can discard it or explicitly apply it. The current client acceptance approves work/price, not new delivery dates: internal plans must not be labelled client-agreed. External date commitments require a separately designed explicit client-review workflow if later added.

## Authority and data requirements

- Dates/durations originate from explicit owner entries, never AI guesses, invoice due dates or a payment promise date. Existing Workspace.promiseDate is a client's payment promise, not a delivery date.
- Original scope, owner-approved proposals, client decisions, invoice statuses and balances remain authoritative in the current backend. Gantt gets a minimal projection, no secrets, client tokens or private payment URLs.
- Store date-only values and an explicit working calendar/timezone. Specify end-date inclusivity, weekends, holidays and unknown dates before implementation; missing dates remain unscheduled rather than fabricated.
- Preserve the original owner plan separately from a proposed change. Editing the chart/dragging only changes a preview. No financial/provider operation is a scheduling callback.
- Link an extra task to an existing proposal ID. Require accepted status before applying its schedule to the internal plan. Declined/unaccepted work may appear only in clearly tentative previews. Validate scope references and proposal existence server-side.
- Preview computation may use Bryntum's engine, but the server must validate submitted tasks, dates, dependencies and allowed changes against the current workspace version; browser output is not authority. No hidden remote recalculation after acceptance.
- PayPal status is contextual: paid/part-paid/unpaid/cancelled/unknown with amount and snapshot freshness. Payment alone never approves scope, confirms work completion or reschedules work. Do not add payment-blocked delivery without an explicitly supported agreement rule.
- Unknown/partial payment, stale snapshots and pending remote outcomes cannot be simplified into a guaranteed delivery promise. Any dependency cycle or unsupported schedule must fail without changing the saved plan.
- Owner-only first version. Existing client payload stays unchanged; no accidental public access to internal tasks, draft changes or financial records.

## Ordered implementation checklist

1. **B1a complete:** product decision/limits/source review in this document. The benefit is a hypothesis, not an interview result.
2. **B1b complete:** BRYNTUM_BACKEND_CONTRACT.md specifies exact date/calendar/state/projection contracts and acceptance scenarios from existing domain/store/route authority. Include what an old SQLite workspace without schedule data does; preserve old workspaces and all financial identities.
3. **B2a:** review exact Gantt trial/package/version and React/Next compatibility from official guides and installed Next docs. Read package metadata/licence/install scripts before installing; no blind download execution or copied Scheduler package just because the sponsor example uses it.
4. **B2b:** remind owner to claim the intended Gantt trial only when installation is ready. Review required signup fields, marketing preferences, licence/key handling, package redistribution, public-source and hosted-evaluation permissions. Stop at a card/subscription requirement. No automatic form submission.
5. **B2c:** record actual start/expiry and obtain free coverage or a permitted reproducible judge path through December15. A45-day trial begun in mid-October would not cover December judging; published duration does not give an account-specific expiry or extension. Prepare owner-sent support question, no outreach by agent.
6. **B3:** implement minimal versioned schedule storage and validation: bounded tasks/dependencies/dates, explicit calendar, unscheduled state and migrations/backward compatibility. Separate owner plan from tentative preview; no financial changes.
7. **B4:** add owner-authenticated read/propose/apply/discard operations. Explicit apply checks version/accepted-extra state; repeated/concurrent/stale applies cannot create duplicate tasks or overwrite a newer plan. Preserve original/current/diff in audit without secrets.
8. **B5a:** integrate one client-rendered Gantt screen with theming matching Nudge. Show original/current/proposed dates, actual extra link and contextual PayPal state. Read-only until preview workflow; chart drag/edit cannot save directly. Lazy-load without disturbing AG Studio/core routes.
9. **B5b:** add reviewable impact preview/apply/discard, stable refresh and unscheduled/error states. Verify no model/provider calls on load, edit, cancel, apply or PayPal reconciliation; make backend authority visible in the UI.
10. **B6a:** meaningful offline/backend checks: invalid dates/calendar/cycles, missing/declined proposals, forged fields, stale/concurrent applies, duplicate links, existing records, restart persistence, partially-paid/unknown payments and financial nonmutation.
11. **B6b:** actual component/browser checks: keyboard edit/preview/apply/cancel, text/table fallback,320px reflow, reduced motion/contrast, browser refresh and failures. Extend owner R6 Narrator/zoom/touch checklist for the new screen; do not count existing AG checks as Bryntum evidence. Run applicable build/Postman regressions after actual backend changes.
12. **B7:** later consenting user review and exact original-versus-proposed scenario rehearsal. Revise/remove unsupported complexity. Update sponsor attribution/demo/evidence and Render memory/bundle/runtime budget based on actual results. No production readiness, demand or award claims from package installation alone.

Licence confirmation precedes trial-dependent integration and public judge access. B1b backend design can proceed independently without a trial, paid usage or live AI. Findings may reopen this decision. F3 architecture review follows the new domain design; deferred H/E/R6 and Render D3b/D4b remain checkpointed.

## Licence questions for owner to send when ready

> Hello! I am planning a Bryntum Gantt evaluation feature for the PayPal AI Hackathon, showing owner-reviewed delivery-date impact for accepted scope changes with PayPal sandbox payment context. Could you confirm the correct React trial packages, whether the trial permits a hosted hackathon demo and public MIT application source with dependencies installed separately, and whether free evaluation access can cover judging through December 15, 2026? How should judges reproduce the demo without publishing trial credentials or restricted package files? I would like to remain within free evaluation terms. Thank you!

[Official trial page](https://bryntum.com/download/) advertises45days and shows required Name, Company and Work email fields. Do not invent an employer or work address; ask how an independent participant should fill these if the form rejects truthful personal-project details. No form submitted or account-specific terms verified.
