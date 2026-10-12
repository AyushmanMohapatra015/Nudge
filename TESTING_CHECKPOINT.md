# Testing checkpoint — keep open

Created October 11, 2026 at the owner's request. We will dedicate a careful session to testing, record findings and verify fixes. Automated passing results do not close hands-on checks.

## Reminder procedure

- At the start of each resumed project session, read this checkpoint alongside REVIEW_ACTION_PLAN.md.
- Include a short reminder in each completed-task update while hands-on testing remains pending: **Testing checkpoint: Narrator, real zoom and physical touch still pending; we will complete them in a dedicated session.**
- Revisit before final design sign-off, demo recording and submission. Do not mark the review complete based on device availability or automated emulation.
- This is a repository/conversation reminder, not a scheduled notification or calendar event.

## Dedicated hands-on session

October12 automated recheck: all21 relevant Edge browser checks passed together on the matching verified production source with a new fictional database. Covers keyboard journey/focus, contrast/forced-colors/reflow, recovery/link invalidation, Analytics tables/axe checks and Studio keyboard layout controls. Known vendor nested-button findings remain bounded in the tests, not fixed or waived. Actual speech, browser zoom and physical touch remain pending. Beginner Narrator setup is now in ACCESSIBILITY_MANUAL_CHECKLIST.md. Existing3117session was left untouched; tests used their own3116server.

- [ ] R6b: Windows Narrator through the owner, client and Analytics journeys; record actual announcements, labels, focus and failures.
- [ ] R6b: real Edge 200% and 400% zoom; inspect navigation, forms, consent, quote, payment status and report scrolling.
- [ ] R6c: physical touch in portrait/landscape; check taps, disclosures, consent, software keyboard and report scrolling. Separate-device access needs a reviewed fictional connection/preview first.
- [ ] Log findings with device/browser, steps, expected/actual behavior and severity; use fictional data only.
- [ ] Fix concrete Nudge defects, retest affected flows and record remaining vendor/access limitations honestly. Known Studio edit findings stay open.

Use [ACCESSIBILITY_MANUAL_CHECKLIST.md](ACCESSIBILITY_MANUAL_CHECKLIST.md) for the exact steps and `npm.cmd run a11y:manual` for a separate fictional loopback session. If its verified build is outdated, run `npm.cmd run postman:workflow` first. No real client data, payment, live AI activation or network exposure is needed for the laptop checks.

## Technical checks that remain separate

- [ ] R7b: hung/overlapping reads, remaining loading/sign-in/empty/busy/uncertain-operation states; inspect existing evidence, then add meaningful failure checks and fix observed defects.
- [ ] Recheck affected keyboard/accessibility and workflow tests after changes; avoid repeating unrelated full suites without a reason.
- [ ] Before the final submission, verify the final source setup and full demonstrated journey against the final build; document simulated, provider-verified and pending behavior separately.

Further live Elastic and fresh PayPal evidence retain their own E/P allowance and authorization gates. This checkpoint does not resume those deferred tasks or claim user research has been completed.

**Current status:** hands-on testing pending. R7a recovery evidence is documented in [CONNECTION_RECOVERY_REVIEW.md](CONNECTION_RECOVERY_REVIEW.md). Next agent task remains R7b; owner hands-on results can be reviewed whenever available. Close individual checks only with actual findings and retest evidence or a clearly documented external limitation.
