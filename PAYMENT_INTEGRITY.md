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

On October 4, 2026, all 38 server tests and the production build passed. Four new tests cover exact money parsing, contradictory details, supported status transitions, and unchanged workspace state across mocked sync, fallback and webhook paths followed by a corrected retry. No real PayPal or AI request was made for this task.

Earlier sandbox payments verified the read-only fallback before these stricter checks. A fresh authoritative sandbox response and genuine signed webhook delivery remain to be verified. These checks do not establish settlement finality or handle refunds, fees, taxes, multiple currencies, or external invoice edits. Unexpected data requires review rather than automatic correction. Background failures currently preserve state without a dedicated user-facing failure history.

Reference: [PayPal show invoice details](https://developer.paypal.com/api/invoicing/v2/invoices-get).
