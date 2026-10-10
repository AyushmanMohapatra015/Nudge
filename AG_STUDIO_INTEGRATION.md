# AG Studio: first working integration

## Guarded backend transport — October 10

Added a disconnected owner-authorized sandbox-only /api/analytics/agent POST endpoint and reusable transport factory tested with mocks. Strict minimal input, server-derived totals/shared validation, version checks, rate/body/deadline limits, retained in-flight lock after timeout, cancellation, bounded replies/usage and sanitized no-retry failures. Production has no adapter or UI connection. All105 offline tests/typecheck, six harness/four Analytics-HTTP checks, final build and Postman31/50 pass. See STUDIO_AGENT_TRANSPORT.md for limits: request caps are not a monetary ceiling, and the reply contract still needs an AG-UI bridge. Next offline runner/transport interoperability, not live AI. Existing allowance/accessibility/licence/core gates remain active.

## Offline runner and harness verification — October 9

Six browser scenarios now exercise the prepared analyst through a real Studio instance, createAiHarness and clientToolRunner using scripted responses. Automatic/read/request/resume, stale/invalid/unknown rejection, exact three-turn termination and cooperative cancellation pass. Each asserts zero network attempts/runtime errors and unchanged fixture totals; sessions/harness/Studio are torn down, and thread deletion is checked. Typecheck passes. esbuild0.28.2 is a direct pinned development dependency for the fixture bundle; no website/model registration or runtime dependency added. See STUDIO_AGENT_PREPARATION.md for standalone repeat command and limitations. Prior97 offline tests and Analytics verification retained. Next owner-authenticated mocked transport/usage limits; no live model calls while allowance hold remains.

## Agent definition preparation — October 9

Prepared an inactive, type-checked snapshot analyst definition with one read-only totals tool. Runtime argument/name/version checks, numeric/provenance validation, cancellation, explicit privacy projection and fixed errors are covered by five new tests. All97 offline tests and TypeScript pass; no website registration, harness/model/financial access or new live-agent claim. See [STUDIO_AGENT_PREPARATION.md](STUDIO_AGENT_PREPARATION.md). Next actual runner/harness verification with scripted offline responses; live usage remains paused under the allowance checkpoint. Existing accessibility/licence/core gates remain open.

## Export verification — October 8

Actual CSV/PNG downloads verified: exact projected columns, USD dollars rather than cents, $300.01 quote precision, selected/page-filtered invoice rows, highlight-mode chart CSV retaining both groups, independent quote exports, empty export suppression and reset. Meaningful enabled titles fix the initial widgets' `.csv` → `csv.txt` filename issue; enabled caption/title make PNGs self-describing. Page guidance explains export scope. Complete CSV serialization and absence of client identity/token/internal IDs are checked; stored state and audit remain unchanged. Final ten Studio browser checks/typecheck/isolated build/Postman31/50 pass. PNG signature/dimensions and visual content checked. See [STUDIO_EXPORT_REVIEW.md](STUDIO_EXPORT_REVIEW.md) for scope/limits. No vendor patches or provider calls. Next bounded work is offline Studio-agent guardrails; existing AI, accessibility and hosted licence/core gates remain active.

## Accessibility checkpoint — October 8

Added keyboard skip navigation, refresh announcements/focus recovery, internally scrollable report canvas at narrow widths, and native complete-snapshot tables. Two new browser checks and seven existing Studio checks pass; production build/Postman31/50 pass. View/table scans find no violations in exercised states. Edit mode retains two explicitly tracked vendor nested-button defects; no vendor patches or scan exclusions. Real assistive-technology, complete keyboard chart/layout and touch review remain pending. See [the review](STUDIO_ACCESSIBILITY_REVIEW.md) for precise evidence, limitations and cleanup. No provider calls. Next local task: export contents/units/filter verification, with existing AI and hosting checkpoints retained.

## Chart-click cross-filtering — October 7

Initial report now explicitly configures the invoice grid for cross-filtering, the ageing chart for cross-highlighting, and the unrelated quote grid to ignore cross-filter selections. A visible instruction explains selection and clearing. Clicking an ageing bar narrows invoice rows; clicking the same bar again or deleting the Cross Filter card clears it. Page filters remain independent. Full-workspace totals and the custom pending-acceptance summary continue to use server-calculated cents and are unaffected by report selections.

Two actual-canvas browser journeys verify a current $1,200 invoice, overdue $800 invoice and approved $300.01 quote created through fictional local workflows. An overdue-bar click hides the current invoice while preserving the overdue invoice, quote and full-workspace totals. Both clearing methods restore invoice rows. Refresh retains selection. Conflicting Current-page/overdue-chart filters produce no invoice rows; removing only the chart filter retains the page filter, and then removing the page filter restores both rows. Stored workspace/version/audit are unchanged, no dashboard API mutations or browser runtime errors occur. Canvas tests use bar hit-testing at the fixed fixture viewport rather than injecting a filter into Studio state; they do not establish keyboard or touch accessibility.

Verification: TypeScript, isolated production build, Postman31 requests/50 assertions and seven combined Studio browser tests pass. Prior92 server tests and three core workflow browser checks remain baseline evidence, not new runs. No model calls, PayPal calls, billing changes or ordinary workspace data writes. Isolated build c1d9068a-1498-4614-939f-d19682bb0092 and screenshots are ignored. This follows the documented [Studio cross-filter modes and clearing behaviour](https://www.ag-grid.com/studio/react/filters/).

Next: complete the Studio accessibility review and retain the existing PayPal verification checkpoints. Remaining Studio work includes complete keyboard/touch/screen-reader review, export contents, and the bounded Agent Framework experience under the existing model allowance hold. Hosting/licence and core AI/webhook/research/submission checkpoints remain active. This entry supersedes pending chart-click notes below.

## Menu, layout and page-filter verification — October 7

Verified actual Studio controls against an isolated production build: add the Nudge widget from its menu, duplicate/delete it, resize/move it, retain those edits across local snapshot refresh, and reset to the default report after leaving the page. Newly added widgets now use pixel-based default/minimum sizes (520x280 / 280x240), rather than confusing definition pixels with report-layout tracks. This fixes undersized widgets added through the menu; the initial report still uses track-based layout. Readable Duplicate/Delete labels replace vendor internal keys on the custom widget and the initial grid/bar-chart types. Existing grid export and chart export/download actions are preserved and labelled; export file contents have not been independently reviewed.

Mixed-record browser verification creates fictional paid/unpaid invoices and accepted/approved/declined quotes through actual application APIs. An invoice-status page filter hides the paid row, retains the unpaid row, and leaves unrelated change rows, the $300.01 pending quote and all full-workspace totals unchanged. A no-match filter produces no invoice rows; refresh retains it, and deleting it restores both invoice rows. Both new journeys assert no dashboard API mutations, no browser runtime errors and unchanged workspace records/audit/version.

TypeScript, final isolated production build, Postman31 requests/50 assertions and eight combined Studio/core-workflow browser checks pass. Prior92 server tests remain the backend baseline; no backend change or live AI/PayPal call occurred. Final isolated build: data/postman-workflow/72a51e7b-e2e4-49ea-89a4-7f8c6dd7b02a. Browser artifacts use fictional records and stay ignored. The test-only build emits a workspace-root warning due to its copied lockfile; ordinary source configuration was not changed for this disposable artifact.

Next bounded Studio task: configure and verify chart-click cross-filtering, including reset and empty results. This page-filter result does not establish chart-click cross-filtering. Full keyboard/screen-reader access, narrow-canvas editing, export contents and reload-persistent layouts remain unverified. Session-only report edits are the documented current behaviour, not persistence across navigation. Live Studio-agent usage, hosting permission and licence-expiry coverage remain gated. This entry supersedes pending menu/layout/page-filter notes below.

## Custom pending-acceptance widget — October 7

Implemented through AG Studio React `createWidgets`, with a typed extended registry, a Nudge widget-menu group and a default report tile. It reads backend-calculated full-workspace awaiting-acceptance count/value through React context. Approved quotes awaiting a client decision are included; accepted, declined and draft changes are excluded. Integer cents remain authoritative. The tile explicitly says report filters do not affect it and quote value is not payments received. Empty/unavailable states and a read-only workspace link are included. Snapshot refresh updates the summary without replacing widget registration.

Verification: 92 server tests, TypeScript, isolated production build, Postman simulation (31 requests/50 assertions), and three focused Studio browser tests pass. The new journey creates/reviews fictional extra work through actual application APIs, approves $300.01, checks the widget, accepts through the client endpoint, then refreshes and checks $0/no awaiting changes. Dashboard-originated API writes and browser runtime errors are absent. No credentials, AI calls, PayPal calls or ordinary workspace writes were used. Widget add/delete/duplicate, layout persistence, cross-filter correctness and complete keyboard/screen-reader access remain separate checkpoints. This tile has no financial action or automatic reminder.

Next: verify Studio widget menu/layout operations and filtering with mixed records. Bounded Studio-agent work remains gated on safe model usage. Hosted licence permission and November 21 expiry coverage remain unresolved. This entry supersedes the pending-widget note below.

Owner verification, October 7: after local configuration, owner confirms Analytics has no watermark or licensing errors in the browser console, and confirms checking balances, loaded reports, edit controls and refresh. This closes the owner-observed local licence checkpoint; no key value was inspected or retained. It does not establish hosted permission, judging continuity, full accessibility, cross-filter correctness or Agent Framework integration. November 21 expiry and hosted evaluation/production wording checkpoint remain active. Next bounded implementation is the custom pending-acceptance widget, followed by focused navigation/layout/filter verification.

Licence checkpoint, October 7: owner now supplies a trial expiry of **November 21, 2026**, superseding the unknown-expiry note below. Supplied licence wording says evaluation only and “Use in production is not permitted.” Confirm hosted hackathon evaluation/judging permission and any access needed after expiry with AG before deployment; do not infer ordinary production rights from the advertised full-feature trial. Key validity inside Nudge remains unverified. Do not store the supplied key in documentation/source.

For AG's configuration generator select **AI features: No** for the current Studio integration and **Framework: React**. This question concerns Studio's AI module, not Nudge's separate Elastic scope-analysis integration. Both3.0 packages and AgStudioProvider are already installed/configured. Do not paste the generated App/AgStudioAiModule example over the existing code or reinstall unpinned packages. Privately set the single NUDGE_AG_STUDIO_LICENSE line in .env.local, restart npm.cmd run dev and inspect /analytics for remaining licence warnings. If the line already exists, replace its value rather than adding a duplicate. Pasting the key into the vendor validation form does not configure Nudge. Registering the AI module alone is not a paid model call, but its addition is unnecessary until the planned Studio-agent workstream is approved/configured.

October 7, 2026. Owner reports receiving a full-access 45-day trial licence, but no exact expiry date is shown. The licence has not been inspected or installed here. Judging-period/deployment coverage remains a separate checkpoint. No AI calls, payment actions, subscription or hosting activation occurred.

## What works

AG Studio 3.0.0 and its React package are pinned in package.json/package-lock.json. They were downloaded from npm with install scripts disabled; no trial was started by installation. Installed peer requirements support React 19 and aligned Grid/Charts dependencies. Existing Next/React versions were preserved.

Open your workspace, then choose **Analytics**, or visit `/analytics`. Sandbox access requires the existing valid owner session both on the page and analytics API. The page loads Studio only in its own browser bundle, leaving the core workflow separate. It reads `/api/analytics`, not PayPal or an AI provider.

- Backend-calculated full-workspace outstanding/overdue balances and approved/awaiting-acceptance quote values.
- Invoice detail grid, ageing bar chart and change quote grid using actual stored records from the minimal analytics projection. Empty datasets remain empty.
- Studio view/edit mode and the initial report layout; no financial callbacks or AI modules/runners/tools are registered.
- Nudge green interface accents, sized Studio canvas and a320px layout without outer-page horizontal overflow. Narrow report grids may need their own horizontal scrolling; complete report accessibility is not signed off.
- Manual local refresh,10-second timeout, no automatic polling, fixed errors and safe retry. A failed refresh removes the displayed records. Snapshot/version/mode and lack of a live PayPal check are explicit.
- Report edits are page-session only, not saved to DB/browser storage. Complete-workspace cards are unaffected by report filters; this boundary is labelled. Snapshot refresh keeps the mounted report configuration; leaving the page resets it.

Authoritative money remains integer cents on the backend and in detail-grid aggregation. The chart has a separately named presentation-only USD measure because chart axes do not use the grid's custom cent formatter. Dollar chart arithmetic is not financial authority; no plot or model output changes invoice amounts. Quote values are not money received and must not be added to already-invoiced receivables.

## Configure the received licence privately

In your existing `.env.local`, add a new line yourself:

```dotenv
NUDGE_AG_STUDIO_LICENSE=YOUR_AG_STUDIO_LICENCE_KEY
```

Replace only the placeholder with the licence from your email, using quotes around it if needed. Do not use a PayPal/Elastic key or workspace token. Restart the development server. The committed `.env.example` contains an empty field only. Existing `.env.local` was not opened or modified during this work.

This is a browser runtime licence supplied to AgStudioProvider, so it is intentionally visible to an authorised browser. It is not an authentication secret. Do not commit the licence value, screenshots of the email or other credentials. Missing configuration is labelled; local evaluation can display vendor warnings/watermark. Licence validity, removal of warnings and expiry are not yet verified. Hosted use needs valid coverage; owner-visible UI presence of a key is not a licence-validation claim.

Official setup: [React licence installation](https://www.ag-grid.com/studio/react/licence-install/), [Quick Start](https://www.ag-grid.com/studio/react/quick-start/). Exact expiry should be checked with the licence validation tool or sponsor support privately; no supplied key is uploaded or parsed automatically by Nudge.

## Verification

- 92 server tests and TypeScript pass. New report test preserves partial-payment cent aggregation and formats 579 cents as USD 5.79; source rows exclude private metadata.
-Final isolated production build and Postman simulation regression pass:31HTTPrequests/50assertions, no provider-fetch attempt. Ignored artifact: data/postman-workflow/34513ea7-37ae-4a15-8ab7-c35dc7c47297. Temporary server stopped; ordinary DB/env/dev cache preserved.
-Two focused Studio browser checks pass on that final build: actual vendor grid/data/USD formatting, view/edit toggles, read-only refresh,320px outer reflow, no page exceptions/mutations, empty/error/retry states and hiding raw server messages. Desktop screenshot inspected: chart now uses USD0–800 for the syntheticUSD800balance, not cent0–80000.
-Three existing core approval/payment/browser rejection checks passed on the preceding canvas-sized build; the final chart-only measure correction was rechecked with the affected Studio tests and Postman. Do not claim every browser test was rerun on the final build.
-Initial browser assertions accidentally matched Next's route announcer and hidden Studio loading elements; corrected to the application alert and visible loading indicators. These were selector fixes. Canvas sizing and chart unit issues were real UI findings and fixed before completion.

Production-source copies have no env files or provider credentials. Tests use a separate fictional SQLite DB, paused AI and a provider-network guard. Local evaluation tests use no owner licence key. Public hosting, actual licence validation, real screen-reader operation and broader Studio accessibility remain unverified.

## Official boilerplate review

User requested reference: [paypaldev/hackathon-paypal-ag-grid-boilerplate](https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate). Reviewed commit8de661bda9f6dd10c5d930767e8cb185a15f6b83, downloaded only into ignored data/ag-boilerplate-review; no code executed or copied into Nudge.

At that commit package.json contains the PayPal server SDK/Next/React, but no AG Studio/Grid package. app/data-table.tsx renders ordinary HTML tables; README/lib/paypal.ts demonstrate sandbox transactions, billing plans and balances. These are useful PayPal SDK/server-component reference patterns, not a completed Studio component to import. Nudge retains its existing Invoicing/webhook approvals, privacy projection, bounded provider calls and sanitized errors rather than copying that starter's broader payload/logging/unbounded-timeout configuration. Do not infer missing features on future commits or claim use of its transaction APIs in Nudge.

## Next bounded step

Confirm local licence configuration, then build the planned custom pending-acceptance widget and verify real layout editing/cross-filter behaviour and selected-record/stale-version navigation. Improve chart/theming/mobile/keyboard states before claiming sponsor-ready polish. Agent Framework integration remains pending the separate model allowance/data-flow gate; no automatic Elastic enablement. Core REVIEW_ACTION_PLAN.md evidence/research/hosting checkpoints remain open.
