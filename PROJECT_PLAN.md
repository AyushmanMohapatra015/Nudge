# Nudge — one-month product and build plan

## Product decision

Current sequencing and accepted external-review feedback are recorded in [REVIEW_ACTION_PLAN.md](REVIEW_ACTION_PLAN.md). Its evidence requirements supersede the original calendar sequence below. The schedule is an initial plan, not a completion record. Prioritize verified live AI, payment delivery and user value before optional features.

Nudge helps freelancers get paid for everything they agreed to—and everything that changed.

Initial audience: freelance web designers and small design agencies working on fixed-price client projects. Their deliverables, revision limits, and requested additions are concrete enough to demonstrate scope comparison. This audience choice is a hypothesis to validate, not a claim of research findings.

Nudge connects the approved agreement, change requests, PayPal invoices, and payment follow-ups in one project workspace. AI drafts and explains; deterministic rules enforce boundaries; humans approve external actions.

## Primary demonstration

A designer agrees to build a five-page website for $1,200, including two revision rounds. The client approves the agreement. Later, the client requests a booking page and another revision round. Nudge highlights the relevant agreement clauses, distinguishes an addition from an ambiguous request, and drafts a change proposal. The designer explicitly sets the additional price and approves the proposal. The client accepts it. Nudge creates and sends a PayPal sandbox invoice after designer approval. A sandbox buyer pays through PayPal's invoice payment page. A verified webhook updates the workspace and prevents further reminders.

A separate overdue invoice demonstrates contextual follow-up and a recorded payment promise. Synthetic overdue records must be labeled; do not pretend a freshly issued invoice has naturally become overdue.

## MVP: must finish before adding features

1. Project workspace: client, deliverables, revision limits, exclusions, price, due dates, and immutable agreement versions.
2. Brief extraction: AI proposes structured fields from pasted notes; missing information stays missing and becomes a clarification question.
3. Client agreement approval: read-only client view with an explicit acceptance step and timestamp. Approval is workflow evidence, not a claim of legal enforceability or identity verification.
4. Scope comparison: a new request is classified as included, additional, or ambiguous, with references to the applicable agreement clauses. The freelancer can correct the classification.
5. Change proposal: editable deliverables and price, explicitly approved by the freelancer and then accepted by the client. AI cannot silently set or modify prices.
6. PayPal Invoicing: create, send, show payment link, fetch status, and reconcile payment events. Keep invoice creation and sending independently tracked so a send failure does not create a second invoice.
7. Follow-up queue: draft, approve, dismiss, and record reminders. Payment promises can pause reminders after human confirmation.
8. Policy checks and audit history: all external actions go through the same server-side checks; decisions are logged with concise rationale, actor, agreement/invoice references, and request identifiers.

## Enforced boundaries

- Always require human approval for sending invoices, reminders, cancellation, and payouts in this prototype.
- Never remind on paid or cancelled invoices; use the outstanding balance for partial payments.
- Respect a configurable cooldown and maximum reminder count, plus PayPal's reminder limits.
- Pause reminders until an approved promised-payment date has passed.
- Block reminders for protected clients; a one-click approval does not bypass a hard policy block.
- Recheck current invoice status and current policies when executing, not just when drafting.
- Approval applies to a particular draft version. Editing an approved draft invalidates that approval.
- Payouts, if built, require a configured recipient and amount, confirmed qualifying payment, and explicit approval. Received payments are not proof of available payout balance.
- Treat client text as untrusted input. It cannot change policy, recipients, prices, or permissions.
- Use deterministic integer/minor-unit calculations for money; support USD only initially.

Start with structured policy settings. Free-text policy compilation is optional and requires showing the resulting structured rules for confirmation. Do not claim arbitrary natural-language rules are reliably enforced.

## Product surfaces

- Overview: outstanding balance, overdue invoices, and actions needing review; every number opens its underlying records.
- Project workspace: Agreement, Changes, Payments, and Activity sections.
- Approval queue: proposed action, intended recipient, exact message or amount, explanation, policy results, and approval/dismiss controls.
- Client page: accepted scope, proposed changes, and the PayPal-hosted invoice payment link.
- Settings: reminder limits, cooldown, protected clients, and integration connection status.

Show useful empty states, loading states, recoverable errors, and an explicit distinction between demonstration data and connected sandbox records.

## Month schedule

### Days 1–3: validate and prove the integration

- Talk to at least three freelance designers about their most recent scope change and late-payment incident. Ask for actual steps and anonymized examples rather than whether they like the idea.
- Compare existing scope/contract, invoicing, and collections products. Document overlaps and the proposed differentiation; do not claim the product is unprecedented.
- Define the exact demo agreement and change request.
- Create and send one PayPal sandbox invoice, open its hosted payment page, pay with a separate buyer account, and retrieve the paid status.
- Confirm the real response shapes and webhook payloads before designing the persistence model.
- Make a low-fidelity flow for both freelancer and client.

Exit condition: a documented real sandbox payment and a specific problem supported by interview notes. If seller interviews show scope changes are rare, narrow or adjust the flow before spending a week building it.

### Days 4–10: build a complete thin slice

- Brief → reviewed agreement → client acceptance.
- Request → AI comparison with clause references → priced change proposal → client acceptance.
- Approved invoice → PayPal payment link → verified payment reconciliation.
- Persist state and show the activity trail.

Exit condition: the entire primary demonstration works with actual AI and PayPal sandbox, even if the interface is plain.

### Days 11–17: make the trust layer useful

- Approval queue and centralized execution gate.
- Reminder drafts, cooldown, protected clients, reminder limits, and payment-promise pause.
- Partial-payment and cancellation handling.
- Duplicate-event protection, repeated-approval protection, stale-action checks, and safe error recovery.
- A 20–30-example scope-comparison evaluation set covering included, additional, and ambiguous requests.

Exit condition: blocked actions are demonstrably blocked server-side, and paid invoices cannot be chased through a stale approval.

### Days 18–23: test and polish

- Observe at least three users completing the core tasks without coaching.
- Fix the biggest confusing steps and record task times and correction rates honestly.
- Make both sides of the project flow coherent on desktop and usable on mobile.
- Deploy a hosted build with authentication, persistent storage, controlled demo access, and clear sandbox labeling.
- Add subcontractor Payouts only if the MVP is stable and the sandbox app supports it. Show pending/unclaimed/failed separately from success.

Exit condition: a fresh user can finish the core journey and failures can be recovered without duplicate invoices or payments.

### Days 24–30: submission and buffer

- Freeze features; fix defects rather than expand scope.
- Finish public repository, license, setup guide, environment example, integration instructions, architecture diagram, and known limitations.
- Verify setup from a clean checkout.
- Record a public YouTube video under three minutes using actual running product footage.
- Finalize Devpost text, screenshots, tools explanation, and judge instructions.
- Submit at least two days before the official deadline. Keep judge access available through the judging period.

## Architecture direction

- Next.js and TypeScript for frontend and server endpoints.
- Postgres for hosted persistence, with a migration-backed schema. Choose the local persistence approach during the integration spike; avoid divergent application behavior between local and hosted modes.
- A server-only AI adapter for structured brief extraction, clause-linked scope comparison, and reminder drafting. Provider choice is interchangeable; use a supported current model and validate every response.
- A server-only PayPal sandbox adapter with OAuth token caching, operation-specific idempotency/recovery, and webhook signature verification.
- A centralized action executor shared by every UI endpoint and any future MCP tools.
- Polling initially for status updates; add SSE only if it meaningfully improves the experience.
- Hosted sandbox mutation access restricted to authorized testers. Public visitors may use an isolated, clearly labeled simulation; arbitrary visitors must not be able to send invoices to arbitrary addresses.

Core records: clients, projects, agreement_versions, client_acceptances, change_requests, change_proposals, invoices, action_drafts, action_executions, policies, payment_promises, webhook_events, and audit_entries. Payout records are conditional on building that feature.

## Verification priorities

- Scope classification: compare model results with labeled examples; check clause references and refusal to invent missing terms.
- Payment state: actual sandbox payment, partial payment where supported, cancellation, duplicate event, and delayed/out-of-order event reconciliation.
- Action gate: paid invoice with stale reminder, changed policy after drafting, changed content after approval, simultaneous repeated approval, and malicious client text.
- Access: client links expose only their project; expired/revoked links and unauthorized mutation attempts are rejected.
- Financial correctness: minor-unit totals, accepted proposal amounts, and invoice amounts remain consistent.
- Recovery: ambiguous network failures do not cause blind repeat sends or duplicate invoices. Document operations whose remote idempotency guarantees differ.

## Evidence for judging

- Technology: a traceable agreement → accepted change → PayPal invoice → verified paid state, plus tested action gating.
- Design: complete freelancer and client journeys, including correction, rejection, and error states.
- Impact: anonymized interview findings and observed user-task results. No invented savings or testimonials.
- Innovation: clause-linked changes connected to payment and relationship-aware collections. Describe differences from researched alternatives precisely.
- Presentation: show one concrete project, one scope change, one payment, and one blocked or paused reminder.

## Video outline: target 2 minutes 40 seconds

- 0:00–0:20: the freelancer, the agreed project, and the unpaid-extra-work problem.
- 0:20–0:45: approved scope and the client's new request.
- 0:45–1:15: clause-linked comparison, freelancer review, and client acceptance.
- 1:15–1:55: actual PayPal sandbox invoice payment and reconciled status.
- 1:55–2:20: approved payment promise or blocked stale reminder; show enforced control.
- 2:20–2:40: measured user evidence, product value, and where judges can try it.

## Cost and access

PayPal sandbox uses no real money. Spending is optional for the initial prototype. AI API calls, persistent hosting, and a database may incur costs depending on provider plans and sponsor credits; verify current prices before purchase. Set a small spend cap and request confirmation before any paid service or subscription. A custom domain is optional. Do not put provider secrets into GitHub or the client bundle.

Needed for the live integration: a PayPal sandbox REST app, separate business and buyer sandbox accounts, merchant email, a webhook registration once an HTTPS endpoint exists, and an AI provider key. Store credentials locally in an ignored environment file; do not paste secrets into chat.

## Deliberately deferred

MCP server, autonomous payouts, cash-flow prediction, dispute adjudication, refunds driven by AI, multi-currency accounting, escrow, Gmail ingestion, arbitrary natural-language policy compilation, and a second Orders checkout for invoices. Reconsider only after the full MVP passes user and integration testing.

## Reference documentation

- Hackathon rules: https://paypalaihackathon.devpost.com/rules
- PayPal Invoicing overview: https://developer.paypal.com/api/invoicing/
- Invoicing API: https://developer.paypal.com/api/invoicing/v2/
- Invoice payment pages: https://developer.paypal.com/invoicing/core-concepts/
- Invoice webhooks: https://developer.paypal.com/api/invoicing/webhooks/
- Webhook verification: https://developer.paypal.com/api/rest/webhooks/rest/
- Payout idempotency and statuses: https://developer.paypal.com/docs/payouts/standard/integrate-api/customize/

Recheck current documentation during implementation; an initial plan is not an integration test.
