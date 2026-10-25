# Nudge — submission text draft

Prepared October 18, 2026 (F7a). This is reviewable submission copy, not a published entry or confirmation that all submission requirements are complete. The product description and tools sections can be adapted into the form. Keep the current verification note accurate; the internal checklist at the end is for preparation, not promotional copy. No account details, credentials or operational links belong here.

## Project name

Nudge

## Short description

Turn scope changes into clear client agreements and PayPal payments, with AI-assisted scope review and human control.

## The problem and who it is for

A freelancer agrees to build a five-page website. Later, the client asks for appointment booking. Is that part of the original price, or a separate piece of work? Even when the boundary is clear, explaining it politely, agreeing on a price and collecting payment can become a disconnected conversation across messages, proposals and invoices.

Nudge is built for freelance web designers and small studios working on fixed-price projects. It connects the original agreement, the requested change, the designer's decision, the client's acceptance and a PayPal sandbox invoice in one workspace.

## What Nudge does

1. **Establish the agreed scope.** The freelancer prepares the project scope, exclusions and price. The client reviews and accepts through a private project link. This records a workflow decision; it does not take a payment or verify the client's identity.
2. **Review a new request with evidence.** The scope-assessment layer compares the request with the supplied agreement clauses. Its structured draft identifies included, additional or ambiguous work, cites clause IDs and raises clarification questions when facts are missing. The freelancer reviews the decision and separates any additional deliverables before pricing.
3. **Explain and agree on the change.** The freelancer sets the additional price and can write a client-facing explanation with supporting clauses. The client sees the proposed work and exact price and can accept or decline. Private owner review notes are not part of that client view.
4. **Move accepted work into PayPal.** Client-accepted additional work can become a PayPal sandbox invoice through separate owner actions. Nudge reconciles invoice details and balances, records activity and applies server-side approval and payment-state checks. AI does not approve quotes, create payments or send invoices on its own.

For example, appointment booking explicitly excluded by the agreement can become an owner-reviewed USD 300 proposal. The revision allowance remains a separate question if its prior usage is unknown. This is an illustrative workflow, not a claim that every new request is chargeable or that Nudge determines legal obligations.

## What makes the approach useful

The scope assessment is connected to the action that follows it. A clause reference can support the freelancer's explanation; the approved explanation and price travel into the client decision; accepted work is connected to its invoice. This gives both sides a clear record of what changed and what they agreed to pay for.

The differentiator is that continuous evidence-to-decision-to-payment workflow. Nudge keeps ambiguity visible and keeps pricing and external actions under human control. It does not depend on a claim that its AI is always correct, that a private-link click is a legal e-signature, or that it has already recovered revenue for real customers.

## Supporting product features

AG Studio provides embedded invoice/change analytics, custom widgets, filters, exports and layout controls. Native snapshot tables remain available before the interactive report builder is loaded. The reports distinguish approved quote values from invoice balances.

Bryntum Gantt provides an optional read-only view of internal delivery planning. Original, current and proposed dates remain distinct, and the owner reviews a preview before applying it. Dates are owner-entered estimates, not inferred payment deadlines or new client commitments.

Reminder drafts use explicit owner approval and server-side protection, reminder-limit and cooldown rules. These are supporting capabilities; the main demonstration follows one scope change through agreement and payment.

## Tools used and how

| Tool | Actual role in Nudge |
| --- | --- |
| **PayPal Developer Platform** | Sandbox Invoicing and OAuth for invoice creation/sending and authoritative invoice lookup; webhook signature verification, reconciliation and duplicate-event handling. PayPal is the payment mechanism for accepted work. No live-money service, Orders integration or Payouts loop is claimed. |
| **Elastic Agent Builder / managed LLM** | Server-side structured scope assessments using the supplied agreement and request. The configured scope agent has no payment tools. Output is schema/reference validated and remains a draft for owner review. Actual website analysis is verified on the fictional booking example used in the matched sandbox journey; general accuracy is not established. |
| **AG Grid — AG Studio** | Embedded owner analytics, built-in grid/chart widgets, theming, custom pending-change/invoice-check widgets, cross-filtering, exports and editable report layouts. The Studio agent bridge has offline preparation; live dashboard AI is not claimed. |
| **Bryntum Gantt** | Optional read-only timeline for the guarded original/current/proposed delivery-plan workflow, with native tables as a fallback. It does not autonomously reschedule work or change payments. |
| **Postman — Newman** | Repeatable local API collections verify the fictional invoice/approval/payment and delivery-plan workflows, rejected actions and restart persistence. The current isolated production workflow passes 47 requests and 77 assertions. A connected Postman cloud account is not required for this runner. |
| **Next.js, React, TypeScript and Node.js** | Web interface, owner/client views, server routes and integration logic. |
| **SQLite, Zod and Lucide** | Local persistent application state, structured validation and interface icons, respectively. |

Render has deployment preparation and redeemed sponsor credits, but no deployed service or Render Workflows integration is verified. **Do not list Render as a used deployment tool unless that changes.** Other investigated sponsors are not used-tool claims.

## Current prototype and verification note

Nudge is a working single-owner prototype with a reproducible local simulation workflow. **The same-record live sandbox journey is verified across sessions:** actual Elastic website assessment, human review, owner-set USD300 quote, fictional client acceptance, one PayPal invoice/create/send, owner-performed sandbox checkout and provider-backed PAID/$0 reconciliation. The actual local Analytics snapshot agrees. Ordinary AI remains paused; this is one development example, not a general accuracy or independent-user result. Fresh PAID webhook delivery and a final uninterrupted demo recording remain unverified.

Earlier UI verification passed TypeScript, a disposable production build,47 local API requests/77 assertions with restart persistence and14 owner/client browser checks using fictional data where specified. Those checks are separate from the later matched live sandbox evidence above. They establish neither general AI accuracy nor customer impact. See SANDBOX_REHEARSAL_PLAN.md for the actual evidence and its limits.

The source/setup and tool-licence documentation exist. Final public repository access, permitted functional judge access through judging, sponsor continuity and the public demo video remain to be confirmed. This draft does not establish eligibility or completion merely by describing the implemented integrations.

## Try it / project links

Use [JUDGE_SETUP.md](JUDGE_SETUP.md) for the current local simulation walkthrough and setup boundaries, and [SPONSOR_ATTRIBUTION.md](SPONSOR_ATTRIBUTION.md) for actual integration evidence and licence/access status.

- Public repository: add only the verified public source URL after publication review.
- Functional demo: add the verified hosted URL **or** point to final complete functional setup/access instructions. A static mockup is not the demo.
- YouTube: add the reviewed, publicly visible video link after the under-three-minute functioning demonstration is complete.

Do not paste reusable admin tokens, provider keys, private client links, PayPal operational URLs or licence values into these fields. Required judge access needs a permitted private arrangement, not public secret disclosure.

---

## Internal — check before copying into the final submission

This section is a preparation checklist. Preserve the evidence boundaries above until they are actually resolved; do not simply remove disclosures to make the copy sound finished. Adapt the final text to the real form fields and demonstrated final build. No external form or field-length limits were inspected in this task.

| Claim or deliverable | Current boundary / smallest next action | Existing checkpoint |
| --- | --- | --- |
| Website AI | E6 one real website booking comparison passed with S2 and human approval gates. Usage21848 input/447 output recorded; one development case is not accuracy or full-demo evidence. Account quota/exhaustion and judging coverage remain open; no repeat from this draft. | E3/E4; ELASTIC_WEBSITE_REHEARSAL.md |
| One live booking-to-payment story | Use the same approved extra, currency and amount for owner, client, invoice and checkout. The earlier USD 1 connectivity fixture must not be presented as payment of a USD 300 quote. | F5; DEMO_STORYBOARD.md |
| Payment-triggered webhook | Signed SENT redelivery is verified; fresh payment-triggered PAID transition without polling is not. Omit that specific claim unless verified; describe confirmed reconciliation accurately. | P5; WEBHOOK_VERIFICATION.md |
| Judge and sponsor access | AG permission/December15 request was last reported unsent; no extension assumed. Elastic judging access/allowance, Bryntum technical/local acquisition and the selected functional access route remain to confirm. Hosting is optional; no paid activation is authorized. | A3b/D4/E3/B2c; SPONSOR_CHECKPOINTS.md |
| Public source / licence | MIT covers original code; third-party terms remain separate. Resolve owner historical disclosure decisions and verify actual public repository/About/setup/access without publishing secrets or vendor distributions. | R2/R9/F7; PUBLICATION_READINESS.md |
| Video / submission | Existing technical captures are not the finished pitch. Record the functioning selected story, review rights/privacy, upload publicly on YouTube and complete the submission with verified links. | F5/F6/F7 |
| Impact and quality | No customer quotes, measured revenue recovered, time saved, held-out superiority or broad accuracy claimed. Add only actual consenting findings or clearly bounded measurements. Manual Narrator/zoom/touch remain pending. | H/R6; TESTING_CHECKPOINT.md |
| Extra scope | No full redesign, migration, new sponsor integration, autonomous payments or live Studio agent is necessary to finish this description. Do not add them as current features. | REVIEW_ACTION_PLAN.md |

Draft checked against README.md, lib/domain.ts, lib/scope-instructions.ts, components/quote-explanation.tsx, current package dependencies, SPONSOR_ATTRIBUTION.md and the retained live/runtime evidence. This documentation task performs no new model/payment/deployment/browser runs, account changes or publication.
