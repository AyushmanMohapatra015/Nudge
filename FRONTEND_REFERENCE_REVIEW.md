# Frontend reference review — October26,2026

SUPERSEDING OWNER DECISION: the ivory/document prototype derived from this review was rejected. FRONTEND_DESIGN_RESET.md records fresh research, six visually compared MotionSites previews, actual-reference shortlist and revised selection steps. Earlier recommendation to implement an original project-desk direction is historical and must not override the owner's MotionSites preference. No template adopted; source redistribution remains to be checked for the chosen item.

Purpose: choose useful design principles for Nudge's complete makeover. This is a reference review, not a purchased-template recommendation or proof of an objectively best design. Source code/assets are not copied. No accounts, services, template purchases or installs were activated.

## Evidence and comparison

| Reference | What was actually examined | Useful for Nudge | Limit / decision |
| --- | --- | --- | --- |
| [MotionSites — Bionova Biotech](https://motionsites.ai/) | Public gallery and downloaded public preview GIF, viewed as a still frame | Strong editorial headline, ample whitespace, asymmetrical product/feature composition | Strongest landing-layout reference of the three previews examined. Biotech copy, stock brand marks and abstract imagery do not describe our product. No full responsive/interactive behavior verified. |
| MotionSites — Finlytic AI Agent | Public gallery and previously downloaded preview, visually inspected | Prominent product preview and clear introduction | The globe dominates the composition and the dark dashboard is dense. It does not solve our working-app clutter. Earlier recommendation was too definite. No template adopted. |
| MotionSites — AKOR Security | Public gallery and individually downloaded preview, visually inspected | Clear hierarchy across a dark hero and light supporting section | Security-agency/3D building aesthetic is a weaker audience fit. It would require substantial art-direction changes. |
| [Linear](https://linear.app/) | Public product page, visible workflow/navigation content and documented product positioning; no signed-in app session | Focused work items, context grouped around a decision, secondary properties kept distinct | A reference for hierarchy, not permission to copy design/code or introduce teams, issue tracking or agent powers. Runtime motion/mobile behavior not tested. |
| [HoneyBook](https://www.honeybook.com/) | Public client/project/payment descriptions and portal/product sections; no account | Familiar client relationship language and shared proposal/payment journey | Nudge's scope is narrower. Do not import a CRM, lead-generation or scheduling product roadmap. No claims about participant eligibility or service use. |
| [Bonsai](https://www.hellobonsai.com/) | Public business-management page; the older getbonsai URL was inaccessible through the web tool | Connect project administration with client work and invoices | Product/audience reference only. No authenticated screen, service purchase or full UX inspection. |
| [Stripe Invoicing](https://stripe.com/invoicing) | Public invoice/payment examples and invoice detail hierarchy | Clear totals, remaining balance, invoice identity and confirmation states | Financial information hierarchy only. Nudge continues to use PayPal; no Stripe feature, SDK, payment method, performance metric or commercial claim is adopted. |
| [Vercel Geist](https://vercel.com/geist/introduction) | Public design-system introduction | Component consistency and a restrained interface vocabulary | Not a selected component dependency, downloaded font or copied design system. |

The MotionSites gallery also lists hero/footer/CTA sections and unrelated agency, property and entertainment concepts. Their titles/categories were surveyed, not all visually inspected. This is not a claim to have exhaustively tested the library or found its universal best template. The three visual inspections concern preview stills; animation playback timing, mobile behavior, implementation quality and performance remain unknown.

Public MotionSites reference images are retained privately in ignored data: motionsites-finlytic-reference.gif, motionsites-bionova-reference.gif and motionsites-akor-reference.gif. They are inspection references, not product assets for redistribution.

## Recommendation

Build an original Nudge direction: **editorial clarity plus a focused project desk**. Bionova's spacious split composition is the most useful MotionSites starting point among the inspected candidates; focused workflow hierarchy and clear invoice presentation supply the working-app reference. Translate those principles into Nudge's own typography, document/decision motif and functional product screens. Do not assemble disconnected copied sections.

Proposed visual family: warm ivory, deep forest, restrained sage and dark readable typography, with generous spacing and a distinctive original agreement-to-receipt animation. This preserves a useful brand association from Nudge's previous palette while fully changing composition, density and navigation. Final palette/layout is pending review of a coherent visual prototype. A dark cinematic variant can be considered if it retains financial readability, but is not the default recommendation.

## Rights and constraints

[MotionSites terms](https://motionsites.ai/terms), reviewed October26, allow building websites/apps with their material while restricting redistribution of prompt/source content and library content. Their public-source compatibility is not established here. A public MIT application repository needs separate clarity before including template source/assets. The plan therefore uses independently authored code/graphics and no purchased or copied template. Visual inspiration is not permission to reproduce proprietary materials or third-party brands.

The existing Antigravity work remains useful evidence. FRONTEND_DESIGN_REVIEW.md identified a good evidence/pricing split but real mobile overflow, excessive technical copy and incomplete state handling. CURRENT_WEBSITE_DESIGN_REVIEW.md records actual current-app observations. A previous idea or test receipt is not proof that a newly designed screen works.

## Technical guidance informing the design

- [Animation performance](https://web.dev/articles/animations-and-performance): prefer inexpensive transform/opacity effects for routine transitions and measure the resulting behavior.
- [Video performance](https://web.dev/learn/performance/video-performance): compress/defer media and account for its loading cost. A large frame sequence is an option requiring measurement, not a prerequisite.
- [Motion reduced-motion behavior](https://motion.dev/docs/react-use-reduced-motion): provide an alternative for users requesting less motion. No animation library installed or selected by this research.
- [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): inform accessible controls and motion alternatives. The animation criterion is Level AAA; the design can adopt a stronger comfort goal without claiming WCAG certification. Our44px touch-control design goal is not a claim that WCAG2.2AA universally requires44px.

Next evidence: the standalone visual prototype and independent state-contract review specified in FRONTEND_DESIGN_PLAN.md. No final style approval, functional replacement, new runtime tests or model/provider requests occurred during this reference review.
