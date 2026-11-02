# B6a: delivery backend and persistence coverage

October 16, 2026. This review compares the implemented delivery workflow with the twelve scenarios in BRYNTUM_BACKEND_CONTRACT.md. It reuses existing coverage, adds genuine separate-process transaction/restart evidence and reset isolation, and makes the targeted production browser runner reproducible from tracked source. No application/backend contract or dependency changed.

## Contract coverage

| Scenario | Evidence and limits |
| --- | --- |
| 1. Legacy paid workspace without plan | `delivery-plan-api.test.ts` checks unconfigured GET, byte-identical records, query-only SQLite reads and no automatic seed/provider call. `delivery-plan-state.test.ts` and its persistence child check legacy bytes across processes. |
| 2. Initialize, apply, restart | Existing API tests cover separate stage/apply and server IDs. New `delivery-command-process.test.ts` uses independent Node connections for actual commands and fresh processes to compare persisted initialization/change previews and applied records. |
| 3. Date/calendar validity | `delivery-plan.test.ts` covers Friday/weekend/holiday finishes, leap days, DST-zone calendars, impossible dates, fractional/excess durations, duplicate holidays, unsupported timezone/calendar and date-span limits. These are civil-day rules, not intraday scheduling or proof of every national calendar. |
| 4. Accepted extra, original and discard | API/state/browser tests cover reviewed extra linkage, computed impact, original preservation, explicit apply/discard and compared financial records. |
| 5. Acceptance and stale decisions | Validator/API/browser tests cover approved-only warnings and blocked apply, missing/draft/declined/unreviewed proposals, acceptance staling a saved preview and explicit restaging. |
| 6. Unscheduled work and graph validity | Validator/draft tests cover null dates, unresolved dependency apply blocking, self/unknown/duplicate/backward/cyclic edges and zero-duration milestone cycles. |
| 7. Competing and repeated commands | Existing API tests check competing requests in one process. New process tests synchronize two already-open SQLite connections, then race stage/stage, apply/discard and apply/apply. Each pair has exactly one success and one conflict, one version/audit increment and no financial or auxiliary-table changes. The apply/discard winner is intentionally nondeterministic; existing API tests separately cover both operations. A consumed apply remains rejected after another fresh process restart. |
| 8. Payment context does not schedule work | Validator tests cover PAID/PARTIALLY_PAID/UNPAID/CANCELLED/OTHER and uncertain-send records without moving dates or completing tasks. API tests check payment mutations stale a preview and preserve exact-cent finances through restage/apply. This is local fictional evidence, not fresh PayPal webhook verification. |
| 9. Busy/auth/forgery/limits | API tests cover owner/origin/quota/body/auth-revocation gates, forged IDs/fields/provenance, calendar changes and confirmation. This review adds a busy-stage assertion alongside existing busy apply/discard assertions. |
| 10. Projections and privacy | API/state/client tests cover owner-only minimal projection, client/analytics/AI omission, strict fields and bounded failures. B5b deliberately includes owner clause text and reviewed deliverables for planning; this is not text anonymization or the full agreement/contact object. |
| 11. Nonmutation, reset and malformed state | API tests compare workspace finances plus webhook/remote-operation rows, including rollback when response projection fails. New `delivery-reset.test.ts` checks the real workspace route: sandbox reset refuses without changing either workspace row or auxiliary rows; demo reset removes the plan while sandbox bytes and auxiliary evidence remain intact. State tests preserve malformed data for review. |
| 12. Actual vendor adapter/UI | Previous isolated India/US timezone checks and the nine delivery/core browser scenarios provide bounded evidence. Broader Gantt keyboard/reduced-motion/accessibility and real Narrator/zoom/touch remain B6b/R6, not closed by B6a. |

## Reproducible targeted browser check

After a successful `npm.cmd run postman:workflow`, use its printed artifact directory:

```powershell
node scripts/check-delivery-browser.mjs data/postman-workflow/<run-id>/app-source
```

The tracked runner requires a passing isolated workflow receipt and matching runtime source inventories/hashes for app, components and lib, plus package/lock/TypeScript/Next configuration. It rejects source symlinks, limits the build location to the disposable workflow directory, filters inherited credentials/proxies, disables AI and uses a provider-fetch guard. It creates new fictional databases and a synthetic owner token for separate loopback demo/sandbox servers on 3118/3119, with no existing-server reuse. Next's generated `next-env.d.ts` is excluded because dev/build legitimately generate different type import paths. The first strict-hash attempt rejected that generated difference before any server started; correcting the comparison preserves all runtime-source checks.

The default `playwright.config.ts` now excludes the sandbox-only owner fixture, which cannot run correctly against its demo-only server. The dedicated runner explicitly includes that fixture on its sandbox server and tests the existing three core workflows too. This change does not claim the full default development browser suite was rerun. Edge's existing Windows default executable path remains; cross-platform browser setup is not added here. The provider guard covers application fetch calls, not an operating-system network sandbox.

## Verification and remaining boundaries

All 170 offline outcomes and TypeScript pass. The final tracked runner passed all nine Edge scenarios against the unchanged B5b production build, with zero skipped/flaky/unexpected outcomes and no provider-fetch attempts. Receipt: ignored `data/delivery-browser/1692925a-ee40-4620-ab15-e4bcd18f68e5/results.json`; its `cleanup.json` confirms ECONNREFUSED for both owned ports 3118/3119. The ordinary development server was untouched. Matching build/Postman receipt: `data/postman-workflow/d3249340-043c-4ec9-9421-6e005ae41850/summary.json`, with 31 requests, 50 assertions and restart persistence. Runtime source is unchanged, so a redundant production rebuild/Postman run is unnecessary for these test/harness changes. Default Playwright discovery lists 77 tests in 21 files without the sandbox-only fixture; listing is not execution of those 77 tests.

The first reset test assertion compared SQLite null-prototype row objects with structured-cloned ordinary objects. Retaining the original immutable query result corrected the test without relaxing byte equality. The full-suite rerun includes that correction. Earlier tracked-runner pass `4a8e299f-eda1-4703-aa30-0bb8952325c6` preceded its automated outcome/provider/cleanup checks; the final run above verifies those additions too. No provider quota was consumed, no real or sandbox payment was made and no ordinary workspace/environment file was used.

B6a tests one local SQLite WAL file with independent processes on Windows. It does not authorize multi-host deployment or prove Linux disk mounts, network filesystem locks, sustained contention/load, crash-at-every-write recovery or all possible thread interleavings. Existing backup/restore and Linux-host verification remain separate deployment tasks.

Next: B6b actual Gantt keyboard, narrow-screen, reduced-motion, contrast and error review. Preserve owner-deferred R6 Narrator/actual 200–400% zoom/physical touch and H/E work. Public hosted/source/judge permissions, actual Bryntum trial dates and sponsor coverage through judging remain open; this work activates no sponsor account, paid service, deployment or public release.
