# AG Studio sponsor access: verified offer and manual steps

Owner local verification, October 7: reports no watermark or console licensing errors and confirms the Analytics checks. Do not request signup, licence sharing or repeat configuration. Local licence checkpoint is complete on owner-observed evidence; hosted evaluation permission and judging access beyond November 21 remain unresolved.

Updated licence checkpoint: owner confirms **November21,2026** expiry from the generated licence. It is evaluation-only and contains “Use in production is not permitted.” Exact-expiry uncertainty below is superseded; hosted hackathon evaluation/judging rights and post-expiry access remain unresolved. No licence value is retained here. Current generator choices: AI features **No**, framework **React**. Existing pinned dependencies/provider require no copy-pasted App example or new npm install; follow AG_STUDIO_INTEGRATION.md for private env configuration and restart.

If needed, send manually to AG support/Discord: “Hello! My 45-day AG Studio trial expires November21,2026 and is labelled evaluation-only, with ‘Use in production is not permitted.’ Could you confirm whether a publicly hosted, sandbox-only hackathon evaluation demo is permitted, and how judges can retain access if judging continues after expiry? Thank you!” No message sent by this agent.

October7 owner update: licence arrived; owner confirms45-day trial/full dashboard embedding access, with no displayed expiry date. Do not repeat signup or start another trial. AG_STUDIO_INTEGRATION.md gives the new private NUDGE_AG_STUDIO_LICENSE setup. Key was not shared/read/installed by this agent; actual validation, exact expiry and judging coverage remain unverified. Packages and initial local Studio integration now verified, superseding earlier prepared-only status below.

October 7, 2026. No trial/account/licence activation, payment method, package installation or external message was performed during this research.

## Verified offer and choice

The [official hackathon AG Grid page](https://paypalaihackathon.devpost.com/details/aggrid) is now accessible. It links a free 45-day AG Studio trial and a PayPal/Studio boilerplate. Its award guidance emphasizes custom widgets, theming/layout and the Studio Agent Framework. This supersedes the previous unavailable-offer checkpoint, not the unresolved participant-specific licence/expiry/judging terms.

Choose AG Studio as the intended sponsor dashboard path: built-in invoice grid, ageing/report widgets and a custom view of reviewed changes awaiting acceptance. Keep AG Grid Community as the free fallback. Standalone Grid/Charts alone would not meet the sponsor's stated ambition for this category; neither path guarantees eligibility or a prize.

Our backend and approved scope workflow remain authoritative. The Studio agent, if later enabled, may query the minimal analytics snapshot or edit report layouts only. It receives no PayPal keys, invoice actions, private agreements or payment approval tools. Its real model/provider allowance and data handling need separate approval; the existing Elastic pause remains active. Installing an agent framework does not constitute a working agent or demonstrated AI integration.

## Claim steps for the owner

1. Open the official sponsor page above and follow **free 45-day trial license**. It currently points to [AG Studio licence/pricing](https://www.ag-grid.com/studio/license-pricing/).
2. Use the **Start your 45-day enterprise trial** section, not the sales enquiry form. It displays First Name, Last Name, Email and Company; the visible trial form marks first/last/email required. Do not invent a company. Leave it blank if accepted, otherwise ask sponsor support how independent participants should complete it. Choose marketing preferences yourself.
3. Before submission, read the displayed privacy/licence terms and confirm the offered duration. If a payment method, subscription or different trial duration appears, stop to clarify rather than accept a different offer.
4. Review the resulting licence/email: actual start/expiry, authorised application/deployment and use through judging. Do not assume 45 days covers the full judging period. Store the licence privately; do not paste it into chat or commit it to GitHub before public-source/distribution requirements are reviewed.
5. Share only non-sensitive confirmation: received/not received, expiry, and relevant terms. No installation requires sharing your personal details with this agent.

The form is inspected but not submitted; email delivery, exact generated licence scope and any account-specific terms remain unverified. A browser runtime licence will be visible to the browser by design; it must not be confused with a server secret or used as owner authentication. The repository's MIT licence does not relicense AG's commercial software.

Optional message for the sponsor Discord, to send manually if needed:

> Hello! I plan to use AG Studio through the linked 45-day trial. Could you confirm how to keep the hosted demo usable throughout judging, and the requirements for publishing application source that depends on AG Studio? Does the trial cover Studio's built-in grid/charts and custom widgets that use only Studio APIs? Thank you!

No message has been sent. Standalone Enterprise Grid/Charts used outside Studio have separate licensing requirements; see [Studio licence coverage](https://www.ag-grid.com/studio/react/enterprise-licence/).

## Engineering checkpoint

`GET /api/analytics` now provides the minimal local snapshot for a future owner dashboard. It reuses owner auth/shared read quotas, returns no-store responses, labels stateSource as local-records, and never reconciles, seeds a workspace or uses providers. Missing workspace returns404; malformed data/storage failures return a fixed503. Demo mode intentionally follows existing unauthenticated fictional-demo behavior. SQLite initialization may create an empty schema; no workspace/decision/payment record is created by this endpoint.

All91 server tests and TypeScript pass. Disposable production build passed; existing Postman regression passed31 HTTP requests/50 assertions with no provider fetch attempt. Actual AG component integration and hosted endpoint verification remain pending. See AG_DASHBOARD_PLAN.md for exact monetary definitions and remaining product/evidence gates.
