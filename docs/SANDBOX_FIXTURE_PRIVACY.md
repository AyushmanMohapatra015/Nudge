# Private sandbox fixture selection

October 10, 2026. Action-plan R3b, current-source cleanup only. No operator CLI, real provider call, invoice creation/send/payment, normal workspace read/write, licence or credit use.

Both `prepare-payment-webhook.ts` and `sandbox-webhook-invoice.ts` now obtain the exact reference identity through `sandbox-fixture-config.ts` from private `NUDGE_SANDBOX_REFERENCE_INVOICE_ID`. Its public example is empty; the actual `.env.local` was not read or changed. A missing, malformed or oversized value fails before workspace mutation/network access. A valid-looking value must match the eligible local paid USD10 invoice with a generated personal sandbox recipient and the expected test project; there is no first-paid-invoice guess or embedded historical-ID fallback.

The fresh helper retains its draft-only behavior, separate confirmation, registered-sandbox check, process-owned lock, stable fixture identity, duplicate block and cached remote identity after an uncertain follow-up. Tests use `INV2-FICTIONAL-REFERENCE` instead of the actual operational identity.

The older create/send helper now also requires `--confirm-sandbox-fixture` and is import-safe. It remains an operator helper capable of sending when intentionally invoked; it is not the draft-only flow. Setting the private reference does not authorize running either helper. The already-paid test fixture must not be replaced or paid again. Configure the new field only when a separately authorized future verification session needs it, using existing private records.

Current webhook/payment/handoff documentation no longer contains literal operational invoice IDs, the historical event ID or the private sandbox payment URL. Verification facts (amounts, states, dates, replay versus fresh-event limits) are preserved; command examples use placeholders. The source-review helper now detects sandbox invoice payment URLs, operational-format invoice IDs and a nonempty reference in `.env.example`, reporting locations/categories without values.

All129 offline tests and TypeScript pass; current-source scan is clear. New tests cover malformed references, absent configuration, mismatched identity, unpaid state, wrong total and nongenerated recipient for both helpers with zero mocked fetch attempts and unchanged rejected state. Existing draft creation/recovery/duplicate tests pass using the fictional configured reference. An initial test compared its second helper against a snapshot predating the test's own fixture edits; the snapshot was corrected and the suite passed. No application/browser change occurred, so prior production build/export evidence remains unchanged.

## Historical disclosure checkpoint

Current-source edits do not remove Git history. A refreshed targeted local history check (107 reachable commits at this run) finds299 invoice-pattern occurrences and103 sandbox-payment-link occurrences across historical file versions, plus26 known README tunnel placeholders and the previously reported author/committer email finding. These are repeated pattern matches, not counts of unique accounts, transactions or leaked credentials. Actual identities/links are not printed here.

Before public release, review whether historical operational details should be retained or removed together with the R2b metadata decision. No history rewrite, forced push, credential rotation or fresh remote inspection occurred. The expanded history helper intentionally remains nonzero while these findings are pending. Source cleanup alone does not provide publication clearance.

Next coding task is R4: asset/dependency notices and sponsor licensing review. Live AI remains owner-deferred; account-specific sponsor permissions and historical-disclosure decisions stay open.
