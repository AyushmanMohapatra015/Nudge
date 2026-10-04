# Clean source verification — October 4, 2026

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
