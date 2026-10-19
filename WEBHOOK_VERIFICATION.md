# Genuine sandbox webhook verification checkpoint

October19 P4a: [SANDBOX_REHEARSAL_PLAN.md](SANDBOX_REHEARSAL_PLAN.md) now supplies the concrete same-USD300-quote rehearsal specification, isolated AI/payment phases, attempt/recovery and cleanup boundaries, plus minimum reconciliation versus optional fresh-PAID webhook evidence. Session controller/offline checks and owner activation review are next; no live rehearsal or provider operation occurred. Earlier next-step statements are historical where superseded.

## P3 existing-fixture and cleanup review: October19,2026

Read-only local evidence and current sandbox API checks agree: the existing USD1 fresh-payment fixture is **PAID with zero outstanding**, with matching invoice identity and USD currency/total. Its saved local session baseline was UNPAID; the session's own deadline has expired. That local deadline does not establish whether PayPal's invoice link itself expired, and is not a reason to create/pay another invoice. The proposal remains present and the ordinary workspace has no processing marker. Normal AI remains disabled.

Local review receipt: `data/paypal-evidence-review/20579e16-8965-4fe0-b5fe-50be0fcfe48f/summary.json`. SQLite was opened read-only, with the main database hash unchanged. Two persisted verified-webhook audits/events exist; both audit details identify **INVOICING.INVOICE.SENT**, not PAID. One concerns this USD1 fixture; the other reconciled an already-paid earlier fixture. The USD1 audit does not demonstrate that a fresh PAID notification caused its paid transition. No payment-triggered webhook claim is added.

Current provider receipt: `data/paypal-evidence-review/d3fc37ee-ec91-46d1-ac73-a311e5701d40/summary.json`. One OAuth authentication followed by two GETs returned HTTP200: exact existing invoice details and the app's webhook-registration list. The latter is empty: neither the old temporary registration ID nor URL remains, and local `PAYPAL_WEBHOOK_ID` is empty. The retained registration file is historical metadata, not an active registration; it was preserved. No create/send/pay/remind/resend/register/delete request, invoice synchronization write, tunnel or AI call occurred. Credentials, account details, invoice/event IDs, URLs and raw provider payloads were not retained in these sanitized receipts or this update.

The old USD10 paid reference also remains locally, but `NUDGE_SANDBOX_REFERENCE_INVOICE_ID` is not currently supplied/matched by the private environment. Do not run an old fixture helper or guess an identity to bypass its reference gate. This is an operator configuration prerequisite, not evidence of an application fault. No environment or database repair was attempted.

References for the read-only operations: PayPal [invoice details](https://developer.paypal.com/docs/api/invoicing/v2/#invoices_get) and [list webhook registrations](https://developer.paypal.com/docs/api/webhooks/v1/#webhooks_list). Successful reads verify the stated existing records; they do not send a test payment or prove a new notification.

**Next P4:** prepare/review the concrete same-quote sandbox rehearsal and any optional webhook-only connectivity session before activation. The selected video story uses one manually reviewed USD300 booking quote through client acceptance, invoice and payment. Existing USD1 evidence must not stand in for that payment. If fresh PAID delivery is to be demonstrated, specify the isolated workspace, exact one-fixture/one-send boundary, manual sandbox buyer checkout, no owner polling during evidence capture, webhook-only public route, bounded wait and owned-registration/process cleanup before exposing anything. Reuse a suitable existing fixture only after its state is inspected; an already-paid invoice cannot supply a fresh unpaid-to-paid transition. Keep the simpler authoritative-reconciliation demo option honest if new webhook proof is unavailable. Do not create a new invoice, enable a tunnel, modify the ordinary workspace or start another AI conversation merely from this plan.

## Verified signed delivery and cleanup: October 4, 2026

The bounded replay test succeeded using a newly reachable HTTP/2 tunnel. Public dashboard, workspace, session and client paths returned 404. An unsigned notification was rejected with 401. Nudge ran on separate loopback port 3102; the existing port 3000 app was left untouched. AI was explicitly disabled in the test app.

PayPal authentically redelivered the existing SENT event identified below. The application verified its signature, fetched current authoritative invoice details, and recorded exactly one **Verified PayPal webhook** audit entry matching the event ID. The USD 1 invoice remained PAID with zero due. A second genuine delivery received HTTP 200 and did not add another matching audit entry, verifying deduplication for that event.

Cleanup was separately checked through a read-only PayPal subscription listing: the test registration is absent. The local webhook ID is cleared, ports 3001 and 3102 are closed, and no cloudflared process remains. No invoice was created, sent or paid by this replay; no real money or AI allowance was used. The ignored local session scripts are operational aids rather than judge dependencies.

This verifies genuine signed notification delivery, authoritative reconciliation and repeated-event handling. It does **not** verify a fresh buyer payment generating a PAID notification and changing a previously unpaid local invoice. The historical attempt and diagnosis sections below preserve the earlier failures; this section is the current delivery status.

## Connectivity diagnosis: October 4, 2026

A separate bounded diagnostic session used the webhook relay with a stub forwarding function, so it could not contact Nudge, PayPal, the database or any model. No environment credentials were loaded. Local root GET returned 404 and webhook GET returned 405.

Two temporary tunnels were tested sequentially:

- Default/auto transport: Cloudflare registered the connector, but the generated public hostname failed both operating-system lookup and DNS A-record resolution with ENOTFOUND. Node fetch failed ENOTFOUND; Windows curl (default and IPv4) returned exit code 6, a hostname-resolution failure. No TLS connection was established by these probes.
- Explicit HTTP/2 transport with a new temporary hostname: the connector registered, DNS queries succeeded, and Node plus both curl probes reached the relay and returned the expected webhook GET 405 with normal certificate validation.

This isolates the observed default-attempt failure to public-hostname resolution. It does **not** prove QUIC was blocked or that HTTP/2 repairs DNS: the hostname and timing changed between attempts. A fresh HTTP/2 tunnel is a tested option for another bounded verification, but each new hostname must pass readiness and route-boundary checks before PayPal registration. Wait for an actual registered connector, not just a printed hostname. Preserve certificate validation; do not change system DNS, firewall or antivirus settings based on this observation.

Both tunnel processes and the diagnostic relay were stopped. No PayPal registration, replay, payment, configuration change or AI usage occurred. Genuine signed delivery remains unverified. The next task is the previously approved bounded event replay with a newly checked reachable webhook-only endpoint and guaranteed cleanup.

References: [Cloudflare run parameters](https://developers.cloudflare.com/tunnel/reference/run-parameters/) and [Quick Tunnel testing limitations](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

## Authorized attempt outcome: October 4, 2026

The user approved a brief public webhook-only test. An existing app on port 3000 was detected and left untouched. The test used a separate loopback app port 3102 and relay port 3001. Local relay checks returned 404 for dashboard, workspace, session and client routes.

The temporary tunnel produced a hostname, but public requests could not establish the required 404 route-boundary checks, including a bounded readiness retry. The test stopped before PayPal registration, configuration changes or authentic event replay. No new invoice or payment was created and no AI call was made. Session-owned relay/tunnel processes were stopped. No subscription cleanup was necessary because none was registered. The existing port 3000 app was not stopped or reconfigured.

Genuine webhook delivery remains **unverified**. A tunnel hostname is not proof of reachability; no signature verification or deduplication result is claimed. The exact connectivity cause was not established. Next attempt should first diagnose tunnel reachability or use an approved hosted webhook endpoint, before registering anything or replaying an event. The ignored local driver is data/verify-webhook-session.mjs and is not part of judge setup.

## Read-only preflight: October 4, 2026

PayPal returned an existing INVOICING.INVOICE.SENT event for a paid sandbox fixture (operational identity retained privately):

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
