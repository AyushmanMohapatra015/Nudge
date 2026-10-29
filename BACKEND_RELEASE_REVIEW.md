# Backend release checkpoint

October 29, 2026. Scope: API error privacy, saved-output evaluation and local release verification. Hosting, fresh payment webhooks and independent people remain separate evidence gates.

## Demonstrated faults and fixes

tests/api-error-boundaries.test.ts was run against the previous implementation first. Four scenarios failed: an invalid client enum reflected a fictional private value, client and owner SQLite failures returned 400 with native diagnostics, and corrupt stored JSON escaped the read handler. The parent test also failed. Malformed JSON and basic owner validation privacy checks already passed; do not call them reproduced leaks.

app/api/client/[token]/route.ts now exposes only typed, authored decision/body-limit messages for expected errors. Parsing/schema failures have fixed text. Storage/unexpected failures return generic 503/no-store responses, including initial reads and projection failures. Current-link checks, transaction rechecks, expiry/rotation and approved-only, one-time acceptance remain enforced. The response asks the client to refresh and check the recorded decision before retrying.

app/api/workspace/route.ts now catches read failures and returns generic 503/no-store. Invalid request JSON/schema errors use fixed text. Native coded storage errors, stored-JSON parse errors and unexpected error classes do not expose diagnostics. Existing plain domain/adapter Error messages remain authored action guidance; this is not a universal error-typing architecture. Cleanup is guarded: if reading/saving it fails, return 503 and retain the processing lock rather than throw another error or replay work.

Eight new subcases cover client enum reflection, malformed JSON, owner validation, client/owner rollback, failed cleanup preserving one proposal and the lock, corrupt storage across GET/POST, and unchanged one-time acceptance. Actual SQLite triggers induce commit/cleanup faults. The cleanup case uses demo analysis and all tests reject provider fetches.

## Actual local verification

- Focused privacy/provider/client-link/body checks: 18 passed.
- Full backend: 273 reported, 271 passed, 0 failed/cancelled, 2 existing Windows file-symlink skips.
- Nonincremental TypeScript: passed.
- Fresh isolated production build: passed.
- Postman/Newman: 47 requests, 77 assertions, 0 failures; restart preserves records and no provider fetch was attempted.
- Synthetic browser-secret scan: 25 files, 0 marker findings, 0 source maps.
- Production receipt: data/postman-workflow/27538dd8-641b-43b3-83c8-28372faed48f/summary.json. Independent closure check returned ECONNREFUSED on the owned loopback port 58871; independent-cleanup.json records the result.

Initial restricted Windows tsx execution failed in uv_os_get_passwd before running tests. Approved offline reruns executed the regressions; no dependency change was needed. Existing experimental SQLite/fs.F_OK deprecation notices remain nonfatal.

## Privacy boundaries

Reviewed source includes owner/client, analytics, delivery, health, signed webhook and dashboard-agent error boundaries; existing PayPal/AI sanitizers; Next development logging and the Render startup wrapper. Owner records intentionally contain authorised client details. Client responses exclude owner audit/policies, raw analysis and processing data. No submitted-body/native-error logging was added.

Existing next.config.ts disables routine development logging and applies no-referrer/nosniff/frame-denial headers. Provider/relay helpers use fixed messages or limited status metadata. Browser scans use synthetic markers, not actual credentials. These checks do not establish that Render access/error logs suppress bearer URL paths; actual hosted logs and HTTPS/session behavior remain to verify.

Repository-history/publication review is owner-deferred. This targeted check does not read private environment values, scan every historical commit, establish absence of every possible secret, or authorise making the repository public. Hosting/provider retention and independent security review remain unknown.

## Evaluation and external dependencies

SAVED_AI_COMPARISON.md and evaluation/saved-development-comparison.json provide a reproducible four-case comparison without new AI usage. Independent semantic review, unseen cases, repeated live runs and broader injection evaluation remain pending. Further inference is not automatically scheduled by these checks.

Render USD50/October 1, 2027 and no-payment-method facts remain recorded. Owner confirmed October 29 that the no-card/credit-only support request is unanswered or not yet sent; the copyable devrel@render.com request is in SPONSOR_SUPPORT_REQUESTS.md. AG Studio hosted/judging permission remains unconfirmed. Owner accepts possible credit expiry and asks for safe use within limits; this does not establish new funding or a hard spending cap.

After actual cost/access terms are known, activate the reviewed single-instance Node/1 GiB SQLite configuration; verify HTTPS/session access, real mounted persistence/restart and backup/recovery; then arrange a fresh payment-triggered signed PayPal sandbox webhook. Do not reopen consumed financial ledgers or imply polling/old SENT replay proves a fresh PAID webhook. Narrator, actual zoom/touch, final source/judge/video/submission remain separate.
