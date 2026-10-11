# Clean source verification

## R5 refresh — October 11, 2026

Verified a **current working-tree source snapshot**, including uncommitted runner changes, based on local HEAD `324c2e518e7f`. This was not a remote clone, Git archive, different-machine test or hosted deployment. The snapshot contained 231 files, with SHA-256 `5df3fc53d5541d9d8b88fb22df8c19135cc1e21431b775b67a99b431c17b3151`. Documentation updates written after the run are outside that snapshot; the tested application/runner code is unchanged.

### Isolation and dependencies

- Windows, Node24.12.0, npm11.6.2. No ordinary environment file, database, .next or application node_modules copied.
- Fresh `npm ci --include=dev` installed 54 packages from the lockfile. Optional platform entries explain the difference from the 111-entry licence inventory.
- Empty user/global npm configuration and a dedicated ignored verification cache were used. Original application dependencies were never linked into this source copy. The inner disposable build links only to the newly installed dependencies.
- Existing pinned Newman6.2.1 is reused as verification tooling, not an application dependency. This check therefore does not prove a first-time Newman install; its command remains in POSTMAN_WORKFLOW_VERIFICATION.md.
- The source snapshot includes the blank .env.example, root MIT licence and current notice documents. Provider/owner settings are removed from the child environment, simulation is forced, and a separate SQLite database is used.
- Application provider fetches are blocked in the build/server children. The coordinator uses loopback HTTP; npm installation requires registry access. This is not an operating-system network sandbox.

### Results

| Check | Result |
| --- | --- |
| Fresh locked application install | Passed;54 packages, approximately51seconds |
| TypeScript before build | Passed |
| Offline tests | 129passed;0failed, cancelled or skipped |
| Disposable production build | Passed, including Next's TypeScript phase |
| Postman simulation collection | 31requests/50assertions;0failures |
| Real process restart | Both production starts reached readiness; paid invoice/$0 due, agreement/proposal approvals, policies, audit, client token/expiry and integration flags matched before/after |
| Provider-fetch attempts during production workflow | None |
| Cleanup | Both owned server processes stopped; normal development server preserved |
| Current targeted privacy/whitespace checks | Passed |

Restart checks compare actual owner-state fields after launching a new process using the same disposable database. Policies matched, but this run does not separately prove persistence of a non-default policy. The client link's stored token/expiry were compared; a separate post-restart client browser journey was not run. These checks add evidence of local persistence, not live payment delivery or hosted disk behavior.

The first restricted install encountered EACCES. The approved network attempt later failed with registry EIDLETIMEOUT and a cleanup warning. A longer fetch timeout and reuse of the isolated registry cache allowed the next fresh install to succeed. No packages or application behavior were changed to bypass a failing check.

Evidence is retained under ignored `data/postman-workflow/clean-e9ce5a2a-71ea-4d2c-b18a-f289613ab2e5/`; the nested successful workflow is `source/data/postman-workflow/33c277e0-495d-4645-be2c-74f7395d2b3b/`. Logs, synthetic client tokens and databases remain local. Source manifests identify what was copied; do not upload these directories as submission attachments. Copies/cache consume disk space; review resolved paths before any cleanup.

### Repeat and limits

Install optional pinned Newman using POSTMAN_WORKFLOW_VERIFICATION.md, then run `npm run verify:clean` from the repository root. Use `npm.cmd` in PowerShell if needed. The wrapper checks current source, copies only reviewed tracked/non-ignored files, performs a fresh locked install, and stops after a failed step. It does not load .env.local, update the normal database, create payment fixtures or activate sponsor services.

No browser/accessibility regression was rerun for these runner/documentation changes. R6 actual screen-reader/zoom/keyboard/touch review is next. Historical publication decisions R2b/R2c, AG licence permissions, free sponsor access through judging, Linux/Render persistence, broader live AI quality/website verification, independent user findings and a fresh payment-triggered signed webhook remain pending. Simulation does not complete the hackathon's AI requirement. Live AI remains deferred.

## Historical milestone — October 4, 2026

The following evidence describes the older revision and is not the current readiness claim.

Verified application commit **3844728** using a Git archive of tracked files expanded into a fresh Windows temporary directory outside D:\Nudge. Local HEAD and origin/main matched at inspection; no fresh remote clone was performed. README/JUDGE_SETUP improvements from this verification are separate documentation changes to commit afterwards.

## Environment and isolation

- Windows, Node **24.12.0**, npm **11.6.2**.
- No copied .env.local, database, node_modules or .next. The archive included package-lock.json, the blank .env.example and root MIT LICENSE.
- `npm ci --no-audit --no-fund` installed the locked dependencies using a separate verification cache. Initial restricted registry access failed with EACCES; the approved network retry succeeded. This was an execution-environment restriction, not a missing source file.
- Next resolved from the temporary copy's own node_modules, not D:\Nudge's dependencies.
- Production smoke checks forced NUDGE_MODE=demo, blanked provider/payment credentials, bound to loopback on an available port and used a new local database. Temporary server processes were stopped after verification.

## Results

| Check | Result |
| --- | --- |
| Fresh dependency installation | Passed, 37 packages installed |
| TypeScript before first build | Passed |
| Mocked server tests | All 33 passed |
| Production build | Passed; all app/API routes compiled |
| Production-mode simulation journey | Accepted agreement → simulated comparison → human scope review/price → client acceptance → invoice/send → simulated PAID and $0 due |
| Premature invoice and protected reminder gates | Rejected as expected |
| Client invoice visibility | Matched the owner's paid state |
| Server restart persistence | Paid invoice and protected-client rule retained |
| Fresh-copy browser regression | All six tests passed using installed Edge; isolated dev server stopped after the run |

The smoke exercise used only the local HTTP API and existing simulation operations. Browser regression checks cover the website interaction flow separately. No actual PayPal/AI requests, public tunnels or deployments were made. npm downloads and optional Google Fonts are network dependencies; this was not an offline install or a different-machine/OS test.

## Remaining submission work

The code can run without the developer's local files. This does not establish meaningful real AI integration: a live model response, model evaluation, sponsor allowance through judging, genuine webhook delivery, user validation and final submission materials remain pending. Simulation is clearly labelled and cannot be presented as the completed AI requirement. A hosted build is not yet verified; if choosing local judging, finish the private integration/access instructions as well.

README now uses reproducible npm ci, links a short judge walkthrough and corrects outdated claims about link revocation, interrupted-action recovery and webhook verification. Google Fonts remain a cosmetic external dependency with local system-font fallback.
