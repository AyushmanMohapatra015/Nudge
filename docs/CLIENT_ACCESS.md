# Private client link controls

## R10b — owner/browser trust boundary review, October25

The sandbox owner is trusted to view and privately share the current client link. The authenticated workspace response intentionally contains `clientToken`: Client view links and confirmed replacement use it. Omitting that field alone would break those contracts without preventing a trusted owner from sharing the link. No token-omission patch, new sharing endpoint or authentication redesign is selected. Demo mode intentionally bypasses owner authentication and must not be exposed as a private credentialed workspace.

| Actor or request | Intended authority and checked boundary |
| --- | --- |
| Owner with valid signed sandbox session | Can read owner records/current shareable link and explicitly replace it. Existing rotation tests cover confirmation, stale token, origin, processing and durable invoice identity. |
| Current unexpired link holder | Can read the allowlisted client projection and POST pending acceptance/decline decisions. Possession does not authenticate a person. It cannot sign an owner session, read the owner API or replace access. |
| Preview scanner issuing GET | Can read the client projection if it has the link. Query parameters do not record acceptance, alter proposal status, add audit entries or advance the stored workspace version. This is not a claim that every scanner only performs GET. |
| Expired/replaced/invalid link | Client reads and decisions are rejected. In-flight POST token/expiry checks repeat inside the transaction; old access cannot accept later work. |
| Same-origin owner script or browser compromise | A malicious script running with owner access can read the same data as the owner. Hiding one response field is not a defence against this threat. Browser extensions, clipboard/history, screenshots and shared devices remain outside link secrecy guarantees. |

Client projection explicitly omits owner audit, policy, integration and processing records; approved proposal output also omits the raw client request and private AI analysis. It includes the shared agreement, approved proposal deliverables/prices/explanations and non-draft invoice payment information as intended. The link covers the workspace, not one recipient or one proposal; do not promise tenant/per-person isolation.

Application-wide `Referrer-Policy: no-referrer`, external links with `rel="noreferrer"`, no-store API responses and disabled routine Next development logging reduce specific leakage paths. They do not erase browser history, previously viewed information, provider payment URLs or hosted reverse-proxy/access logs. Hosted logging/access configuration remains a separate release gate. Private links must not appear in public videos, issue reports or screenshots.

Verification: two new tests in `tests/client-owner-boundary.test.ts` plus the existing client access, expiry and replacement tests passed together (five tests). They use isolated fictional sandbox/demo databases; new tests deny provider fetches and assert zero calls. Checks include anonymous/forged-cookie/bearer owner access, rejected client replacement, authorised-owner positive control, scanner-style GET nonmutation and nested approved-proposal privacy. TypeScript result is recorded in the current task checkpoint. Direct route invocation does not verify browser response headers, HTTPS, host/proxy behavior, deployed logging or physical-device accessibility; no browser/build/provider run was performed for this review.

Client reads and decisions also have process-local rate limits; decision bodies have byte/time limits. See [PUBLIC_REQUEST_CONTROLS.md](PUBLIC_REQUEST_CONTROLS.md) for responses and deployment limitations.

The owner can replace a client link in **Agent rules → Private client access**. Explicit confirmation is required. The server checks the current token and workspace processing lock inside the database transaction. Sandbox owner authentication and same-origin checks apply. A repeated request with the old token is rejected.

Replacement uses a new random 192-bit token. Previous Nudge URLs can no longer read shared work or record pending decisions; an in-flight client POST rechecks the token before writing. Share the replacement privately using Client view. Nothing is emailed automatically. Existing acceptance records, proposals and invoices remain intact: replacing access does not undo earlier decisions or verify who made them. PayPal payment URLs and information someone already viewed remain available outside this control.

New workspace and replacement links expire after 30 days. Expiry uses the server clock and is checked on reads, before body parsing, and again inside acceptance transactions. At the exact expiry time access is rejected. Expired, malformed, and legacy links without a recorded expiry are rejected; the owner must explicitly replace them in Agent rules and privately share the replacement. Visiting or polling does not extend access. The owner view displays the UTC expiry date. Replacing an expired link preserves earlier decisions and invoice identity.

These are bearer links, not authenticated client accounts or proof of identity. The prototype uses one current client link per workspace, covering the shared agreement and approved proposals; there are no per-person permissions. Expiry cannot revoke copies already viewed or PayPal-hosted payment links. Client expiry checks do not block PayPal webhook reconciliation or owner actions.

Base invoice identity is persisted separately as `baseInvoiceKey`. Legacy workspaces freeze their existing `base-<old-token-prefix>` identity before replacement or invoicing. This preserves existing idempotency keys, cached PayPal IDs and unresolved creation markers. Link changes cannot authorize retrying an uncertain creation. Keys and link tokens are not copied into the replacement audit summary.

Local tests verify old GET/POST rejection, new access, stale replacement rejection, authentication/origin/processing guards, acceptance preservation, legacy invoice cache recovery and unresolved creation protection. Browser checks verify confirmation, new Client view URL and old-link rejection. No live PayPal call is needed to replace a link.
