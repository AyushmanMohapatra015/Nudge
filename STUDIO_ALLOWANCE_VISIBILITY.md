# Owner allowance visibility without activation

October 10, 2026. Analytics now shows the dashboard's local request allowance, reserved attempts and UTC expiry. It explicitly states that dashboard AI is not connected and that request slots are not provider credits or a spending limit. There is no approve, renew, enable, payment or model-call control.

## Read boundary

The existing owner-authorized, no-store, rate-limited `GET /api/analytics` includes a strict `dashboardAllowance` projection. Sandbox reads expose only state, available request slots, approved cap, reserved count and expiry. Approval UUIDs, history, keys and provider details are excluded. Query parameters cannot select another mode or add private fields. Clients still need the owner's signed session for sandbox analytics; bearer client links are insufficient.

`readStudioRequestAllowance` performs SELECTs only. If its table is absent, it reports unapproved without creating a table. It validates active records, rejects multiple/invalid active rows and reports zero usable slots after expiry or a clock reversal before approval. The existing ledger's status method delegates to this read function. No viewing or refreshing reserves requests, mutates approvals, reconciles payments or seeds workspace data.

Demo mode reports simulation without reading or revealing the sandbox ledger. Ledger errors produce an unavailable allowance view while preserving valid financial reports. A failed overall refresh hides the previous panel with the previous reports. The browser validates the projection and replaces malformed/missing allowance data with unavailable; private error text is never rendered.

## Display boundaries

The panel is a named region with a heading and polite status text. Counts represent the latest refresh, not a continuously updated provider balance; the existing Refresh local snapshot button updates them. UTC expiry uses a semantic `time` element. The server admission gate remains authoritative if another request consumes a slot or the approval expires while the page stays open. The read-only display does not establish provider allowance, monetary limits, model quality, deployed transport or permission to activate live calls.

Tests use fictional approvals/databases and intercepted UI responses only. No ordinary database, local credentials/licence, subscription, provider or PayPal transaction is accessed. Manual screen-reader/touch/full keyboard review and the known vendor accessibility findings remain separate gates.

Final verification: all118 offline tests and TypeScript pass; the isolated production build and existing Postman31 requests/50 assertions pass, with normal Postman temporary-server cleanup. Eight rendered browser checks against that build pass: two new allowance journeys, four Analytics/HTTP regressions and two bounded accessibility checks. Browser teardown stalled inside the Windows sandbox; an approved read-only process lookup verified its temporary server, and a guarded stop terminated only that server on port3114. The browser runner then exited0 with eight passed; the normal development server was preserved. The accessibility scans retain the previously documented vendor nested-interactive finding; they do not establish full manual conformance. Allowance states beyond simulation are intercepted UI fixtures, while signed sandbox authorization/read-only SQLite/non-mutation are separately verified at the actual route-handler level. No hosted sandbox owner session or live provider was tested. Ignored build artifacts: `data/postman-workflow/b96f2e49-aa8a-4a63-93d3-b1970deb168c`.

Sponsor fit was rechecked in SPONSOR_RESOURCES.md. Existing meaningful AG Studio/Postman use is retained; Elastic/live AI and Render/hosting remain gated, with other tools considered only for a demonstrated workflow need.
