# R7b1: bounded owner/client reads

October12,2026. A focused recovery change, not completion of all R7 states.

## Problem and behavior

Owner and client reads previously had no deadline or overlap control. Five-second polling could start another read while the previous one was pending, and a slow read could overwrite the response to a newer action.

`lib/browser-read.ts` now coordinates one current read: concurrent refresh calls share its promise; a ten-second browser timer bounds fetch and response-body parsing; cancel/deadline request transport abort; and obsolete completions cannot publish data or errors even if a transport ignores abort. Cancellation settles promptly and clears its deadline/listener. Read timeout uses the existing connection-error/retry UI, preserving action errors separately.

Both pages cancel any old read immediately before starting a write, suppress polling while that write is pending, and cancel reads on effect cleanup. An immediate ref also guards repeated owner/client actions before React renders disabled controls. Sign-in clears its action error and resets its pending guard on failure as well as success; refreshing after successful sign-in remains possible. Financial decisions are not retried automatically.

## Validation

Three targeted offline cases exercise a never-settling transport with timeout/retry/late completion; simultaneous refresh coalescing; and cancellation followed by fresh data and a stale rejected read. Four browser cases cover owner/client hung reads, no additional poll at five seconds, timeout/recovery, and owner/client writes while an old read is pending. Browser clock control advances actual application timers; it is not a real-world latency measurement. Intercepted fictional reads/writes plus the real local route verify UI/decision state without providers.

All25browser checks passed together (21existing plus4new). The3targeted offline tests, TypeScript, isolated production build and Postman31requests/50assertions with real process restart pass. No provider-fetch attempt occurred; owned test servers stopped. The first offline attempt could not start tsx because restricted Windows user-profile lookup failed; the approved retry passed, without changing application logic or test assertions. The prior129backend tests remain baseline evidence, not a new full-suite result.

Production/Postman checks used a disposable source copy and fictional SQLite records; generated test output stays ignored. No ordinary database, private credentials, paid model, PayPal operation, licence or public network exposure was used. Existing unrelated review/dev sessions were preserved.

## Limits and remaining tasks

- The deadline is a browser timer. Background suspension/event-loop stalls can delay it; it is not a server deadline, monetary limit or proof that remote work has stopped. One current accepted read does not guarantee only one server request across tabs or an abort-ignoring transport.
- Write requests are not given this read timeout. Hung or uncertain write outcomes need a separately reviewed presentation/reconciliation plan; do not replay financial operations based on a browser timeout. Existing backend locks/idempotency remain authoritative.
- R7b2 still covers remaining sign-in/loading/empty/busy/uncertain-operation presentation and failure cases. No complete sign-in or all-state sign-off follows from this change.
- Narrator, actual200/400% browser zoom and physical touch remain owner-assisted R6b/c checks in TESTING_CHECKPOINT.md. Known Studio edit findings remain open.
- A previously running fictional review may use an older cached build. Before a future manual session, stop only your own review terminal and relaunch `npm.cmd run a11y:manual` to select a matching verified current build. Do not stop unidentified sessions.
