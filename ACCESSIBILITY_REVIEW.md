# Core keyboard and load-recovery checkpoint

## Combined automated recheck — October 12

At the owner's request, all21 relevant browser checks passed together in one isolated Edge run: nine core accessibility checks, two Analytics accessibility checks, one client-link check, six connection-recovery checks and three keyboard-journey/focus checks. Current application source, assets/config and lockfile match the previously verified production copy; a fresh fictional database was used. This run does not repeat the prior production build, TypeScript or Postman evidence or imply another fresh install.

The checks cover named controls, solid-background text contrast, forced-colors/reduced-motion emulation, owner/client320/640CSS-pixel reflow, keyboard financial simulation, error recovery, link rotation, complete snapshot tables and keyboard Studio layout changes. The Analytics edit-mode scan still expects the two known nested-interactive vendor findings; it is not a clean edit-mode audit. Actual Narrator speech, browser200/400% zoom and physical touch remain pending. Updated the manual with beginner setup, reading/navigation commands and a reporting procedure verified against Microsoft guidance.

The review's3116server stopped after testing. A3117server was already running, so its session was not inspected, reused or stopped; a second manual-launch attempt returned address-in-use. Tests used a separate fictional database and filtered provider-disabled environment. No ordinary workspace, real AI/payment operation, private licence or firewall setting was used or changed.

## R6 owner focus and keyboard journey — October 11

Found and fixed a remaining owner focus race: an animation-frame check could run before React removed the successful agreement editor/action. Recovery now runs after committed state changes and focuses the heading only if the initiating control disappeared and focus has not moved to another connected control. Cancellation uses the same recovery path; routine polling creates no recovery request. A held-response regression verifies that tabbing to another connected button during save preserves that new focus.

The rebuilt isolated production app passed Postman 31 requests/50 assertions and a real process restart with persisted state, with no provider-fetch attempt. The broader browser run passed all 11 existing core/Analytics accessibility checks and the two new core keyboard/focus checks; its remaining Studio movement test initially attempted occupied/boundary space. Correcting that test to shrink then move into the free space produced a passing targeted run of all three new checks. Thus all 14 distinct relevant checks have passing evidence, across the broader run and final targeted run, not one final all-green combined run. The journey uses actual Tab/Enter/Space/type keys for agreement approval, client consent, scope review, quote approval, invoice send and simulated payment. Fixture setup and final verification use local APIs; no real checkout or AI is involved.

Initial new-test errors also targeted a textarea by label instead of its accessible textbox name and assumed a visible Studio focus sentinel. Those tests were corrected without weakening the keyboard traversal or financial nonmutation assertions. Backend code did not change; the prior 129 offline-test result remains baseline evidence.

The owner has Windows and a touchscreen device. Actual Narrator speech, real 200%/400% zoom and physical touch are **pending**, as are known vendor findings. [ACCESSIBILITY_MANUAL_CHECKLIST.md](ACCESSIBILITY_MANUAL_CHECKLIST.md) provides exact exercises. `npm run a11y:manual` starts a separate loopback fictional session from a matching verified build; start/read/stop were checked and AI/providers were disconnected. It does not load the ordinary env/database or expose a phone-accessible server. R6 remains open; this is not a WCAG certification.

## Client explanation follow-up — October 7

Added two checks for the new quote explanation in ordinary and explicitly verified forced-colors modes, with reduced motion. They exercise the named editor, short-message feedback, confirmation clearing after edits, keyboard approval, native disclosure controls via Tab/Enter/Space, owner/client reflow at 320 and 640 CSS pixels, keyboard client acceptance, retained message/price and no invoice creation. An intentionally long unbroken fictional string tests wrapping. Both 320-pixel client screenshots were inspected: message and clause content remain inside their cards, with visible disclosure focus in both modes.

The review found intermittent lost focus after accepting a quote. The earlier single animation-frame check could run before React removed the action button. Client focus recovery now runs in an effect after the state update commits; it returns focus to the project's main heading only when the initiating control disappeared and focus has not moved to another connected element. Routine polling does not create a new pending focus request. The first test also initially targeted the section heading rather than the intended main heading; corrected that selector before diagnosing the intermittent behavior.

All **14 relevant browser checks passed** on the corrected isolated production build: nine existing accessibility checks, two explanation checks and three core workflow checks. TypeScript and production build pass. Postman sponsor regression also passed again: 31 requests/50 assertions. No provider-fetch attempt occurred. The temporary local server stopped; ordinary database, environment and dev cache were preserved. Backend code is unchanged in this task, so the prior 82-server-test result remains current without a redundant rerun.

These are automated Edge checks and screenshot inspection, not a hands-on screen-reader session, real browser zoom or full WCAG conformance claim. The wider manual checkpoints below remain open. No live AI, PayPal request, credit usage or billing change occurred.

## High-contrast checkpoint

October 5: one additional Edge/Playwright check passed in explicitly verified forced-colors mode for the owner and client documents. Keyboard skip navigation, editor field names/focus, narrow owner reflow, client consent gating and unchanged approved agreement were verified. Consent was toggled but not accepted; no invoice or payment resulted. Screenshots of the fictional owner editor and client scope were inspected, showing system-colored text, field/card boundaries and visible focus. Emulation was explicitly reapplied after client navigation to ensure its screenshot represented forced colors.

No application code needed changing. TypeScript passes; prior 70 server tests and production build remain current for unchanged application code. The focused new browser test was run, not a new full-suite run. No real credentials/workspace, provider calls, configuration changes or credits used. Real Windows contrast themes, actual browser zoom, other browsers and hands-on screen-reader sign-off remain pending; emulation is not a complete accessibility audit.

## Agreement-save recovery follow-up

October 5: fixed the editor closing immediately on Save, before the server response. The editor now closes only on a confirmed successful workspace response. Validation rejection or connection failure leaves title, client name/email, price and clauses in the open form. Fields, cancel and save are disabled during the request, with a submission guard. Existing alert and heading-focus behavior remain in use; no automatic retry, approval or provider action was added.

One additional browser check holds a mocked response to verify pending-state controls, rejects it, then aborts a second request and verifies every field plus unchanged persisted agreement. An explicit successful retry saves the exact cents as a draft, closes the editor and restores heading focus; no invoice is created. The test initially used an unsuitable textarea label selector, corrected to its accessible textbox name. The corrected focused test passed; all 15 existing checks passed in the preceding full run. Final isolated production build and TypeScript pass. Backend unchanged; previous 66 server tests remain current. No live providers, credits, actual workspace/configuration access or development-server changes.

Edits are retained only while the editor remains mounted in this browser session; page reload, navigation away, cancellation or session expiry can still discard unsaved edits. This is not autosave, conflict resolution or proof of recovery after a lost successful server response. Manual screen-reader/real-zoom sign-off below remains pending.

## Broader review completed October 5

Preserved the green palette while darkening pale supporting text and the shared muted-text token. The logo retains white lettering on dark green. Added a label to the reminder message, improved field/textarea text size, allowed long text and button labels to wrap, tightened narrow-layout reflow, and enlarged icon/dismiss targets. Owner view switching focuses the new page heading. Opening the agreement editor focuses its first field; cancelling restores heading focus. When an initiating action control disappears, owner/client focus returns to the heading without moving focus during routine polling. Client actions also ignore a repeated click while busy.

Seven browser checks now cover rendered-text contrast, skip navigation/view focus, six owner views and editor fields at 320/640 CSS pixels, reminder naming/focus recovery, client keyboard acceptance/reflow, invalid-link alerts, failed owner approval without state changes and read-only client retry. Native labels or explicit accessible labels were checked for fields rendered in the six owner views; existing workflow tests cover reviewed scope, quotes and brief forms. Tests exercise local simulation, not real AI or payments.

The full 15-test Edge/Playwright suite passed. A subsequent editor-focus improvement passed the affected reflow/focus test; final production build and TypeScript pass. Previous 66 server tests remain current for unchanged backend code. Owner/client mobile screenshots were inspected locally and remain under ignored verification output. Existing dev server and actual workspace were untouched.

### Limits of the evidence

The custom contrast test checks direct, visible rendered text against solid ancestor backgrounds with a 4.5:1 threshold across six initial owner views and the client scope page. It excludes disabled controls and SVGs; it does not assess all generated states, images, opacity compositing, placeholders, borders, focus-indicator contrast or every browser/font combination. It is not a complete WCAG audit or an independent accessibility scanner.

The 640-pixel check represents available layout width similar to a 1280-pixel window at 200% zoom; it is not an actual browser-zoom operation. The 320-pixel checks verify horizontal document reflow, not every clipping or text-resize scenario. Reduced-motion preference is exercised, with existing CSS suppressing animation/transition; no vestibular-user study occurred.

Browser accessible names, alert/status roles and focus were checked, but NVDA/Narrator/VoiceOver was not operated. Do not claim a completed screen-reader audit. Remaining manual sign-off:

1. In a local simulation, use Windows Narrator or an existing screen reader to traverse headings, project fields, consent, prices and action states; confirm decorative icons do not create confusing announcements.
2. Confirm scope acceptance, action failures and client-load recovery are understandable when navigating without sight. Check login and busy/uncertain-operation states too.
3. Set real browser zoom to 200% and 400%; inspect all views, expanded brief forms, approval cards and client prices for clipping, overlapping controls and retained keyboard access.
4. Check text-only enlargement, high-contrast/forced-colors mode and another browser when available. Record actual findings before claiming completion.

These are remaining manual verification checkpoints, not permission to spend, install software or submit real participant data. Full assistive-technology conformance remains unclaimed.

## Earlier targeted checkpoint

October 5, 2026. Targeted improvements responding to the external review, not a complete accessibility assessment or WCAG conformance claim.

The owner dashboard now provides a first-tab skip link to a focusable main-content landmark, bypassing repeated navigation. Keyboard-focus outlines cover links, buttons, fields and disclosure summaries. Existing reduced-motion support remains unchanged. Owner/client initial loading text uses status semantics; load failures use alert semantics and decorative loading icons are hidden from assistive technology. The client loading-error screen now offers an explicit retry button. Retrying reads the current project; it never accepts scope or makes a payment, and existing consent requirements remain intact.

Two new Edge/Playwright checks verify keyboard skip-link activation, main focus, visible navigation focus, keyboard view switching, announced client failure and keyboard retry without acceptance. The initial retry-test selector also matched Next.js's route announcer; scoping it to main content corrected the test. The two focused checks then passed; the other eight browser tests passed in the preceding full run. TypeScript and an isolated production build pass. The previous 66 server tests remain current for unchanged server code; they were not rerun for this UI-only change.

Verification used local simulation in an isolated source copy with no personal workspace, secrets, live providers or credits. The user's development server was not stopped or rebuilt.

Remaining work includes a full label/name inventory, contrast and zoom checks, mobile layouts, focus after dynamic content removal/view changes, assistive-technology testing, and the complete error-state journey. Browser role/focus assertions do not establish what every screen reader announces. Private-link expiry and network outages still remain errors after retry when their underlying cause has not changed.
