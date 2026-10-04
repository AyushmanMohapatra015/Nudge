# Fresh sandbox payment transition test

## Current result: paid, fresh PAID notification still unverified

On October 4, a new reachable HTTP/2 endpoint passed the public route guards and unsigned-notification rejection. The approved USD 1 fixture was created as a draft and sent through the normal authenticated owner send action. Nudge's baseline was UNPAID with 100 cents due. The private payment link was saved only under ignored data/ for the operator's sandbox checkout.

The user completed payment. A separate read-only PayPal lookup validated the approved USD total and returned PAID/zero due without changing Nudge. No matching verified INVOICING.INVOICE.PAID audit appeared within the bounded session, and no fallback audit ran for this invoice. The event-list page queried during the session returned a SENT event, not PAID; this is not an exhaustive history search or proof no payment notification exists.

The ten-minute limit began when the fixture became ready, not after checkout. Payment was confirmed near the end of that window, so this result does not establish a persistent delivery failure. The temporary registration was removed and processes stopped. An independent remote listing confirmed subscription absence, local webhook ID cleared, and ports 3001/3102 closed. The existing app on port 3000 was preserved.

After the observation session ended, Nudge's normal owner sync action retrieved authoritative PayPal state and updated this invoice to PAID/zero due. This is **owner reconciliation**, not a passed fresh-payment webhook transition. No real funds or AI credits were used. The previous signed-event replay/deduplication evidence remains verified.

Preserve this paid fixture; never issue an automatic replacement or ask the user to pay it again. Any later authentic PAID-event redelivery must be labelled redelivery rather than automatic initial delivery. Another fresh-payment fixture would require separate approval. A stable endpoint with a longer appropriate observation window is preferable to repeated short-lived tunnels.

Connectivity diagnosis preceding the successful attempt compared local DNS and independent Cloudflare DNS-over-HTTPS; both reached an isolated relay with normal certificate validation. An earlier new hostname still failed ENOTFOUND. The session driver gained a process-local, certificate-checked resolver option for probes, but the successful payment-test run did not report needing that option. System DNS, firewall, antivirus and TLS settings were unchanged.

## Authorized execution attempt: October 4, 2026

The user approved the one USD 1 sandbox fixture and its normal owner-action send. Two bounded HTTP/2 tunnel sessions were attempted. Both failed public reachability checks before PayPal registration, fixture creation or sending. Their owned processes were stopped. The planned new fixture has not been created and buyer payment has not been requested. No configuration, payment or AI usage occurred. The earlier successful signed replay remains valid evidence; this new payment-transition scenario remains pending.

Do not repeatedly reopen Quick Tunnels hoping for success. A stable, reachable webhook endpoint or a more precise resolution/connectivity diagnosis is needed before executing this test. The approval for this single USD 1 fixture persists; do not ask again merely because connectivity delayed its creation, and do not create a replacement if the first attempt later has an uncertain outcome. Hosted deployment or billing still requires its own review/authorization. No system DNS, TLS validation, firewall or antivirus settings were changed.

## Why this follows the completed replay test

Signed redelivery and deduplication are verified. The missing scenario is a newly paid invoice moving from UNPAID to PAID because of a genuine payment notification, rather than polling or manual refresh. This completes the payment portion of the primary demonstration; real AI integration remains separately pending.

## Prepared fixture

scripts/prepare-payment-webhook.ts prepares exactly one USD 1.00 **draft** for the generated sandbox buyer already recorded on the verified integration fixture. Its stable identity is webhook-payment-002. It requires explicit confirmation, sandbox mode, a configured webhook ID and an idle verified test workspace. It records that approvals are synthetic and that the operator acts in both roles; no real client work or AI interpretation is claimed.

The helper cannot send or pay an invoice. Existing fixture creation is rejected; a cached remote identity survives a lost follow-up response. The local action lock includes process ownership and completion writes require that lock. A configured webhook ID alone is not proof the endpoint is working; the operator must pass the public readiness checks first.

## Bounded execution after approval

1. Obtain approval for one additional USD 1.00 sandbox-only fixture and a temporary webhook-only connection. Existing approval covered replay of an already-paid event; it did not create this new fixture.
2. Use a separate loopback test app, force AI disabled, start the relay and a temporary HTTP/2 tunnel. Require registered connector, public reachability, blocked private routes and unsigned-event rejection. Register only that temporary endpoint on the same sandbox app, then reload its webhook ID in the test app.
3. Run the helper with explicit confirmation:

```powershell
node --env-file=.env.local --import tsx scripts/prepare-payment-webhook.ts --confirm-sandbox-fixture
```

4. Confirm the recorded draft is USD 1.00 and addressed to the existing generated sandbox buyer. Approve sending through the normal authenticated owner send action; do not use the old test script or bypass pending-send protection.
5. Capture UNPAID/100 cents due as the baseline, then close the owner workspace to prevent polling. The operator opens the invoice's PayPal-hosted **sandbox** payment link and completes payment using only the generated sandbox buyer and its test funding source. No real account, card or banking details are required. Keep passwords and private payment links out of screenshots, logs and the repository.
6. Observe the local database read-only while the webhook test app is running. Require a new matching **Verified PayPal webhook** audit entry with event type INVOICING.INVOICE.PAID, validated signature, and PAID/zero due. A completed checkout page, SENT event, manual sync or fallback audit alone does not pass this test. If notification is delayed, keep the result pending; record authentic redelivery separately if later needed.
7. Remove the test subscription, clear its local webhook ID, stop only test-owned processes, and independently confirm remote subscription absence and closed test ports. Preserve the fixture and audit for traceability. Do not automatically create another invoice if any step fails.

## Current evidence

Preparation only: all 39 server tests and TypeScript checks pass. The new test verifies confirmation/registration guards, draft-only behavior, lock ownership, recovery after a lost details response, and duplicate-creation rejection with mocked PayPal. No new invoice, subscription, tunnel, send, payment or model call was made for this preparation task. Live execution still needs approval and the user's sandbox buyer interaction.
