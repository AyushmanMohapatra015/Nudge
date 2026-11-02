# AI authority boundary regression

## Fallback provider outcome checks — October 10

The Anthropic/Astropods parser previously selected the first `report_scope` tool result without checking for additional tool requests, duplicate reports or an explicit incomplete stop reason. `lib/ai.ts` now requires exactly one reporting tool, rejects other tool/block types and rejects a present stop reason other than `tool_use`. Ordinary text accompanying the sole report is permitted; it is not used as scope data. An omitted stop reason remains compatible with existing gateway envelopes, so omission alone does not establish provider completion. The strict five-field report/reference checks still apply.

`tests/ai-outcome.test.ts` exercises both providers with mocked truncation, pause, refusal, end-turn/null reasons, duplicate reports, foreign tools in either order, server tools, null blocks and missing reports. Each rejection makes one mocked request, exposes a fixed error and performs no retry or simulation fallback. Single valid reports with an omitted reason and explicit tool-use completion remain accepted. These checks reject unsafe returned outcomes locally; they cannot undo provider-side work or prove the remote provider performed no extra action. The requested API tool list still contains only the reporting tool.

All121 offline tests and TypeScript pass after this implementation change. Isolated production build/Postman verification is recorded in the newest handoff checkpoint once completed. Elastic configuration, live-use flags, ordinary workspace, credentials and licence remain unchanged; no real provider calls were made.

October 10, 2026. Two additional offline regressions in `tests/elastic-ai.test.ts` verify the existing scope-analysis boundary. Application implementation is unchanged. All responses are injected fictional mocks; no Elastic, PayPal or other remote service was called.

## Verified behavior

The first test places hostile instructions in the agreement title, a clause and the client request, including JSON-shaped configuration overrides. It inspects the actual serialized Elastic request: text remains evidence data, access remains private, tools and skills remain empty, capabilities remain disabled, and the canonical instructions remain unchanged. An injected response containing `amountCents`, `status` and `sendInvoice` is rejected by the strict analysis schema after one mocked request with no retry.

The second test exercises the authenticated owner HTTP handler against an isolated fictional SQLite workspace. A response containing price, approval timestamp and invoice instructions is rejected; agreement, proposals and invoices remain unchanged and the processing lock clears. A subsequent deliberately incorrect but schema-valid response says excluded booking is included and cites existing S5. It creates only a zero-price draft, with no approval or acceptance timestamp, no agreement mutation and no invoice. Its semantic error is intentionally preserved in this fixture.

This distinguishes authority enforcement from interpretation quality: a real clause ID and valid JSON do not establish that the model's conclusion is correct. Owner review remains necessary before proceeding. These tests do not establish resistance of a live model to injected text, provider-side tool behavior or independent human usefulness.

## Verification and limits

- `npm.cmd test`: 120 tests passed, including the two new regressions. The sandbox initially failed during the Windows profile lookup before tests ran; the approved outside-sandbox offline rerun passed.
- `npm.cmd run typecheck`: passed.
- Production build and browser checks were not repeated because only tests and documentation changed. Prior evidence remains historical evidence for the unchanged implementation.
- Ordinary environment, database, licence, live-use flags and grants were not changed. Fixtures use generated paths under ignored `data/`; fake credentials exist only in the test process and are restored afterward.

Existing brief tests reject unknown executable fields, fabricated evidence and unsupported conversions. Literal source evidence still does not prove a quoted price or recipient is agreed: a misleading instruction may itself occur in the source. Real-model injection evaluation in both briefs and requests, independent semantic review and provider usage reconciliation remain open. Do not describe this regression as a complete AI security audit.

Next: collect independent saved-output reviews and freelancer interviews, clarify sponsor allowances/licensing, and use explicit bounded authorization before any live evaluation. Sponsor extension requests do not automatically enable model calls.
