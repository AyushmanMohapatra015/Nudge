# AG Grid / AG Studio: owner dashboard preparation

October7 implementation follow-up: AG_STUDIO_INTEGRATION.md records actual pinned Studio3.0/React integration, protected /analytics page, read-only local snapshots, integer-cent grid/full-workspace totals and a USD display-only ageing chart. View/edit controls and two focused browser checks pass; no custom widget, proven cross-filter workflow or Studio agent yet. All92 server tests/typecheck/final isolated build/Postman31/50 pass. Owner received45-day licence but exact expiry/key configuration/validation still pending. Current implementation supersedes prepared-only notes below; keep remaining targets and core checkpoints.

October 7, 2026. This owner-priority workstream supports the existing scope-change-to-payment product. It does not replace REVIEW_ACTION_PLAN.md's pending AI, fresh-webhook, human-review or judging-access checkpoints. Independent local preparation can continue while those external checkpoints are pending.

Follow-up: the official sponsor offer is now verified and AG_SPONSOR_SETUP.md gives the manual 45-day trial steps. Studio is the intended licensed path; Community is the free fallback. GET /api/analytics now wraps the projection with existing owner authentication/shared quotas, no-store, local-state labelling and sanitized failures. It reads only the selected mode's existing record and never reconciles or seeds a workspace. All91 server tests/typecheck and isolated build pass; Postman31 requests/50 assertions pass. No AG package/trial/licence activation; participant-specific licence and judging coverage remain pending. Earlier prepared-only/unavailable-page notes below describe the preceding checkpoint.

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

### Owner-requested sponsor guidance: implementation targets

The supplied sponsor brief is the design target for this workstream. Build embedded AG Studio reporting with a clear Nudge identity; Community Grid remains a fallback, not the intended award-focused experience. This is a plan, not completed integration.

| Sponsor direction | Nudge implementation target | Required demonstration |
| --- | --- | --- |
| Embedded dashboards, grids and charts | One owner Studio page using the authenticated local analytics snapshot, with invoice details, ageing and approved-change views | Real package/API use; totals match the backend and simulated versus sandbox mode is visible |
| Self-service layouts and cross-filtering | Owner can add/rearrange widgets and filter issued balances by status/age | A filter changes relevant widgets coherently; subset totals labelled; no change to stored invoices or approvals |
| Custom widgets | Nudge-specific widget for approved changes awaiting acceptance, with value/count and reviewed navigation into the existing Changes view | Defined through Studio's custom-widget API; empty state, stale-version protection and keyboard navigation verified |
| Theming and polish | Preserve green palette, apply Studio theme, readable financial labels, intentional spacing and a usable narrow-screen view | Inspect normal/forced-colors/mobile views; retain the existing workflow and visible focus |
| Studio Agent Framework | A custom Nudge analytics agent delegates report/query work to Studio's built-in agents or a reviewed harness | One actual bounded request such as “Show overdue invoices by age” queries this dataset or builds a working report; record provider/usage and distinguish mocks |

Official implementation references: [Quick Start](https://www.ag-grid.com/studio/react/quick-start/), [Custom Widgets](https://www.ag-grid.com/studio/react/custom-widgets/), [Agent Overview](https://www.ag-grid.com/studio/react/ai-agents/), and [Agent Framework introduction](https://www.ag-grid.com/blog/introducing-the-ag-studio-agent-framework/). Custom widgets can use application-defined React components; the agent framework supports application agent configuration. Choose exact APIs after reviewing the installed version; do not treat pseudocode or an uninstalled framework as evidence.

Agent guardrails are tool permissions and enforced server checks, not instructions alone: dashboard tools may inspect the minimal snapshot and change report configuration, but never approve scope, alter monetary records, send invoices/reminders or execute payments. Analytics receives no private agreement/request/identity fields. Keep financial totals exact and supplied by the backend; model prose must not replace them. Live agent work remains pending allowance/data-flow review; no model calls are authorised by this design update. Do not claim existing Elastic scope-agent access automatically supports Studio's harness.

The sample sponsor projects are inspiration, not required features. Keep our differentiator: clause-grounded, human-reviewed scope changes linked to client acceptance and PayPal. A “friendly scoreboard” can improve presentation without adding fabricated clients, revenue or a second reminder engine. AG Studio reporting supports this journey rather than replacing it with a generic dashboard.

Build sequence: confirm trial/licence terms; install and prove a minimal Studio component with real local data; add custom widget/theme/layout/filter behavior; verify accessibility/navigation; then implement and measure the bounded Studio agent only after usage approval. Document actual versus planned sponsor use and keep core review-plan checkpoints open throughout.

Owner questions: which issued balances are overdue, which records need status/date review, and which approved changes await client acceptance? Start with invoice status/ageing filters and record inspection. Consider Studio self-service reporting once licence coverage and usefulness are established. Current storage is one project per mode; this work does not create a multi-client portfolio.

Next: review these data definitions and select the Community/Studio licence path. When wiring it, reuse owner authentication/quotas, no-store responses and generic errors; label stale local status and filtered subset totals. Backend integer-cent totals remain authoritative. Keep analytics AI disabled until its provider/data/cost flow clears the existing usage gate.

Before claiming integration: verify real package use with fictional local data; keyboard/screen-reader operation, narrow layouts, filters, empty/error states, navigation and stale versions. Preserve the green palette and existing approval/payment flows. Library ARIA support alone is not accessibility sign-off.

Core checkpoints remain: Elastic allowance/usage and judging access; independent saved-output review and freelancer sessions; fresh payment-triggered webhook; full real-AI website journey; Render signup/credit terms and approved hosting; repository privacy and final functional demo/video. Analytics preparation closes none of these.
