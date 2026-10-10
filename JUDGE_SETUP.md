# Run and review Nudge locally

For the planned short presentation and its outstanding evidence requirements, see [DEMO_STORYBOARD.md](DEMO_STORYBOARD.md). The local rehearsal is simulation, not the final submission video.

This guide runs the current public-source prototype in clearly labelled simulation. It verifies product behavior without a PayPal or AI account. Simulation does **not** demonstrate the final hackathon requirement for real AI integration. Actual sandbox checkout, genuine signed webhook redelivery/deduplication and limited live Elastic scope responses have been verified during development. The owner website live-AI journey, broader model evaluation and fresh payment-triggered webhook transition remain pending. See ELASTIC_VERIFICATION.md and WEBHOOK_VERIFICATION.md for evidence and limits. Further live AI verification is deferred at the owner's request; final submission instructions must update these checkpoints when verified.

## Setup

1. Clone or download the repository and open a terminal in its root (the folder containing package.json).
2. Install Node.js 22.16 or later; Node 24 is the tested version. Check `node --version` and `npm --version`. The minimum includes SQLite's backup API for maintenance and recovery tests.
3. Run `npm ci`, then `npm run dev`. On Windows PowerShell use `npm.cmd` if npm.ps1 is blocked.
4. Open http://127.0.0.1:3000. No .env file is needed. Do not bring over an existing .env.local. If your shell already defines NUDGE_MODE, remove it or set it to demo before starting.

Dependency installation downloads packages; the application walkthrough does not call paid services. Docker and sponsor accounts are not needed. SQLite is built into Node. A new local data/nudge.sqlite file is created automatically and ignored by Git. Keep the folder writable. Stop the server with Ctrl+C.

Typography currently loads Google Fonts when available and falls back to system fonts if unavailable. This is a cosmetic network dependency, not an AI service.

## Five-minute walkthrough

1. Review the example agreement. Choose Approve scope, then open Client view in another tab, check the review confirmation and accept project scope.
2. Back in the owner tab, Compare with agreement using the sample booking request. Allow up to five seconds for the client decision to appear. The analysis is explicitly labelled simulated.
3. Keep only the booking deliverable in Deliverables to propose. In Your scope decision, choose Additional work, enter a rationale of at least 20 characters citing the explicit booking exclusion, use S3 as the supporting clause, and Record scope decision.
4. Enter a USD price such as 300.00. Optionally write an Explanation for your client, review its preview and supporting clauses, check that the quote contains only reviewed additional work, and Approve proposal. The client sees the approved message and clauses, not your private scope-review notes.
5. In Client view, review and accept the change and its price. Back in the owner tab, Create PayPal invoice. Go to Payments, Approve & send invoice, then Simulate payment. All invoice actions here change local simulation state only.
6. Check Activity for the sequence of owner/client decisions. In Payments, Add overdue example and Draft reminder. Enable Protect this client in Agent rules and save rules; sending the existing reminder is rejected by server policy.

Optional: before approving an agreement, My project offers manual brief review with empty missing fields, a review note, USD confirmation and draft-only confirmation. It does not perform automatic AI extraction. Agent rules offers client-link replacement with explicit confirmation; the old Nudge URL then stops working without cancelling existing work or invoices.

## Validation and production-mode local run

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

Optional backend verification: follow POSTMAN_WORKFLOW_VERIFICATION.md to install the pinned Newman runner and run `npm run postman:workflow`. This creates a separate production copy, local server and synthetic database; 31 requests/50 assertions have passed. It requires no provider credentials and does not use your configured workspace. Payments and model inference in this collection are simulated, so it supplements the functional walkthrough rather than proving live provider behavior.

Model calls also require the server's explicit `NUDGE_AI_ENABLED=true` setting; the default is paused regardless of configured credentials. Enable it only within a confirmed allowance and test plan. It is an access switch, not a spending cap.

The Agent rules integration panel names the selected AI provider and distinguishes simulation, paused/enabled calls, credential presence and webhook-ID presence. None of those labels prove a live model response or a fresh payment webhook. Consult verification documents for actual evidence. An unrecognized provider name is reported generically rather than exposing its configuration value.

For final judging, provide either complete verified local integration instructions with a usable allowance/access arrangement or a hosted functional build. Do not publish provider keys or owner tokens in GitHub. Access must cover the judging period, not only the submission deadline. Hosted SQLite requires one Node host and persistent disk; shared simulation currently does not isolate public visitors.
