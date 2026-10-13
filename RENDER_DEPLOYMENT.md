# Render hosting preparation — review before activation

October13 D2b/D3 update: owner reports USD50 Render credits applied, valid until October1,2027. Signup/redemption and reported date are recorded; promotion exclusions, accrued charges, card requirement, exhaustion behavior and exact compute quote remain unconfirmed. D3 planning worksheet is in RENDER_COST_PLAN.md: existing single Node/1GiB SQLite disk configuration, three monthly equivalents through December15, USD10 planning reserve and explicit quote/activation gates. Cost approval and deployment are not complete. Next finish account terms and actual quote, then D4 licence/judge-access review before provisioning. No live AI, service creation or paid activation. R6 Narrator/actual zoom/touch stays pending. This supersedes prior balance/expiry-pending notes.

October10 recheck: official Next.js/disks/free-service/credits guidance supports the existing single Node service plus persistent disk choice. Free web services cannot attach persistent disks and lose local SQLite files on restart/redeploy/spindown. Workflows is separate task infrastructure, not the website endpoint. The review-only template remains unapplied. Confirm actual compute/disk quote, provider usage and sponsor billing terms in the dashboard; public pricing's numeric rates could not be extracted during this check, so the proposed instance is not a verified price/performance estimate. Account/credits/deployment remain unconfirmed. See SPONSOR_CHECKPOINTS.md and the updated RENDER_SIGNUP.md.

Deployment budget worksheet before approval: record applied credits and expiry, workspace fee, single service compute rate,1GiB disk rate, included/extra bandwidth, build/pipeline usage, planned active days and projected spend through judging. Include current accrued charges because credits apply at billing and their visible balance can lag usage. No numeric quote, guaranteed credit-only operation or automatic suspension at exhaustion is assumed. If the confirmed terms do not satisfy the owner's zero-out-of-pocket constraint, keep the functional documented local setup instead of creating billable infrastructure.

Status: prepared locally; no Render account connection, credit redemption, deployment or public URL has been created by this task. Render is a hackathon sponsor and a useful candidate for a stable website and PayPal sandbox webhook endpoint. The published credit offer in SPONSOR_RESOURCES.md is not proof of available balance, expiry or a hard spending limit.

## Hosting choice and cost checkpoint

Nudge needs a Node web service because it has server routes and SQLite, rather than a static export. [Render's Next.js guide](https://render.com/docs/deploy-nextjs-app) describes that deployment type.

The current SQLite design requires persistent disk: default service files are ephemeral, only files under the disk mount survive, and attached disks are available at runtime rather than during builds. A disk-backed service has one instance and deploy downtime. [Render persistent-disk requirements](https://render.com/docs/disks). Free web services do not support persistent disks, so don't put this database on a free service's temporary filesystem and claim durable judging access. [Render free-service limits](https://render.com/docs/free).

Before creating anything, the owner needs to confirm actual sponsor balance/expiry, applicable compute and disk charges, what happens when credits run out, and access through judging. A billable service may use credits, but that does not guarantee zero out-of-pocket cost. No billing activation or resource creation is authorized by this preparation. If sufficient allowances are unavailable, retain the documented local setup as the submission access route; don't promise a free hosted build.

## Reviewable configuration

`render-blueprint.example.yaml` is deliberately a review template, not the default `render.yaml`. Applying it would provision resources. It proposes a single Node service, the smallest listed paid compute tier (`0.5c-512mb`), Singapore, a 1 GiB disk mounted at `/var/data`, the locked npm build, and `npm run start:render`. These are configuration choices to validate against the actual dashboard and workload, not a performance guarantee. Do not rename/apply the template until costs and approval are settled.

The template pins tested Node 24.12.0, disables auto-deploys, generates the owner secret privately, sets sandbox mode and pauses AI. No provider credentials are embedded. The [Blueprint reference](https://render.com/docs/blueprint-spec) documents these fields; the [Node-version guide](https://render.com/docs/node-version) describes version selection. No remote Blueprint validation has been performed.

For an approved activation, build with `npm ci --include=dev --no-audit --no-fund && npm run build`. TypeScript/build dependencies must remain available during build. Keep the service at one instance; do not add autoscaling, workers or preview services to this SQLite prototype.

The Render startup wrapper checks production/Render flags, sandbox mode, owner-token length, the exact `/var/data/nudge.sqlite` path, an actual `/var/data` entry in Linux mount information, a valid port and explicit AI enable setting. It rejects public credential environment names and command-line overrides. If checks fail, it prints a fixed error without configuration values and starts no app. It forwards shutdown signals to its own Next.js child. This checks the mount/configuration, not disk durability, secret randomness, billing or provider validity; actual Render operation still needs verification.

## Private runtime setup after approval

- Use the generated owner token privately. Do not place it, a client link or keys in the repository, submission description, video or a public Postman environment.
- Add only PayPal **sandbox** credentials and the sandbox merchant email privately when testing actual invoicing. The hosting template does not create or send invoices.
- Keep `NUDGE_AI_ENABLED=false`. After the separate allowance checkpoint clears, configure Elastic's Kibana origin, dedicated private agent ID, encoded API key and verified inference ID privately; revisit the judging-period allowance before enabling calls. Credential presence is not live verification.
- Register `/api/paypal/webhook` only during an approved sandbox webhook verification session. Save its webhook ID privately. A stable URL alone does not prove signed delivery or a fresh payment transition.
- Start with fictional records on a fresh disk. Do not copy the local SQLite database, backups, screenshots or `.env.local` to the service through Git. A reviewed migration/restore is a separate operation.

Sandbox mode requires owner login for workspace operations. This is a single-owner prototype, not isolated accounts for arbitrary visitors. Client links are private bearer capabilities. Before judge access, decide how judges get controlled owner access and how simultaneous reviewers avoid conflicting edits; do not publish a reusable administrator secret openly.

## Health and release checks

`GET /api/health` reports only `{ "status": "ready" }` or a generic 503 unavailable response, with no-store headers. It checks a query against the workspace table; on first use the normal store initializer may create the empty database/schema. It does not seed a workspace or contact PayPal/Elastic. A healthy response does not establish provider access, correct invoices, a mounted disk or financial permission. [Render health-check configuration](https://render.com/docs/health-checks).

Once activation is approved, verify:

1. HTTPS, the owner login gate and secure session-cookie flags behind Render's proxy; unauthenticated workspace requests must be rejected.
2. Health response and actual disk attachment/path, then restart persistence using fictional records. Confirm no duplicate side effects.
3. Database backup/recovery procedure on the mounted path. `npm run db:render` now provides a separately guarded `/var/data` workflow, locally verified with fictional outside-checkout storage. Verify its backup/restore commands on the actual service before relying on hosted recovery. Local commands still constrain paths to project `data/`. Disk snapshots alone are not verified SQLite recovery; use database-consistent backups and follow DATABASE_RECOVERY.md's remote-outcome review.
4. Approved real provider checks and a fresh-payment webhook, with no claim that polling or a replay proves a new payment event.
5. Complete judge access, final tools attribution, public-repo privacy review and a functioning video under three minutes. The final product remains a website connecting approved scope, real AI-assisted review, client acceptance and PayPal sandbox payment.

## Local evidence and limits

Pure-config tests use fictional mount information and secrets to exercise refusals; the wrapper's override failure starts no child. Health tests use a separate fictional SQLite database, verify no seeded records/network calls, and force a query failure to check a generic 503 without raw errors. Counts and actual build/regression results are recorded in the latest PROJECT_STATUS.md checkpoint.

October 7 results: all **85 server tests** passed, including the three new hosting/health checks. After tightening response/template assertions, those three focused checks passed again. TypeScript and the isolated production build pass; Postman passed **31 requests/50 assertions** with no provider-fetch attempt. A separate real HTTP check on that production copy returned 200/ready/no-store, left zero seeded workspaces in a fresh database and attempted zero provider fetches. Both owned verification servers stopped. App UI is unchanged, so the preceding 14-browser-check result remains current without a redundant rerun.

October 7 recovery follow-up: a separate guarded Render maintenance command now fixes backup input to `/var/data/nudge.sqlite` and creates snapshots/offline copies only under that mounted directory. All 87 server tests/typecheck pass, including two new storage-boundary/recovery tests. This changes maintenance tooling, not application routes/UI, so the prior production-build, Postman and browser evidence remains current without a redundant rerun. Owner reports sponsor credits not yet claimed; deployment stays inactive.

Linux Render startup/maintenance, external health checks, true restart persistence, hosted cookie behavior, Blueprint acceptance, credit redemption and public judging availability remain unverified. Local Windows tests cannot establish these. No actual provider, public tunnel, Docker install or hosting resource is needed for this preparation.
