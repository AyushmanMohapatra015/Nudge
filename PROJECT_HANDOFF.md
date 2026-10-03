# Nudge project handoff

Updated 2026-10-03. Workspace: D:\Nudge, Windows PowerShell, Node 24. User has one month and values careful implementation over speed.

## Product
Freelancer scope and payments workspace: approved agreement, AI comparison of change requests against clauses, human-priced changes, client acceptance, PayPal invoicing, policy-gated reminders and audit history. Next.js/TypeScript, built-in SQLite, Claude tool-use adapter. See PROJECT_PLAN.md and README.md.

## Verified milestone
Actual PayPal sandbox invoice [historical sandbox invoice redacted], USD 10.00, paid through sandbox buyer checkout. PayPal GET reconciliation returned PAID and updated Nudge on 2026-10-03. This was simulated money, not a real purchase. Indian sandbox merchant and generated US personal sandbox buyer were used after domestic invoicing was rejected. No real financial details were added.

## Safety and configuration
Sandbox only. User is a student in India. Ask before paid services, live payments, or public deployment/tunneling. Never print or commit secrets. Local .env.local is Git-ignored; it holds sandbox credentials and an admin token. Data, screenshots and cache backups are ignored under data/. Do not expose the dashboard through a tunnel; scripts/webhook-relay.mjs exposes only POST /api/paypal/webhook on loopback port 3001. Launching that relay alone does not expose anything publicly.

## Pending work
Verify authentic sandbox webhook delivery and deduplication. PAYPAL_WEBHOOK_ID and a reachable HTTPS endpoint are needed. Obtain approval before starting a public tunnel. Existing paid invoice can be used for replay if PayPal retained a suitable event; do not create a duplicate invoice or claim simulator traffic verifies authentic delivery. Then configure and test actual AI with an approved budget. Continue product polish, meaningful tests, documentation and the hackathon demo.

## Operational notes
Local app was running a production build at 127.0.0.1:3000. Check current processes before restarting; code edits require rebuilding for production. Read AGENTS.md and the installed Next docs before code changes. Previous dev cache corruption was resolved by moving .next under ignored data/ and rebuilding; tsconfig excludes data/. Existing source edits and helper scripts are uncommitted; do not discard or auto-push them. GitHub is connected. Earlier unit and browser tests passed; rerun checks appropriate to new changes.
