# Nudge: external review decisions

October 4, 2026. Planning update only: no application changes, provider calls, spending, deployment or new payment fixtures.

October 7 current checkpoint: live Elastic adapter and targeted development regressions are verified with the limitations in SCOPE_CHALLENGE_VERIFICATION.md. Owner requests offline work while reviewing trial usage/billing; live AI stays paused. HUMAN_SCOPE_REVIEW.md now provides a two-pass independent review packet from saved fictional analyses, with no model requests needed. Reviewer sessions and findings are pending. Historical mock-only and next-call notes below are superseded by this checkpoint; do not restart live verification before the usage gate clears.

## Product decision

Keep the approved-scope-to-payment workflow. The review identifies an important hypothesis: the difficult part may be explaining an extra to the client, rather than classifying it. Validate this with freelancers before expanding features. Our differentiation to test is clause-supported reasoning connected to human review, client approval and PayPal invoicing; do not claim novelty without comparison evidence.

Passing tests establish behavior under tested conditions, not product demand, semantic AI quality or production readiness. Completion estimates are informal and must not imply submission readiness.

## Priority order and evidence required

1. Complete AI evidence with usage control. Live adapter and known development-case evidence exist; broader semantic quality, stability, prompt injection and owner website AI remain open. First reconcile dashboard usage with recorded receipts and obtain applicable trial allowance/billing behavior; judging-period access is separate. While live AI is paused, use HUMAN_SCOPE_REVIEW.md for independent saved-output review. No further calls until the usage gate clears and a bounded request allowance is reviewed. The enable flag is not a spending cap.
2. Finish fresh payment-triggered webhook verification with stable, authorized public connectivity. Genuine signed replay and duplicate suppression are already verified; fresh checkout and owner reconciliation are verified separately. Preserve the paid fixture; do not ask for another payment or create a replacement without separate authorization.
3. Validate usefulness with freelancers. Aim for five to eight conversations, starting with three. Request anonymized past disputes, observe the workflow, and record overrides, decision time, confusing steps and existing workarounds. The user conducts outreach unless explicitly authorized otherwise. Obtain permission before transmitting any participant content to an AI provider; fictional data remains the demo default. Do not invent quotes, findings or savings.
4. Close specific release gaps after inspecting current code and tests: client-link expiry, AI data disclosure/minimization, endpoint abuse controls, sanitized logging, retention/deletion and backup/restore, persistent deployment storage, and accessibility/error states on the core journey. These are review tasks and implementation candidates, not claims that every safeguard is absent or every proposed fix is mandatory under the hackathon rules.
5. Prove the complete real-AI-to-sandbox-payment journey and prepare judging access. Complete setup instructions or a hosted build satisfy the supplied functional-demo requirement; hosting is optional. A public endpoint is needed to demonstrate genuine webhook delivery. Verify provider access through judging, repository privacy before public release, clean setup, tool attribution, and a functioning video under three minutes.

## Corrections to the external review

- Acceptance already requires POST and server-side validation; viewing a link does not accept work. Rotation and 30-day expiry now exist (see CLIENT_ACCESS.md). Legacy links without expiry require owner-confirmed replacement. Bearer links do not verify identity.
- Client acceptance is a recorded workflow decision, not a claim of legally binding electronic signature. AI-drafted scope is not legal advice; review product wording without adding a legal guarantee.
- Existing tests cover several provider failures, concurrency, stale actions, uncertain operations and payment-state checks. Inventory coverage before adding tests. Distinguish mocks from actual provider behavior.
- A replayed signed event is different evidence from a fresh payment-triggered transition. Do not merge these claims.
- Sponsor tools are optional under the supplied requirements. Consider relevant tools, verify their allowances, and claim only demonstrable use.

## AI evaluation improvements

October 5 non-model baseline completed: `npm run evaluation:baseline` measured generic lexical rules on all 25 existing fictional cases, 16/25 classification matches and 12/25 automated-check passes. BASELINE_EVALUATION.md records method, confusion matrix and exposure. This closes the simple baseline preparation/run, not the live-model comparison, semantic review or unseen evaluation. No paid/model calls occurred.

October 5: offline counts/confusion matrix/error directions are available through `npm run evaluation:summary -- <saved-results.json>` (AI_EVALUATION.md). It excludes simulation, exposes invalid/missing cases and does not authenticate live runs or held-out provenance. Reporting preparation is complete; baselines, actual model measurements and semantic human review remain pending.

Use the existing 25 scope cases and 12 brief cases as groundwork, not measured results. Separate prompt-development cases from held-out evaluation before tuning; document which cases have already influenced prompts and avoid calling them unseen. Add unseen cases when needed.

Record counts and a confusion matrix, distinguishing included-to-additional errors (client friction) from additional-to-included errors (lost revenue). Manually assess whether cited clauses support the claim, not only whether IDs exist. Record targeted clarification, injection resistance in both briefs and requests, schema failures, latency, usage and human overrides. No fabricated scores or cost estimates.

Compare with a simple non-model baseline and a plain structured LLM prompt where useful. Repeated runs can measure disagreement, but multiple baselines and three runs per case are conditional on confirmed allowance; they are not permission to spend or an immediate required batch. Inspect one-call usage first. Save sanitized outputs; evaluation must never create invoices or send reminders.

## Optional improvements after core verification

1. Editable client-facing change explanation with evidence: addresses the awkward conversation; owner reviews before sharing, and AI cannot invent price or approval.
2. Evidence panel showing the relevant clause text and an explicit insufficient-information state. Inspect existing UI before adding duplicate controls.
3. Agreement ambiguity/risk flags, such as undefined revision limits, without claiming legal assessment.
4. Execute and document the prepared read-only Postman collection.
5. Display actual evaluation results if useful to judges. Any recorded replay fallback must be explicitly labelled and cannot replace a working meaningful AI integration.

Forecasting, payouts, MCP, refunds and additional checkout APIs remain deferred. Prioritize verified usefulness and a coherent demonstration over feature count.

## Current verification baseline

October 5 broader accessibility update: contrast, labels, focus restoration and narrow-layout/error-recovery fixes now have seven dedicated checks. Full 15-browser suite passed; final editor-focus refinement passed its affected test; TypeScript and isolated build pass. Prior 66 server tests remain current for unchanged backend. ACCESSIBILITY_REVIEW.md separates browser evidence from pending actual screen-reader and real zoom/forced-colors sign-off. These improvements address the review's Design/release gaps; they do not establish user demand, live model quality or submission readiness.

October 5 AI privacy update: fixed errors added for Anthropic/Astropods transport/URL/JSON/schema failures and provider-independent brief extraction; redirects rejected, no retries added. All 64 server tests, TypeScript and isolated production build pass. AI_ERROR_PRIVACY.md distinguishes reviewed logging surfaces from pending helper, client-link path, runtime and infrastructure limits. This supersedes the test count below; live-model quality and full privacy auditing remain unproven.

October 5 update: Postman's reviewed read-only collection is now verified through Newman (three HTTP 200 responses, four assertions; POSTMAN_VERIFICATION.md). Owner session expiry and API quotas are implemented; targeted PayPal error/relay-log privacy fixes pass all 62 server tests, TypeScript and isolated production build. Existing eight browser tests remain latest for unchanged UI. These supersede the older maintenance count below; broader privacy, live AI and fresh payment-triggered webhook evidence remain outstanding.

Latest maintenance checkpoint: 55 server tests and TypeScript checks passed. Eight browser tests and the production build passed for the preceding public-request controls; the newer database tools do not change application/UI code. Local snapshot/offline recovery is tested with fictional records (DATABASE_RECOVERY.md); protected retention, off-device storage and actual recovery promotion remain separate tasks. Live Elastic use, real-model evaluation, automated website brief extraction, freelancer findings and fresh payment-triggered webhook delivery remain outstanding. The brief schema/evidence pipeline exists; its live provider and website action do not. Current local persistence and processing safeguards are for a single-host prototype, not a distributed multi-tenant service.

This plan supersedes older priority lists in PROJECT_STATUS.md and PROJECT_HANDOFF.md. Preserve historical verification records; consult their newest checkpoints for actual evidence.
