# Owner-reviewed client change explanation

An approved quote can now include a short explanation of how the extra work differs from the original agreement. The owner writes and previews it in the proposal card, after recording an additional-work scope decision. It is optional and uses no AI request. This addresses the external review's awkward-conversation hypothesis; usefulness still needs independent freelancer feedback.

The editor is labelled **Explanation for your client (optional)**. Write respectful, specific wording, such as: “Booking is excluded from the original website scope. This quote covers appointment scheduling only.” Review the message, deliverables and exact USD price before confirming and approving the proposal. Editing the message clears the quote confirmation. If present, the trimmed message must be 10–800 characters.

Approval saves the message and supporting clause IDs/text together. The server obtains clauses from the current recorded human review and agreement, rather than accepting clause text from the browser. The owner preview and client page show the same explanation with an expandable evidence panel. Quotes approved without an explanation and existing quotes continue to work.

The client's API response allowlists this approved explanation. It does not automatically publish the AI summary, raw request, human rationale, clarification or audit log. Messages and clause text render as ordinary escaped text, not HTML or Markdown links. A person with the private client link can read the approved message, so include only text intended for that client.

After approval, the quote's message and evidence cannot be replaced through owner approval/review or client acceptance actions. Clause text is a snapshot, so later agreement data cannot silently rewrite the evidence attached to the approved quote. Client acceptance remains a separate decision before invoicing; publishing an explanation does not create an invoice, send an email or record acceptance. There is no new messaging service or legal-enforceability claim.

## Verification

October 7 keyboard/mobile follow-up: two new explanation checks pass in normal and forced-colors modes at 320/640 CSS pixels; long message wrapping and native evidence disclosure were inspected. Fixed intermittent client focus loss after quote acceptance by checking after the React state update commits. All 14 relevant browser checks, TypeScript, isolated production build and Postman regression pass. See ACCESSIBILITY_REVIEW.md for evidence and outstanding manual checks.

Server coverage exercises length/type validation, stale/repeated approval, approved evidence snapshots, forged clause data, private-field filtering, client tampering, repeated acceptance, the invoice acceptance gate and escaped rendering. All calls use a separate fictional database and block network. The existing browser workflow now checks entering the message, client visibility and supporting clauses, and retention after acceptance. Postman's unchanged optional-message workflow verifies older callers remain compatible.

October 7 verification: all **82 server tests**, TypeScript checks and the isolated production build pass. All **three affected browser workflow tests** pass against that production copy, including entering the message, opening supporting clauses and retaining the message after acceptance. The unchanged Postman workflow also passed again: **31 requests, 50 assertions**, confirming compatibility for callers that omit the optional message. Neither the Postman nor browser run attempted a guarded provider fetch. No full accessibility-suite rerun is claimed.

This feature does not close independent human review, live AI quality/website verification, provider allowance or fresh PayPal webhook gaps. No automatic AI drafting or external delivery is implemented here. Ordinary workspace/configuration and development cache were preserved; verification used ignored disposable state.
