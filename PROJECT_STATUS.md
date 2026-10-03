# Nudge: current status and priority order

Reviewed October 3, 2026 against PROJECT_PLAN.md, the implementation, and https://paypalaihackathon.devpost.com/rules. This is the current summary; older milestone paragraphs in PROJECT_HANDOFF.md are historical and may describe superseded states.

## Direction

Keep the freelancer workflow: accepted agreement → clause-grounded scope comparison → human-priced proposal → client acceptance → PayPal sandbox invoice → reconciled payment. Do not return to broad autonomous payouts/forecast/MCP features before this journey works with real AI and has been observed by users.

The project is on track in direction, but not submission-ready. An earlier 50–55% estimate was an informal feature estimate, not a measured readiness score. Passing local tests does not prove live AI quality, genuine webhook delivery, customer impact, or deployment readiness.

## Evidence and gaps

| Area | Current evidence | Remaining gap |
| --- | --- | --- |
| PayPal integration | Actual sandbox buyer checkout and authoritative PAID reconciliation; owner workspace polling fallback verified | Authentic signed webhook delivery still unverified; partial/cancelled handling mainly mock-tested |
| AI | Anthropic/Astropods adapters and mocked validation; 25 labelled evaluation cases prepared | No verified live model response; Elastic not integrated; allowance/support checkpoint remains active |
| Core product | Agreement/client acceptance, human-set change prices, invoices, reminders, audit trail | Brief extraction absent; no explicit freelancer correction control for classification; proposal drafts permit pricing included/ambiguous work without a separate scope-resolution step |
| Access and recovery | Private client filtering and stale-link checks; invoice/reminder recovery safeguards; 16 automated tests and latest production build passed | No client-link expiry/revocation interface; crash can leave processing locked; rejected-create retry authorization incomplete; new recovery panels not browser-tested |
| Impact | Specific freelancer audience and a credible problem hypothesis | No recorded freelancer interviews or observed task studies; no invented savings/testimonials |
| Hosting and judging | Local persistent SQLite; public-source setup instructions prepared | No verified hosted build or clean-checkout judge run; AI allowance and access must last through judging |
| Documentation/submission | MIT/source workflow, setup docs and sponsor research | Final tools claims, video, submission copy and judge instructions not finished; distinguish implemented code from live verification |

## Next priorities

1. Validate the core workflow with at least three freelance designers. Prepare a short interview guide and anonymized recording template; the user conducts or explicitly authorizes outreach. Ask about actual incidents and existing workarounds. Record no fabricated findings.
2. Review and fix scope-decision behavior: included work must not accidentally become a paid extra; ambiguous work needs clarification or a recorded human correction before pricing. Design this alongside the prepared evaluation cases, using mocks while Elastic is on hold. Brief extraction remains a planned core feature, not completed work.
3. When Elastic support replies, verify allowance/extension and perform one small fictional test before any batch. Then integrate and evaluate real AI, and run the entire accepted-change-to-payment journey.
4. Finish essential reliability gaps in bounded tasks: crash-lock handling without blind replay, reviewed retries for rejected creation, client-link controls, and browser verification of recovery flows. Avoid an open-ended recovery-feature detour.
5. Prepare stable HTTPS hosting and persistent storage with reviewed sponsor limits. Verify genuine PayPal webhook delivery after approved setup. Local run instructions are also an allowed submission route; hosting is our preferred product experience, not a rule requiring payment.
6. Conduct task-based user testing, refine both website journeys, test a clean checkout, and finish the public video/submission. Ensure judge access through December 15, 2026, not merely the November 12 submission deadline.

## Guardrails

Elastic AI calls remain on hold pending support clarification. No paid billing, real payments, or public deployment is authorized by this status review. Local mocks and documentation can proceed. Do not expose secrets in judge instructions or public GitHub: provide controlled access or instructions for local private configuration.

Immediate next task: prepare freelancer validation materials and scope-decision acceptance criteria; do not start another retry feature automatically. User feedback and the live AI checkpoint determine the next substantial implementation work.
