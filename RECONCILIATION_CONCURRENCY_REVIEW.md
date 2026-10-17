# R10c: reconciliation in-flight regression

October 17, 2026. Two deterministic subtests were added to the existing isolated reconciliation test. The working backend implementation was already correct for these scenarios and was not changed. This closes the scoped test follow-up from Antigravity observation15, not the fresh-payment webhook or deployment evidence gaps.

## Behaviour now exercised

The test file owns a new ignored fictional SQLite database and uses injected lookup functions. Its subtests reset invoice state explicitly while retaining the same test-owned connection. They use manually released promises and an event-loop turn, rather than waiting a fixed number of milliseconds. A global fetch rejection guard records and rejects unexpected network attempts; the successful test reports none.

1. **Shared successful lookup:** one caller starts a lookup and another caller arrives with injected time more than30seconds later. This deliberately puts the follower beyond the normal throttle interval, so throttling cannot disguise a missing in-flight guard. Before releasing the lookup, both callers must remain pending and the entire workspace must equal the baseline. After release, both complete with one lookup, one version increment and one reconciliation audit entry; the paid balance is zero and prior audit/agreement/policies remain intact.
2. **Shared failure and later recovery:** a second controlled lookup is held, shared with a follower beyond the throttle interval, then rejected. Both finish without any state/version/audit change. A later injected successful lookup must run and reconcile once, proving the failed attempt released the process-local slot.

These are in-process function/storage tests, not concurrent browser or HTTP sessions, multi-process deduplication, a live PayPal request, timeout guarantees or exactly-once external execution. Existing authoritative amount/identity guards and newer-version tests remain separate. The existing SENT-to-UNPAID payment fixture already exercises the smaller-balance rejection guard; no redundant literal-UNPAID test or money-handling change was added.

## Actual validation

```powershell
node --import tsx --test tests/reconciliation.test.ts tests/payment-integrity.test.ts
npm.cmd run typecheck
```

- Focused test run: **7passed,0failed,0skipped/cancelled**, including the parent reconciliation case, both new subtests and four payment-integrity tests.
- TypeScript: passed.
- First restricted test run failed at the tsx loader's Windows user lookup (`uv_os_get_passwd`/ENOMEM), before either file ran. An approved outside-sandbox run passed. No application workaround or loader/configuration change was used.
- Node emitted its SQLite experimental warning; no dependency/runtime upgrade was attempted.

The full offline suite, browser suite, production build and Postman collection were not rerun for this test-only change. Their earlier receipts remain historical; do not call this a fresh full-suite result. Application code, dependencies, lockfile, ordinary environment/database, sponsor settings and the Antigravity review folder were untouched.

## Does the regression detect a broken guard?

A single controlled mutation experiment copied the current owned lib source and reconciliation test into an ignored disposable directory, removed only `if (inFlight) return inFlight;` in that copy, and ran the copied test with the existing installed dependencies. The child received an allowlist of system variables, disabled AI and no inherited provider credentials; the test itself supplied controlled promises and blocked global fetch.

The mutant exited1 with the targeted assertion **“only the leader starts an authoritative lookup”** failing, without a child timeout. This is an expected rejection of deliberately broken copied code, not a failing production test. The original lib/reconciliation.ts hash matched before/after:

`5219da890be2f3feef9dbaa7083602a1bfc812326f0fb18a912df96b4a385da3`

Mutation receipt: ignored `data/reconciliation-review/b32ff8d9-be61-457c-9e46-dac0001153e2/summary.json`; raw fictional TAP/stderr and copied source remain local. The one-off helper is `data/check-reconciliation-mutant.mjs`, not a required judge tool. No mutation was made to active application files, no server was started and no provider was contacted. This experiment is not an exhaustive mutation-testing campaign or fresh dependency-install check.

## Continuation

R10c is complete within this scope. R10b's owner client-link exposure/threat-model review is still pending; do not apply the external review's omit-token snippet without addressing the link and rotation contracts. A3b/D4b remains the external AG permission/December15 checkpoint. Live AI, fresh-payment webhook, actual human/manual accessibility, Bryntum operational coverage, publication and Render gates remain open.
