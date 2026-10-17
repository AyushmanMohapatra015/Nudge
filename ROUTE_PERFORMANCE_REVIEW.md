# F2p: optional chart and report performance

## October17 F2q: explicitly activated Studio reports

Analytics now renders native totals and complete snapshot tables without mounting Studio. Load interactive reports explicitly mounts the existing dynamic component; the control retains keyboard focus and communicates expanded state. Existing session-only layout/editing, filtering, widgets and exports are preserved. A report error boundary retains the page/tables and offers an actual page reload, rather than retrying a cached rejected import. A reload resets session layout edits; no automatic provider request/fallback is added.

`tests/browser/analytics-loading.spec.ts` verifies the large JavaScript response belongs to a request first made after activation; it also holds deferred requests to check the loading announcement, focus and usable table, then releases them. A separate failed-download scenario verifies table access and a successful explicit reload/re-activation. Existing report tests now explicitly activate the tools; the full keyboard journey still uses Tab/Enter. The scoped accessibility test directly focuses its skip link after activation, while the separate keyboard journey tests actual tab traversal.

Validation: TypeScript,170offline tests, production build/Postman31requests/50assertions/restart and all20 targeted browser outcomes passed. Browser receipt: ignored `data/analytics-browser/0851a304-9028-47b5-a16c-bbf71041dee4/`, no failed/skipped/flaky outcomes, provider-fetch guard quiet, endpoint3118 confirmed closed. The two known vendor edit-mode accessibility findings remain explicitly bounded by the existing tests; this change does not clear them. Actual Narrator/zoom/touch remain pending.

Production receipt: `data/postman-workflow/4153b298-7ac3-4fca-a971-8026b4284ae6/`; trace-boundary guard passed. Reproduce the20 targeted checks with `node scripts/check-analytics-browser.mjs data/postman-workflow/<successful-run-id>/app-source`. The runner checks matching runtime/config source and a passing production receipt, then uses a fresh fictional demo database with integrations disabled and guarded provider fetches. Ordinary workspace/env and paid services are not used.

The API-assisted rehearsal now explicitly activates reports; only this interaction was adapted, and the full B7a rehearsal was not rerun as part of F2q. The performance runner uses the new explicit activation action and records activation time for both routes.

### Repeat measurements

All12 matching-condition observations passed with no page errors/provider fetch, the entire fictional workspace unchanged and owned endpoint closed. Receipt: ignored `data/route-performance/cb1f26f1-b9ad-4e42-8de6-ecd2db14dacc/` (summary, aggregate and cleanup). Same Edge version, viewport, reduced-motion setting, sequence, new-context/cache-disabled routing, unthrottled loopback and CPU1x/4x methodology as the baseline. This is a later run, not a randomized controlled comparison; system/cache variation remains material. Analytics explicitly activates reports immediately after its native-ready measurement, so full chart timings still include activation. A user who chooses only tables does not activate that work, as verified by the request-level test.

Times are median [min–max] milliseconds, three observations per row:

| Route / CPU | Native ready | Tool ready from navigation | Tool activation | Interaction |
| --- | --- | --- | --- | --- |
| Delivery / normal | 239 [205–383] | 1660 [1564–1706] | 1356 [1275–1464] | 40 [34–41] |
| Analytics / normal | 170 [164–171] | 943 [917–981] | 777 [745–807] | 160 [160–170] |
| Delivery /4x | 829 [664–1062] | 4811 [4393–5021] | 3745 [3716–4189] | 277 [220–292] |
| Analytics /4x | 610 [474–679] | 3532 [3287–3541] | 2850 [2673–3064] | 781 [744–811] |

Analytics normal native/tool/action medians were168/891/157ms before and170/943/160ms after, so there is no demonstrated across-the-board latency reduction. Slowed observations improved719/4812/895ms to610/3532/781ms, but unchanged Delivery also varied considerably; do not attribute all differences to this code. The strong result is deferring the approximately5.4MB raw report module until requested, not shrinking it or removing post-activation work. Slowed Analytics still had916–1269ms maximum long tasks across the three samples, so it is not cleared for low-end-device responsiveness. No vendor code/dependency/version/expiry change or backend change. Performance ceilings, warm-cache/mobile/hosted and large-record datasets remain unverified.

F2q is complete within this scope. Next existing action-plan checkpoint is A3/D4b: obtain AG Studio public-source/hosted judging permission and coverage through December15, with no message sent or paid activation by the agent. Other deferred/live/manual gates remain open.

## Historical F2p baseline

October 17, 2026. Measured the unchanged production application on the owner's Windows laptop using headless Edge155.0.4283.45 and Node24.12.0. This is a baseline measurement, not an optimization result or hosted/mobile performance guarantee.

## Method and reproducibility

`scripts/review-route-performance.mjs` requires a passing disposable production/Postman/restart receipt and matching runtime/config source. It starts a loopback production server with a new fictional SQLite database, simulation, disabled AI/integrations, allowlisted process environment and provider-fetch guard. It creates an accepted base agreement and a three-day base delivery plan using the actual APIs; no extra quote or invoice/payment is created. It checks the entire workspace is unchanged after read-only browser interactions.

Twelve observations: three sequential samples for each of Delivery and Analytics at normal speed and CDP4x CPU slowdown. Each uses a fresh browser context,1366x900 viewport and reduced motion. Routing blocks external traffic except loopback and supplies empty stylesheet responses to Google Fonts requests; routing disables HTTP caching. No network throttling. Browser contexts are new, but OS, browser-process and server caches can warm; these are not twelve fully cold system starts. Delivery always runs before Analytics within each pair. Three observations support a descriptive range/median, not statistical or real-user claims.

- Native readiness: Delivery's current-date table visible; Analytics' edit-layout control visible after snapshot loading, followed by two animation frames.
- Chart readiness: actual Gantt ready status or first Studio layout widget visible, followed by two frames. A first-widget check does not prove every chart finished rendering.
- Interaction: hide Gantt and verify removal, or toggle Studio into edit mode; observe corresponding UI and two frames. Includes Playwright actionability/IPC/polling overhead; **not INP**.
- CDP cumulative script/task time and observed long tasks provide main-thread evidence. Script time is not isolated parsing time. Summed long-task excess over50ms is observation-window blocking, **not Lighthouse TBT**. LCP candidates/paint/resource measurements are retained as diagnostics, not a Core Web Vitals certification. No trace/profile attribution proves a particular vendor function caused a long task.

Reproduce on Windows after the setup in README and pinned Newman installation:

```powershell
npm.cmd run postman:workflow
node scripts/review-route-performance.mjs data/postman-workflow/<successful-run-id>/app-source
```

Use the receipt directory actually printed by the workflow, not the placeholder. All receipts remain ignored; do not publish databases, generated URLs/tokens or vendor distributions.

## Observed results

Times below are milliseconds: median [minimum–maximum], three samples per row.

| Route / CPU | Native ready | Visual tool ready from navigation | Representative interaction | Largest long task per sample |
| --- | --- | --- | --- | --- |
| Delivery / normal | 180 [176–867] | 1565 [1526–8661] | 35 [35–36] | 461 [442–467] |
| Analytics / normal | 168 [163–264] | 891 [888–2350] | 157 [148–162] | 272 [270–274] |
| Delivery /4x | 817 [745–836] | 5577 [5277–5678] | 142 [114–180] | 2840 [2342–3010] |
| Analytics /4x | 719 [661–816] | 4812 [3864–5369] | 895 [559–973] | 1234 [1210–2569] |

Gantt activation measured from before the explicit Show action: normal median1386ms [1344–7792],4x median4748ms [4527–4813]. The first normal-speed chart observation is retained; no exact cause for its excess delay was established.

Median cumulative script/task execution: Delivery normal188/881ms,4x1051/5174ms; Analytics normal170/865ms,4x1071/5724ms. Endpoint JS heap snapshots were approximately23MiB for Delivery and48–56MiB for Analytics, not peak memory or total browser/server RAM.

The requested large JavaScript chunks were4,909,996 bytes for Delivery and5,400,204 bytes for Analytics on disk. They had not completed loading at the native-ready observation in any sample. This does not prove they had not started requesting; native resource snapshots contain completed entries. No claim that these are compressed wire sizes, vendor-only bytes or parse costs. B7a contains the earlier full requested JS/CSS budget.

All12 samples passed; no browser page errors or application provider-fetch attempts. Before/after workspace objects matched exactly. The owned server endpoint was confirmed closed. Final evidence: ignored `data/route-performance/1cdf4587-2e12-4856-bec0-99245f3bc80b/summary.json`, `aggregate.json` and `cleanup.json`. Source build: `data/postman-workflow/337e76f8-5358-4771-b1b5-27a89fa8e0cd/app-source`; no app source changed for this task. No new full suite/build is warranted for a standalone measurement runner and documents; syntax/privacy/whitespace checks supplement the actual browser run.

## Decision and next task

F2p measurement selected F2q: make AG Studio explicitly opt-in while retaining native reading, error recovery, keyboard focus and existing report controls, then verify deferred requests and compare measurements. That task is now complete in the October17 section above; the baseline does not itself prove an optimization result.

Preserve Delivery's existing explicit Gantt activation and table bypass. Revisit supported bundle/configuration changes only after this bounded improvement; no proprietary source patches or unreviewed package changes. Actual Narrator/zoom/touch, independent usefulness, live AI/fresh webhook, AG/Elastic access, Bryntum technical-expiry/judge acquisition, publication and Render gates remain open. No paid activation, deployment, account access, external outreach or ordinary workspace/env use occurred.
