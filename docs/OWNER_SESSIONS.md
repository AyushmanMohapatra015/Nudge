# Owner session lifetime

Sandbox owner sessions are signed, versioned tokens containing an issuance time and a random 128-bit nonce. The HMAC covers all fields using the locally configured owner secret. The token contains neither that secret nor workspace data. Server authorization rejects missing/malformed/oversized tokens, invalid signatures, future issuance and tokens at or beyond eight hours old. The browser cookie lifetime uses the same eight-hour constant; activity does not extend it.

Login retains HttpOnly, SameSite=strict, Secure on HTTPS and the existing body/rate limits. Authentication and unauthorized workspace responses use Cache-Control: no-store. A copied cookie cannot gain a later expiry by editing its timestamp. Changing the owner secret invalidates sessions signed with the earlier secret.

## Migration and operational limits

Old unversioned cookies are deliberately rejected after this update. Sign in again through the owner form using the existing locally configured workspace token. No secret, client link, approval, invoice or database record was changed by implementation. Keep the secret out of chat/Git. Client bearer-link expiry is independent of owner sessions.

These are stateless sessions for a single-owner prototype. A stolen valid cookie can be replayed until expiry or secret rotation; individual-session revocation, logout denylisting, idle timeout, MFA and multi-user identity are not implemented. Expiry is checked when a new owner request is authorized; it does not cancel an external operation already authorized and running. Existing operation locks and recovery markers still govern its completion.

Time validation relies on the server wall clock. Maintain correct time and consistent secrets if deploying multiple processes; a process restart does not revoke a valid signed token. Shared login quotas remain process-local and need trusted edge protection. Local HTTP is suitable for local development; hosted owner access must use HTTPS. Do not expose the shared simulation workspace as if it were authenticated or isolated.

Tests use fictional secrets and prove exact expiry boundaries, tampering, future timestamps, legacy rejection, changed/missing secrets, unique issuance and denied expired owner reads/actions without provider calls or state changes. The actual login response is checked for a valid signed cookie and retained flags. These are local tests, not a comprehensive security audit.
