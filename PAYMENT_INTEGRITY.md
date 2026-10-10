# Payment reconciliation integrity

Nudge validates invoice details before updating payment state through owner sync, background reconciliation, or a verified webhook. These are conservative application checks against the approved local invoice, not a claim that every field is required in every PayPal response.

- The returned invoice ID must match the requested invoice.
- The returned total must match the approved local total and use USD. A supplied detail currency must also be USD.
- Money is parsed as exact integer cents. Negative amounts, exponent notation, numeric values instead of strings, excess decimal precision, and amounts above the supported USD 100,000 limit are rejected.
- An outstanding balance cannot exceed the total. PAID cannot have a nonzero balance; PARTIALLY_PAID requires a positive balance below the total; UNPAID, SENT, and SCHEDULED require the full balance.
- CANCELLED has zero collectible balance but remains cancelled, not paid. Unsupported states, including manually marked payment and refund states, remain OTHER rather than becoming confirmed payment.
- Invalid details do not clear an uncertain send marker. Supported authoritative transitions can clear it after validation.

An invalid owner sync returns an error. Background reconciliation preserves the last known record. A webhook whose fetched details fail validation returns a retryable error and does not record the event as successfully processed; a corrected retry can then reconcile it.

## Verification and remaining limits

A further USD 1 sandbox checkout was completed on October 4. Its authoritative response passed total/currency/balance validation and normal owner sync recorded PAID/zero due. The bounded session did not verify a fresh PAID notification; see FRESH_PAYMENT_WEBHOOK_TEST.md. The fixture must not be paid again.

On October 4, 2026, all 38 server tests and the production build passed. Four new tests cover exact money parsing, contradictory details, supported status transitions, and unchanged workspace state across mocked sync, fallback and webhook paths followed by a corrected retry. No real PayPal or AI request was made for this task.

Later on October 4, the read-only script retrieved both existing paid sandbox invoices using the configured sandbox app. YOUR-VERIFIED-SANDBOX-INVOICE-ID matched USD 10.00; YOUR-VERIFIED-SANDBOX-INVOICE-ID matched USD 1.00. Both passed the actual reconciliation function and returned PAID with zero outstanding. No workspace database was opened or written, no invoice was created/sent/paid, and no raw provider payload or credentials were printed. TypeScript checks passed. This verifies compatibility with these two paid responses, not every remote state or automatic delivery path.

To repeat the USD 10 check from PowerShell with local sandbox credentials already configured:

```powershell
node --env-file=.env.local --import tsx scripts/verify-sandbox-payment.ts YOUR-VERIFIED-SANDBOX-INVOICE-ID 1000 PAID
```

The arguments are the invoice ID, independently known approved total in cents, and optional expected normalized status. The script uses only sandbox OAuth authentication and a GET invoice lookup. It validates the response in memory and never writes Nudge records. Use only invoices belonging to your configured sandbox app; never supply secrets as arguments. Lookup errors are intentionally summarized to avoid printing provider details.

Genuine signed webhook redelivery and deduplication were subsequently verified against the already-paid USD 1 fixture; see WEBHOOK_VERIFICATION.md. A fresh payment-triggered PAID event and unpaid-to-paid transition remain pending. These checks do not establish settlement finality or handle refunds, fees, taxes, multiple currencies, or external invoice edits. Unexpected data requires review rather than automatic correction. Background failures currently preserve state without a dedicated user-facing failure history.

Reference: [PayPal show invoice details](https://developer.paypal.com/api/invoicing/v2/invoices-get).
