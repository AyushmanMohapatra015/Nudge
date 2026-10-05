# Core keyboard and load-recovery checkpoint

October 5, 2026. Targeted improvements responding to the external review, not a complete accessibility assessment or WCAG conformance claim.

The owner dashboard now provides a first-tab skip link to a focusable main-content landmark, bypassing repeated navigation. Keyboard-focus outlines cover links, buttons, fields and disclosure summaries. Existing reduced-motion support remains unchanged. Owner/client initial loading text uses status semantics; load failures use alert semantics and decorative loading icons are hidden from assistive technology. The client loading-error screen now offers an explicit retry button. Retrying reads the current project; it never accepts scope or makes a payment, and existing consent requirements remain intact.

Two new Edge/Playwright checks verify keyboard skip-link activation, main focus, visible navigation focus, keyboard view switching, announced client failure and keyboard retry without acceptance. The initial retry-test selector also matched Next.js's route announcer; scoping it to main content corrected the test. The two focused checks then passed; the other eight browser tests passed in the preceding full run. TypeScript and an isolated production build pass. The previous 66 server tests remain current for unchanged server code; they were not rerun for this UI-only change.

Verification used local simulation in an isolated source copy with no personal workspace, secrets, live providers or credits. The user's development server was not stopped or rebuilt.

Remaining work includes a full label/name inventory, contrast and zoom checks, mobile layouts, focus after dynamic content removal/view changes, assistive-technology testing, and the complete error-state journey. Browser role/focus assertions do not establish what every screen reader announces. Private-link expiry and network outages still remain errors after retry when their underlying cause has not changed.
