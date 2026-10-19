# P4: one consistent scope-to-payment sandbox rehearsal

Prepared October19,2026 from the current website/routes, PayPal adapter, reconciliation, webhook relay and existing receipts. **Plan complete; session tooling and execution are not complete.** No live operation is authorised merely by reading or running a generic development command from this document.

## Selected outcome

One fictional five-page website, one booking request, one reviewed **USD300 extra**, one client acceptance, one PayPal sandbox invoice and one manual sandbox checkout. The original USD1200 project is scope context only: do not invoice or portray it as paid. Preserve the selected 2:40 story in DEMO_STORYBOARD.md. Earlier USD1 footage is separate connectivity evidence.

Existing evidence: E6 real website comparison passed with S2 and human review; P3 confirms the old USD1 invoice PAID/$0 and zero remote webhook registrations. Neither receipt is a completed same-quote rehearsal. The old invoice is already paid; paying it again or using it as the new USD300 change is inappropriate.

## Preparation boundaries found in source

- `app/api/workspace/route.ts` requires accepted agreement before analysis, recorded scope review before pricing, exact reviewed deliverables and additional classification before quote approval, client acceptance before invoice creation, and separate explicit send. Use these real paths; do not insert synthetic accepted proposals into the database.
- `lib/paypal.ts` targets the sandbox origin; creation caches attempt/returned identity and sending retains uncertain-operation protection in the route. An error is grounds to inspect the original attempt, not create another proposal/invoice.
- `GET /api/workspace` invokes `reconcileOutstanding()`. Owner UI polling and Refresh status can reconcile payment independently of webhooks; this matters when proving the origin of a transition.
- `scripts/elastic-live-review.cjs` replaces global fetch with an exact one-conversation gate. It blocks PayPal too. Keep its existing boundary; do not weaken it to enable payment operations. Restart the isolated app after AI, preserving its DB but removing that preloader and all Elastic credentials, with AI disabled, before enabling PayPal.
- The E6 fixture's `fictional-client@example.com` is suitable for AI-only testing, not the target buyer. A new recording fixture must use a privately verified generated personal **sandbox buyer** from the beginning, before agreement approval/acceptance. Do not rewrite an accepted agreement or copy old analysis into a new fixture and describe it as a new live result. Structured email/price fields are excluded by `scopeAiPayload`; review free text separately.
- `scripts/manage-sandbox-webhook.mjs` writes `.env.local` and registration metadata relative to its working directory. The old ignored session drivers also inherit broad environment settings. They must not be run unchanged for this isolated session. A dedicated controller must keep registration/configuration under the new run directory and leave ordinary `.env.local` untouched.

## Concrete session specification

| Item | Required value/boundary |
| --- | --- |
| Storage | New `data/sandbox-rehearsal/<run-id>/` containing only this session's DB, private manifest, attempt ledger and sanitized receipts. Never reuse/reset `data/nudge.sqlite`. |
| App | Existing source-matched passing production build; bind an available `127.0.0.1` port, record owned PID. Preserve any normal developer server. Generate a separate owner session token. |
| Agreement | Title: Fictional five-page marketing website; base USD1200. S1: Five responsive marketing pages are included. S2: Appointment booking, scheduling calendars and booking integrations are excluded. S3: Two minor revision rounds are included. Fictional client display name; privately verified generated sandbox recipient email. |
| Request | Please add appointment booking with available time slots. |
| AI | At most one separately resumed website conversation, canonical instructions/no tools/no skills/capabilities off/private local execution, requested `.anthropic-claude-5-sonnet-chat_completion`. Persistent pre-dispatch slot; failure consumes it. Record usage, then stop AI. Existing quota/exhaustion and E4 dashboard gaps stay visible; do not promise a token/cost cap. |
| Owner decision | Additional work, cite actual S2, rationale explaining booking exclusion, one neutral booking deliverable. Record scope decision before entering price. If result is unclear/wrong, review it honestly; do not tune/retry silently or fabricate support. |
| Client message | Appointment booking with available time slots is excluded by S2 of our agreed scope. This optional change adds that functionality for USD300; the original project scope remains as agreed. Owner edits/reviews this message before publishing it. |
| Extra | USD300.00 =30000 cents throughout quote, acceptance, invoice, checkout, audit and analytics. No base invoice, reminder, refund, payout or real-money transaction. |
| Environment | AI phase receives only necessary Elastic values; no PayPal secrets. Payment phase receives only necessary sandbox PayPal settings; no AI key. Both use the same isolated DB/token and mode=sandbox. Vendor licence values, if needed, remain private and their public/judge rights remain separate. |
| External operations | One logical draft-create attempt and one explicit send attempt, bounded read-only detail checks/OAuth. Buyer completes checkout manually using only sandbox credentials/funding. Do not automate login, add a real card, store a buyer password or change to live APIs. |

The controller must reject a changed amount/recipient/fixture identity, stale manifest, consumed create/send slot or uncertain previous attempt before dispatch. Its operation limits supplement existing application protection; they are **requirements for the next task**, not controls already implemented by this document. Persist attempted/returned identities privately and keep normal receipts free of URLs, IDs, emails and tokens. One logical attempt can include OAuth and validation GETs; report actual requests separately.

## Execution sequence for the later approved session

1. **Offline preflight.** Compare runtime/config to the passing production build. Validate the new run paths, environment allowlist, fixed USD amounts, generated sandbox buyer/email shape and actual PayPal sandbox account selection privately. Record existing app/relay/tunnel PIDs without stopping them. Confirm ordinary DB/env are not session targets and the session has no prior financial attempts. Resolve any missing prerequisite before starting inference or registration.
2. **Accept original scope.** Start the isolated app with no PayPal access. Save the fictional agreement using the real owner flow; Approve scope, then explicitly accept scope in the local client view. Bearer-link acceptance records a decision, not identity verification or an e-signature. Keep links out of logs/recording.
3. **One AI review.** After the bounded check is resumed, submit the exact request through the website. Inspect schema/citation/summary and actual usage. Preserve the resulting draft and original analysis. On any failure, stop inference, retain sanitized evidence and diagnose; no automatic retry. Repeated unresolved failures should be packaged without secrets for the owner's other agent.
4. **Switch phase.** Stop only the session app and confirm its loopback port closes. Restart that app against the same run DB with AI disabled, no Elastic key and no AI-only fetch preloader. Retain its owner token. Confirm the same accepted agreement and proposal survived. No direct DB edits or analysis import.
5. **Owner/client review.** Record actual owner scope decision, set USD300, review message/deliverable, confirm reviewed extras and Approve proposal. In the local client view inspect the same message/price and choose Accept work & price. Verify proposal identity/status and amount before permitting any create attempt. The original scope stays unchanged.
6. **Create/send.** Owner selects Create PayPal invoice once for this accepted extra; verify returned identity, merchant/recipient, one booking item, USD300 total and draft status privately. Then Approve & send invoice once. If a response is lost, keep the same proposal and attempt markers: inspect authoritative details and use existing guarded recovery as applicable. Do not rerun a create/send helper or clear a marker to obtain a cleaner video.
7. **Buyer/payment.** Owner opens only the confirmed sandbox payment URL for that invoice. User signs in as the generated sandbox buyer and reviews USD300. If checkout is stuck/uncertain, first inspect this invoice's authoritative state; never advise another payment merely from a thank-you page or stale local status. Stop on an unexpected real-money page/account/funding request.
8. **Reconcile/display.** Use the route below, clearly identifying its provenance. Verify authoritative invoice identity/USD300/PAID/zero due. Then open owner Analytics and explicitly refresh its recorded snapshot; show actual invoice row/totals and Invoice checks widget without fabricating overdue warnings. Preserve the Activity trail. Final footage must match this exact quote/invoice, not another payment.
9. **Stop and retain.** Close owned browser contexts/servers and any connectivity using the cleanup procedure below. Retain the isolated run for review; do not reset/delete it just because a step failed. Normal app/env/data and repository settings remain untouched.

## Payment evidence route

**Minimum functional route:** keep everything loopback; after buyer checkout use explicit Refresh status or the labelled automatic fallback. A valid PayPal-authoritative PAID/$0 result proves reconciliation. Describe it that way. No tunnel is needed for this route; it does not close P5 fresh PAID-webhook evidence.

**Optional P5 route, separately approved before activation:** one temporary webhook-only endpoint can also capture genuine payment-triggered delivery on this same invoice, avoiding another fixture/payment just for a webhook claim.

- Start the relay bound to a separate loopback port targeting only the isolated app. Tunnel targets that relay, never the owner app. HTTP/2 worked previously, but DNS/TLS/readiness must be checked anew; do not weaken certificate validation, change system DNS or open a firewall to force a result.
- Before registration, require public dashboard/workspace/session/client paths404 and webhook GET405. Register only the session URL on the existing sandbox app, retaining only its own returned registration ID privately. Do not update/delete another registration. Inject that webhook ID into the isolated payment child only and restart it before create/send/payment; ordinary `.env.local` stays untouched.
- Require an unsigned webhook POST401. Once SENT state is established, close **all owner tabs/automation contexts for this run**. Restart only the isolated app on the same owned port/DB with its session webhook ID, to eliminate any in-flight owner reconciliation; do not reopen an owner client. Establish the unpaid pre-payment baseline through read-only SQLite before buyer checkout. The evidence observer must read SQLite read-only, not owner GET/Refresh status. No other process may reconcile this DB during the observation window.
- Observe for at most180seconds after the buyer confirms checkout. Success needs a newly persisted event matching this invoice and `INVOICING.INVOICE.PAID`, successful application signature verification, matching audit, authoritative USD300 PAID/$0 and no competing reconciliation path. Correlate the first paid-state audit/transition: if a delayed SENT notification already reconciled it to PAID, report that fact rather than attribute the earlier transition to the later PAID notification. A signed-header log, SENT event or HTTP200 alone is insufficient. A partial payment does not satisfy full settlement.
- If it times out or fails, keep payment outcome separate from delivery. Stop the webhook observation and inspect read-only state; then explicitly reconcile the **same invoice** if needed, labelling that fallback. Do not pay/create again or call the transition webhook-verified. A later replay can prove signed handling but cannot retroactively prove original payment-triggered delivery.
- A separately bounded genuine duplicate redelivery can verify one persisted event/audit without another payment. Record original delivery separately from this replay and perform it only after identity/signature success. Existing P2 duplicate evidence already exists; do not expand into a replay campaign.

## Failure and cleanup decisions

| Situation | Action |
| --- | --- |
| AI failure/unknown usage | Consume slot, retain error category, stop. No another-model fallback or paid upgrade. |
| Create/send timeout | Preserve original attempt and ID if returned; inspect the same remote invoice. No new proposal, marker clearing or repeated financial POST. |
| Buyer result uncertain | Inspect authoritative existing invoice first. Leave UI waiting/unknown rather than assert failure or repeat checkout. |
| Delivery unavailable | End bounded observation; label explicit/polling reconciliation accurately. Keep P5 open. |
| Session registration cleanup fails | Keep its private manifest and report cleanup incomplete. Stop public tunnel/relay promptly anyway. Recheck only that registration with a read-only lookup before another exact-ID cleanup attempt. Do not delete all app webhooks. |

In every exit path, stop the session-owned tunnel first if exposure cannot otherwise be bounded. Remove only the registration this run created (verify exact ID and URL); confirm its absence with a list/read, never rely only on an empty local setting. Stop only owned app/relay/browser processes, then verify their loopback ports refuse connections. Retain sanitized operation/usage/status and cleanup outcomes; never swallow an incomplete cleanup as overall success. Session deadlines are operation limits, not payment-link expiries. No restore/reset of ordinary database or environment is part of cleanup.

## Completion and next task

P4a preparation is complete when this document is cross-linked and source-checked. **P4b is next:** implement/test the isolated session controller's manifest, path/env/phase transitions, one-create/one-send attempt controls and cleanup using fictional transports first. Review real commands and specific external operations with the owner only once that concrete implementation is ready. Existing create/send routes and relay are reused; application architecture, dependencies and financial business rules do not need a redesign.

P4 owner activation review, P5/P6 execution and F5 matched rehearsal/video remain open. E4 dashboard reconciliation, licence/free judging access, source-publication decisions and R6 Narrator/actual zoom/physical-touch checks remain separately pending. This plan does not establish a hosted demo, sponsor extension, trial quota or measured human benefit.
