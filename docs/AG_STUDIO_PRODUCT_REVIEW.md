# A4: AG Studio product review and selected improvement

October 12, 2026. Initial A4a inspection and implementation specification. A4b was subsequently implemented as recorded at the end. The initial inspection changed no application code, package, trial, licence value or account; no live AI, payment, signup or outreach occurred. Participant interviews remain pending, so this is an engineering/product hypothesis, not validated customer impact.

## Existing evidence and sponsor fit

| Sponsor emphasis | Current source and recorded evidence | Remaining boundary |
| --- | --- | --- |
| Custom widgets | `studio-pending-changes.tsx` is registered through the typed widget registry and React `createWidgets`; it shows approved changes awaiting acceptance without counting them as money received. Existing browser evidence covers actual quote values and acceptance refresh. | Only one application-specific widget; no measured user benefit yet. |
| Theming | `studio-canvas.tsx` uses the Studio theme API with Nudge's green/white palette, system font and readable foreground; custom-widget CSS follows that palette. | This inspection is not a fresh visual/contrast sign-off or authorization for a complete redesign. |
| Layout tools | Edit/view modes, widget menu, duplicate/delete, resize and keyboard movement have local browser evidence. | Edits are page-session only; navigation resets them. Mobile canvas uses internal horizontal scrolling. No persistence or full touch accessibility claim. |
| Data engine and filtering | Invoice/change sources, exact-cent display, ageing chart cross-filtering and exports have existing checks. | Invoice filters do not change workspace totals or the custom full-workspace summary. Do not imply otherwise. |
| Agent framework | Separate real framework/harness/runner and guarded bridge have scripted/offline evidence. | The visible Studio canvas registers no live AI runner. Elastic-backed dashboard transport and built-in-agent delegation remain A6–A8, not completed integration. |

The installed packages are 3.0.0. The current [React custom-widget documentation](https://www.ag-grid.com/studio/react/custom-widgets/) describes typed widget definitions, React `createWidgets`, toolbar actions and explicit sizes. The existing approach uses those extension points. The [theming guide](https://www.ag-grid.com/studio/react/theming/) supports theme parameters; the [modes/layout guide](https://www.ag-grid.com/studio/react/modes-layout/) covers the relevant report editing surface. Vendor APIs must be checked against installed types during implementation; example snippets are not copied blindly.

## Selected improvement: Invoice checks

The existing dashboard has a short status line for `statusReviewCount` and `unknownDueDateCents`, but little explanation of what those warnings mean or what to review. A custom **Invoice checks** widget will turn those existing flags into two understandable, read-only checks. This adds a Nudge-specific decision aid inside Studio rather than another revenue chart or a duplicate overdue total.

Use only the existing `OwnerAnalytics` snapshot. Status discrepancies are records already marked `needsStatusReview` (including unknown status and inconsistent settled/unpaid balances). Missing due-date checks apply only to receivable records with `ageBucket === 'unknown'`, not every draft/cancelled/paid record. Show their recorded receivable amount in exact USD cents and a count derived from those rows. Do not invent dates, classify them as overdue or infer eligibility to send a reminder.

| Check | Display | Guidance |
| --- | --- | --- |
| Status needs review | Existing flagged invoice count, with singular/plural wording. | Review the invoice in Payments and verify its status before relying on the balance or repeating an uncertain action. |
| Receivable due date unknown | Count plus existing unknown-date receivable amount. | Review the invoice due date; the snapshot cannot place these balances in an overdue-age group. Do not describe date editing as an available feature. |
| No flagged records | Explicit absence of these two recorded issues. | This is not proof that all invoices are current, paid, safe to chase or reconciled with PayPal. |

Always label the card **Complete workspace · unaffected by report filters**, include the snapshot timestamp/version and the local-record limitation. Categories are independent and must not be summed into a distinct-invoice total. The existing outstanding amount is not increased by warnings or quote values.

Keep the approved-quote widget separate. Place the new checks in their own full-width row in the initial layout, with invoice and ageing reports following below; avoid making two long cards too narrow. Reuse the green palette with a restrained warning treatment, text labels and visible focus. This task does not add animation, a theme switch, chart purchases or standalone Enterprise Grid/Charts imports.

## A4b implementation acceptance criteria

- [x] Add a separately typed `nudge-invoice-checks` custom widget through the existing registry/React widget factory, not a detached card pretending to be a Studio widget.
- [x] Provide only the existing sanitized analytics projection through context; no raw workspace, client identity, invoice/payment URL, token or AI output. No new API, database schema or provider fetch is necessary.
- [x] Display the two checks, exact-cent money, singular/plural/zero states and snapshot scope/freshness limitations. A missing context shows a load/refresh prompt rather than reassuring zero values.
- [x] No actions that sync, send, remind, price, cancel or recover. A normal link can open the workspace for review; snapshot record numbers are not backend action identifiers. An unknown status is a review prompt, not a policy engine decision.
- [x] Register in the Nudge widget menu and initial report. Add, duplicate, delete and resize through actual Studio controls; refresh updates values without resetting the current edited layout. Navigation still resets the page-session layout, and the existing caption remains truthful.
- [x] Preserve full-workspace values under invoice/chart/page filters and independent quote totals. State the scope in text. Never sum independent warning categories as distinct invoices or receivables.
- [x] Use an accessible named region, headings, text warnings and keyboard-accessible link; handle constrained widget size by internal scrolling. Check the widget at narrow viewport and within edited small sizes, along with focus/forced-colors where relevant. Native reading fallback remains available; adding a card does not fix vendor editing defects or close R6 manual checks.
- [x] Verify realistic fictional cases: empty workspace; unknown status; PAID with nonzero outstanding; UNPAID/PARTIALLY_PAID with zero balance; positive receivable with invalid due date; valid current/overdue dates; DRAFT/CANCELLED with invalid due date. Mixed cases must retain separate categories and original totals.
- [x] Verify refresh from warning to clear state and failure preservation using controlled fictional read responses, without claiming a real PayPal transition. Record browser errors, unexpected API writes/provider calls and verify original decisions/totals remain unchanged.
- [x] Run only relevant analytics/report/widget/browser checks, TypeScript and an isolated current-source production workflow when implementation changes. Keep licence values private and owned test-server cleanup verified. Update evidence, limitations, status and handoff.

## Deferred and human validation

Persisting layouts would introduce a storage/validation/privacy workstream and is not bundled here. The live analyst remains allowance-gated; UI polish does not substitute for its verification. Real interview observations must assess whether the new guidance helps an owner decide what to check, whether labels are clear, and whether the card distracts from approved-scope-to-payment. Do not invent time savings, quote participants or imply that a warning is a reminder recommendation. Revise or remove the widget if those findings do not support it.

A3/R4b licence and judging permissions remain open; no trial restart/extension is assumed. R9b publication and historical-disclosure decisions, R6 Narrator/actual zoom/physical touch and owner-deferred Elastic checks remain unchanged. Conditional Bryntum/other sponsors keep their own fit/account gates.

**October12 implementation update:** A4b is complete with bounded evidence in INVOICE_CHECKS_WIDGET_REVIEW.md. The initial inspection above remains the specification, not user validation. Next independent checkpoint is M3 sanitized Postman sharing review; A4c actual participant usefulness stays open.
