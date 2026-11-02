# B6b: actual delivery and Gantt accessibility review

October16 B6c follow-up: the two findings now reproduce independently in plain JavaScript Gantt7.3.7, with one fictional task in both readonly/editable modes. [BRYNTUM_ARIA_REPRODUCTION.md](BRYNTUM_ARIA_REPRODUCTION.md) records existing open issue12114, related support guidance, original local fixture and an unsent follow-up draft. No supported correction is established; B6d retains the vendor follow-up and R6 actual speech remains pending. The initial integration-only qualification below is historical; no ARIA clearance is claimed.

October 16, 2026. Automated browser review covers the real Bryntum 7.3.7 component and Nudge's delivery controls with fictional local snapshots. This is a review with an unresolved vendor finding, not an accessibility certification or completed manual sign-off.

## Findings and changes

- Opening the owner editor removed its initiating button without moving focus to the new content. Its heading now receives focus when the editor mounts. Cancel and saved-action notices retain the existing focus-recovery behavior. Keyboard observations are browser evidence, not Narrator speech.
- The chart's split grid emits two `aria-required-children` axe findings: `.b-grid-panel-body` and the generated normal-subgrid element. These are vendor-rendered structures. No supported configuration correction has been established in this bounded review; no vendor source or ARIA roles were patched and the axe rule remains enabled. Regression checks record the exact finding, reject additional rule/target findings and attach fictional DOM diagnostics. A passing regression with an expected finding does not mean the chart passes that accessibility rule.
- A visible explanation and keyboard-activatable **Skip timeline to date table** link now bypass the visual chart. The native table already includes every saved task/date/estimate; a native list now spells out the actual finish-to-start dependency relationships rather than offering only a count. This improves reading access without claiming equal access to every vendor interaction or correct screen-reader speech.
- Existing reduced-motion CSS disables chart animations/transitions. The review checks computed styles under reduced-motion emulation, a 320-CSS-pixel document width, native table keyboard scroll and keyboard exit from the vendor region. This is separate from actual browser zoom and physical touch.
- A failed lazy chart download leaves React's failed module result cached; hiding/showing cannot reliably retry it. The error message now offers **Reload page to retry timeline**. The native table remains available throughout. The recovery check removes the simulated network failure, activates that link by keyboard, then opens the chart in the new page. No plan command is retried or written by recovery.

## Verification checkpoint

All 170 offline outcomes and TypeScript pass. The final disposable production build and Postman31requests/50assertions/restart pass, with no provider-fetch attempt: ignored `data/postman-workflow/15c5f0a4-2dc9-41dc-9bed-84c9f72ce7d6/summary.json`.

All eleven targeted Edge regressions pass together in the final source-matched build run: `data/delivery-browser/449ffa37-8456-4c07-bffb-411ebe9f8f8e/results.json`. This includes keyboard activation of save, confirmation/apply and discard in actual-command journeys, keyboard estimate editing, first-Tab editor focus, native bypass/dependency reading, reduced-motion computed styles, narrow reflow, interrupted download plus explicit reload recovery and the existing core/auth/failure checks. Focus setup in some steps is programmatic; this is not a claim that every control's Tab order or full keyboard-only user journey has been audited.

The chart test attaches its two known ARIA findings and rejects additional scoped findings; eleven passing regression tests do not mean zero accessibility violations. The runner also requires zero skipped/flaky/unexpected outcomes and no provider-fetch attempt, and its `cleanup.json` confirms ECONNREFUSED on both test ports3118/3119. The ordinary development server is untouched. The earlier successful run `6ef413a4-d607-4a7e-a30e-2476c010e83e` preceded the additional actual-command keyboard assertions.

The initial eleven-scenario run passed the existing nine checks and exposed the editor focus loss and the two vendor ARIA findings. Its ignored receipt is `data/delivery-browser/ece3f98b-52b8-4237-b712-347c9e99380c/results.json`; this is not a clean accessibility pass.

The next run passed ten scenarios, including the expanded chart review with explicitly recorded vendor findings, but failed the attempted hide/show retry after an interrupted download. Receipt `5d429883-dab0-429a-9ede-3af19757fe00` retains that failure. The explicit reload control addresses the observed failure and passes in the final runs; the failed run is not counted as passed.

The chart is optional and read-only; review does not grant it financial or scheduling mutation authority. Fictional snapshots are used for the dedicated accessibility scenarios, while the existing planning journeys still exercise actual local commands. No ordinary workspace, live AI, payment or public tunnel is used.

## Follow-up

ACCESSIBILITY_MANUAL_CHECKLIST.md now includes Delivery-specific Narrator, real 200/400% zoom and physical-touch steps. Those remain owner-deferred. B6b's automated review can finish while the vendor finding and R6 manual outcomes stay explicitly open; do not describe the whole Gantt as cleared.

Next B6c is a minimized local reproduction and supported-fix investigation, or preparation of a report for owner review. Sending/publishing a report is a separate action. This review alone does not establish upstream novelty, a confirmed Bryntum defect or permission to publish proprietary package code. Human usefulness validation and sponsor hosted/public/judging permissions remain separate gates.
