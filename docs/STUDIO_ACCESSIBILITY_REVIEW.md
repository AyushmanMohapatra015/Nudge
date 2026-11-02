# Analytics accessibility checkpoint

## R6 keyboard editing follow-up — October 11

Actual Tab traversal reaches the snapshot disclosure/table region, layout toggle and Studio widget focus sentinel. The new check verifies Alt+Left shrinks the initially full-width custom widget, Shift+Right moves it into the freed canvas space, Enter enters content, Escape returns to its container, and Finish editing/refresh/back navigation remain keyboard reachable. API write capture stays empty and the complete workspace state is unchanged. The sentinel has zero size by vendor design, so the test checks the visible associated widget's viewport bounds while asserting real focus on the sentinel. It does not programmatically focus or click these controls.

Initial movement/growth attempts hit canvas boundaries or adjacent widgets; installed v3 collision checks reject overlaps. Shrinking before moving is a valid keyboard path, not a new app restriction. All three new keyboard/focus checks pass in the final targeted run, and the two existing Analytics accessibility checks passed in the preceding broader run.

Known edit-mode nested-interactive findings remain unchanged and unresolved. Native tables provide reading access, not equivalent access to all editing/chart interactions. Real Narrator, actual browser zoom and physical touch remain pending in [ACCESSIBILITY_MANUAL_CHECKLIST.md](ACCESSIBILITY_MANUAL_CHECKLIST.md); the local fictional helper does not enable sponsor AI or use the private licence. No screen-reader or full-conformance claim follows from these automated checks.

October 8, 2026. This is a bounded automated/browser review, not a WCAG certification or a completed screen-reader study.

## Changes and evidence

- A keyboard skip link targets the report heading. The report area is focusable, labelled and described; its focus outline is visible.
- A 900px minimum canvas scrolls inside the report region rather than clipping panels or widening the page. Chromium checks at a 320px viewport prove no page overflow and keyboard horizontal scrolling. This is a scrollable desktop editor on mobile, not a redesigned touch editor.
- Native, captioned invoice and change tables expose the complete stored snapshot, with scoped column/row headers, exact-cent currency display, explicit empty states and independently focusable scrolling regions. These are unfiltered records; quote amounts are not payments.
- A polite status announces snapshot loading and successful refresh. Error recovery returns keyboard focus from the disappearing retry button to the stable refresh control.
- `axe-core` 4.14.0 is development-only. Scans cover WCAG 2 A/AA, 2.1 AA and 2.2 AA rule tags in the exercised states. View mode with the tables open reports no violations.

Two new Playwright journeys pass. The seven existing Studio journeys also pass, including layout controls, read-only behaviour, filtering and failed-refresh recovery. Production build and Postman's 31 requests/50 assertions pass against isolated fictional records. No backend code changed; the preceding 92 server-test result remains baseline evidence rather than a new run.

## Known vendor defect: not resolved

Studio 3.0.0 edit mode reports `nested-interactive` for both data-source headers: each header is a button containing an Add computed column button. A negative tab index does not remove the nested semantics. The installed panel configuration exposes panel placement but no granular option for these controls. Vendor files and DOM semantics have not been patched. Tests scan the whole document and explicitly assert the two affected controls; they do not exclude the data panel or treat this as a clean scan. Mobile edit mode has the same known finding.

The native tables provide an alternative for reading records, not an accessible substitute for every editing action. Keep this issue open for a supported vendor fix; a future dependency update should remove the exception and rerun the checks.

## Remaining manual checks

Test with actual NVDA/JAWS and VoiceOver, keyboard-only chart selection and widget movement/resizing, high zoom, real touch devices, and export contents. Automated scans cannot establish announcement quality or complete assistive-technology interoperability. The vendor's [accessibility guidance](https://www.ag-grid.com/studio/react/accessibility/) describes their support; it is not evidence of Nudge's conformance.

Verification used a disposable production copy and isolated demo database with provider credentials removed and provider fetches guarded. Temporary servers are stopped. The first sandboxed Postman runner completed all assertions but could not terminate its child; its exact owned process tree was subsequently verified and stopped with an approved Windows command. Local licence configuration, ordinary workspace records and the owner's development server were preserved. No AI calls, PayPal calls or subscription changes.

Next bounded local task: verify exported invoice/chart data, money units and filter behaviour. Live Studio Agent Framework work remains subject to the existing AI-allowance checkpoint; hosting/licence, fresh-payment webhook and user research checkpoints remain open.
