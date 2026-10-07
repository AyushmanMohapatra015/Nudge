# AG Studio: first working integration

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
