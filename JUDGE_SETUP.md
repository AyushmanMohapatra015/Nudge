# Run and review Nudge locally

October25 evidence update: the matched USD300 example now has actual Elastic website assessment, recorded owner review, fictional client acceptance, one live PayPal sandbox invoice/send, owner buyer checkout and provider-backed PAID/$0 reconciliation with matching local Analytics. This was verified across sessions; the local walkthrough below remains a simulation unless explicitly configured with permitted provider access. No hosted demo/final video or fresh PAID webhook proof is implied. Judge access/licence continuity and manual Narrator/real zoom/touch remain pending; see SANDBOX_REHEARSAL_PLAN.md and REVIEW_ACTION_PLAN.md for the latest gates.

October18 F5a: the current minimum core-demo/access ledger is at the top of [DEMO_STORYBOARD.md](DEMO_STORYBOARD.md). This guide provides the working local **simulation** route; it is not yet final functional AI/judging-access evidence. Last confirmed Elastic/AG dates remain November3/November21 pending newer owner replies, so judging continuity is unresolved. Bryntum's written December15 project permission is confirmed separately; technical/local acquisition checks remain. Hosting is optional, not a required paid step. No current owner secret, vendor key or normal database should be published to make setup easier. Next independent F7a drafts the required text/tools description while core live/access decisions remain pending.

October16 readiness checkpoint: [SPONSOR_ATTRIBUTION.md](SPONSOR_ATTRIBUTION.md) is the current tools/access matrix. Hosted access is not verified; commercial dependency public/judge permissions and trial continuity, live website AI and release-history decisions remain open. These are development walkthrough instructions, not a claim that final judging access is ready. Installing a trial package does not establish licence coverage or authorise resetting an expired trial.

For the planned short presentation and its outstanding evidence requirements, see [DEMO_STORYBOARD.md](DEMO_STORYBOARD.md). The local rehearsal is simulation, not the final submission video.

This guide runs the current source prototype in clearly labelled simulation. It verifies product behavior without a PayPal or AI account. Simulation does **not** demonstrate the final hackathon requirement for real AI integration. Actual sandbox checkout, genuine signed webhook redelivery/deduplication and limited live Elastic scope responses have been verified during development. The owner website live-AI journey, broader model evaluation and fresh payment-triggered webhook transition remain pending. See ELASTIC_VERIFICATION.md and WEBHOOK_VERIFICATION.md for evidence and limits. Further live AI verification is deferred at the owner's request; final submission instructions must update these checkpoints when verified.

## Bryntum evaluation access

The sponsor permits this project's public non-commercial judge demo through December15,2026; see [permission checkpoint](BRYNTUM_EVALUATION_PERMISSION.md). Follow [Bryntum's separate local acquisition and setup guide](BRYNTUM_JUDGE_SETUP.md) for evaluation terms, the public npm path, exact Gantt/wrapper versions, full lifecycle commands and the fictional chart walkthrough. No owner credentials or vendor distribution is supplied by this repository. The current registry-install workflow is tested locally; independent judge acquisition, effective technical expiry and hosted access remain to verify. AG Studio and other provider permissions are separate.

## Setup

1. Clone or download the repository and open a terminal in its root (the folder containing package.json).
2. Install Node.js 22.16 or later; Node 24 is the tested version. Check `node --version` and `npm --version`. The minimum includes SQLite's backup API for maintenance and recovery tests.
3. Follow all three dependency setup commands in [README.md](README.md#run-locally), then run `npm run dev`. They unpack locked dependencies, prepare the trial helper first, then execute all normal lifecycles. Unpacking alone is not a functioning trial; no expiry checks or trial rights are changed. On Windows PowerShell use `npm.cmd` if npm.ps1 is blocked. See [clean-source verification](CLEAN_CHECKOUT_VERIFICATION.md) for preparation checks and limits.
4. Open http://127.0.0.1:3000. No .env file is needed. Do not bring over an existing .env.local. If your shell already defines NUDGE_MODE, remove it or set it to demo before starting.

Dependency installation downloads packages; the simulation walkthrough does not call paid services. Docker and PayPal/AI accounts are not needed for simulation. Bryntum's public trial npm path needs no private registry login, but applicable commercial-dependency evaluation terms still apply; see the separate guide above. SQLite is built into Node. A new local data/nudge.sqlite file is created automatically and ignored by Git. Keep the folder writable. Stop the server with Ctrl+C.

Typography currently loads Google Fonts when available and falls back to system fonts if unavailable. This is a cosmetic network dependency, not an AI service.

## Five-minute walkthrough

1. Review the example agreement. Choose Approve scope, then open Client view in another tab, check the review confirmation and accept project scope.
2. Back in the owner tab, Compare with agreement using the sample booking request. Allow up to five seconds for the client decision to appear. The analysis is explicitly labelled simulated.
3. Keep only the booking deliverable in Deliverables to propose. In Your scope decision, choose Additional work, enter a rationale of at least 20 characters citing the explicit booking exclusion, use S3 as the supporting clause, and Record scope decision.
4. Enter a USD price such as 300.00. Optionally write an Explanation for your client, review its preview and supporting clauses, check that the quote contains only reviewed additional work, and Approve proposal. The client sees the approved message and clauses, not your private scope-review notes.
5. In Client view, review and accept the change and its price. Back in the owner tab, Create PayPal invoice. Go to Payments, Approve & send invoice, then Simulate payment. All invoice actions here change local simulation state only.
6. Check Activity for the sequence of owner/client decisions. In Payments, Add overdue example and Draft reminder. Enable Protect this client in Agent rules and save rules; sending the existing reminder is rejected by server policy.

Optional: before approving an agreement, My project offers manual brief review with empty missing fields, a review note, USD confirmation and draft-only confirmation. It does not perform automatic AI extraction. Agent rules offers client-link replacement with explicit confirmation; the old Nudge URL then stops working without cancelling existing work or invoices.

## Optional owner delivery and analytics walkthrough

After agreement acceptance, open Delivery. Enter a base task, select supporting clauses, choose your calendar/estimate and optionally a start date, then save a preview. Applied dates remain unchanged until the explicit review checkbox and Apply internal plan action. Approved extra work can be previewed, but only client-accepted extra work can be applied; a client decision makes a previous preview stale and requires explicit restaging. Original dates remain available separately.

The optional Gantt is read-only. Use the native table and dependency list or Skip timeline to date table if needed; two known vendor ARIA findings and pending Narrator/real-zoom/touch results are documented in DELIVERY_ACCESSIBILITY_REVIEW.md. Dates are internal owner estimates, not client-agreed deadlines or payment conditions. A failed chart download offers a page-reload retry while the table remains available.

Analytics shows stored invoice balances and approved quote values separately. Read the native totals/tables immediately, or choose Load interactive reports for AG Studio, then Edit report layout for widgets and layout tools. It does not contact PayPal or run live dashboard AI. A failed report download retains the tables and offers an explicit page-reload retry; reloading resets session layout edits. The exact API-assisted USD300 booking/delivery/payment simulation and Windows resource measurements are in DELIVERY_IMPACT_REHEARSAL.md. For its optional Windows/Edge runner, first obtain a passing isolated Postman build, then use `node scripts/rehearse-delivery-impact.mjs data/postman-workflow/<run-id>/app-source`. It creates its own fictional database, not the walkthrough's active workspace.

## Validation and production-mode local run

For an optional clean-source regression check, install the pinned Newman runner as described in [POSTMAN_WORKFLOW_VERIFICATION.md](POSTMAN_WORKFLOW_VERIFICATION.md), then run `npm run verify:clean`. This creates a current working-tree source snapshot under ignored data/, freshly installs application dependencies from the lockfile using a separate verification cache, runs TypeScript and offline tests, and runs the isolated production Postman workflow with restart persistence checks. It does not load .env.local or reuse your application node_modules. Installation needs registry access and temporary disk space; the existing pinned Newman verification tool is reused. This is a local snapshot check, not a remote-clone or live integration check.

```sh
npm run typecheck
npm test
npm run build
npm run start -- --hostname 127.0.0.1
```

Open the same local URL after starting the production build. Run dev and start separately, and stop one before starting the other. Automated browser tests are optional: `npm run test:browser` starts a separate simulation server on port 3100. The default browser is installed Microsoft Edge on Windows; on another platform set NUDGE_BROWSER_PATH to an installed Chromium browser executable. Browser tests use their own database. Server tests use mocked providers, not real credentials.

## Real integrations and judging access

For the review-only Render hosting configuration, startup guards and outstanding credit/storage/access checks, see RENDER_DEPLOYMENT.md. No hosted URL is verified yet. Its health endpoint proves only a local database query, not AI/PayPal access or persistent storage. Keep complete local instructions as the fallback submission route until hosted access is verified.

Use README.md for private sandbox configuration and read-only connectivity checks. Use only sandbox merchant/buyer accounts, never real cards or live API credentials. Elastic live scope responses are verified separately; further calls and website AI remain paused pending the owner usage/allowance checkpoint. See ELASTIC_VERIFICATION.md. Do not assume simulation meets the AI requirement or claim prepared sponsor tools as integrations already used.

Optional backend verification: follow POSTMAN_WORKFLOW_VERIFICATION.md to install the pinned Newman runner and run `npm run postman:workflow`. This creates a separate production copy, local server and synthetic database; 47requests/77assertions have passed, including delivery preview/apply/discard, rejected actions and delivery-plan restart preservation. See [delivery coverage and limits](POSTMAN_DELIVERY_VERIFICATION.md). It requires no provider credentials and does not use your configured workspace. Payments and model inference in this collection are simulated, so it supplements the functional walkthrough rather than proving live provider behavior.

[POSTMAN_JUDGE_GUIDE.md](POSTMAN_JUDGE_GUIDE.md) provides the complete Windows/macOS/Linux command sequence, expected sanitized results and precise submission tool attribution. A Postman desktop/cloud account is optional, not needed for these verified commands. The separate sandbox collection requires private authorized setup and is not run by that credential-free sequence.

Model calls also require the server's explicit `NUDGE_AI_ENABLED=true` setting; the default is paused regardless of configured credentials. Enable it only within a confirmed allowance and test plan. It is an access switch, not a spending cap.

The Agent rules integration panel names the selected AI provider and distinguishes simulation, paused/enabled calls, credential presence and webhook-ID presence. None of those labels prove a live model response or a fresh payment webhook. Consult verification documents for actual evidence. An unrecognized provider name is reported generically rather than exposing its configuration value.

For final judging, provide either complete verified local integration instructions with a usable allowance/access arrangement or a hosted functional build. Do not publish provider keys or owner tokens in GitHub. Access must cover the judging period, not only the submission deadline. Hosted SQLite requires one Node host and persistent disk; shared simulation currently does not isolate public visitors.
