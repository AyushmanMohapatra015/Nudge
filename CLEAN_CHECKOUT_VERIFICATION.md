# Clean source verification

## R5b refresh — October 16, 2026

Current verification includes the pinned Gantt dependencies and delivery tooling. The wrapper copies reviewed working-tree source, not a remote clone; it excludes ordinary configuration, databases and application dependencies. Only existing pinned Newman tooling is linked. Install children receive an allowlist of system variables and empty npm configuration; application build/server children use fictional simulation and the provider-fetch guard. Registry installation is networked, not an OS network sandbox.

Two setup findings were resolved in the verification path:

- Next inferred the original repository as an ancestor root, leaving eight original dependency metadata paths in the first build traces. Explicit supported Turbopack/tracing roots now contain the disposable app and its fresh dependencies. The workflow rejects traced paths outside that source root.
- A background install and foreground installs left a UUID preparation marker in the Gantt bundle despite successful npm exit. The foreground log shows the parent Gantt hook before its helper hook. A subsequent normal parent rebuild also did not repair the already-transformed bundle; that attempt is not counted as success. The final sequence starts from a fresh locked unpack with scripts temporarily deferred, runs the helper's normal lifecycle first, then runs all normal dependency lifecycles. The wrapper checks versions, absence of unprocessed markers and that the prepared helper text stayed unchanged across the final rebuild. It never patches vendor files or expiry checks. This is an observed lifecycle-order problem in this setup, not a demonstrated npm/upstream defect across environments.

Reproduction: install the pinned Newman tooling as documented in POSTMAN_JUDGE_GUIDE.md, then run `npm.cmd run verify:clean`. The three application setup commands are in README.md. [npm documents rebuild](https://docs.npmjs.com/cli/v11/commands/npm-rebuild/) as executing lifecycle scripts after an install with scripts deferred. Foreground mode exposes output; it does not promise dependency hook order. All lifecycle stages must complete: unpacking with scripts deferred is never treated as a working trial. Installation was tested with npm11.6.2. Trial preparation success does not establish public/hosted/judge licence rights.

Final pipeline receipt: ignored `data/postman-workflow/clean-c5b1d066-3f61-4927-9cf0-03379773d182/`, based on local HEAD `545fafd1492160670385b644cc5d8b77c2d04406`. The 302-file working-tree snapshot is 2,167,795 bytes, SHA-256 `51afa42adc9accb0287434affb11d7481243d9404e81b297213d1d59e73c0a48`. Later documentation/setup-template edits are outside that snapshot; tested runtime and verifier code remain unchanged. Node24.12.0/npm11.6.2/Next16.3.8/React19.3.0, Gantt and wrapper7.3.7/helper1.0.1.

| Check | Final evidence |
| --- | --- |
| Fresh locked install | 57 packages; 61.786 seconds; application dependencies not linked to original workspace |
| Normal lifecycle stages | Helper first, then all installed dependency hooks; both successful |
| Preparation audit | Helper/bundle prepared; helper unchanged across final lifecycle stage; no identifiers printed |
| TypeScript and offline suite | Passed; 170 passed, none failed/skipped/cancelled |
| Production/Postman | Build passed; 31 requests, 50 assertions; real process restart persistence passed; no provider fetch attempts |
| Dependency trace boundary | 14 trace files, 192 unique dependency paths, zero outside fresh source root |
| Targeted Edge browser checks | 11 passed in 41.8 seconds; no failed/skipped/flaky outcomes; provider-fetch guard quiet |
| Cleanup | Fresh and root workflow endpoints plus both browser endpoints confirmed closed |

Nested workflow receipt: `source/data/postman-workflow/89612488-fec6-4e4c-b6b6-1c6434a1befc/`; browser receipt: `source/data/delivery-browser/f971bcb3-9cfc-481f-a0ff-576baef76147/`. The root workflow using the same config also passed (`data/postman-workflow/337e76f8-5358-4771-b1b5-27a89fa8e0cd/`). Diagnostic earlier runs remain local and are not substitutes for the final preparation audit. Logs/databases/generated trial values must not be uploaded. This is a same-Windows-machine working-tree check, not a remote clone, first-time Newman installation, Linux or hosted test. The lockfile and package versions were not changed.

R6 Narrator/actual zoom/physical touch, E live website AI/evaluation, H validation, fresh payment-triggered webhook, sponsor permissions, publication history and Render billing/deployment remain open. Two known Gantt ARIA findings remain recorded; a passing regression does not clear them.

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
