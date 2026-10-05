# Public request controls

## Implemented single-process safeguards

Owner login allows ten same-origin attempts per minute across the process, including successful, malformed and failed attempts. It returns 429/Retry-After without a session cookie on overload. Login bodies have a 4 KiB limit and ten-second read deadline. Rejected credentials/body checks do not set a cookie; successful sessions retain HttpOnly, SameSite=strict and an eight-hour browser cookie lifetime (Secure on HTTPS). Authentication responses use no-store. The shared quota can temporarily block the owner, resets on restart and needs edge protection before hosting. This is not per-user lockout, a distributed brute-force defence or server-enforced session expiry.

Client reads allow 600 requests per minute; same-origin client decision attempts allow 60 per minute. Excess requests return 429 with Retry-After and Cache-Control: no-store. Limits are shared across links in the process, including invalid attempts; no IP address, forwarded header, bearer token or request content is retained by the counters. Private-link validity, expiry, explicit POST acceptance and transactional rechecks remain required independently.

Client decision bodies are limited to 8 KiB and must finish reading within ten seconds. Webhook bodies are limited to 256 KiB with the same read deadline. The stream is counted in bytes, including chunked bodies without Content-Length; a misleading header cannot bypass the limit. Oversize requests return 413, client read timeouts return 408, and webhook read timeouts return 503 with Retry-After. No decision or successful webhook-event marker is written for these rejected requests.

Webhooks missing required signature headers are rejected before reading the body or contacting PayPal. Presence of headers does not establish authenticity: normal PayPal signature verification remains mandatory. Requests with those headers share a 120-per-minute process-local limit. Capacity rejection returns 503 with Retry-After, never successful receipt or a processed-event marker. A later delivery must still pass signature verification, authoritative invoice lookup and duplicate checks. Mocked regression tests verify existing legitimate delivery and duplicate/busy-workspace behavior; provider retry timing is not newly established by these tests.

## Limits of this protection

These are fixed-window counters in application memory, not distributed rate limits, authenticated sender quotas or DDoS protection. They reset on process restart/hot reload, apply independently across processes, and allow boundary bursts. Shared quotas can let abusive requests temporarily block legitimate requests. Forged complete signature headers can consume the webhook allowance; blocked work must remain observable and retryable rather than silently acknowledged.

Rate limits do not cap concurrent provider calls, already-buffered platform bodies, socket count or all resource use. The temporary relay has its own body limit, while these guards also protect the direct application route. No public tunnel, firewall rule, deployment or operating-system setting was changed by this task.

Before hosted judging access, review trusted ingress/edge rate limits, connection/body deadlines, legitimate event volume and multi-process behavior. Authenticated owner API limits and server-enforced session expiry remain separate review tasks. Never trust arbitrary X-Forwarded-For headers as verified client identity. Preserve authentication, expiry, approval, signature verification and idempotency even behind an edge limiter.

Tests exercise byte limits, malformed length claims, split UTF-8, stalled streams, window boundaries, route overload and unchanged state. This is mocked/local evidence, not a production load or external-provider reliability claim.
