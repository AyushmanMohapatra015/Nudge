# PayPal rejected-token recovery without operation replay

October28,2026. C7 is local backend failure recovery under the core-first plan. Existing proactive expires_in-based refresh remains in place. This change handles rejection before the cached expiry deadline.

## Reproduced problem and correction

PayPal documents finite access-token lifetimes and [HTTP401 handling](https://developer.paypal.com/reference/get-an-access-token/). Nudge already expires its cache60seconds early. However, when PayPal rejects a still-cached token, the previous implementation kept using it on subsequent requests until the local expiry. The new mocked regression failed when a later independent read reused that rejected token.

lib/paypal.ts now retains the token used for each request and invalidates the cache on401 only if the cached token is still that same token. A late401 from an older request cannot discard a newer cached token. The failed request still throws the same sanitized error. There is no immediate token request, operation retry, fallback or financial replay.

A later status check may obtain fresh authentication normally.403 and other failures do not indiscriminately reset authentication. Fresh authentication does not clear invoice creation/send/reminder uncertainty or grant approval. The existing persistent attempt markers and owner-review gates remain authoritative. This does not assert that every401 means expiry; refreshing once on a later request does not repair bad credentials or permissions.

## Meaningful regression

tests/paypal-auth-recovery.test.ts uses mocked sandbox endpoints and one fresh ignored fictional database. It exercises:

1. A rejected POST is dispatched only once. A later independent read obtains a fresh token and succeeds; the provider's private error text is not exposed.
2. A403does not refresh the cached token, and a subsequent allowed read reuses it.
3. One delayed rejection is held while another request invalidates the old token and a fresh read caches a new one. Releasing the older401does not invalidate the new token.
4. The actual owner send route receives401, preserves pendingSend and blocks a second send without another provider call. A later read refreshes authentication, but a remote DRAFT response keeps the uncertainty marker and does not resend.

Only fetch is mocked; route/auth/storage and the PayPal adapter execute normally with fictional settings. A manually released promise controls the concurrency case. No production keys/env/database or real provider operation is used. Earlier invoice-recovery/payment/webhook safeguards were included in the focused run. This is an offline failure-injection result, not live expired-token evidence or distributed-cache coordination.

## Actual validation

- Before the fix, the new regression failed on the later read with401.
- After the fix,14focused PayPal/recovery/privacy/payment/webhook checks pass.
- Full offline backend suite:264reported tests,262passed,0failed/cancelled,2explicit Windows symlink skips (storage-sidecar and offline-evaluation path checks).
- Nonincremental TypeScript passes.
- Fresh disposable production build passes; Postman/Newman47requests/77assertions and restart persistence pass,0failed assertions/provider-fetch attempts. Receipt: data/postman-workflow/89332455-fd42-4566-8edf-5a43d18e10eb/summary.json. Independent-cleanup.json confirms the owned loopback port returns ECONNREFUSED; normal development server preserved.

No new browser suite was run for this shared server-adapter correction. Installed Next testing guidance was read before edits. Existing SQLite experimental and dependency deprecation warnings were non-failing; dependencies/configuration were not changed to hide them. Future live/build checks must use this matching new production source rather than a stale pre-fix copy; do not reopen consumed financial permissions.

No UI, dependency, normal environment/database, Elastic call or deployment changed. The existing paid sandbox record remains untouched. Current one-case Elastic success does not establish the cause of the earlier awaiting_prompt result or numerical remaining allowance. Fresh actual payment-triggered webhook, hosted Linux/HTTPS/durability, user/manual and publication/judge-access gates remain separate.
