# Dashboard analyst transport: guarded, not live

October10 persistent-admission follow-up: STUDIO_REQUEST_ALLOWANCE.md supersedes the missing durable request-control note below. Before adapter execution the transport now reserves from an explicit expiring SQLite approval, with no approval/no slots/storage error denying execution. Failed and uncertain attempts retain reservations; production still has no adapter or actual approval. This is dashboard attempt accounting, not a global AI allowance or monetary guarantee. Existing process-local rate/concurrency checks still apply.

October10 follow-up: STUDIO_AGENT_BRIDGE.md records a prepared, unregistered reply-to-Studio-events bridge and offline runner/handler interoperability. This supersedes the earlier next-bridge task below. Production remains disconnected; intercepted requests are not deployed HTTP/model evidence, and persisted allowance controls remain pending.

October 10, 2026. `/api/analytics/agent` now has a POST handler and a reusable server transport factory. The website registers **no model adapter**, so configuration flags alone cannot activate it. There is no new chat UI, provider integration or AG-UI streaming bridge.

## Request and data boundaries

Origin checks and existing signed owner sessions apply before any snapshot or adapter work. Demo mode cannot activate an adapter, even through its otherwise unauthenticated workspace access. Production remains disconnected. Only tests inject a trusted mock adapter and enable callback; browser input cannot configure these.

The only accepted JSON fields are `expectedVersion` (nonnegative safe integer) and `question` (1–1000 trimmed characters). Extra fields, client-supplied totals/tools/history, incorrect content type, invalid JSON and oversized bodies are rejected. Body reading is bounded to8192 bytes and five seconds. The handler loads stored owner records without seeding or reconciliation, derives totals on the server, and uses shared `studioSnapshotSummary` validation/projection. It excludes identities, tokens, URLs, rows, remote IDs and unexpected runtime metadata. The free-text question itself is not redacted; a future UI/provider integration must disclose and review what user text is transmitted.

Snapshot versions are checked before an adapter call and again before returning an answer. All responses use `Cache-Control: no-store`. Transport/provider errors are replaced by fixed messages; there are no automatic retries, stored conversations, financial actions or raw error logs.

## Limits and cancellation

- Default admission cap: four authenticated enabled requests per minute, including failed attempts. Excess requests receive429 and Retry-After.
- One in-flight request per handler instance. A concurrent request receives409.
- Default adapter deadline: ten seconds. Client cancellation and timeout abort the adapter signal and return408/504 respectively.
- If an adapter ignores cancellation, the handler retains its concurrency lock until that adapter actually settles. Timeout does not quietly permit an overlapping retry.
- The adapter receives `maxOutputTokens: 256`. Responses require text of1–2000 characters and integer reported usage bounded to4096 input/256 output tokens. Unknown reply fields are rejected.

These are process-local request/response limits, **not a verified monetary budget or sponsor-credit guarantee**. They do not coordinate replicas or survive restarts. An eventual adapter must enforce provider-side output limits and accurately report usage. Rejecting excessive reported usage cannot undo already incurred provider usage. A durable allowance/budget gate and owner approval remain required before live activation. No adapter or paid subscription is activated by this task.

## Verification

Eight new offline tests cover production disconnection even with the enable flag set, auth/origin, demo-mode denial, server-derived/private-field-free totals, hostile input, rate caps, timeout/concurrency retention, client cancellation, malformed replies/usage, sanitized failures and now-stale results. All105 offline tests and TypeScript pass. Actual sandbox authorization is tested through route-handler calls with fictional signed sessions; deployed sandbox access has not been exercised here.

Six real Studio harness browser scenarios pass after extracting the shared summary helper. Four Analytics/HTTP checks pass against the final isolated production build, including the new disabled-endpoint503/cross-site403/no-store/state-preservation test. The final build and existing Postman31 requests/50 assertions pass; the Postman collection itself has not been extended for this endpoint. Temporary servers stop normally. Prior broader Studio export/layout/accessibility tests remain baseline evidence, not fresh runs this checkpoint.

All model adapters in these tests are mocks. Provider fetches are forbidden or guarded, fictional records stay in ignored data, and no ordinary workspace, local environment/licence, billing, model usage or PayPal payment changes occurred.

Next bounded task: test the bridge between Studio's scripted runner and this transport contract, retaining the disconnected production route. Live model access, validated spending controls, semantic response quality, accessibility, hosting/licence, fresh-payment webhook and freelancer research remain separate checkpoints.
