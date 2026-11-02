# Nudge — Thursday local demo, step by step

Prepared November 2, 2026 for Thursday, November 5, 2026. Keep this file open privately while presenting. Read it once before demo day; it contains preparation and recovery steps as well as the live click sequence.

## 1. Can this be done without deploying?

**Yes.** Nudge's owner/client website, SQLite database, Elastic scope review, PayPal sandbox invoicing/checkout, AG Studio reports and Bryntum timeline can run from your Windows laptop. Internet is needed for Elastic, PayPal and dependency downloads. Render hosting and Docker are not required.

Localhost works for an in-person laptop demo or screen sharing. A remote interviewer cannot open your laptop's localhost from their own computer. A separate browser tab/context on your laptop can show the client role. Remote independently interactable access is a separate hosting/network task.

PayPal cannot deliver external webhooks directly to localhost. Without a separately configured public tunnel, demonstrate provider-backed **Refresh status** and explain the distinction honestly. This walkthrough does not open a tunnel or prove fresh payment-triggered webhook delivery. All other core interactions can be shown locally.

## 2. Critical Thursday access checkpoint

The last confirmed Elastic trial ends **November 4, 2026 at 05:29 UTC / 10:59 a.m. IST**. Thursday is November 5. **Get the extension approved and check the actual dashboard before planning live AI on Thursday.** Filling the extension form does not itself extend access. Check that your API key also remains valid; its expiry and trial expiry are independent.

If not extended, run the explicitly labelled simulation described below. Say: “This is the deterministic simulation path. The real Elastic integration has historical verified development evidence, but today's provider access is unavailable.” Do not present simulation as a fresh model result or claim the full live-provider demo is complete.

Other access checks:

- AG Studio: last reported expiry November 21. Verify licence validity and applicable demonstration terms; absence of a watermark alone is not permission proof.
- Bryntum: sponsor's written non-commercial hackathon evaluation permission runs through December 15. Verify the actual package still runs; ask the sponsor for technical extension if necessary, never patch expiry logic.
- PayPal: use the business sandbox application's credentials and a **separate personal sandbox buyer**. Use fictional records and sandbox checkout only.
- No Render deployment is needed for Thursday. No Render compute credits are consumed by local hosting.

## 3. What requests cost or do

| Action | What it contacts / changes |
| --- | --- |
| View local pages, client decisions, owner edits | Local Next.js API and SQLite; no model request |
| View Analytics/AG Studio or Delivery/Gantt | Stored local projections, UI/chart assets; no live dashboard AI or PayPal operation caused by the report |
| Compare with agreement in demo mode | Local deterministic simulation; no model request |
| Compare with agreement in sandbox with AI enabled | Actual Elastic request; tokens may be consumed even if it fails |
| Create/send invoice, reminder, status refresh | Actual PayPal sandbox API operations; no real payment, but remote sandbox records/side effects are real |
| PayPal sandbox checkout | Fake sandbox funds via sandbox buyer; no real financial details needed |
| Owner workspace polling in sandbox | Can trigger fallback PayPal reconciliation; “local website” does not mean zero external requests |
| Postman isolated workflow | Many local HTTP requests with simulated providers; not many model requests |

You do **not** need many AI calls to make this convincing. Start with one complete live scope assessment, optionally one ambiguity example only if allowance is confirmed. Pause, inspect usage, then decide whether another is justified. These are operational targets, not an enforced numerical quota. One Agent Builder conversation round can involve multiple internal model calls. The ordinary website's enable switch is not a token/dollar cap.

## 4. Day-before preparation

Open a dedicated PowerShell window. These environment settings affect this window and its child processes; closing it removes those temporary overrides. Do not display `.env.local`, owner tokens, provider dashboards with private details or payment URLs while screen sharing.

```powershell
Set-Location D:\Nudge
git status --short --branch
node --version
npm.cmd --version
```

Use Node 22.16+; Node 24 is the tested family. Keep the current working dependencies if already installed and functioning. Do not reinstall them just before the demo without a reason.

**Only if dependencies are missing / setting up a fresh checkout**, follow the pinned install order and stop if any command fails:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd rebuild @bryntum/gantt-trial-lib --foreground-scripts --ignore-scripts=false
npm.cmd rebuild --foreground-scripts --ignore-scripts=false
```

These commands download packages and execute dependency preparation. Read `BRYNTUM_JUDGE_SETUP.md` for evaluation terms. Do not copy downloaded vendor ZIPs into Git.

### Build and rehearse using a separate fictional database

Do not run a second server on the same database. Use an isolated date-stamped path; this preserves the normal `data/nudge.sqlite` and existing verified paid records.

```powershell
$env:NUDGE_MODE = 'demo'
$env:NUDGE_AI_ENABLED = 'false'
$env:NUDGE_AI_PROVIDER = 'elastic'
$demoStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$env:NUDGE_DB_PATH = "D:/Nudge/data/thursday-$demoStamp.sqlite"
npm.cmd run typecheck
npm.cmd run build
```

Run each command separately; proceed only after a successful exit. Do not start from a failed or incomplete build. The database will be created by normal application startup/use. The path itself is not secret, but do not show the database contents or upload it.

Start the production build locally:

```powershell
npm.cmd run start -- --hostname 127.0.0.1 --port 3120
```

Keep that terminal running. Open **http://127.0.0.1:3120**. In a second terminal, this optional readiness request returns only the generic local health response:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3120/api/health'
```

Production mode avoids compiling each page during the presentation. If you change source later, stop with Ctrl+C, rebuild successfully, then restart. A port-in-use error means identify/stop your own previous server or choose a new port; do not kill all Node processes.

### Rehearse before starting the final live fixture

Perform the click sequence in section 6 in **demo mode** first. Check the client window, Studio and Gantt rendering, text readability and browser navigation. Do not run the real sandbox flow repeatedly as practice.

To get a fresh fictional rehearsal, stop with Ctrl+C and choose another new `NUDGE_DB_PATH` using a new timestamp, then restart. Preserve previous files. Do not delete a sandbox database to hide or retry an uncertain invoice; remote records still exist even if the local file is removed.

## 5. Prepare the real Thursday session

### Privately check configuration

Your existing `.env.local` stays private. Next.js loads it automatically. Do not duplicate secret values into commands, this document or a Postman shared environment.

Required private sandbox settings: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MERCHANT_EMAIL`, `NUDGE_ADMIN_TOKEN`. Elastic needs the actual Kibana origin, encoded key, dedicated agent ID, optional space and verified inference endpoint ID. AG Studio uses `NUDGE_AG_STUDIO_LICENSE`. See `.env.example` for exact names, never for real values.

With AI paused in this same dedicated terminal, the following Elastic check is **offline only**:

```powershell
npm.cmd run elastic:check
```

It checks configuration shape, not credentials, trial status, inference availability or remaining allowance. A PASS is not approval of more model calls.

Optional PayPal check performs real read-only sandbox authentication/Invoicing access and does not create/send an invoice:

```powershell
npm.cmd run paypal:check
```

Do this before presenting, not repeatedly during it. If configuration fails, resolve it privately before the demo; never loosen schema/security checks just to proceed.

### Switch the server to the fresh sandbox fixture

Stop the rehearsal server using Ctrl+C. Only after confirming free Elastic access/allowance and licence validity:

```powershell
$env:NUDGE_MODE = 'sandbox'
$env:NUDGE_AI_PROVIDER = 'elastic'
$env:NUDGE_AI_ENABLED = 'true'
$demoStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$env:NUDGE_DB_PATH = "D:/Nudge/data/thursday-live-$demoStamp.sqlite"
npm.cmd run start -- --hostname 127.0.0.1 --port 3120
```

This enables ordinary website inference without a hard request cap. Stop after your planned comparison and inspect usage. The command does not change `.env.local`, but it overrides its matching values for this server process. The already-built server reads these runtime settings; if a later source/config change requires a rebuild, follow the relevant build instructions.

Sign into the owner workspace with your private admin token. Do not show the token entry, clipboard or saved-password prompt during screen sharing. Open a second browser window/context for Client view; a separate context is useful to visibly distinguish the owner and client roles. Do not expose the address bar containing the bearer token.

If Elastic extension is unavailable, retain demo mode and AI disabled. You can separately demonstrate sandbox invoicing of an accepted original agreement without claiming live AI; read `README.md` for that flow. Do not fake an additional-work model result or alter database state to force a mixed-mode story.

## 6. Main demo: exact story and clicks

### Who plays each role

You demonstrate both roles using two browser windows on your laptop: the owner
workspace is the freelancer/merchant side, and **Client view** is the limited
client side. Explain each switch to the audience. The current client page records
agreement and change-quote decisions; it does not submit new extra-work requests.
Introduce the fictional booking request as a message received by email or chat,
then paste it into the merchant's scope assistant yourself.

Follow this order: merchant approves agreement → client accepts agreement →
merchant pastes the extra request and reviews AI assessment → merchant sets and
approves the quote → client accepts the quote → merchant creates/sends the
invoice → separate personal sandbox buyer completes checkout → merchant refreshes
payment status and shows Analytics, Delivery and Activity. Client acceptance is
required before creating the extra-work invoice.

Allow roughly 8–12 minutes for a spoken technical demo, plus provider waiting time. For the final hackathon video, use `DEMO_VIDEO_SCRIPT.md` and keep the final export under three minutes. These are different formats.

### A. Set the commercial baseline

1. Open the fresh owner workspace. Go to **My project → Edit agreement**.
2. Use a fictional website redesign, five marketing pages, two revision rounds and an explicit booking-system exclusion. Keep the default USD1200 base price if appropriate.
3. **Before approval**, replace the fictional recipient with your actual **personal sandbox buyer email**, entered privately. Do not use the business merchant as buyer or use a real client's email.
4. Review the actual clause IDs in this fixture. The ordinary seed uses S3 for the booking exclusion; older diagnostic fixtures sometimes used S2. Cite what is on screen, never a memorized wrong ID.
5. Choose **Approve scope**.
6. Open **Client view**, select the review confirmation and accept scope. Return to owner; allow the existing refresh interval to show acceptance.

Say: “We agree on what is included before discussing extra work. Client acceptance is recorded through this scoped link; it is not identity-verified signing.”

### B. Show the actual AI contribution

1. In the scope assistant, enter: **Please add an appointment booking system to the website.**
2. Click **Compare with agreement once** and wait. Do not double-click or repeatedly retry if slow.
3. Show classification, explanation, cited agreement clause, questions and deliverables. Verify it actually matches the displayed agreement.
4. If the result is ambiguous or incorrect, show the real result and explain the review step. Do not narrate an “additional” result that the model did not return.

Say: “Elastic Agent Builder compares the request with these clauses. Its result is a structured draft. It has no PayPal execution tools, cannot set the price and cannot approve the work.”

Check actual reported Elastic usage privately after the call. Failed/interactive outcomes can consume tokens. Do not run an evaluation batch or invoke historical one-shot diagnostic scripts as part of this presentation; their consumed ledgers and strict fixtures are separate from this user walkthrough.

### C. Turn evidence into a reviewed quote

1. Inspect cited clause text. In **Your scope decision**, choose **Additional work** only if justified by the actual agreement/request.
2. Enter a rationale of at least 20 characters and select the supporting clause. Keep deliverables limited to the booking work. If mixed or unclear, clarify first.
3. Choose **Record scope decision**. Set the owner price to **300.00 USD**.
4. Optionally write the editable client explanation: “The agreed website excludes booking functionality. This quote adds an appointment booking system for USD300, subject to your acceptance.” Review it against the actual scope.
5. Review supporting clauses/message, select the confirmation that the quote includes only reviewed extras, and choose **Approve proposal**.
6. In Client view, show the approved work/price/explanation, then accept the change. Return to owner and confirm accepted status.

Say: “I make the decision and set the price. The client sees the proposed work and price before any change invoice is created.”

### D. Show PayPal's central role

1. With the change accepted, choose **Create PayPal invoice** once.
2. In **Payments**, review the invoice/amount, then **Approve & send invoice** once.
3. Open the PayPal payment link privately. Verify it is sandbox and use the separate personal sandbox buyer. Never enter real financial details. Avoid showing account identifiers/payment URLs while sharing.
4. Complete the **sandbox** checkout. Return to Nudge and choose **Refresh status** if required; the workspace also has fallback reconciliation.
5. Show **PAID / $0 due** for the change invoice. Explain that the original USD1200 agreement remains separate; payment of the extra is not settlement of every project charge.

Say: “This is actual PayPal sandbox invoicing and checkout with fake money. Nudge retrieves the provider's authoritative balance. Today I am using local status reconciliation; I am not claiming this local demo proves a new webhook delivery.”

If checkout hangs, inspect PayPal's actual invoice state before retrying. Do not create another invoice or repeat send just because the browser did not navigate. An uncertain external action must be reconciled, not cleared from the database.

### E. Show AG Studio clearly

1. Open **Analytics** and point out stored invoice balances versus approved quote totals.
2. Choose **Load interactive reports** and wait for Studio to render.
3. Show the custom pending-changes and invoice-check widgets, a relevant chart and **Edit report layout**. Make one small layout change and demonstrate any available chart/filter interaction.
4. Explain that report edits do not modify invoices, payments or acceptance. Reloading/navigation can reset report layout edits; do not promise persisted dashboards.

Say: “AG Studio gives the freelancer an interactive view of the stored commercial state. These are real local records, not a second payment engine. Live dashboard AI is not connected.”

If a chart fails, use the existing native totals/tables and label the chart issue honestly. Do not repeatedly reload while a financial operation is pending elsewhere.

### F. Show Bryntum as delivery impact

1. Open **Delivery** after agreement acceptance.
2. In **Owner-entered plan**, add a base task with an appropriate included-scope clause, a realistic start date, estimated working days and calendar/timezone. For example use Asia/Kolkata if appropriate to your plan.
3. **Save a preview**. Show that applied dates remain unchanged until explicit confirmation and **Apply internal plan**.
4. Apply the reviewed base plan. Then add an extra-work task linked to the accepted booking proposal, with its estimate/dependency; save and inspect the new preview.
5. Show original/current/proposed dates in the read-only Gantt and native date/dependency table. Apply only after review, or discard the preview to demonstrate separation.
6. If client/workspace state changed after preview creation, refresh/review/restage; do not bypass the stale-version rejection.

Say: “Bryntum visualizes the delivery impact. The schedule is my internal estimate; applying it does not send a new client agreement, charge money or autonomously promise a deadline.”

### G. Close with audit and safeguards

Show Activity: agreement review, client acceptance, owner quote and invoice/payment transitions. Explain one failure case, such as stale state, duplicate prevention or protected-client reminder policy. If showing the overdue example/reminder guard, use **demo mode in a separate rehearsal database**; do not send extra real sandbox reminders merely for spectacle.

Close: “Nudge connects evidence, a human decision, client approval, payment and delivery impact. Its safeguards keep an AI draft from becoming a financial action on its own.”

## 7. Optional Postman segment: real API testing, no AI tokens

Do this before demo day if possible; it builds a disposable copy and may take several minutes. It is a useful terminal segment for technical questions, not a required interruption of the main story.

If the pinned local Newman runner is not already installed:

```powershell
npm.cmd install --prefix ./data/postman-runner --no-audit --no-fund --ignore-scripts --save-exact newman@6.2.1
```

Then:

```powershell
npm.cmd run postman:workflow
```

This wrapper uses its own fictional database/server, simulated providers and restart checks. It does not require your Postman account and does not load your normal `.env.local`. The documented past successful run had 47 requests/77 assertions; present only the actual result of your run. Expect no failed assertions/steps, restart persistence, no blocked provider fetch and success. If nonzero/failing, do not call it a pass. Keep raw reports private and do not run the write collection directly against your active demo workspace.

Say: “Postman/Newman checks the local HTTP workflow and persisted state after restart. This is API integration testing with simulated providers, separate from the actual sandbox checkout you just saw.”

## 8. Failure/recovery card

| Symptom | Safe action |
| --- | --- |
| Elastic 401/403 | Privately check key validity/privileges and trial status; no repeated guesses or secret printing |
| Elastic 429/quota/trial expiry | Stop live calls; inspect allowance/extension; use honestly labelled simulation if needed |
| Elastic awaiting_prompt, invalid JSON or missing references | Preserve error; do not auto-answer prompts, relax validation or call repeatedly |
| Slow or failed invoice create/send | Inspect current/remote invoice outcome and processing notice before retry; no marker/database editing |
| Invoice still due after apparent payment | Check the exact invoice in sandbox, then refresh; do not assume payment based on a thank-you screen |
| Protected or rate-limited action | Explain the server safeguard, wait or resolve the legitimate condition; do not bypass it |
| Expired client link | Use owner link-rotation controls if required and share the new link privately; do not publish it |
| Studio/Gantt failure or licence expiry | Use available native tables, disclose limitation and resolve vendor access privately |
| Local server stops | Restart from the same terminal/settings/database after confirming no active process; do not select a fresh DB during financial recovery |

## 9. Finish and preserve the session

Stop the server with **Ctrl+C**. Before any later restart from this same shell, pause AI:

```powershell
$env:NUDGE_AI_ENABLED = 'false'
```

Changing this variable does not reconfigure an already-running server; stop/restart is required. Close the dedicated shell when finished to drop its temporary overrides. `.env.local` was not edited by these commands; ensure its persistent default remains paused through private review if it was changed separately.

Keep the session's SQLite files private. For database-consistent backup/restore, follow `DATABASE_RECOVERY.md`; do not copy only a live SQLite main file and forget WAL data. This runbook does not delete/reset the ordinary database, install hosting or deploy anything.

## 10. Final checklist before the audience joins

- [ ] Elastic extension actually approved for November 5; valid key/model, usage visibility and free allowance checked.
- [ ] Valid AG Studio and Bryntum access; Studio/Gantt loaded during rehearsal.
- [ ] Successful matching build, local URL working, separate fresh fictional database selected.
- [ ] Real sandbox buyer email entered before scope lock; owner login and buyer credentials ready privately.
- [ ] Exactly one intended live AI assessment and one sandbox invoice/payment planned; no unnecessary repeated external actions.
- [ ] Owner/client windows arranged, browser zoom readable, notifications disabled, secrets/address bars outside shared area.
- [ ] Understand how to show native chart fallbacks and how to label simulation if live provider access fails.
- [ ] Local payment reconciliation versus webhook distinction clear; Render honestly described as prepared, not deployed.
- [ ] Leave time for questions about the storage model, approval gates, retries and limitations.

This document was prepared by inspecting current commands, source and existing judge/provider guides. Its commands and future demo were not executed to create it. Exact UI behavior, provider availability and Thursday success require your rehearsal.
