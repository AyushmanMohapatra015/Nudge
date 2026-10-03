# Nudge project handoff

Updated 2026-10-03. Workspace: D:\Nudge, Windows PowerShell, Node 24. User has one month and values careful implementation over speed.

## Product
Freelancer scope and payments workspace: approved agreement, AI comparison of change requests against clauses, human-priced changes, client acceptance, PayPal invoicing, policy-gated reminders and audit history. Next.js/TypeScript, built-in SQLite, Claude tool-use adapter. See PROJECT_PLAN.md and README.md.

## Verified milestone
Actual PayPal sandbox invoice [historical sandbox invoice redacted], USD 10.00, paid through sandbox buyer checkout. PayPal GET reconciliation returned PAID and updated Nudge on 2026-10-03. This was simulated money, not a real purchase. Indian sandbox merchant and generated US personal sandbox buyer were used after domestic invoicing was rejected. No real financial details were added.

## Safety and configuration
Sandbox only. User is a student in India. Ask before paid services, live payments, or public deployment/tunneling. Never print or commit secrets. Local .env.local is Git-ignored; it holds sandbox credentials and an admin token. Data, screenshots and cache backups are ignored under data/. Do not expose the dashboard through a tunnel; scripts/webhook-relay.mjs exposes only POST /api/paypal/webhook on loopback port 3001. Launching that relay alone does not expose anything publicly.

## Pending work
Temporary webhook setup was authorized on 2026-10-03. Official Cloudflare binary downloaded to ignored data/tools/ with matching GitHub release SHA256. Tunnel points only at port 3001 relay. Registration succeeded using scripts/manage-sandbox-webhook.mjs; PAYPAL_WEBHOOK_ID saved locally. Public checks: dashboard/session/workspace 404, unsigned webhook 401. PayPal returned no events for the previously paid invoice. Authentic signed delivery remains unverified. A separate $1 sandbox payment test was offered to the user; wait for their answer before creating it. Registration metadata is ignored in data/sandbox-webhook-registration.json. Stop the tunnel and run helper cleanup when testing ends. Never claim this setup proves payment webhooks work yet.
Verify authentic sandbox webhook delivery and deduplication. PAYPAL_WEBHOOK_ID and a reachable HTTPS endpoint are needed. Obtain approval before starting a public tunnel. Existing paid invoice can be used for replay if PayPal retained a suitable event; do not create a duplicate invoice or claim simulator traffic verifies authentic delivery. Then configure and test actual AI with an approved budget. Continue product polish, meaningful tests, documentation and the hackathon demo.

## Operational notes
Remind the user to commit and push after every completed set of source changes. They resolved GitHub private-email push protection using their GitHub noreply email.
Local app was running a production build at 127.0.0.1:3000. Check current processes before restarting; code edits require rebuilding for production. Read AGENTS.md and the installed Next docs before code changes. Previous dev cache corruption was resolved by moving .next under ignored data/ and rebuilding; tsconfig excludes data/. Existing source edits and helper scripts are uncommitted; do not discard or auto-push them. GitHub is connected. Earlier unit and browser tests passed; rerun checks appropriate to new changes.
