# PayPal error and relay-log privacy

Verified October 5, 2026 with fictional provider responses and local HTTP only.

## Changes

The PayPal adapter no longer forwards provider error bodies, descriptions, field names, debug identifiers or transport exception text into errors visible to the owner. HTTP failures retain only the numeric status and fixed instructions to check sandbox access and reconcile uncertain actions. Malformed success responses and transport failures use fixed messages. Successful empty responses remain supported.

OAuth responses require a non-empty token and a numeric lifetime greater than sixty seconds before caching. PayPal requests reject redirects, so a redirect is treated as an uncertain transport failure rather than followed. Existing creation/send uncertainty markers and reconciliation rules are unchanged; a sanitized failure does not authorize automatic retry.

The temporary webhook relay logs only its component name, HTTP status and a boolean indicating signature-header presence. It no longer parses or logs event IDs/types from the submitted body. Header presence does **not** establish signature validity; the application still performs verification separately. Relay forwarding and application audit records retain their existing behavior.

## Evidence

- 62 server tests pass, including injected provider bodies containing fictional email/secret/scope text, malformed JSON, transport exceptions, successful empty responses and hostile relay event fields.
- Existing recovery tests still verify one creation/send across lost responses and subsequent recovery.
- TypeScript and an isolated production build pass. No UI changes; the previous eight browser tests remain the latest browser evidence.
- No actual credentials or workspace records were read for this task. No live PayPal/model calls, public tunnel, financial actions or credits used.

## Remaining boundaries

This is a targeted fix, not a complete privacy or logging audit. Authorized workspace records intentionally contain client data and invoice identifiers. Next.js development request logs can include client-link paths; avoid sharing terminal output containing private links. AI transport/configuration failures, unexpected database errors, other helper scripts, hosting/access logs and provider retention still need review. Never publish environment files, raw API responses or the local data folder. Numeric HTTP statuses and fixed messages aid diagnosis but no longer expose PayPal's detailed debug text.
