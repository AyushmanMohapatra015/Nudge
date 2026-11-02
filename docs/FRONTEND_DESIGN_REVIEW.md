# Antigravity frontend candidate: candid review

October17,2026. Reviewed FRONTEND_DESIGN_BRIEF.md and FRONTEND_MOCKUP.html from D:\Nudge-Antigravity-Review. The previously absent design files now exist. All310original manifest files in that folder still match: no application source edits accompanied these deliverables. Neither deliverable was modified or integrated by this review.

## Overall judgment

A useful first design candidate, especially the desktop evidence/pricing split and client-facing explanation. The forest/sage/warm-white palette fits Nudge, amounts have clearer hierarchy, and system fonts keep the mockup self-contained. It is still a fairly conventional dashboard, with substantial unnecessary technical copy. It is not ready to be copied into the working frontend or treated as a verified accessibility/implementation specification. Keep its best compositions and revise its responsive behaviour, financial/decision states and unsupported claims first.

The best screen is the desktop scope-review layout: original request, cited clause and clarification on the left; owner decision, price and client explanation on the right. That makes the actual differentiator more visible to judges. The client-facing explanation/price grouping is also useful. Those are presentation ideas to adapt around existing server authority, not grounds for replacing working logic.

## What was inspected

- Read the design brief and mockup source, including every inline interaction function; inspected the actual HTML in a fresh headless Edge context with all outbound routes blocked, service workers blocked and no app server/account/private configuration.
- Rendered Overview, Scope Review, Client, Delivery and Analytics at actual viewport widths1440and390: ten screen/size observations. Viewed desktop Overview/Scope/Client and mobile Scope screenshots directly.
- Ran the installed axe-core checks for WCAG2A/AA,2.1AA and2.2AA tags on each view. These are bounded automated results, not full compliance or manual screen-reader/zoom/touch evidence.
- Checked price changes, non-additional classification, the mockup's mobile-width switch and inert markup in the price preview.
- Recomputed selected claimed colour ratios; reviewed relevant [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Inspection receipt, screenshots and byte-identical input copies are in ignored `data/frontend-design-review/c1085aad-58b3-402b-8e2d-2ba43068ac50/`. `review.json` records observations; `artifact-inventory.json` records hashes. Raw inputs are backed up under its artifacts directory; this archive is local, not committed/cloud-backed. Both input copies passed the known-pattern source scan, not a comprehensive privacy guarantee. The browser closed normally, no outgoing requests were observed and no page errors occurred. No Nudge source/configuration/dependency, server, database, licence or account was changed.

Input hashes:
- Brief:49902bytes, SHA256 `5ff6b58c4b604b8218299f64cb642cbdf623d5d49647c42bf15a9aed3d501388`.
- Mockup:75063bytes, SHA256 `be8256d1fd382415e46e01aab46fac65b6f831f3924eabc6db5c4e258b1a5eb6`.

## Revisions required before selecting implementation

### 1. Real mobile layout

At an actual390pxviewport, document scroll width was548px on all five screens. The prototype toolbar spills horizontally; Overview also has an inline two-column grid whose Scope Assistant extends beyond the viewport. Scope/Client content largely stacks, but the persistent tall owner navigation and toolbar consume substantial mobile space. The brief promises a compact tablet rail/mobile bottom navigation; the HTML does not implement that design.

The mockup's Mobile button only makes a390pxwrapper inside the1440pxwindow. Media queries still see1440px, leaving a250pxsidebar and two-column scope grid in that small wrapper. This is not evidence of responsive operation. Use actual viewport changes or iframe/container-query mechanics for a design viewer, and fix the app's own stacking independently. Recheck320/390/820/1440widths later; only390/1440were observed here.

### 2. Financial and human-decision consistency

Editing the proposed price to450updates the inline preview to450, while the approval button and client price remain300. Selecting Included and checking the confirmation still enables Approve Proposal. The mockup also lacks the working app's separate recorded-review identity/price-unlock stage and does not represent invalidation after editing reviewed deliverables.

These are prototype limitations, not newly discovered defects in Nudge's backend. Correct the candidate's states before using it as a UX specification. Retain the actual reviewId/classification/confirmation and exact-cent gates; do not weaken the backend to match this simplified form. Keep all displayed quote amounts derived from the same data. Mark toast-only approval/acceptance as fictional and do not present it as an end-to-end implementation.

### 3. Correct the specification's product claims

- The state matrix says exhausted AI allowance falls back to local simulation. Nudge deliberately does not silently substitute simulation after provider failure. Show an explicit paused/error state and accurate provenance.
- “Claude3.7 / Simulation” conflates model and simulated provenance; the selected provider path is Elastic and actual model evidence/configuration must remain distinct.
- “Privacy Safe” is too broad: structured contact/payment fields are minimised, but free text can contain private information.
- “Immutable Audit Trail,” “signed agreement,” “cryptographic reference ID,” “Verified Clause Match” and “No Hidden Fees” imply stronger guarantees than this prototype establishes. Prefer Activity history, recorded acceptance, action reference, referenced clause and explicit quote currency/amount.
- The mixed-request example refers to a remaining revision quota without establishing prior revision use. Preserve that uncertainty instead of claiming the revision is covered. The e-commerce/checkout title also conflicts with the five-page marketing-site narrative; use one coherent fictional project.
- Analytics labels such as “Authoritative Balance Sheet,” “live workspace totals” and “All due dates verified” overstate a local stored snapshot. Quote value, collectible invoice balance and verification source/time must remain clear.

### 4. Keep a distinct client experience

The client panel currently retains the owner's sidebar, Approvals/Analytics/Delivery navigation and View as Client control. That can be acceptable as a labelled owner preview shell, but it is not a faithful standalone client page. Show a separate simplified client shell for the final candidate, keeping the explanation, scope, exact price and acceptance/payment distinction. This is a visual issue in the mockup, not evidence that the actual client route exposes owner records.

### 5. Accessibility claims require correction and verification

The prototype screen-switch buttons have role=tab without a tablist parent; axe reports aria-required-parent across all inspected views. Mobile contrast findings are specifically in spilled prototype toolbar labels, not proof of low contrast throughout the product content. These findings belong to the mockup controls, not AG Studio/Bryntum or the current website.

The brief's border ratios are inaccurate: #e2e8dfagainst white computes1.25:1, not3.1; #b8c5b4computes1.80:1, not4.2. Its main text ratios are also numerically inaccurate but the inspected text pairs do pass normal-text contrast thresholds. Decorative separators need not all reach3:1; essential UI boundaries/states require their own assessment under the applicable criterion.

The brief incorrectly treats32pxbuttons as automatically failing the24pxminimum criterion and includes noninteractive step markers in its target critique. W3C's criterion is24x24with exceptions;44x44is a useful larger target, not that AA criterion's universal minimum. Existing badges already have distinct written labels, so calling them colour-only is also overstated. Improve them on measured usability grounds rather than inventing failures. Actual Narrator, zoom, touch, keyboard patterns and all state combinations remain unverified for this candidate.

### 6. Do not copy prototype JavaScript or refactoring claims verbatim

The text price input is inserted through innerHTML. A harmless `<b>`probe created an actual element in the preview. No executable payload or external request was used. Render untrusted text through escaped React/text nodes; keep price parsing/validation and server-approved values authoritative. This is a mockup issue, not evidence of XSS in the current React app.

New routes and component extraction can affect state, focus, recovery and test selectors. The brief's “zero logic risk” and blanket presentation-only refactoring claims are inaccurate. Route synchronisation is an optional application change requiring its own decision. Start by adapting styling/composition around existing handlers and state boundaries. Real AG/Bryntum theming, native fallbacks and bundle activation need verification in their actual components; placeholders cannot establish that.

## Visual refinement I recommend

Keep the palette, evidence/pricing grouping, client explanation and tabular amounts. Use shorter headings and quieter copy: “Review this change,” “Additional price,” “Client preview,” “Activity.” Reduce repetitive badges, formal/technical assurances and small-print explanations. Remove database-cent mechanics from user-facing forms. Preserve a clear next action and make the product feel like a freelancer's daily workspace. Add restrained motion after the layouts and states work; animation does not resolve the issues above.

## Recommended continuation

Return a focused revision request for the same two design files: actual narrow-screen layout, consistent amounts/blocked decisions, standalone client shell, corrected factual/a11y claims and shorter copy. Save progress early. Do not request more sponsors, dependencies, routes or a wholesale rewrite. Then inspect the revised candidate before selecting a small implementation slice. No implementation was authorised or performed by this review. F2 remains open, as do R10b, A3b/D4b and the previous live/manual/judge/publication gates.
