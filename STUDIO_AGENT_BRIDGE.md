# Studio runner-to-transport bridge: offline evidence

October 10, 2026. `lib/studio-agent-bridge.ts` translates the guarded backend's bounded reply into Studio text events. It is **not registered in the website**, and the production endpoint still has no model adapter. This checkpoint does not activate a chat feature or consume AI allowance.

## Data and execution boundaries

The bridge takes the latest user message, validates a trimmed 1–1000 character question and reads the validated current snapshot version. It sends only `{ expectedVersion, question }` to the fixed same-origin `/api/analytics/agent` POST endpoint. It sends no history, totals, tool definitions, record rows or credentials in the JSON body. Existing same-origin session cookies supply authentication when used in an actual browser; no provider key belongs in this bridge. Questions are free text, not redacted: disclosure and allowance approval remain prerequisites for live use.

Requests disallow redirects and caching, propagate cancellation and have a 12-second client deadline. There is no automatic retry. Replies must be JSON and are read with an 8192-byte limit. Strict validation bounds text and reported usage, rejects unexpected fields, and requires `stateSource: local-records`, the expected version and exact snapshot timestamp. The current browser snapshot is rechecked before emitting any answer. Failures display a fixed message without raw provider details. Owner cancellation emits no answer. A valid reply becomes text events, never an executable command or tool call. Semantic accuracy of its text is not established by protocol validation.

The existing read-only analyst definition remains the sole available tool set in the fixture. Its automatic totals read precedes the bridge turn. The backend independently derives its totals from its own snapshot; it does not trust that client tool output. This bounded bridge does not transmit tool results or support remote tool-calling, built-in Studio agents, dashboard generation or delegation.

## What the browser tests prove

`tests/browser/studio-agent-bridge.spec.ts` uses actual Studio, `clientToolRunner` and `createAiHarness`. Playwright intercepts a fictional loopback page and its POST request, then invokes the real guarded server factory with a fictional signed owner session and an injected mock adapter. Every other browser request is blocked; Node provider fetches throw. No HTTP server is started, no real session or database is read, and no local environment or licence file is loaded.

Eight cases cover successful displayed text; sanitized adapter failure; server and browser snapshot changes; extra reply fields; wrong reply version; oversized response; and cancellation without later display. Each asserts one request/adapter call, exact minimal request fields, unchanged monetary totals and no browser runtime errors. The server-stale fixture intentionally changes only its version. Cancellation here proves browser abort/no display; interception does **not** prove a browser disconnect reaches a real server's abort signal. That propagation remains a deployed/live transport checkpoint; server cancellation already has separate mocked handler tests.

Four additional offline unit tests cover invalid/pre-cancelled input without requests, same-origin/no-redirect/minimal payload behavior, HTTP/content/schema/usage/source/timestamp failures, and simulated deadline/owner-abort behavior without retries.

## Verification and next gates

Final verification: all109 offline tests, all14 Studio harness/bridge browser checks (six existing harness cases plus eight bridge cases), and TypeScript pass. `git diff --check` is checked separately. The sandbox's Windows user-profile lookup prevented the first tsx invocation; the approved offline suite rerun outside that restriction passed. No live credentials or provider requests were used.

Run the offline harness and bridge suite with:

```powershell
node node_modules/@playwright/test/cli.js test --config playwright.studio-agent.config.ts
npm.cmd test
npm.cmd run typecheck
```

No production registration, live provider, PayPal payment, hosting or subscription changes are part of this checkpoint. Previous build/Postman/Analytics evidence remains historical, not a fresh run of those checks. The next AI integration prerequisite is an enforceable persisted request allowance with explicit activation approval; process-local caps and reported token bounds are not a monetary guarantee. Live semantic evaluation, fresh-payment webhook delivery, freelancer feedback, manual/vendor accessibility and hosted licence/storage/judging access remain open.
