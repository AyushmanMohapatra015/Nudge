# R6 hands-on accessibility review

Prepared October 11, 2026. Owner has a Windows laptop and a touchscreen device. Device availability is not a completed test. All results below remain pending until observed.

The ongoing reminder and completion gates are in [TESTING_CHECKPOINT.md](TESTING_CHECKPOINT.md). We will use a dedicated session to work through these checks carefully.

## Start an isolated fictional session

From D:\Nudge run:

```powershell
npm.cmd run a11y:manual
```

Open http://127.0.0.1:3117 in Edge after the terminal says Ready. This helper uses a verified production build matching current app/components/lib/dependencies and a new ignored fictional database. It strips provider credentials and uses the simulated workflow; it does not open the ordinary workspace database or load its environment file. If no matching verified build exists, run `npm.cmd run postman:workflow`, then retry. Leave the terminal open during review and stop it with Ctrl+C afterwards. Each new launch starts fresh fictional records; page reload retains that session's records.

Do not use the ordinary `npm run dev` workspace for these exercises. Do not enter actual client details. The isolated UI explicitly says Simulation mode; stop if it does not. Invoice/payment actions in this session are simulated and no messages are sent. No AI/provider allowance is used.

## Windows Narrator and core journey

Use Windows+Ctrl+Enter to start/stop Narrator if its keyboard shortcut is enabled, or use Narrator in Windows Settings. Microsoft's [Narrator command reference](https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-b-narrator-keyboard-commands-and-touch-gestures) explains the commands; Caps Lock or Insert is normally the Narrator modifier. Scan mode can change how arrow/Space keys behave; note which mode you use. Use Tab/Shift+Tab for controls, Enter for buttons/links and Space for native checkboxes.

1. Tab to Skip to workspace content and activate it. Check that the main heading and current navigation view are understandable when announced.
2. My project: open Edit agreement. Check the first-field focus, every field name and Save/Cancel names. Cancel and check heading focus. Save a fictional edit and check that focus is recovered and the result is understandable without sight.
3. Approve scope, open Client view, confirm that Accept project scope is disabled until the consent checkbox is selected. Listen to its label and checked state, accept and check the result announcement/focus.
4. Owner: paste `Please add appointment booking to the website.` and Compare with agreement. In Approvals, listen to the original simulated analysis and cited clauses. Set Deliverables to propose to `Appointment booking system`, enter a rationale citing S3 and Supporting clause IDs `S3`, then Record scope decision. Check that the recorded classification is announced.
5. Enter additional price `300.00`, a fictional respectful explanation, select the reviewed-additional-work checkbox and Approve proposal. Client: read Supporting agreement clauses and verify the USD price and work are understandable before Accept work & price.
6. Owner My project: Create PayPal invoice. Payments: Approve & send invoice, then Simulate payment. Check the paid/$0 result in owner/client views. This is a simulation, not new PayPal evidence.
7. Analytics: use Skip to reports, Refresh local snapshot and Read complete snapshot as tables. Check table captions, headers, empty states and currency values. Confirm that quote values and invoice balances are distinguishable when spoken. Note any repeated/stale or missing loading/result announcement.
8. Edit report layout: Tab to a widget, Enter into content, Escape back to its container. Alt+Left can shrink a full-width widget; Shift+Right can move it into the freed space. Studio rejects overlaps and canvas-boundary movement. Check that focus and widget identity are understandable, then Finish editing layout. Native tables offer reading access, not equivalent editing controls.

Record the exact control, expected speech, actual speech and whether another action was needed. Automated accessible names and focus checks do not establish spoken quality. Known AG Studio edit-mode nested-button findings remain unresolved; do not treat them as passed.

## Actual browser zoom

Using Edge's menu zoom control, test **200% and 400%**, keeping the same laptop window size. These must be real browser zoom settings, not DevTools viewport emulation or Windows Magnifier. Restore 100% afterwards.

- Review all six owner views and the agreement editor, the client consent/quote/payment states and Analytics.
- Check labels, buttons, full explanations, error/status text and keyboard focus are readable and reachable, with no overlapping or clipped content.
- The owner/client document should reflow; horizontal scrolling within wide Analytics reports/tables is intentional. Check the containing page does not lose navigation or controls, and that report scrolling works with keyboard as well as a pointer.
- Record the browser zoom, window size and precise failing control. Viewport-width automation is separate evidence.

## Physical touchscreen

If the Windows laptop itself has touch, use this same loopback session. If the touch device is a separate phone/tablet, its `127.0.0.1` points to that device, not the laptop. Separate-device access remains pending until an explicitly reviewed fictional preview/connection is available; do not change firewall rules, bind the ordinary workspace publicly or expose a private owner token.

On an available safe fictional preview, check portrait and landscape, tap navigation and disclosures, tick consent, type/edit a quote with the software keyboard, accept once, scroll the Analytics region/table and try layout controls. Check tap targets do not trigger neighbours, controls are not hover-only, the software keyboard does not permanently hide the submit control, and scrolling does not accidentally approve work. Physical touch is separate from browser mobile emulation.

## Results record

| Check | Current result | Evidence to record |
| --- | --- | --- |
| Narrator owner/client journey | Pending | Windows/Edge versions, spoken labels/results, focus problems |
| Narrator Analytics reading/editing | Pending | Captions/headers/widget identity, exact vendor failures |
| Actual 200% zoom | Pending | Window size, views tested, clipping/focus/scroll findings |
| Actual 400% zoom | Pending | Window size, views tested, clipping/focus/scroll findings |
| Physical touch | Pending | Device/browser, safe preview used, orientation, tap/keyboard/scroll findings |

Send only fictional observations or cropped fictional screenshots. Do not include keys, account pages, private URLs or actual client information. A failed or blocked check is useful evidence: record it rather than checking it off. R6 stays open until findings are reviewed and concrete fixes or external limits are documented. Independent R7 technical review can continue while these owner-assisted results are pending, as recorded in the authoritative action plan.
