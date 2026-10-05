# AI error privacy and logging review

October 5, 2026. Verified using fictional data and injected transports only; no live AI access or allowance used.

## Implemented

Anthropic and Astropods scope requests now reject redirects and use no-store. Transport failures use a fixed message without the underlying exception, URL or provider text. Malformed JSON and schema failures use a fixed manual-review message; unknown response keys are rejected. HTTP failures retain only the numeric status and existing access guidance. Malformed Astropods gateway URLs no longer expose the URL parser's exception. Clause-reference failures remain concise, fixed local messages. No automatic retries or simulation substitution were introduced.

The provider-independent brief-extraction boundary now hides transport exception text and schema/evidence-validation details from callers. Timeout, refusal/incomplete and oversized-output messages remain distinguishable. Extraction still has one attempt and no workspace writes. The standalone validation function retains detailed errors for offline evaluation; it is not a live provider endpoint.

Elastic's existing fixed transport/output errors were inspected and left unchanged. Its live runtime compatibility and model allowance remain unverified. The server-side AI enable gate remains unchanged and local credentials were not inspected or modified.

## Verification

All 64 server tests, TypeScript and an isolated production build pass. Mock cases inject fictional private text into transport exceptions, invalid URLs, malformed JSON, invalid model fields and quota-error bodies; errors omit that text and request counts remain one per attempt. Existing citation, hold, timeout and extraction tests pass. No UI changes; the previous eight browser tests remain the latest browser evidence.

## Logging inventory and limits

Application API handlers contain no explicit console payload logging. The temporary webhook relay already logs only component, HTTP status and signature-header presence (not signature validity). Postman checks emit sanitized status/assertion counts. Database maintenance prints relative output paths and aggregate counts; unknown failures use fixed messages.

Several operator-only sandbox scripts deliberately print invoice IDs, event IDs or payment URLs needed for local verification. Their output is private operational data, not shareable evidence. A subsequent helper-output task replaced raw failure text in the PayPal checker, webhook management and older invoice/fixture helpers; see HELPER_OUTPUT_PRIVACY.md. Successful operational output still needs to remain private.

Next.js development request logs may contain bearer client-link paths, and unexpected database/runtime exceptions are not uniformly translated to safe application errors. Infrastructure access/error logs, provider retention, historical logs, and full authenticated workspace/audit data need separate review. Valid AI output is intentionally visible to the owner and may repeat submitted text; error sanitization is not output redaction or semantic safety. No complete logging/privacy audit or production-readiness claim is made.
