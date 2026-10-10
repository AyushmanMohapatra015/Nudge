# Browser artifacts and export privacy checkpoint

October 10, 2026. Action-plan R3a, while live AI remains deferred. Fictional isolated evidence only; no real provider credentials, ordinary database, licence, payment or deployment changes.

## Build and public artifacts

`npm run privacy:browser` extends the existing reviewed Postman isolation runner with an explicit `--review-browser-artifacts` option. The source copy excludes environment files and normal data, uses installed dependencies, and builds outside the owner's active cache. Five unique synthetic markers stand in for PayPal/Elastic/Anthropic/Astropods credentials and the owner token in the **build child only**. Live AI stays false; the preloaded guard rejects provider fetch. The later runtime server receives the original credential-free simulation environment, not the markers.

The generated `.next/static` tree contained16 files. None contained any of the five marker values, and no browser `.map` files were emitted. There was no application `public/` directory in this build. The helper scans bytes and reports only relative artifact paths/categories, with bounds and symlink checks; it never prints marker values. A unit test confirms that a deliberately contaminated asset/source map is detected rather than silently accepted.

This is a literal-marker check on a local production build. It does not prove that runtime HTML/RSC, encoded/transformed values, future bundles or hosted infrastructure cannot leak data. Server bundles/logs are not public browser assets and were not presented as publishable artifacts. The installed Next guide documents disabled production browser maps by default; actual absence was verified here rather than inferred only from configuration.

## Data projections and actual downloads

Reviewed ownerAnalytics → studioData: Studio receives generated record labels, statuses, due dates and selected monetary measures; raw client identity, client token, PayPal invoice ID, proposal ID, model rationale and owner audit records are not forwarded. The private client API intentionally returns approved agreement/quote terms and visible invoice identity/payment link, with drafts and owner-only fields excluded. Existing tests for both projections passed in the full suite. Intended client financial details are not anonymity; the bearer link must remain private.

The existing `studio-exports.spec.ts` was rerun against this isolated production copy. Its one browser scenario verifies actual invoice/change/ageing CSVs, exact serialization and USD precision, filter/highlight/reset behavior, empty export suppression, PNG signature/dimensions and unchanged workspace/audit state. All three CSVs explicitly exclude the fictional client name/email/token and raw invoice/proposal IDs. The browser scenario passed in18.7seconds including setup; that is test duration, not product performance or user time-saving evidence. No new screenshot visual review is claimed; the previous PNG visual review remains in STUDIO_EXPORT_REVIEW.md.

Server-side Analytics passes `NUDGE_AG_STUDIO_LICENSE` intentionally to the licensed browser component after owner access checks in sandbox. It is a browser-visible vendor licence, not a server credential or owner authentication token. The real licence was neither loaded nor inspected in this task; hosted evaluation/public-source permission remains a separate sponsor checkpoint.

## Verification

- All127 offline tests and TypeScript pass, including the new artifact-helper test and extended private-link pattern test.
- Current-source targeted scan is clear. Its client-link detection now covers both legacy UUID and current48-hex rotated tokens.
- Isolated production build passed;16 browser artifacts/zero marker findings/zero browser maps.
- Postman Newman:31 requests/50 assertions pass; zero provider fetch attempts, temporary server stopped normally.
- Actual AG export browser scenario:1 passed, temporary server stopped normally.
- Ignored run: `data/postman-workflow/fa0091d5-9b95-457a-867f-9a3a8cdb46d1`. The ignored browser config points only to that run; ordinary dev server/cache/data remain preserved.

## Remaining disclosure work

R3b remains open: two sandbox verification helpers (`scripts/prepare-payment-webhook.ts`, `scripts/sandbox-webhook-invoice.ts`) and their fixture test retain a fixed operational-looking invoice identity. Those helpers are not browser exports, and the identifier is not a credential. Move actual fixture selection to private configuration while preserving exact-identity safeguards and using clearly fictional test IDs; this must not create, replace, send or pay an invoice.

R2b remains the owner's decision about one older commit's non-noreply identity metadata. This task does not clear public release. R4 covers assets/dependency notices/licensing; runtime and hosted privacy checks remain necessary before exposure. Arbitrary user-designed report configurations/formats, real owner exports and every external data path are outside this small-fixture evidence.
