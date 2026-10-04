# Private client link controls

Client reads and decisions also have process-local rate limits; decision bodies have byte/time limits. See [PUBLIC_REQUEST_CONTROLS.md](PUBLIC_REQUEST_CONTROLS.md) for responses and deployment limitations.

The owner can replace a client link in **Agent rules → Private client access**. Explicit confirmation is required. The server checks the current token and workspace processing lock inside the database transaction. Sandbox owner authentication and same-origin checks apply. A repeated request with the old token is rejected.

Replacement uses a new random 192-bit token. Previous Nudge URLs can no longer read shared work or record pending decisions; an in-flight client POST rechecks the token before writing. Share the replacement privately using Client view. Nothing is emailed automatically. Existing acceptance records, proposals and invoices remain intact: replacing access does not undo earlier decisions or verify who made them. PayPal payment URLs and information someone already viewed remain available outside this control.

New workspace and replacement links expire after 30 days. Expiry uses the server clock and is checked on reads, before body parsing, and again inside acceptance transactions. At the exact expiry time access is rejected. Expired, malformed, and legacy links without a recorded expiry are rejected; the owner must explicitly replace them in Agent rules and privately share the replacement. Visiting or polling does not extend access. The owner view displays the UTC expiry date. Replacing an expired link preserves earlier decisions and invoice identity.

These are bearer links, not authenticated client accounts or proof of identity. The prototype uses one current client link per workspace, covering the shared agreement and approved proposals; there are no per-person permissions. Expiry cannot revoke copies already viewed or PayPal-hosted payment links. Client expiry checks do not block PayPal webhook reconciliation or owner actions.

Base invoice identity is persisted separately as `baseInvoiceKey`. Legacy workspaces freeze their existing `base-<old-token-prefix>` identity before replacement or invoicing. This preserves existing idempotency keys, cached PayPal IDs and unresolved creation markers. Link changes cannot authorize retrying an uncertain creation. Keys and link tokens are not copied into the replacement audit summary.

Local tests verify old GET/POST rejection, new access, stale replacement rejection, authentication/origin/processing guards, acceptance preservation, legacy invoice cache recovery and unresolved creation protection. Browser checks verify confirmation, new Client view URL and old-link rejection. No live PayPal call is needed to replace a link.
