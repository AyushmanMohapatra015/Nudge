# F2p: optional chart and report performance

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

F2p measurement is complete. The samples justify reducing automatic report-builder work, without removing the sponsor integration or changing financial/date safeguards. **F2q next:** make AG Studio explicitly opt-in while retaining the native summary/tables, clear loading/failure/retry states, keyboard focus and existing widgets/layout controls. Verify the large Studio chunk is not requested before activation, then measure the same conditions and test report behavior. Adapt this runner's explicit activation measurement when that UI changes. Do not promise faster post-activation editing before measuring it.

Preserve Delivery's existing explicit Gantt activation and table bypass. Revisit supported bundle/configuration changes only after this bounded improvement; no proprietary source patches or unreviewed package changes. Actual Narrator/zoom/touch, independent usefulness, live AI/fresh webhook, AG/Elastic access, Bryntum technical-expiry/judge acquisition, publication and Render gates remain open. No paid activation, deployment, account access, external outreach or ordinary workspace/env use occurred.
