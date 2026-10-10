# Studio export verification

October 10 R3a rerun: the existing actual CSV/PNG scenario passed against a fresh isolated production build; complete columns/privacy/filter/reset/state assertions remain valid for that fixture. The same build passed16-file synthetic browser credential-marker scan and Postman31/50 with no provider fetch attempts. See BROWSER_ARTIFACT_REVIEW.md for127-test/typecheck results, normal temporary-server cleanup, browser-visible licence distinction and remaining runtime/hosted/operational-identifier work. No new visual image inspection or arbitrary-report-format claim.

October 8, 2026. Actual browser downloads were checked against an isolated production build using fictional application workflows. No model or PayPal requests were made.

## Fixed

The initial widgets had empty titles. Studio 3.0.0 used the empty title as its filename stem, emitted `.csv`, and the tested browser saved it as `csv.txt`. The initial invoice, change and ageing widgets now have explicit meaningful titles, producing named `.csv` files. Titles and captions are explicitly enabled so the exported chart carries USD units and a stored-snapshot notice. Vendor files were not modified.

The Analytics page explains export scope. This verification covers the three initial report widgets; arbitrary owner-created widget configurations, manually cleared titles and other download formats are not covered.

## Verified downloads

| Export | Observed and asserted behaviour |
| --- | --- |
| Invoice balances CSV | Exact five projected columns; current $1,200.00 and overdue $800.00 records, statuses and dates match the fixture. Monetary cells contain USD amounts, not unlabelled integer cents. |
| Change quotes CSV | Exact three projected columns; approved quote retains $300.01. Invoice filters do not alter it. Quote amounts are not received payments. |
| Ageing CSV | USD-labelled aggregated measure contains 1,200.00 and 800.00. These are presentation values; backend financial authority remains integer cents. |
| Overdue chart selection | Invoice CSV contains only the overdue record. Chart CSV retains both groups because its cross-filter mode highlights rather than removes groups. Quote CSV is unchanged. |
| Current page filter | Invoice CSV contains only the current record; chart CSV contains only its current group. Quote CSV is unchanged. |
| Empty page filter and clearing | No invoice rows means the invoice export control is absent. Quote export still works. Clearing restores both invoice records and their export. |
| Chart PNG | Real download has PNG signature and 600×300 dimensions. Visual inspection confirms both bars, overdue highlighting, a USD title and the stored-snapshot note. This is an image, not structured financial data. |

CSV checks assert complete quoted serialization, complete headers/rows and meaningful filenames. Tested exports contain no client names, emails, client token, invoice IDs or proposal IDs. They intentionally contain owner financial report values. Stored workspace/version/audit remain exactly unchanged; dashboard requests make no API mutations and no browser runtime errors occur.

## Evidence and remaining gates

`tests/browser/studio-exports.spec.ts` executes the downloads, filter/reset paths, image checks and state/privacy assertions. All ten combined Studio browser journeys, TypeScript, production build and Postman31 requests/50 assertions pass on the final source. The prior92 backend tests remain baseline evidence; this change does not alter backend logic. Build and downloaded images stay in ignored `data/`, not Git. Temporary test servers stopped normally; ordinary workspace, local credentials/licence and the owner's dev server were preserved.

This is Chromium-based browser evidence for a small fixture, not large-dataset, spreadsheet-application or cross-browser certification. Existing vendor edit-mode accessibility findings and manual assistive-technology checks remain in [STUDIO_ACCESSIBILITY_REVIEW.md](STUDIO_ACCESSIBILITY_REVIEW.md). Hosted licence/judging continuity, live AI allowance, fresh-payment webhook and freelancer validation checkpoints remain unresolved.

Next bounded local task: prepare and test the Studio Agent Framework's read-only boundaries offline. Do not enable a live model or claim live Studio-agent integration while the AI-allowance checkpoint remains open.
