# AG Grid / AG Studio: owner dashboard preparation

October 7, 2026. This owner-priority workstream supports the existing scope-change-to-payment product. It does not replace REVIEW_ACTION_PLAN.md's pending AI, fresh-webhook, human-review or judging-access checkpoints. Independent local preparation can continue while those external checkpoints are pending.

## Completed now

`lib/owner-analytics.ts` implements a pure, read-only projection of an already-loaded workspace. It is not connected to a route or UI and does not establish owner authorization. No AG package, account, licence, trial or report builder has been activated.

Output contains version, mode, timestamp, USD, minimal invoice/change rows and integer-cent totals. It excludes project/client identity, email, requests, reasoning, deliverables, agreement text, audit details, payment URLs, client tokens, remote IDs, operation keys, provider errors and policies. Row indices reference records within that exact workspace version only: future navigation must use the matching owner view. Never use an index as an action approval or payment identity.

Definitions:

- Outstanding: positive balances on UNPAID or PARTIALLY_PAID invoices. Draft, cancelled, paid and unknown-status invoices are excluded. Partial invoices contribute the outstanding balance, not face amount.
- Overdue: due date precedes the snapshot's UTC calendar date; due today is current. Buckets are current, 1–30, 31–60, 61–90 and 91+ days.
- Invalid/missing dates remain unknown and have a separate unknown-date receivable total; they are not assumed overdue.
- Approved extra value includes approved and accepted proposals; draft/declined proposals contribute zero. Awaiting acceptance includes approved proposals only. These are quote values, not payments, earned revenue or cash available. **Never add approved extra value to invoice balances:** already invoiced changes would be counted twice.
- OTHER status, PAID with a nonzero balance, and unpaid statuses with zero balance are flagged for review. The projection never rewrites statuses or reconciles with PayPal.
- Negative/fractional/unsafe money, balances above face amount, duplicate records and aggregate overflow fail with a fixed message. Missing records are not manufactured for charts.
- Timestamp records local projection time, not latest PayPal confirmation. Existing current-state approval and authentication remain mandatory for actions.

Three added tests cover partial balances, exact cents, excluded states, empty data, UTC/date boundaries, invalid dates, privacy allowlists, detached output, no mutation/network, duplicates and overflow. All 90 server tests and TypeScript pass. Routes, UI and dependencies are unchanged; previous production/browser/Postman results remain the latest evidence for those surfaces, without claiming a rerun.

## Licensing and compatibility

Official documentation checked October 7:

- [AG Grid Community versus Enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/): Community is MIT and free including production. Sorting, filtering and pagination are Community features. Enterprise production needs a licence; integrated charts and other advanced features have additional licensing requirements.
- [AG Studio Enterprise Licence](https://www.ag-grid.com/studio/react/enterprise-licence/): Studio is commercial and every deployment requires a licence. Its licence covers built-in widgets, not standalone Enterprise Grid/Charts or custom widgets using those products.
- [React Studio compatibility](https://www.ag-grid.com/studio/react/compatibility/): Studio 3.0 aligns with Grid 36.2 / Charts 14.2, supports React 17–19+, and requires TypeScript >=5.8.3. Verify exact installed versions before integration. Documented support is not verified Next.js bundling, performance or accessibility in Nudge.
- [Official hackathon AG offer](https://paypalaihackathon.devpost.com/details/aggrid): unavailable to this research tool. Historical 45-day offer, licence coverage, expiry/judging access, redistribution and bonus eligibility require official confirmation. A generic trial's terms do not establish sponsor terms.

A useful Community grid is a free fallback, not proof of AG Studio integration or sponsor bonus eligibility. Do not activate a time-limited licence merely to research it.

## Planned experience and next step

Owner questions: which issued balances are overdue, which records need status/date review, and which approved changes await client acceptance? Start with invoice status/ageing filters and record inspection. Consider Studio self-service reporting once licence coverage and usefulness are established. Current storage is one project per mode; this work does not create a multi-client portfolio.

Next: review these data definitions and select the Community/Studio licence path. When wiring it, reuse owner authentication/quotas, no-store responses and generic errors; label stale local status and filtered subset totals. Backend integer-cent totals remain authoritative. Keep analytics AI disabled until its provider/data/cost flow clears the existing usage gate.

Before claiming integration: verify real package use with fictional local data; keyboard/screen-reader operation, narrow layouts, filters, empty/error states, navigation and stale versions. Preserve the green palette and existing approval/payment flows. Library ARIA support alone is not accessibility sign-off.

Core checkpoints remain: Elastic allowance/usage and judging access; independent saved-output review and freelancer sessions; fresh payment-triggered webhook; full real-AI website journey; Render signup/credit terms and approved hosting; repository privacy and final functional demo/video. Analytics preparation closes none of these.
