# Private client link controls

The owner can replace a client link in **Agent rules → Private client access**. Explicit confirmation is required. The server checks the current token and workspace processing lock inside the database transaction. Sandbox owner authentication and same-origin checks apply. A repeated request with the old token is rejected.

Replacement uses a new random 192-bit token. Previous Nudge URLs can no longer read shared work or record pending decisions; an in-flight client POST rechecks the token before writing. Share the replacement privately using Client view. Nothing is emailed automatically. Existing acceptance records, proposals and invoices remain intact: replacing access does not undo earlier decisions or verify who made them. PayPal payment URLs and information someone already viewed remain available outside this control.

These are bearer links, not authenticated client accounts or proof of identity. Automatic expiry is not implemented. The prototype uses one current client link per workspace, covering the shared agreement and approved proposals; there are no per-person permissions.

Base invoice identity is persisted separately as `baseInvoiceKey`. Legacy workspaces freeze their existing `base-<old-token-prefix>` identity before replacement or invoicing. This preserves existing idempotency keys, cached PayPal IDs and unresolved creation markers. Link changes cannot authorize retrying an uncertain creation. Keys and link tokens are not copied into the replacement audit summary.

Local tests verify old GET/POST rejection, new access, stale replacement rejection, authentication/origin/processing guards, acceptance preservation, legacy invoice cache recovery and unresolved creation protection. Browser checks verify confirmation, new Client view URL and old-link rejection. No live PayPal call is needed to replace a link.
