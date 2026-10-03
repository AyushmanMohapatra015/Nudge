# Scope-decision acceptance criteria

Status: specification only, not implemented. The current draft approval endpoint accepts prices regardless of analysis classification. This document defines the next bounded implementation task, alongside the fictional cases in AI_EVALUATION.md. Real AI calls remain on hold.

## Product rule

A scope comparison is advisory evidence. It does not itself authorize charging. The owner reviews the classification and applicable clauses; the client separately accepts any priced additional work. The original base invoice remains available for the accepted base agreement, independently of change decisions.

| Reviewed classification | Available next step | Additional-work pricing |
| --- | --- | --- |
| Included | Record that it is covered by the original scope; no new charge | Blocked |
| Ambiguous | Record clarification needed; clarify or correct the decision with rationale | Blocked until resolved |
| Additional | Record the reviewed additional deliverables and supporting rationale | Available after owner review; requires client acceptance before invoice |

For mixed requests, only additional deliverables belong in the paid proposal. Included tasks remain covered by the base agreement. The first implementation may use owner-reviewed separation instead of another AI call; it must not pretend to automatically validate whether an arbitrary edited deliverable is an extra.

## Minimal records and controls

- Preserve the original AI/simulation analysis and its provenance. Store the human decision separately; never rewrite the model output to look correct retrospectively.
- Record reviewed classification, explanation, valid clause IDs when applicable, actor, timestamp, and proposal revision. Additional decisions require evidence: applicable clauses and/or explicit documented clarification of newly agreed work. A missing clause does not justify inventing one.
- Provide a visible review step before pricing. A correction from included/ambiguous to additional requires an explanation; it is an owner's assessment, not an AI certainty or an existing client approval.
- Require owner confirmation that quoted deliverables contain only the reviewed additional work. Carry exact deliverables and integer-cent price through owner approval, client acceptance, and invoice creation.
- Keep approved/accepted proposals immutable in this slice. If revisions are added later, they must create a new reviewed version with fresh client acceptance; never silently change accepted prices or scope.
- Enforce the review at the server, not just with disabled buttons. Client-link holders cannot change scope decisions or set prices. Untrusted request text cannot confer approval.
- Historical approved/accepted proposals must not be silently rewritten or invalidated by introducing new metadata. Apply the new review requirement to new/draft approval; preserve the existing sandbox fixtures. Document compatibility explicitly.

## Acceptance scenarios for mocked tests

| Scenario | Required behavior |
| --- | --- |
| Included responsive-layout request (evaluation 02) | No paid-extra approval, even via direct API call. Base invoice unaffected. |
| Unknown revision history (19) | Remain ambiguous and block pricing until recorded clarification or correction. |
| Explicit booking exclusion (08) | Owner reviews additional work, sets price, client accepts; invoice matches that work and price. |
| Mixed colour change and checkout (23) | Quote checkout only; show the colour change remains included. |
| Owner corrects a mistaken additional classification to included | Preserve original analysis; audit correction; paid-extra approval blocked. |
| Owner resolves ambiguity with explicit clarification | Record evidence and the human decision; do not invent a clause or prior client acceptance. |
| Attempted prompt injection (24/25) | No prices, approval, or external action inferred from client instructions. |
| Reviewer changes draft deliverables after scope review | Require reconfirmation of the revised deliverables before approving. |
| Forged or stale review, non-owner request, missing rationale | Reject at the server without changing price, proposal, or audit state. |
| Already accepted proposal | No scope/price mutation; existing accepted invoice flow remains functional. |

## Completion evidence

Implementation must have meaningful server tests, a browser walkthrough of included/ambiguous/additional flows, and a clearly labelled simulation. AI quality is evaluated separately after provider allowance confirmation. Do not claim that a human review field mechanically proves contractual scope or that client acceptance verifies legal identity.
