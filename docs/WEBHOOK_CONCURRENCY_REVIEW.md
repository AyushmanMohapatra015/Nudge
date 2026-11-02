# Webhook concurrency: preserve newer payment state

October28,2026. C6 is a bounded backend correctness task while external Elastic/Render follow-ups and visual work remain checkpointed. No real PayPal/AI request or deployment was needed.

## Reproduced gap

The signed-webhook handler verifies a notification, reads a local invoice, awaits an authoritative PayPal lookup, then writes the returned financial fields. Its existing processing guard blocks an owner action still running at commit time. It did not detect another webhook or completed owner action changing the workspace while the lookup was in flight.

The new offline regression first failed against the unchanged handler: both a delayed older lookup and a lookup spanning a new uncertain-send marker returned200 instead of rejecting the stale result. The source's field assignment could replace newer payment status/balance or pendingSend evidence. This was reproduced with controlled mocked responses and fictional SQLite only; no claim that an actual user's payment record was corrupted.

## Fix

app/api/paypal/webhook/route.ts retains the workspace snapshot/version used for the lookup. Inside the existing SQLite transaction it first preserves the busy-workspace and duplicate-event checks, then requires the current version to match that snapshot before applying the response or recording the event. A version conflict throws and rolls back; the existing503 response requests a fresh delivery. No create/send/reminder/payment operation is replayed by this handler.

This deliberately uses the global single-workspace version. Even an unrelated intervening mutation may trigger503 rather than applying a possibly stale snapshot. That is a conservative throughput tradeoff for this prototype. Concurrent already-processed copies still acknowledge successfully without duplicating the financial update/event/audit. Existing transaction bookkeeping may advance the version on that overlapping duplicate path; no version-no-op claim is made for it.

## Deterministic regressions

tests/webhook-concurrency.test.ts uses manually released promises rather than timed sleeps:

1. Hold an older SENT/unpaid lookup, commit another verified delivery's PAID/zero balance, then release the older one. It returns503, preserves the entire newer workspace and leaves its event unprocessed. A fresh retry reads current PAID state and succeeds; a later duplicate does not perform another invoice lookup or alter state.
2. Hold a DRAFT lookup, record a new uncertain owner-send marker and release the older result. It returns503 and preserves the exact newer workspace/marker; no event record is committed.
3. Overlap two deliveries of the same event. The second commits PAID first; the older one does not regress it or create another event/audit entry.

Mocked OAuth/signature/invoice fetches remain intercepted. Environment changes are test-local and database paths are fresh ignored fixtures. These are in-process route/storage concurrency checks, not a multi-host, live-signature or actual PayPal redelivery guarantee. The fix rejects stale results across an observed local mutation; it does not promise that every later provider GET is free from provider-side eventual consistency.

## Actual verification

- Red check before the fix: two new subtests failed the expected stale-result rejection; same-event overlap passed. Parent reports failure as well.
- Focused webhook/payment/reconciliation checks after the fix:14passed,0failed/skip.
- Complete offline backend suite:260reported tests,258passed,0failed,2explicit Windows symlink skips (storage-sidecar and offline evaluation symlink scenarios). No other skipped/cancelled outcomes.
- Nonincremental TypeScript: passed.
- Fresh disposable production build: passed, using installed dependencies and source copied after the fix.
- Postman/Newman on that production build:47requests,77assertions,0failed assertions; restart preserves invoice/approval/delivery/policy/audit/client state. Provider-fetch guard remained quiet.
- Production workflow receipt: data/postman-workflow/5629e496-ded1-46b8-9aaf-f46779d7afbe/summary.json. Independent cleanup receipt in the same run confirms the owned loopback port returns ECONNREFUSED. Ordinary development server was not stopped.

No frontend/browser suite rerun was necessary for this route-only change. Historical browser evidence is not counted as a fresh result. Relevant installed Next Route Handler guidance was read before editing. Tests emitted the existing SQLite experimental warning; the production helper emitted a dependency deprecation warning, without a check failure or dependency change.

## Remaining core work

This closes C6's demonstrated stale-webhook race. It does not close Elastic awaiting_prompt diagnosis/resumption, numerical AI allowance/independent quality evaluation, fresh actual payment-triggered signed webhook evidence, hosted Linux/HTTPS/disk/restore checks, sponsor/judge access, human/manual reviews or publication/submission. Preserve the already verified USD300 sandbox record. Do not add unrelated backend features just to increase scope.
