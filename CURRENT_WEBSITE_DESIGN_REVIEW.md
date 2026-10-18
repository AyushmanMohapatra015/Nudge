# Current website review — retain the design

October 18, 2026. F2t reviews the actual current website, not either Antigravity mockup. The owner prefers the current design and wants changes only where justified. No application code, configuration, dependency, environment, normal database, sponsor account or original design artifact was changed in this task.

## Recommendation

Keep the current palette, owner shell, project cards, evidence flow and standalone client page. The visual identity is coherent and already communicates a calm freelancer workspace. The inspected client quote presents scope, explanation, exact price and acceptance separately from payment. A wholesale redesign or automatic adoption of the revised mockup is not justified by this review.

The owner approval form is long, especially on a phone, and its native classification select looks less styled than nearby controls. Those are potential polish/usability topics, not proof of broken functionality or a reason to move all controls. Defer speculative restructuring until observing actual users or a concrete task failure. Source review cannot establish product demand.

## Two confirmed issues to fix next

| Issue | Actual evidence | Small correction |
| --- | --- | --- |
| Compact owner Analytics/Delivery links lack accessible names | At 320/390 pixels the sidebar hides each link's span; the decorative icon has no name and neither link has aria-label. axe reports link-name. At 820/1440 the text is visible. The six other owner navigation buttons already have explicit aria-label values. | Add descriptive names to the two existing links in components/workspace.tsx, preserving href, icon and visible label. Verify computed names and keyboard navigation at narrow widths. |
| Client view button becomes unreadable on hover | The .btn.dark link uses white text on #2d4736 normally and with keyboard focus. Generic .btn:hover:not(:disabled) wins for background and changes it to #f2f5eb, leaving white text. Explicit hover reproduced at all four widths; axe reports about 1.1:1 contrast. | Add a properly scoped dark-button hover style in app/globals.css that retains readable text/background and existing focus. Check normal, hover and keyboard-focus states, plus other button variants for regression. |

These belong to the actual app and are distinct from prior mockup-only overflow, pricing and client-shell defects. Repeated occurrences across views are the same two underlying issues, not dozens of separate bugs. The sidebar names matter to assistive technology; the hover issue is not limited to mobile. Styling should preserve reduced motion and focus visibility. Native control size observations alone were not treated as WCAG failures because spacing/exceptions and effective targets require assessment.

## What was inspected

Used the existing verified disposable production build at `data/postman-workflow/dd6ce3ba-9c30-4a67-88b4-ff3e1a084eb2/app-source`, after comparing all 61 app/components/lib runtime files and relevant config/dependency files with the working tree. The successful build/restart/no-provider receipt was checked. No redundant rebuild, installation, full application suite or Postman execution was needed for unchanged app source.

Started a separate loopback server with a new ignored SQLite fixture, filtered environment, demo mode, AI disabled and the existing provider-fetch guard. Local fixture setup accepted fictional scope, generated a simulated booking request and later created a reviewed USD 300 proposal for client inspection. Those setup writes affected only this new disposable database; no invoice was created, message sent or payment made.

Fresh headless Edge context; no account profile, service workers or downloads. Browser requests to external origins were intercepted; the only attempted external host was fonts.googleapis.com and its response was replaced locally with empty CSS. **Typography/screenshots therefore use fallback fonts** and do not establish the remotely loaded font appearance. No font/CDN request left the routed browser. The Node guard covers provider fetch, not an OS-level network sandbox.

- **36 baseline page/viewport observations:** six owner views (Overview, Approvals, My project, Payments, Activity, Agent rules), plus approved Client page and native Analytics/Delivery views, each at actual 320/390/820/1440 CSS pixels.
- All 36 document widths equalled viewport width. This is bounded reflow evidence, not real browser-zoom or all-data-state coverage.
- Baseline axe selected WCAG2A/AA, 2.1AA and 2.2AA tags found the unnamed compact links in all six owner views at 320/390, and one low-contrast hover occurrence. Wider baseline owner and inspected client/native-report states had no violations in those tags. Do not call the entire review a clean accessibility pass.
- **Four focused explicit-hover observations** reproduced the dark-link contrast issue at every width and confirmed the compact-link naming cause independently of visual judgment.
- Visually inspected desktop Overview/Client and mobile Approvals/Overview screenshots. The long owner review form was assessed as a possible usability question, not an implemented redesign requirement.
- Full stored fixture state was unchanged across owner inspection; after the separate approved-quote setup it remained unchanged across client/report inspection. Zero browser mutation requests, page errors or provider-fetch attempts were observed. This task did not accept the client quote or simulate payment.
- Neither AG Studio nor Bryntum Gantt was activated. The native Delivery view had no schedule populated. Their vendor/runtime/manual findings remain separate and open.

## Receipts and cleanup

Broad review: `data/postman-workflow/current-design-ed97125b-8d63-4bf2-aa11-f12d4dcee775/review.json` and 36 screenshots. Its capture completed, but the restricted Windows process cleanup failed (taskkill exit 1), so the command exited 1 and the original receipt correctly retains serverClosed=false. Approved follow-up identified the exact review parent and Next child, stopped only that child tree, then independently confirmed port 62042 returns ECONNREFUSED. See the separate `cleanup-followup.json`. The owner development server was not reused or stopped.

Focused review: `data/postman-workflow/current-design-62ef3864-28a8-4b57-9fc5-a0079279dcef/review.json`. Approved execution with required Windows cleanup permissions exits 0; browser and owned server both closed. Four explicit-hover screenshots retain the defects; success means the diagnostic completed and reproduced them, not that the UI is defect-free.

An initial helper invocation stopped before server launch because the reused isolation helper requires output under data/postman-workflow. Corrected the ignored helper's output location and reran without weakening that guard. Initial empty data/current-website-review directory is harmless; no deletion was necessary.

Ignored helpers: `data/review-current-website.mjs`, `data/confirm-current-review-cleanup.mjs`. Raw screenshots/receipts are local and excluded from the documentation commit. No private environment or ordinary DB was read. This is not comprehensive security, source-history, manual accessibility, live provider, sponsor permission or judging clearance.

## Plan continuation

F2t is complete within the limits above. **Next F2s-a: fix only the two confirmed compact-link naming / dark-hover defects**, then use the relevant installed Next guides and meaningful targeted checks against the actual rebuilt application. No new routes, handlers, schema, dependencies, product features, sponsor activation or live usage is required. This replaces the earlier proposal-card layout-first recommendation.

The broader optional F2s composition work remains conditional. Keep the alternative mockup as reference, not an implementation mandate. Narrator, actual 200/400% zoom, physical touch, human usefulness, sponsor/judging access, fresh-payment webhook and owner-paused live AI checks remain open at their existing checkpoints.
