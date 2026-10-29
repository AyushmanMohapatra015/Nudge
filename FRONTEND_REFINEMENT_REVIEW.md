# Existing website refinement: current decision and review

October 28, 2026. This review implements the owner's latest preference: improve the existing Nudge website, using selective inspiration where useful. A replacement template, a new palette, a new route and another complete prototype are not prerequisites. The rejected ivory/document prototypes remain historical review artifacts.

## Evidence used and limits

Reviewed current components/workspace.tsx, components/client-page.tsx, components/quote-explanation.tsx, app/globals.css and app/layout.tsx, alongside CURRENT_WEBSITE_DESIGN_REVIEW.md and the reviewed agent findings. Reopened these retained fictional screenshots from data/postman-workflow/current-design-ed97125b-8d63-4bf2-aa11-f12d4dcee775:

- 1440-overview.png
- 320-approvals.png
- 1440-client.png

Compared current bytes with the later verified October 18 build at data/postman-workflow/ac26f1fb-c1a2-4392-870f-4e4e67848d70/app-source. Workspace, shared CSS, root layout and quote explanation match. ClientPage differs: current source contains the later invoice-presentation and acceptance-receipt changes. The older client screenshot is a composition reference, not proof of its current status copy. Earlier screenshots also precede the two subsequently fixed accessible-name/hover issues and use fallback fonts. Focus outlines visible around headings are captured keyboard focus, not permanent decorative borders.

No server, browser session, provider request or application test was run for this review. The earlier 36 page/viewport observations and subsequent verification remain dated evidence; they are not new results. This is a source/saved-image review, not a fresh accessibility, device or performance clearance.

## Assessment and specific changes

The existing green palette, branding, separate client surface and real product content provide a useful base. The largest visual weakness is competing information at the same level, particularly in the owner's Overview and scope review. These are design judgments, not measured freelancer outcomes.

| Surface and source | Observed issue | Proposed bounded improvement | Authority to preserve |
| --- | --- | --- | --- |
| Owner page heading in WorkspaceApp | Large promotional headings and a repeated eyebrow compete with actual project/work status. On the retained narrow Approvals screenshot the heading occupies several lines before the task begins. | Use short task headings such as Overview, Review changes and Payments; keep one useful contextual sentence. Reserve expressive storytelling for any later introduction. | h1 focus on intentional view changes; simulation/sandbox label, error and recovery notices stay visible. |
| Overview in WorkspaceApp | Four equal statistics, full project clauses, a complete proposal editor, request form, decorative note and activity are all presented together. Repeated ProposalCard instances also occur in Project and Approvals. | Give Overview a concise project summary and clearly labelled route into the existing review view. Keep the full evidence/decision form on its existing task surface in a later separately reviewed slice. | Preserve pending counts and action eligibility; never replace real work with invented insights or a balance forecast. Navigating must not silently discard a typed draft. |
| ScopeDecision and ProposalCard | Evidence, clarification, private review, deliverables, price and client explanation form one long visual stack. Existing controls do not share a consistent label/field rhythm. | Introduce explicit sections: request and evidence; recorded scope decision; client quote. Improve spacing and native select treatment before considering collapsing or staging sections. | Original analysis remains distinct from human review. Edited deliverables invalidate reviewed pricing. Keep exact cents, optional message validation, extras confirmation and approval gating. |
| Mobile shared shell/CSS | The fixed 65px icon rail reduces the usable width of a 320px page; its labels are hidden. The long review form becomes especially narrow. | Evaluate a labelled compact navigation treatment after the first visual slice. Make reading space a priority. | All eight destinations remain available and named; preserve focus, current-view indication and access to Analytics/Delivery. No navigation replacement is approved by this review alone. |
| Shared CSS | Numerous metadata styles are 8-11px; explanatory text and labels can look equally subdued. | Establish readable text roles, increase important labels/body copy selectively and reduce competing decorative copy. | Recheck actual line wrapping, contrast, focus and button states. Do not enlarge all text indiscriminately or remove critical uncertainty guidance. |
| ClientPage and QuoteExplanation | The standalone document layout is simpler than the owner view and already distinguishes scope, additional work and price. | Keep its structure. Later match type/spacing and make the current quote or invoice easy to locate without hiding the agreement. | Current invoice helper/status copy, acceptance-versus-payment distinction, private projection, explicit decisions and expired-link recovery. |
| Analytics and Delivery | Useful sponsor functions already exist, with native tables and optional heavy tools. | Carry through the shared visual details after the core slice; avoid new chart furniture on Overview. | Deferred Studio/Gantt activation, native fallbacks, internal schedule review and financial/scheduling separation. |

## Status wording risk to verify before changing it

ProjectCard currently advances its four-step display to the completed index whenever any invoice has status PAID. That condition is not proof that all agreed work has been paid. The verified example paid a USD300 extra while the USD1200 base was not invoiced. Treat this as a source-confirmed broad completion condition requiring a focused behavior/wording check, not a newly reproduced runtime failure or permission to alter invoice accounting. Prefer per-invoice payment status and avoid implying that the whole project is settled. Any fix should preserve existing server-authoritative amounts/statuses and receive its own focused verification.

The earlier reviewed risk involving unkeyed Overview ProposalCard local state also remains relevant if that editor is moved or reused. Do not transplant the prototype's local financial state, remount forms casually or assume navigation preserves drafts.

## Motion direction

Keep the requested polish: restrained hover/selection feedback, short entrance or disclosure transitions, and a consistent sense of movement. Develop any larger landing animation only after the actual workspace is clear. Reduced motion must expose the same content and actions. No animated counters implying payments, moving monetary values, scroll trapping or delayed critical notices. Start with existing CSS capabilities; no animation dependency or paid asset is selected here.

## Ordered continuation

1. **F2-I1 complete:** reconcile the active plan with the existing-site refinement decision. Template research and prior full-prototype work are optional historical references.
2. **F2-I2 complete:** review current sources and retained images, preserve prior evidence limits and identify a bounded first slice in this document. No design implementation or user validation is implied.
3. **F2-I3 next:** refine the actual owner page-heading and Overview hierarchy using the current identity. Start with short task headings and consistent text/spacing; make the primary review destination clear. Inspect the installed Next guides and current owner/client browser tests before edits. First slice must remain useful with zero or multiple proposals and paused AI. Keep existing form mounting/navigation behavior until a separately reviewed change can preserve drafts. Review the ProjectCard completion wording condition alongside this slice before presenting a project as fully paid. Capture actual desktop/narrow results and run relevant checks for any changed behavior; show the result before extending the treatment across screens.
4. **F2-I4 pending:** refine the review form, client page and mobile navigation in individual slices; retain real handler/state contracts. Reconcile corrected Agent B returns if supplied; external-agent availability does not block primary work.
5. **F2-I5 pending:** sponsor/native view consistency, motion/reduced-motion polish, relevant final functional checks and manual Narrator/zoom/touch checkpoint. Actual asset/device performance needs measured evidence.

The interview in approximately 15 days adds a near-term checkpoint: a reliable demonstrable product with defensible technical claims. Sponsor access, independent AI evaluation, fresh payment-triggered webhook evidence, freelancer findings, hosting/persistence, publication/privacy and the final under-three-minute video remain separate open release tasks. Do not expand scope merely to add sponsors or collect more prototype artifacts.
