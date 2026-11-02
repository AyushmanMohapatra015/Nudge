# M6: delivery planning in the isolated Postman workflow

October 17, 2026. The original 31-request/50-assertion workflow is retained, with 16 requests and 27 assertions added for the delivery-plan API. **The complete 47-request/77-assertion collection passed** against a disposable production build, with no failed assertions or steps. AI and payment behavior were simulated; HTTP routes and SQLite writes were real local application operations.

## Actual evidence

- Final receipt: ignored `data/postman-workflow/dd6ce3ba-9c30-4a67-88b4-ff3e1a084eb2/summary.json`.
- All 47 statuses and 77 assertions passed; process restart preserved owner state including the complete original/current delivery plan; `blockedProviderFetch` was false.
- Build trace review passed. The wrapper stopped its test server, and a separate TCP probe confirmed the owned endpoint refused connections (`endpoint-closure.json`, ECONNREFUSED).
- TypeScript passed. All four focused offline Postman safety checks passed, including rejection of an incomplete run and the obsolete 50-assertion count even when reported statuses otherwise pass. Existing script/destination mutation, fail-stop, loopback, privacy and inherited-secret/fetch guards remain enforced.
- Reviewed collection digest: `93773f154bff183d857d9f545720c2b7d4853d5d51920b6fb1345e90bacd5f80` over parsed JSON serialization. This constant was changed only after reviewing the preserved original workflow and new request/script/variable flow; the execution wrapper never updates it automatically.

No application route, domain logic, dependency, lockfile, private environment, ordinary database, licence or account was changed. The full offline suite and browser suite were not repeated for verification-tool changes; older 170-test/browser evidence remains historical rather than a fresh full-suite claim.

## Added boundaries

| New request(s) | Verified outcome |
| --- | --- |
| 32–35 | Capture accepted/paid owner baseline; delivery GET is no-store/local-records and omits owner secrets and invoice links; cross-origin stage is rejected and full owner state remains identical |
| 36–38 | Stage a three-working-day base plan with server-generated task identity; current/original remain null; unconfirmed apply is rejected without changing the stored view |
| 39–40 | Confirmed apply records original/current once; repeating the same apply is rejected |
| 41–43 | Stage a one-calendar-day extension without changing applied dates/original; stale-version apply is rejected and the saved preview is unchanged |
| 44–45 | Discard removes only the proposed preview; repeating discard is rejected |
| 46–47 | Client projection still excludes the internal plan; all owner fields except deliveryPlan/version/audit match the baseline; exactly four valid commands increment version/audit and no rejected action adds an entry |

The final applied base plan survives restart. A changed preview is deliberately discarded, so this does not claim a second revision was applied or an outstanding preview survived restart. Remote-operation/webhook tables are not queried by this collection; separate delivery API/backend tests cover those deeper storage boundaries. Sandbox authentication, tentative-extra acceptance changes, independent-process races, vendor chart rendering/accessibility and hosted operation remain separate evidence.

## Execution and sharing boundaries

Use `npm.cmd run postman:workflow`, as described in [judge guide](POSTMAN_JUDGE_GUIDE.md). It requires the existing pinned Newman6.2.1 tooling, creates its own fictional database/production build and loopback server, strips provider configuration and blocks application provider fetches. It does not load .env.local, export reports/environments or require a Postman account. The fetch guard is not an OS-wide network sandbox.

The clean template has13empty variables. Runtime values now also contain a full fictional owner baseline, preview/original state and command bodies. Never run or export this write-containing collection against the real owner workspace or a shared hosted demo. Share fresh repository templates and sanitized counts only; see [sharing review](POSTMAN_SHARING_REVIEW.md).

## Retained failed attempt and cleanup

The first focused-test attempt failed in the restricted environment at Windows user lookup (`uv_os_get_passwd`/ENOMEM) before tests ran. An approved outside-sandbox run passed all four checks; no application workaround was introduced.

The first production attempt, ignored `data/postman-workflow/2e30c899-c32b-4bda-aae2-27c935f98d89/`, built and reached a server, but failed to confirm process cleanup and produced no passing summary. It is not counted as a successful workflow or proof that the new assertions passed. A restricted process lookup was denied. Approved lookup identified only the wrapper's disposable Next child; PowerShell Stop-Process then reported an internal error, so its subsequent success text was not trusted. Rechecked, approved Windows taskkill stopped that verified child and its descendant; the original wrapper exited with code1. The complete outside-sandbox rerun above passed with normal cleanup and independently verified endpoint closure. The ordinary development server was not targeted.

No AI/provider usage, PayPal request, real payment, package installation or external message occurred. These tests strengthen API regression coverage; they do not close the deferred live AI, fresh-payment webhook, human/manual, sponsor-licence, publication or deployment gates.
