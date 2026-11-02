# F2r-b: focused frontend candidate revision

Prepared October 17, 2026 from the saved candidate and FRONTEND_DESIGN_REVIEW.md. This is a revision request, not a revised mockup, application implementation or test result. F2r-b remains open until revised artifacts are inspected and a small implementation slice is selected.

Use this in the existing Antigravity review chat. No additional access to the working repository, accounts or credentials is needed. The owner can paste the prompt; it incorporates the essential review findings without requiring the other agent to read D:\Nudge. Preserve the originals before any revision using the already retained local copies described in FRONTEND_DESIGN_REVIEW.md. Do not copy the entire review folder back into Nudge.

```text
Revise the existing design candidate in D:\Nudge-Antigravity-Review.
This is a focused second design pass, not a new product or an implementation.

You may update only:
  FRONTEND_DESIGN_BRIEF.md
  FRONTEND_MOCKUP.html
Preserve useful existing content and every other file. Do not modify source,
configuration, dependencies, manifests or REVIEW_FINDINGS.md. Do not access
D:\Nudge, credentials, databases, accounts or external services. No package
installation, terminal execution, remote assets, publication or deployment.
These instructions scope the task; they do not replace configured permissions.

Keep the forest-green, sage and warm-white direction. The strongest current
composition is request/clause evidence beside the owner's decision and price.
Improve that direction rather than producing several competing themes.
Aim for a clear freelancer workspace, with fewer nested cards, repetitive
badges, technical assurances and long headings. Preserve readable amounts,
comfortable spacing, visible focus and quiet visual hierarchy. Use system
fonts, original inline SVG and self-contained HTML/CSS/JavaScript only.

PRODUCT TRUTH
Nudge's core flow is accepted scope -> new request -> AI draft with clause
references/uncertainty -> recorded human review -> owner price -> client
decision -> separately created PayPal sandbox invoice -> confirmed payment.
The AI cannot set an approved price or act on payments. Client acceptance
does not pay an invoice or prove identity. The real owner/client permissions
and server safeguards must guide this design, not be simplified to fit it.
Live website AI and several judging/manual checks remain unverified.

Use one coherent fictional project throughout: USD 1,200 five-page marketing
website; clause S2 excludes booking functionality; requested booking work is
an additional USD 300 proposal. If discussing revisions, their usage is
unknown unless the example explicitly supplies it. Do not infer remaining
revision allowance. Distinguish proposal value from invoiced balance/paid.

PRIORITY 1: SCOPE REVIEW
- Keep the request, actual referenced clause text and uncertainty visible.
- Use short headings: Review this change, Additional price, Client preview.
- Show distinct states for an unreviewed AI draft, recorded human review,
  price entry and a proposal ready for client review. Keep review identity
  and reviewed deliverables represented in the brief; changing reviewed
  work invalidates its price-ready state until reviewed again.
- Included and ambiguous outcomes must not enable a chargeable proposal.
  Ambiguous work asks a concrete question. A mixed request must not silently
  classify or price every part as additional.
- Require explicit confirmation before a fictional additional-work proposal
  becomes ready. Do not invent a replacement backend protocol.
- Derive every displayed amount from one local prototype state. Changing
  300 to 450 must update the owner preview, action label and corresponding
  client proposal consistently. An approved proposal is a fixed snapshot;
  later edits create an unapproved draft, not an edited accepted quote.
- Render user input with textContent/escaped text, never innerHTML. Price
  examples must validate decimal USD input without floating-point rounding
  being presented as an authoritative financial implementation. Invalid,
  negative, empty or overprecision input must block the fictional action.
- Show pending/uncertain action recovery without inviting blind retries.
  Buttons in this file simulate local states only; state this honestly.

PRIORITY 2: STANDALONE CLIENT PAGE
- Remove owner navigation, analytics, delivery planning, owner controls and
  View as Client from the client product shell. A clearly separate prototype
  screen selector may remain outside it.
- Present what changes, why it is extra, the scope reference, exact currency
  and amount, and clear Accept / Decline controls with explicit confirmation.
- After acceptance, explain that payment is a separate next step. Do not
  instantly mark an invoice created/sent/paid without a labelled simulated
  transition. Include already-decided and expired-link visual states.
- Make the explanation respectful and editable by the owner before sending;
  do not imply legal advice, verified identity or binding e-signature.

PRIORITY 3: RESPONSIVE OVERVIEW AND SHARED SHELL
- Support actual viewport widths 320, 390, 820 and 1440 CSS pixels. Avoid page
  overflow; only genuinely wide tables may scroll inside labelled regions.
- Collapse the Overview's inline fixed two-column layout. Give the primary
  task clear priority and avoid a tall persistent desktop sidebar on phones.
- Ensure the prototype screen selector itself wraps and remains usable.
- Remove the broken wrapper-only Mobile toggle, or replace it with an honest
  instruction to resize the actual browser. A 390px wrapper does not change
  viewport media queries; do not claim it proves mobile responsiveness.
- Retain the owner overview, scope review and standalone client as the three
  primary screens. Keep Delivery/Analytics coherent if already included, but
  do not spend this pass expanding them or replacing real sponsor runtime.

FACTUAL AND ACCESSIBILITY CORRECTIONS
- Provider errors, disabled AI and exhausted allowance have explicit states;
  never silently substitute simulation. Label the prototype fictional, and
  do not label fabricated output as an Elastic/model verification result.
- Replace Privacy Safe, Immutable Audit Trail, signed agreement,
  cryptographic reference ID and Verified Clause Match with accurate labels
  such as Activity, recorded acceptance, action reference and clause reference.
- Use recorded snapshot/source/time language for analytics, not Authoritative
  Balance Sheet, live totals or All due dates verified without evidence.
- Use ordinary navigation buttons for prototype switching, or implement the
  complete tab pattern. The previous role=tab without tablist is invalid.
- Correct claimed contrast numbers: #e2e8df on white is about 1.25:1 and
  #b8c5b4 about 1.80:1. Do not confuse decorative separators with essential
  input/focus boundaries. Measure actual foreground/background pairs before
  reporting ratios; do not invent a WCAG pass.
- WCAG 2.2 AA target-size minimum is 24x24 with exceptions, not universally
  44x44. Prefer comfortable 44px actions where practical. Do not call a
  noninteractive progress marker a failed touch target or text-labelled
  status colour-only. Maintain labels, keyboard access and reduced motion.
- Do not claim Narrator, physical touch, actual zoom or runtime testing you
  did not perform. Motion should clarify state; avoid animation on prices
  or approval/payment controls. No new animation framework or external fonts.

DELIVERABLES AND CHECKPOINTS
1. First save an updated brief checkpoint: completed / remaining / next step.
2. Revise the existing mockup incrementally, keeping it self-contained.
3. In the brief include a state table with classification, review state,
   price validity, confirmation, permitted action and visible explanation.
4. Add a change log tied to the six review areas above, honestly separating
   changes made from unverified behaviour. Do not fabricate screenshots/tests.
5. Propose the smallest first implementation slice mapped to the copied
   components/workspace.tsx, components/quote-explanation.tsx and/or
   components/client-page.tsx as appropriate. No new routes or wholesale
   extraction. Preserve existing handlers, server authority and recovery.
6. Finish with the two filenames, remaining limitations and exact next review
   step. Save partial progress if tokens run low; do not repeat the backend
   audit or expand scope to sponsor integrations.
```

After revised files are saved, inspect them before merging: compare changes, render actual 320/390/820/1440 viewports, check price/classification/review invalidation and client isolation, and verify keyboard/automated accessibility where available. Use the existing offline inspection approach; no provider calls or ordinary workspace data are needed. Manual Narrator, actual zoom and physical touch remain separate pending checks in TESTING_CHECKPOINT.md. Application implementation requires its own scoped step and relevant installed Next guides.
