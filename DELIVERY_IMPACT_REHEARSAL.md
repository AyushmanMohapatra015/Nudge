# B7a: delivery-impact rehearsal and resource observations

October 16, 2026. A reproducible fictional workflow now connects the accepted base plan, reviewed booking quote, client acceptance, explicit delivery application, simulated invoice/payment and AG Studio's stored-record analytics. This is local simulation evidence, not live AI, PayPal checkout/webhook evidence, user validation, a video rehearsal with a human presenter or deployment approval.

## Reproduce locally

After a passing `npm.cmd run postman:workflow`, take its printed disposable build directory:

```powershell
node scripts/rehearse-delivery-impact.mjs data/postman-workflow/<run-id>/app-source
```

The Windows runner verifies a passing build/workflow receipt and matching runtime source/dependencies/configuration. It starts an owned loopback production server with a fresh fictional SQLite database, filtered environment, disabled AI and a provider-fetch guard. It exercises real local API handlers, the client quote acceptance UI, owner apply/chart/original-date UI and actual AG Studio/native-table rendering. It uses the existing Edge installation and Windows Get-Process for memory observations. It does not read ordinary environment/database files, activate sponsor accounts, deploy or make PayPal/model requests. Browser external requests are blocked; only the existing Google Fonts hosts were attempted. Screenshots/video were not recorded.

Final receipt: ignored `data/delivery-rehearsal/55c9d8fa-54c8-46f2-8d5e-2d28a564a418/summary.json`. `cleanup.json` confirms the owned endpoint closed with an ECONNREFUSED probe. Build source matched `data/postman-workflow/15c5f0a4-2dc9-41dc-9bed-84c9f72ce7d6/app-source`. Node24.12.0 and Edge155.0.4283.45; no provider-fetch attempt or browser page error. TypeScript passes; unchanged application tests/build/Postman evidence remains recorded in the B6 reviews, not claimed rerun here.

## Exact fictional story and verified boundaries

| Step | Observed result |
| --- | --- |
| Accepted website agreement | USD1,200 base project, S1 website scope and S3 booking exclusion. This is accepted scope/value, not money received. |
| Original owner plan | Asia/Kolkata; Monday–Friday; explicit holiday2026-10-19. Three working days from Friday2026-10-16 have exclusive finish2026-10-22. |
| Booking request and review | Simulated additional-scope assessment; owner records S3 evidence and manually approves a separate USD300 appointment-booking quote. Neither AI nor scheduling infers the price. |
| Tentative extra preview | Three owner-estimated working days starting2026-10-22; exclusive finish2026-10-27, after Thursday/Friday/Monday. It depends on the base task. Before client acceptance, apply returns HTTP400 and financial records remain unchanged. |
| Client accepts work and price | Actual client page displays USD300 and records acceptance. The internal2026-10-27 date is absent from that client page. Acceptance does not approve a delivery deadline. |
| Conservative stale-state gate | Client acceptance makes the previous preview stale. Apply returns HTTP409. Explicit restaging is required against current records. |
| Owner applies reviewed dates | Actual Delivery UI applies revision2. Original finish stays2026-10-22; current finish is2026-10-27. The difference is **five calendar days**, while the extra estimate is **three working days**. Agreement, accepted quote, invoice records and other compared financial fields are unchanged by planning. |
| Invoice/payment simulation | Create/send/simulate-payment for that same USD300 extra. Each step preserves the entire applied plan. Final invoice status is PAID with zero outstanding cents. No base invoice is created: the USD1,200 base value is not claimed paid. |
| AG Studio and native tables | Actual Studio widgets render; native invoice table shows PAID and change table shows the USD300 approved quote. Analytics reports USD0 issued-invoice receivables and USD300 approved extra value. Those are distinct measures, not amounts to add or a claim all project revenue was received. |

Setup and some actions use APIs; client acceptance and delivery apply/read/chart plus analytics use the browser. This is not a continuous, fully UI-operated under-three-minute demonstration. Keep DEMO_STORYBOARD.md's booking-to-payment core story; scheduling remains a possible supporting insert only if later timed rehearsal shows it improves clarity without exceeding the limit. No actual client research or savings claim follows from this fictional run.

## Resource observations — not a sizing certification

All memory readings refer to the single owned Windows Next production server process, not the Edge processes, parent runner, Linux cgroup, build worker or provider inference service. These are five discrete observations; the largest sample is not the continuous peak. No load/concurrency, long-lived session, large workspace, real-provider payload, restart or out-of-memory benchmark is claimed.

| Observation | Working set MiB | Private bytes MiB |
| --- | ---: | ---: |
| Startup health and empty workspace | 95.42 | 124.84 |
| Empty owner UI loaded | 97.68 | 126.03 |
| Client booking acceptance | 113.97 | 136.17 |
| Delivery chart after apply | 124.57 | 145.62 |
| Analytics Studio/native tables | 117.79 | 138.51 |

MiB means1,048,576bytes. Private bytes and working set overlap; do not add them. The earlier exploratory successful run sampled up to126.66MiB working set, illustrating variation between runs. These observations leave the proposed512MB runtime as an **unverified candidate**. They neither approve a tier nor demonstrate how Linux, real AI requests or concurrent judges will behave. Keep the separately approved D3/D5/D6 cost/runtime gates.

Requested JS/CSS is measured by mapping unique observed static asset paths to actual built files. Gzip values are independent per-file compression estimates, not observed wire bytes. Browser routing disables HTTP cache. Images/fonts/HTML/API payloads, decompression/parse/layout time and browser heap are excluded. Shared dependencies are present in each route total; route totals must not be summed for a normal navigation session or called vendor-only sizes.

| Page state | JS/CSS raw MiB | Per-file gzip estimate MiB | Raw asset-set difference from empty workspace MiB |
| --- | ---: | ---: | ---: |
| Empty owner workspace | 0.577 | 0.164 | 0 |
| Client quote acceptance | 0.531 | 0.152 | 0.012 |
| Delivery including requested Gantt | 5.703 | 1.982 | 5.184 |
| Analytics including Studio/widgets | 5.685 | 1.581 | 5.166 |

The complete build has23JS/CSS static files totaling11.047MiB raw /3.475MiB per-file gzip estimates. This is a static-artifact inventory, not all runtime dependencies or a single user's download. Optional chart/report routes have substantial browser payload compared with the workspace. Existing lazy/explicit chart loading remains useful; F2 performance review should measure real device load/parse/interaction before introducing optimizations or changing dependencies. No dependency or app bundle was modified during this task.

At the final pre-shutdown sample, the fictional SQLite main file was4,096bytes, WAL309,032bytes and shared-memory file32,768bytes:345,896bytes combined, about0.330MiB. This tiny fixture does not size real retention/backups/logs or prove a1GiB disk sufficient. Do not copy only the main file as a backup; use the reviewed database-consistent backup process.

## Failures corrected and remaining gates

The first attempt inspected client text before its async quote loaded. The next attempt waited on an incorrect Studio CSS root selector. Correcting the client readiness wait and using the actual rendered widget selector completed the rehearsal; no application guard was relaxed. Earlier receipts remain ignored and are not passes. Exploratory pass `48c88d0a-c4f7-4074-b33c-8806d174b6d2` preceded the final client-date, per-invoice-step nonmutation and asset-accounting assertions.

B7a is complete within these boundaries. Next B7c is sponsor attribution and judge/deployment-readiness documentation, using measured limits and actual evidence; it does not authorize hosting. B7b/H consenting user validation remains owner-deferred. B6d vendor ARIA resolution, R6 Narrator/real zoom/touch, E live AI/usage and fresh-payment webhook evidence remain open, along with trial/public/judge permissions and Render quotes/card/exhaustion approval.
