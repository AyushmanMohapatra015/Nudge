# Nudge — durable project guide and restart handoff

Prepared November 2, 2026. Read this first when returning after a long break.

This document combines the owner's conversation decisions with inspected repository files. It contains no credentials, private client links, payment URLs or account IDs. Historical test results are identified as historical; no application tests or provider calls were performed to write this guide. Account dashboards and the remote repository were not queried during this task.

## 1. What we built and why

Nudge is a website for freelance designers to handle scope creep and get paid for approved extra work. Its product sentence is: **Get paid for everything you agreed to—and everything that changed.**

The important problem is both financial and social: clients ask for extra work, scope can be ambiguous, and freelancers find it awkward to justify additional charges. Nudge connects evidence from an approved agreement to a reviewed client explanation, accepted extra-work quote and PayPal sandbox invoice. It also provides payment follow-up rules, financial analytics and delivery-impact planning.

The initial proposal was a broad autonomous cash-flow agent: invoice drafting, reminders, forecasting, Payouts, Orders checkout and MCP tools. We narrowed it to the more specific scope-to-approval-to-payment workflow. **Those original ideas are not an implemented feature list.** Orders, Payouts, dispute/refund handling, payment prediction and a payment-executing MCP server must not be claimed as completed.

This is a working, single-owner hackathon prototype. It is not a production financial service, a multi-tenant SaaS or a legally validated electronic-signature platform. No real-user adoption, revenue, business impact or general AI accuracy has been established.

## 2. Owner priorities and working rules

- Build carefully and explain what changed and how it was verified. The owner originally allowed a month, later requested faster progress using independently reviewed help from web AI agents.
- Follow `REVIEW_ACTION_PLAN.md`; update the plan when scope changes. Avoid cycling through speculative improvements while core release tasks remain unfinished.
- Current priority is core functionality, Elastic availability and deployment. Website changes are deferred. Preserve the existing design until concrete changes are selected; several external prototypes were rejected.
- Keep PayPal in its free sandbox. Do not add real cards, bank data, live PayPal credentials or real payments for testing.
- Stay within free/sponsor allowances. Credits are useful, but no personal paid subscription or uncovered spending is approved. No-card status is not proof that every paid service is available or that contractual obligations cannot arise.
- Do not expose keys, owner tokens, client bearer links, private SQLite data, screenshots or operational payment URLs. Never ask the owner to paste secrets into chat.
- Use exact `git add` paths and remind the owner to commit/push after changes. Do not commit, push, rewrite history or publish automatically without authorization for that operation.
- Preserve unrelated work, raw private evidence and consumed one-shot diagnostic grants. Do not reset ledgers to create more attempts or repeat external operations blindly.
- Sponsor use must solve a real problem. Maximize useful integration, not a count of logos. APIMatic was explicitly skipped and should not be reintroduced without a new owner decision.
- Web agents cannot access the repository. Give them selected sanitized source/context packets; independently inspect and test their returned proposals before integration. Their answers are proposals, not evidence of successful execution.
- Read `AGENTS.md`. Before writing application code, read relevant installed Next.js guides under `node_modules/next/dist/docs/`; this version differs from older conventions.

## 3. Technology and structure

Current `package.json` pins Next.js 16.4.1 and Zod 4.6.7, uses React 19, TypeScript, Lucide icons, AG Studio 3.0.0 and Bryntum Gantt/React 7.3.7. Styling is existing application CSS; do not assume the original suggested Tailwind/shadcn/PostgreSQL/Prisma stack was adopted.

The application uses Next.js App Router with Node server routes and Node's built-in SQLite API. Node 22.16+ is required; the Render template pins 24.12.0. The build uses Webpack (`next build --webpack`); a prior Turbopack Windows memory-allocation failure informed that choice.

| Area | Files and responsibilities |
| --- | --- |
| Owner website | `app/page.tsx`, `components/workspace.tsx`, `app/globals.css`: agreement, scope review, quotes, invoices, rules, notices and audit UI |
| Owner API | `app/api/workspace/route.ts`: server-authorized workflow transitions and financial actions |
| Client review | `app/client/[token]/page.tsx`, `components/client-page.tsx`, `app/api/client/[token]/route.ts`, `lib/client-access.ts` |
| Domain model | `lib/domain.ts`: schemas/types, integer cents, clause references and reminder policy checks |
| Persistence | `lib/store.ts`: lazy SQLite connection, transactions, workspace versions, operation cache and webhook IDs |
| Owner security | `lib/auth.ts`, `app/api/session/route.ts`, `lib/request-guards.ts` |
| AI | `lib/ai.ts`, `lib/elastic-ai.ts`, `lib/ai-payload.ts`, `lib/ai-access.ts`, `lib/scope-instructions.ts` |
| PayPal | `lib/paypal.ts`, `lib/reconciliation.ts`, `app/api/paypal/webhook/route.ts` |
| Recovery | `lib/processing.ts`, database maintenance/lifecycle scripts and `DATABASE_RECOVERY.md` |
| Analytics | `app/analytics/page.tsx`, `components/analytics.tsx`, `components/studio-*.tsx`, `lib/studio-*.ts`, `lib/owner-analytics.ts`, analytics API routes |
| Delivery | `app/delivery/page.tsx`, `components/delivery*.tsx`, `lib/delivery-*.ts`, `app/api/delivery-plan/route.ts` |
| Evaluation | `evaluation/`, scope comparison/summary scripts and corresponding tests |
| Test tooling | `tests/*.test.ts`, `tests/browser/`, Postman collections and workflow scripts |
| Hosting | `render-blueprint.example.yaml`, `scripts/start-render.mjs`, `scripts/render-config.mjs` |

Do not use the older `ARCHITECTURE_REVIEW.md` as a current completion ledger: for example, some earlier paragraphs predate the actual Gantt integration and later live AI checks. Its boundary descriptions remain helpful when reconciled with source and newer reviews.

## 4. One complete user journey

Example: a designer agrees to build a five-page marketing website. Clauses define included pages, revisions and exclusions such as booking functionality. The owner reviews/approves the agreement; the client accepts through a private link.

The client later requests booking functionality. Nudge sends the agreement clauses and request to the selected AI adapter when real AI is enabled. The result classifies the request as included, additional or ambiguous, explains its reasoning, cites existing clause IDs, asks necessary questions and describes requested deliverables.

The freelancer reviews the result. AI cannot choose a charge or directly create an invoice. The owner records a scope decision, resolves ambiguity/mixed work, chooses only reviewed extra deliverables, sets a USD price and approves the client-facing quote. Changes to deliverables require renewed review.

The client sees the approved work, explanation and price and explicitly accepts. Only then can the owner create the change invoice. Creating and sending are separate owner actions. PayPal's hosted sandbox invoice page handles checkout using a separate sandbox personal buyer account.

The server reconciles authoritative PayPal invoice state, checking identity, totals and balances. A verified signed webhook can trigger reconciliation; owner workspace reads also have a fallback refresh path. Consequently, seeing PAID does not by itself prove webhook delivery. Analytics reads the stored result, while delivery planning remains a separately reviewed local scheduling action.

Original agreement invoicing and additional-work invoicing are separate. Paying one extra does not necessarily settle the entire original project.

## 5. State, storage and security contracts

SQLite defaults to `data/nudge.sqlite`, ignored by Git. `lib/store.ts` creates `workspaces`, `webhook_events` and `remote_operations`. Each mode has a workspace JSON body rather than the normalized Postgres tables suggested in the early idea. Workspace data includes agreement, proposals, invoices, audit, reminder policies, client link, processing state and optional brief/delivery data. SQLite uses WAL and a busy timeout.

There are two modes:

- `NUDGE_MODE=demo`: explicitly labelled deterministic simulation, no actual AI/email/PayPal transaction. Owner authentication is deliberately skipped; do not expose this shared simulation as isolated public accounts.
- `NUDGE_MODE=sandbox`: private owner access plus actual sandbox provider operations when configured. Separate demo/sandbox workspace records prevent treating simulated state as real provider evidence.

Sandbox owner login exchanges `NUDGE_ADMIN_TOKEN` for an HTTP-only signed session, with an eight-hour lifetime. Client links are bearer capabilities: anyone holding a current valid link can perform the allowed client decisions. New links expire after 30 days and can be rotated. Client endpoints expose an allowlisted projection, use explicit POST decisions and recheck validity. These are recorded decisions, not proof of a client's legal identity.

Money is integer USD cents. Server-side state/version and acceptance checks remain authoritative regardless of frontend controls. Persistent operation identities, processing locks, cached remote results and uncertain-send/reminder markers guard retries. An external timeout can mean the provider succeeded even when the app did not receive confirmation; reconcile before retrying. Do not clear uncertain markers simply to unblock the UI.

Reminder gates include outstanding unpaid balance, overdue date, protected-client flag, reminder count, cooldown and payment promise. They are rechecked at execution, so approving a draft does not bypass later policy changes.

The AI payload excludes structured contacts, price/payment metadata, but free text can contain private information. It is minimization, not guaranteed anonymization. Use fictional data for demos and diagnostic calls. Instructions are not the security boundary: strict schema, clause validation, human decisions and deterministic route checks provide it.

## 6. Sponsor resources: actual use and limits

| Resource | Actual contribution | Limits / outstanding work |
| --- | --- | --- |
| PayPal | Sandbox Invoicing, checkout links, reminders, verified reconciliation and signed webhook handling | No live-money rollout; fresh hosted payment webhook still needs direct evidence |
| Elastic | Agent Builder server-side structured scope review using a dedicated restricted agent | Limited live samples; ordinary calls paused; trial, API key and allowance must be checked independently |
| AG Grid / AG Studio | Embedded reports, themes/layout tools, custom pending-change and invoice-check widgets, native data fallback | Dashboard AI bridge has offline preparation but is disconnected in production; do not claim live natural-language dashboard creation |
| Bryntum | Read-only Gantt visualizing owner-reviewed original/current/proposed delivery impact; guarded preview/apply/discard backend | Vendor ARIA issues and manual accessibility remain; no automatic client deadline agreement or payment-triggered rescheduling |
| Postman | Local Newman API workflow/assertions and restart checks | No Postman credentials/account are required for local collections; no cloud workspace/monitor claimed |
| Render | Reviewed single-service deployment template and startup/database guards; $50 owner-reported sponsor credit | No hosted service or URL verified; Workflows not used |

Astropods setup/adapters are historical/inactive; Elastic is selected. Docker was explored during that setup and is not needed for normal local Nudge. Zapier research is retained; Kernel and Channel3 were considered but are not integrated. APIMatic is skipped. Do not put unused sponsors into a submission's used-tools list.

Bryntum's written sponsor permission allows free evaluation and a public non-commercial judge demo through **December 15, 2026**, own MIT application source, and separate judge acquisition. Exclude proprietary library files and credentials; the application's MIT license does not license Bryntum. No automatic conversion/payment obligation was confirmed in that reply. Actual technical expiry may still require an extension; never patch/reset vendor checks.

AG Studio's reported key expiry is **November 21, 2026**. Hosted/public-source permission and December judging coverage were unresolved in the inspected records. The owner was given a support request; do not assume it was sent or approved. A browser runtime licence necessarily reaches the component, but must still not be committed or published in docs.

Elastic's latest owner-reported trial banner ends **November 4, 2026 at 05:29 UTC**; this supersedes older November 3 notes. The owner is filling an additional 30-day extension form, listing “Nudge (individual project).” Submission/approval of that extension is unverified. Support said managed LLM has fair-use limits and usage appears after conversation rounds/per-conversation API; numerical limits and exhaustion behavior are not established. Support offered to review errors/increased allowance. Earlier API key expired and was replaced; current private expiry is not inspected. Trial extension does not extend an API key, and a key expiry does not extend a trial.

Render owner-reported credit is **$50, valid October 1, 2027**, with no payment method. Published planning rates were $7/month compute plus $0.25/month for a 1 GB disk, before extras; dashboard quote controls. Three comparable projects share workspace costs/credit if created there. No services for the other two projects were created by this work. Short sessions require suspending the hosted service, not closing the browser; retained disk still needs cost accounting.

All these dates are historical facts, not promises of access four months later. Reconfirm licences, current versions, trial status and prices before running providers after a long break.

## 7. What has genuinely been verified

Historical development evidence includes a fictional USD300 booking extra completing website Elastic assessment, owner review/pricing, client acceptance, one sandbox invoice/send, owner checkout and authoritative PAID/$0 reconciliation with matching local analytics. This was across sessions, not an uninterrupted final recording. Earlier USD10/USD1 sandbox work also exists; do not confuse records or recreate them unnecessarily.

Signed webhook redelivery, signature rejection and deduplication have evidence. **Fresh payment-triggered PAID webhook delivery is still a separate unverified gate** in current docs. Dashboard polling can explain an automatic paid update. A future Render URL needs fresh hosted evidence even if local events worked.

Elastic previously returned HTTP200 with `awaiting_prompt` instead of a completed analysis. This is a failure, not success or an authentication error: routing/auth passed and model tokens were consumed. The adapter rejects interactive/tool outcomes; it does not answer provider prompts automatically. Count-only diagnostics accept array/object prompt containers without retaining provider IDs/content. A later bounded call completed, but the original cause and stability remain unresolved.

October 29 records two separately inspected fictional outputs: ambiguous case21 with S5/S7, and injection case24 as additional/S5. Both completed and passed frozen checks, reporting **22,680 input + 928 output = 23,608 tokens**. A selected matched comparison is Nudge 2/2 versus lexical 1/2; this is not a general accuracy estimate. Other saved selected-case comparisons preserve wrong answers and missing-citation failures. No independent held-out/repeated evaluation has been established.

Latest publication/security documentation records **272 backend tests passing and two existing skips**, TypeScript, a disposable Webpack build, isolated Postman **47 requests/77 assertions plus restart**, browser marker checks and npm audit passing. These were past bounded runs, not rerun November 2. Counts change with source; cite a matching receipt/commit when presenting results. Browser checks cover selected paths; Windows Narrator, actual zoom and physical-touch results remain pending.

Useful evidence files: `BACKEND_RELEASE_REVIEW.md`, `ELASTIC_LIVE_CHECKPOINT.md`, `ELASTIC_EXTERNAL_REVIEW.md`, `SAVED_AI_COMPARISON.md`, `SANDBOX_REHEARSAL_PLAN.md`, `WEBHOOK_VERIFICATION.md`, `FRESH_PAYMENT_WEBHOOK_TEST.md`, `PUBLICATION_SECURITY_REVIEW.md`. Ignored `data/` receipts may exist only on this laptop; their survival/backups are not verified here.

## 8. Git, security cleanup and current work

Local Git currently shows `282a91a` (“Prepare public repository documentation and remove raw review exports”) after `9ffb019` (“Patch framework dependencies and verify isolated production flow”). Conversation records say the authorized cleanup was pushed. **Remote tip/visibility were not rechecked for this handoff.** The oldest headers of `HANDOFF.md` and some publication documents describe pre-push candidate stages and are superseded on that point.

History cleanup used privately backed-up candidate clones/bundles to remove specified historical sandbox references, a non-noreply identity and 19 raw review/export paths. Do not repeat a history rewrite based solely on stale “pending” paragraphs. Inspect actual refs and the completed audit first. Private backup bundles and raw archived packets must remain private. Historical clones/caches cannot be guaranteed erased. Passing a bounded scanner is not a guarantee of complete security.

At this task's start, `git status --short` listed only untracked `DEMO_VIDEO_SCRIPT.md` and `DEPLOY_LAUNCH_CHECKLIST.md`. They are pre-existing owner work. No staged changes or running-operation inventory was independently checked beyond that status; no application process was started/stopped. This handoff task adds `MEGA_HANDOFF.md` and a navigation notice to the existing `HANDOFF.md` only.

The owner wants a much clearer final video: no watermark, natural voiceover supplied separately if needed, polished editing/animation. A rehearsal/video script exists, but **a final approved video is not complete**. DaVinci/editor capability and third-party voiceover were discussed, not a verified finished production pipeline.

## 9. How to run and verify after returning

First inspect `git status`, `git log`, `README.md`, `.env.example`, `package.json`, `package-lock.json` and `AGENTS.md`. Do not overwrite a private `.env.local` or restore a private database from an unknown source. Review dependency licences and version/security changes before installing months later.

The documented locked-install sequence is:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd rebuild @bryntum/gantt-trial-lib --foreground-scripts --ignore-scripts=false
npm.cmd rebuild --foreground-scripts --ignore-scripts=false
npm.cmd run dev
```

Open `http://127.0.0.1:3000`; stop with Ctrl+C. All three installation steps matter because a vendor parent/helper preparation-order issue was observed. Do not patch proprietary package logic. `npm ci` reinstalls dependencies, so do it deliberately rather than reflexively in a working setup.

Default simulation needs no PayPal/AI credentials; vendor evaluation terms still apply. In sandbox, use `.env.example` as a key-name reference and configure secrets privately. Never copy secret values into this guide. Selected AI settings are `NUDGE_AI_PROVIDER=elastic`, `NUDGE_AI_ENABLED=false`, Kibana origin, encoded API key, agent ID, optional space ID and actual inference ID. An Elasticsearch endpoint is not the Kibana origin. Do not replace role/API-key privilege JSON with an analysis-response example: they serve different purposes.

Common verification commands, to choose for the change being made:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run postman:workflow
npm.cmd run test:browser
npm.cmd run privacy:check
npm.cmd run privacy:history
```

Read each script's setup/side effects first. Tests/builds can create ignored output, and some provider-check commands load private environment files. `paypal:check` and `elastic:check` are separate provider/config diagnostics, not blanket authorization for real inference/payment actions. Read the current provider documentation and allowance before using them.

`npm.cmd run a11y:manual` prepares a separate fictional loopback review at the documented port (previously 3117); follow `ACCESSIBILITY_MANUAL_CHECKLIST.md`. Automated tests cannot establish Narrator speech or real touch behavior. A phone cannot reach the laptop's localhost without separate network setup.

## 10. Deployment preparation and exact continuation

Read `DEPLOY_LAUNCH_CHECKLIST.md` first, then `RENDER_DEPLOYMENT.md`, `RENDER_COST_PLAN.md` and `render-blueprint.example.yaml`. Existing configuration is one Node service, Singapore, 0.5c-512mb, one 1 GB persistent disk, `/var/data/nudge.sqlite`, auto deploy off, health `/api/health`, AI disabled and a generated owner token.

Render supports choosing `render-blueprint.example.yaml` as a custom Blueprint path; no rename is required. The owner can prepare New > Blueprint, choose the repository/branch, inspect resources/quote and stop before Deploy Blueprint. **A saved remote draft or GitHub connection is not verified.** Do not create resources while describing preparation as free/read-only.

First actual launch cannot be one click end-to-end: service URL, private secrets, actual Linux mount, secure HTTPS sessions, restart durability, database-consistent backup/recovery, final sandbox webhook URL/ID and provider verification depend on deployment. A healthy endpoint is not proof of these. Do not upload the local private database or `.env.local` through Git. Keep one instance; no automatic PostgreSQL migration or autoscaling.

For later short sessions, reuse the verified service/disk and its suspend/resume controls instead of recreating it. Confirm dashboard state and health; closing PowerShell does not stop a cloud service. Keep the disk to preserve data and account for its ongoing cost. Deletion needs a separate backup and decision.

**Recommended next concrete task:** the owner reviews the Render Blueprint form and actual quote/payment requirements, stopping before deployment. Then, on launch authorization, perform first hosted build and the access/mount/restart/recovery checks before enabling live providers. Inspect `DEPLOY_LAUNCH_CHECKLIST.md`, template/startup guards and `DATABASE_RECOVERY.md`. Expected outcome is a verified hosted foundation and a short repeat-session runbook, not an unverified “deployed” claim.

## 11. Remaining release work, in order

1. Resolve current sponsor access: Elastic extension/allowance/API-key validity; AG Studio hosted/public-source/judging terms; Bryntum technical expiry if required. Preserve confirmed Bryntum permission.
2. Finish concrete Render quote/account eligibility and deploy when approved; verify actual Linux/HTTPS/private access, persistence and recovery.
3. Verify meaningful real AI in the chosen final environment within confirmed allowance, and a new sandbox payment-triggered signed webhook. Do not count polling or event replay as that proof.
4. Complete independent semantic/failure/repeated AI evaluation if feasible, with actual counts and explicit sample limits. Preserve earlier failures rather than reporting selected development successes as accuracy.
5. Complete Narrator/actual zoom/physical touch and address concrete accessibility findings; retain native analytics/delivery fallbacks.
6. Validate usefulness with freelancers using anonymized past scope disagreements. Conversations were proposed, not recorded as completed; do not invent quotes, users or time savings.
7. Resume bounded UI polish only after the owner's core-first checkpoint, preserving forms/focus, reviewed pricing, action gates and payment uncertainty behavior. No final MotionSites template was selected/licensed. External rejected prototypes are not production source.
8. Recheck source/history/publication permissions, actual remote state and GitHub security settings. Do not assume private-to-public release is authorized merely because cleanup was pushed.
9. Finish clean judge setup/access, tools attribution, final high-quality under-three-minute video, public YouTube link and submission text. Deliver a functioning interactive build via runnable instructions or hosted URL, not just a recording/mockup.

The original provided rules require meaningful PayPal sandbox + meaningful AI, working prototype, documentation, public open-source GitHub source/assets/setup with licence, tools explanation and a publicly visible YouTube demo under three minutes. Judges score technology, design, impact, innovation and presentation. Sponsor use is optional. A prior dated rules review recorded November 12, 2026 noon Pacific submission and December 1–15 judging; the owner targets first-week November. Recheck the actual current official rules when taking submission action; those dates were not browsed anew for this guide.

## 12. First-session checklist for any future maintainer

- Read this guide, newest dated checkpoints in `HANDOFF.md`/`PROJECT_HANDOFF.md`, `REVIEW_ACTION_PLAN.md`, `PROJECT_STATUS.md` and `docs/README.md`. Newer verified source/receipts override stale historical NEXT labels.
- Inspect Git status and local/remote refs without modifying them. Preserve unrelated changes and private backups. Confirm whether the remote is actually public before describing it as such.
- Inspect the relevant source before editing; never infer implementation from a planning checkbox. Read Next.js's installed guidance before code changes.
- Establish today's Node/dependency/licence/provider/trial status. Four-month-old trial/key validity must be treated as unknown or expired until verified.
- Start with clearly labelled fictional simulation if provider access is unavailable. Report unavailable live AI honestly; do not silently swap providers or replay outputs.
- Choose the next incomplete action-plan task, explain its expected result, apply only justified changes and run proportionate checks. Keep live inference and financial side effects separately bounded.
- Update evidence/status with the actual outcome, limitations and dates. Give exact staging paths and remind the owner to push; seek authorization for publishing, paid changes or destructive operations where needed.

No percentage-complete estimate can replace these release gates. Much of the local backend is implemented and hardened; deployability, continuing provider access, judge experience, real-user validation and final delivery still need direct evidence.
