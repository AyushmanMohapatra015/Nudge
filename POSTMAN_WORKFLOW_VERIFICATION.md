# Postman: isolated Nudge workflow verification

## Verified October 7, 2026

Repeat verification after the client-explanation feature: the unchanged collection again passed 31 requests/50 assertions with zero failures or blocked provider-fetch attempts. This confirms legacy approval calls that omit the optional message remain compatible. Separate server/browser tests cover the new message and evidence panel; latest suite is 82 server tests and three affected browser workflow tests, plus typecheck/isolated build. The initial run and its 81-test baseline below remain historical evidence.

Postman's Newman 6.2.1 executed the reviewed collection against a disposable **production build of Nudge**, on an owned loopback server. All **31 HTTP requests and 50 assertions passed**, with no failed steps. The runner's provider-fetch guard recorded no attempted calls. The temporary server stopped after the run.

This is actual HTTP integration testing of Nudge's application routes and SQLite state. **The model and payments are simulated.** It does not establish live AI accuracy, fresh PayPal payment webhook delivery, hosting, user demand or sponsor prize eligibility. The separate [read-only PayPal collection](POSTMAN_VERIFICATION.md) records actual sandbox API access.

| Workflow boundary | Observed result |
| --- | --- |
| Agreement approval and client acceptance | Invoicing before acceptance rejected; repeated acceptance rejected |
| Scope proposal and human review | AI-disabled draft has no price; included/ambiguous decisions cannot become paid extras; missing review and altered deliverables rejected |
| Approved quote and client access | Draft hidden; reviewed quote visible; owner-only fields hidden; extra price/work fields in acceptance cannot change approved terms |
| Accepted change and invoice | No invoice before client acceptance; exactly one simulated invoice created and sent |
| Payment reconciliation | Simulated payment yields PAID and zero outstanding; paid reminder and duplicate invoice rejected |
| Request controls | Cross-origin mutation and unsigned webhook rejected; final state retains approved price and original analysis |

The first disposable build failed because the runner omitted `components/` from its source copy. The copy list was corrected before the successful run; both run directories remain local. No application behavior was changed to make the collection pass.

## Repeat from the project root

Requires Node 22.16 or later and the application's installed dependencies. Install optional, pinned Postman tooling once if absent:

```powershell
npm install --prefix ./data/postman-runner --no-audit --no-fund --ignore-scripts --save-exact newman@6.2.1
```

Installation downloads packages; it does not create a cloud account or subscription. The workflow itself needs no API keys, Postman account, sponsor credits or `.env.local` configuration:

```powershell
npm run postman:workflow
```

Use this wrapper, rather than pointing the write-containing collection at your ordinary workspace. It accepts no endpoint/credential arguments and does not load `.env.local`. A fresh source snapshot, production build and SQLite database are created under ignored `data/postman-workflow/<run>/`. The run uses disk space and briefly runs build workers; retained copies can accumulate. Keep artifacts local, and review their paths before any manual cleanup.

The runner removes inherited Nudge/provider/proxy settings, enforces demo mode and disabled AI, and checks the seeded state before running requests. It binds a separate server to `127.0.0.1` and does not stop the ordinary development server or overwrite its `.next` cache/database. A preload rejects provider `fetch` calls before transport. This guard covers the application's fetch-based integrations; it is **not an operating-system network sandbox or protection against malicious dependencies**.

The canonical collection fingerprint must match before execution. One iteration runs with failure-stop behavior, bounded timeouts, redirects disabled, no report/environment export and no external file reads. Custom HTTP agents permit only the owned loopback host/port; HTTPS connections are rejected. Do not update the fingerprint automatically when a collection changes: review its destinations, scripts, assertions and variable flow first.

Console output and `summary.json` contain status/count evidence, excluding bodies, headers, runtime IDs and SDK error messages. The ignored database contains synthetic records and client tokens; build/server logs are local diagnostic artifacts, not submission attachments. Credentials are absent from the copied source and child environment. A failed run is not retried automatically.

## Supporting checks and remaining limits

All **81 server tests** and TypeScript checks pass. Three new tests check modified-collection rejection, destination restrictions, failure reporting, inherited-secret removal and fetch blocking in a child process. The disposable production build passed before the real Newman run. Browser/accessibility tests were not rerun because no app UI code changed.

This increases repeatable sponsor-backed backend evidence; it does not close the paused Elastic allowance/usage checkpoint or replace independent human review. Newman currently emits a dependency deprecation warning; keep optional tooling separate and reassess maintenance before ongoing CI use.

Reference: [official Newman library options](https://github.com/postmanlabs/newman#newmanrunoptions-object--callback-function--run-eventemitter).
