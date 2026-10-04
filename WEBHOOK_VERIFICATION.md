# Genuine sandbox webhook verification checkpoint

## Read-only preflight: October 4, 2026

PayPal returned an existing INVOICING.INVOICE.SENT event for paid sandbox fixture [historical sandbox invoice redacted]:

`WH-796181837E059390F-4555664192293913Y`

This was a read-only event lookup. No subscription was registered, event resent, invoice created or payment made. The local tunnel executable exists at data/tools/cloudflared.exe; its presence does not mean a tunnel is running. The helper queried one page of up to 100 events, so this is not an exhaustive history search. No PAID event was returned for this fixture in that page.

## Proposed bounded verification

1. With explicit approval for temporary public webhook access, start Nudge bound to loopback and the webhook-only relay on port 3001. Keep the owner dashboard closed during delivery to avoid fallback polling as evidence.
2. Start the temporary HTTPS tunnel targeting port 3001, never the dashboard port 3000. Confirm dashboard/session/client paths are blocked through the public endpoint.
3. Register the tunnel webhook URL on the same PayPal sandbox app using the existing registration helper. It updates only PAYPAL_WEBHOOK_ID in local ignored configuration and records the temporary registration under ignored data/. Restart Nudge to load the ID.
4. Request authentic redelivery of the existing SENT event above to the newly registered webhook. This requests a notification, not a payment or another invoice send.
5. Require actual signature verification plus a matching **Verified PayPal webhook** audit entry with that event ID and invoice ID. Because the invoice is already paid, authoritative GET should reconcile PAID/zero due even though the event type is SENT. A successful resend request or relay's signed-header flag alone is insufficient proof.
6. If delivery succeeds, repeat the same event and check it is deduplicated without another webhook audit entry. If unavailable or rejected, record the failure and leave genuine delivery unverified; do not create another invoice automatically.
7. Remove only the temporary subscription created by this test, stop tunnel/relay and any app process started for the test, and clear its local webhook configuration through the helper. Confirm cleanup. Do not remove an unrelated registration.

## Boundaries and remaining evidence

This exposes a temporary public webhook endpoint, so approval is required before starting the tunnel. The relay forwards only webhook POSTs, strips cookies and authorization, and caps bodies at 256 KiB. Public requests still reach the webhook handler and signature-verification service; this is not a guarantee of zero network risk. Never share credentials, buyer passwords, full provider payloads or client links.

Successful delivery of this existing SENT event would verify the signed delivery/reconciliation path, not a new payment triggering an automatic PAID notification. That separate scenario remains pending. No real money or AI credits are needed for this replay test. Elastic and Astropods calls stay paused while support replies and allowances remain pending.
