# Sandbox helper output privacy

October 5, 2026. This task changed operator tooling only; application/UI code is unchanged.

## Updated boundaries

`npm run paypal:check` delegates to an injectable read-only checker. It validates configuration before access, uses only sandbox OAuth and invoice-list requests, rejects redirects, keeps timeouts and no-store, validates the returned token, and reports fixed messages plus numeric HTTP statuses. It never prints provider bodies or transport/JSON exception text. A successful list HTTP response proves API access, not invoice reconciliation or payload validity.

The webhook management CLI catches failures with fixed reconciliation guidance rather than uncaught exception stacks. Unknown operations, non-sandbox mode and missing credentials fail before networking; tokens must be non-empty strings. Its requests reject redirects. Registration/replay/cleanup still require their original operational authorization; editing the script is not authorization to run those commands. Remote actions can succeed before a failure, so the error explicitly warns to inspect registration before retrying.

The older invoice-test, recipient-correction and webhook-fixture CLIs now print fixed failure messages rather than arbitrary exception text. Their successful operational outputs remain unchanged: some include invoice/event identifiers and payment URLs needed for local verification. Treat those outputs as private and do not paste them into public documentation, recordings or support messages.

## Evidence and remaining work

All 66 server tests and TypeScript checks pass. New tests inject private-looking fictional transport/JSON/body values into the connectivity checker, confirm only OAuth/list requests, verify no request for malformed local configuration and one attempt on failure, and execute webhook-helper failure handling with mocked networking. No live helper command, credential/workspace read, registration, configuration write, financial action or AI call occurred. Prior isolated production build and eight browser tests remain the latest evidence for unchanged application/UI surfaces; they were not rerun for this tooling task.

This does not remove private values from valid operational output, Node/Next.js framework logs, client-link request paths, unexpected database/runtime errors, hosting logs or provider retention. No complete privacy audit is claimed. See AI_ERROR_PRIVACY.md and PROVIDER_ERROR_PRIVACY.md for the earlier adapter fixes.
