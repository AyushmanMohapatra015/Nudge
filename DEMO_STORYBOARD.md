# Nudge demo storyboard and rehearsal

Status: rehearsal plan, not final submission video. Target final runtime: 2:45, leaving fifteen seconds under the supplied three-minute limit. No public upload or narration has been produced by this task.

## One story

Audience hypothesis: a freelance web designer delivering a fixed-price website. The client agreed to five pages, two minor revision rounds and a booking exclusion. The client later asks for appointment booking. Nudge connects the agreement evidence, designer review, client-approved extra price and PayPal sandbox invoice.

Use a booking-only request for the main story: “Could we add appointment booking with available time slots?” This makes the exclusion clear. A revision-count ambiguity is useful in evaluation but adds another branch to the short video. Use fictional identities throughout; do not claim interviews or measured time/revenue savings that have not happened.

## Final recording outline

| Time | Screen and action | Suggested narration |
| --- | --- | --- |
| 0:00–0:20 | Project scope, price and booking exclusion | “A fixed-price website can turn into unpaid extra work when requests change. Nudge helps a freelancer explain the difference, agree on the change and collect payment.” |
| 0:20–0:45 | Approved scope and explicit client acceptance; paste the booking request | “The client first reviews the agreed scope. This new booking request is compared against those same clauses.” |
| 0:45–1:15 | **Actual verified model output**, supporting clause, designer decision and exact USD 300 extra price | “The AI drafts a comparison with evidence. The designer reviews the decision and sets the price. AI cannot approve the work or decide its price.” |
| 1:15–1:35 | Client reviews and accepts the extra work and price | “The client sees exactly what changes and what it costs. Acceptance records a workflow decision; it does not take a payment.” |
| 1:35–2:05 | Create/send through PayPal sandbox; actual sandbox checkout and authoritative paid status | “Only after approval and acceptance can this become a PayPal invoice. This checkout uses sandbox test money.” |
| 2:05–2:25 | Clearly labelled synthetic overdue example; enable client protection, attempt the already-drafted reminder and show rejection | “Approval cannot bypass the server’s rules. Protecting this client blocks the reminder even if a draft already exists.” |
| 2:25–2:45 | Activity trail, concise product close, verified judging access | “Nudge links scope evidence, human decisions and payment in one flow. Here is where judges can run it.” Add user/evaluation evidence only if actually collected and relevant. |

Payments and latency may take longer than these slots. Rehearse before recording; omit setup/sign-in, long typing and optional features. Editing waiting time is acceptable when the transition remains truthful. Never substitute a mock response for a live-model claim. Do not speed through the clause, price or acceptance so quickly they cannot be read.

## What the current capture proves

October 6 rehearsal: the existing core workflow passed once with local video capture enabled. Two non-empty owner/client recordings were produced under ignored data. The first attempt stopped at the client page's loading state under the default five-second assertion wait; a rehearsal-only thirty-second wait allowed the full workflow to pass. Application code and normal test configuration were unchanged. These raw recordings have not been edited, narrated or reviewed as a final pitch.

The existing local browser workflow can be captured with Playwright video in an isolated source copy. It exercises owner/client acceptance, comparison, reviewed pricing, simulated invoice/payment and policy rejection assertions. Owner and client pages generate separate recordings. It has no narration, includes test-speed actions, and some policy assertions use API requests rather than visible clicks. It is a technical reference, not a coherent final edited pitch. Its on-screen simulation labels must stay visible.

No existing environment file or personal database belongs in that copy. Rehearsal artifacts stay under ignored data and are not added to Git. Capture tooling may require Playwright's video encoder in its local tool cache; that is not an application dependency or paid service.

## Final evidence still required

- Confirmed free AI allowance and actual model comparison; do not present lexical baseline or simulation as AI integration.
- Actual sandbox checkout evidence. Fresh payment-triggered webhook remains unverified; owner polling/manual sync or an older signed replay must not be called that transition.
- Working judge access and complete source/setup instructions; live allowance/access must last through judging.
- User findings or real evaluation measurements if mentioned. Present the existing non-AI baseline as a comparison only, not Nudge's AI accuracy.
- Real client-facing explanation value is still a hypothesis to validate with freelancers.

## Recording and publication review

Use fictional client notes and accounts. Exclude API keys, administrator tokens, browser password managers, account dashboards, real emails and private payment/client URLs from shareable footage. Crop the address bar and terminal if they contain private operational information. Use your own narration and no music or third-party material unless permitted. Confirm permissions for any third-party branding/material under the supplied submission instructions. The video must show the functioning device workflow, be under three minutes, publicly uploaded to YouTube and linked in the submission. This task does not upload or publish anything.
