# Read-only Postman collection verification

For the empty template and private-export boundaries, see [POSTMAN_SHARING_REVIEW.md](POSTMAN_SHARING_REVIEW.md). An invoice-read-only run still requests an OAuth token and receives private data; do not share populated variables, history, examples or raw reports. The sharing review does not authorize another live run.

October 7 addition: [POSTMAN_WORKFLOW_VERIFICATION.md](POSTMAN_WORKFLOW_VERIFICATION.md) records a separate actual Newman run against Nudge's isolated local production server: 31 requests and 50 assertions passed. That collection writes only a disposable simulation database; the sandbox collection described below remains read-only. No new PayPal or AI calls were made for the local workflow.

## Actual result — October 5, 2026

The repository's reviewed collection executed through Postman's Newman 6.2.1 Node runner against PayPal sandbox:

| Step | Request | HTTP result |
| --- | --- | --- |
| 1 | Sandbox OAuth token request | 200 |
| 2 | List sandbox invoices | 200 |
| 3 | Retrieve the existing sandbox fixture invoice | 200 |

All four collection assertions passed: authentication, list access, invoice lookup and matching invoice identity. No invoice was created/sent/paid/cancelled, no refund/payout was requested, no Nudge workspace write occurred in the runner, and no AI call or credit usage occurred. This is a real Newman execution, not a desktop GUI run or a sponsor-credit redemption.

This confirms API access and the tested response checks. It does not establish payment integrity for every invoice state, fresh payment-triggered webhook delivery, live AI quality, or a production deployment. Those have separate checkpoints.

## Repeat safely

Optional tooling stays under ignored data; the application does not depend on Newman. Install the pinned runner from the project root:

```powershell
npm install --prefix ./data/postman-runner --no-audit --no-fund --ignore-scripts --save-exact newman@6.2.1
```

This downloads npm packages and may populate npm's normal cache. It does not sign up for an account, install globally, change app dependencies or start a subscription. Newman/transitive dependencies currently emit deprecation warnings; keep this optional tooling separate and reassess its maintenance/security before ongoing CI use. The run keeps normal TLS certificate checks enabled.

Privately configure existing PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET and POSTMAN_INVOICE_ID in the ignored .env.local. Use an existing sandbox invoice belonging to that app; never paste these values into chat or the command line. The tracked sample contains empty placeholders only.

```powershell
npm run postman:check
```

For the operator's already-created local payment fixture, the bounded alternative is:

```powershell
npm run postman:check -- --use-existing-fixture
```

This reads the invoice ID from the existing ignored sandbox fixture file. It does not create a replacement or request another payment. Fixture expiry for its earlier webhook session does not make this read-only lookup a new webhook test.

## Runner boundaries

The wrapper checks a canonical parsed-JSON fingerprint of the reviewed collection before use. Any change to destinations, methods, scripts, variables or metadata requires review and a deliberate fingerprint update. Do not automatically accept a changed collection just to make the check pass. Both fixture selection and privately configured invoice IDs are constrained to the expected sandbox ID format.

Credentials and the access token remain in the process/run. No raw JSON/JUnit/HTML report or environment export is generated. The wrapper prints only step numbers, HTTP statuses, assertion counts and success. SDK error details, request/response bodies, headers, IDs and variables are omitted. Sanitized failures do not imply success and do not retry automatically. The imported library has no application workspace write path.

One iteration executes only the three reviewed requests, with bail on failure, request/script/run timeouts, redirects disabled, TLS verification enabled and external file reads disabled. Fingerprinting protects this particular reviewed collection; it is not a general safe runner for arbitrary uploaded Postman scripts or a guarantee about a malicious npm dependency. Review tooling provenance as part of public-release preparation.

The desktop Collection Runner remains an alternative. Import the public collection and configure values privately; never share screenshots or export files containing secrets, access tokens or invoice details. No desktop execution is claimed here.

References: [Postman Newman setup/library usage](https://learning.postman.com/docs/reference/newman-cli/installing-running-newman/), [official Newman options](https://github.com/postmanlabs/newman#newmanrunoptions-object--callback-function--run-eventemitter).

Local tests verify collection-change rejection, unchanged public placeholders, runtime options and sanitized success/failure reports. Latest server suite: 60 passing tests plus TypeScript checks. No app/UI code changed; the preceding eight browser tests and production build remain the latest checks for those surfaces.
