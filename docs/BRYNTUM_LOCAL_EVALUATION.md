# B5a-1: isolated Bryntum installation and compatibility

October 15, 2026. The owner authorised local evaluation. This task installed the trial only in an ignored disposable folder, then built and rendered a minimal fictional Next.js fixture. Nudge's application dependencies, lockfile, routes, database, private configuration and existing development sessions were not changed. The actual Nudge delivery screen remains B5a-2.

## Installation evidence

- Normal npm installation used the exact public alias `@bryntum/gantt` -> `@bryntum/gantt-trial@7.3.7`, wrapper `@bryntum/gantt-react@7.3.7` and helper `@bryntum/gantt-trial-lib@1.0.1`.
- Exactly three packages were installed; all lockfile integrity values match the prior archive review. No private npm account or registry login was used. Empty dedicated user/global npm configurations, a dedicated cache and a small allowlist of system environment variables excluded owner npm credentials and provider variables.
- Both ordinary postinstall hooks exited zero. The inspected helper build file no longer contains `%UUID%`; the main bundle contains neither `%LICENSE%` nor `%UUID%`. No trial identifier was published, no manual root-level hook execution occurred, and no expiry or preparation check was bypassed.
- Root `package.json` and `package-lock.json` hashes were unchanged across installation. The initial restricted npm attempt failed with EACCES; the approved retry succeeded in a new disposable directory. Neither install used a paid service or AI provider.
- `npm audit` was not run; the successful install is not a vulnerability clearance. The folder is process/configuration isolation, not a virtual machine or operating-system security boundary.

## Actual runtime checks

The disposable JavaScript fixture reused Nudge's installed Next16.3.8, React/ReactDOM19.3.0 through directory links. It did not install a separate framework stack or downgrade the application. Production build used the current default Turbopack path and a browser-only dynamic import with `ssr:false` inside a Client Component. Build/server children had filtered environments, telemetry disabled and a fetch guard; headless Edge also received a filtered environment and blocked all non-loopback requests.

| Check | Final result |
| --- | --- |
| Production build with current Next/React and trial packages | Passed |
| Two explicitly fictional tasks render in headless Edge | Passed |
| Read-only flag and unchanged model after double-click/Escape and viewport change | Passed |
| Browser reload preserves the two expected date-only intervals | Passed |
| Asia/Kolkata versus America/Los_Angeles date-only projection | Same expected October19-20 and October20-21 intervals |
| External browser request attempts, browser exceptions and console errors | Zero in the final run |
| Server/build provider-fetch guard | No attempts recorded |
| Owned server exit and loopback endpoint closure | Both confirmed |

The fixture contains no Nudge API requests, client records, database or payment connection. It establishes basic library compatibility only, not actual delivery API integration, accepted-extra authority, financial nonmutation under the eventual screen, TypeScript prop compatibility, full browser coverage, accessibility or production readiness. Node24.12.0 was used; no claim is made about all supported Node versions. Prior Nudge unit/build/Postman evidence was not rerun for this ignored fixture.

## Findings resolved during the check

1. **Project and inline data conflict:** first rendered configuration supplied `tasks` alongside a project configuration. Bryntum rejected it. The fixture now supplies task records only as `project.tasksData`, with `autoLoad:false` and `autoSync:false`.
2. **Automatic icon CDN fallback:** omitting local Font Awesome CSS caused attempted cdnjs requests. All were blocked. Importing the bundled `fontawesome.css` and `solid.css` before structural/theme CSS removed the attempts; the final run observed none. Carry local assets and their CC BY/OFL/MIT notices into the actual integration.
3. **Civil dates versus ISO instants:** an initial assertion compared timezone-adjusted model Dates using `toISOString()`. That varied across browsers. Bryntum's declared model timezone conversion means these Dates carry project wall-clock fields. With explicit UTC input/project timezone, the fixture now projects those fields to `YYYY-MM-DD`, as Nudge's server contract requires, and asserts exact expected dates in both browser timezones. This corrects an invalid serialization assumption; it is not evidence that Nudge's saved backend dates were corrupted. Non-UTC working-calendar integration still needs its own checks.
4. **Verification cleanup:** the first restricted browser run could not confirm cleanup and masked its browser error. An approved process check found no matching server. The harness now records its owned PID/port, retains browser errors, filters the browser environment and checks both process exit and endpoint closure. Subsequent owned servers stopped normally.

The successful final browser run reused the latest successful production build only after checking that all five fixture source/configuration files were unchanged. Failed configuration, CDN and raw-ISO assumption receipts are retained locally rather than represented as passes.

## Artifacts, limitations and next task

Ignored run: `data/bryntum-local-evaluation/02a3f5b8-0708-4a18-9c32-01935574d27c/`. Installation summary, npm logs, successful build log, final compatibility summary and earlier failure receipts remain there. The mobile screenshot visibly has the expected trial watermark and a narrow timeline next to the task names; it is **not** evidence of a finished mobile design. Actual in-app work needs a useful text/table fallback, layout, keyboard, reduced-motion and pending manual assistive-technology checks. Do not remove trial watermarks or upload vendor files/identifiers from this folder to Git.

**B5a-1 complete. Next B5a-2:** add the pinned dependencies to Nudge, preserve applicable notices, and implement the owner-only read-only delivery view against `/api/delivery-plan`, including empty/review-needed/stale/error states and correct civil-date/calendar handling. Preview/apply/discard UI remains B5b; existing B4 server authority must remain intact. Recheck actual application build, browser and relevant regressions after those changes.

B2b/c exact trial dates, public hosted evaluation, application-source/package distribution and free judge access through December15 remain pending. A 45-day email is not a confirmed expiry date or publication permission. Deferred E live-AI verification, H human validation and R6 Narrator/actual zoom/physical touch remain open. No real payments, provider calls, licence purchase, public hosting or support outreach occurred in this task.
