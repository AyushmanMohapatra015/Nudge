# Postman verification for judges

Nudge uses **Postman's Newman 6.2.1 runner** to execute reviewed API collections with fixed assertions. No Postman account, desktop application, cloud monitor or public workspace is required for the local workflow. This guide documents actual existing evidence; it does not imply the live AI journey or fresh-payment webhook gap has been closed.

## Reproduce the credential-free workflow

Use a clean source checkout and Node 22.16 or later (Node 24 recommended). Run from the repository root. On Windows PowerShell:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd rebuild @bryntum/gantt-trial-lib --foreground-scripts --ignore-scripts=false
npm.cmd rebuild --foreground-scripts --ignore-scripts=false
npm.cmd install --prefix ./data/postman-runner --no-audit --no-fund --ignore-scripts --save-exact newman@6.2.1
npm.cmd run postman:workflow
```

On macOS/Linux use the same commands with `npm` instead of `npm.cmd`. Install dependencies/tooling once; if already installed, run just the final command. Installation downloads packages and uses local disk/cache. The workflow itself needs no PayPal/AI credentials, licence key, Docker, paid plan or sponsor credit. It does not read `.env.local`.

The wrapper builds a disposable production source copy, starts its own loopback server with a fresh fictional SQLite database and disabled integrations, and executes the 31-request/50-assertion collection. It then restarts that server and compares the recorded invoice/approval/policy/audit/client-access state. Its own processes are stopped; the ordinary development server/database are preserved. Copies remain under ignored `data/postman-workflow`, consume disk and are not automatically deleted.

Successful sanitized output includes:

```text
requests: 31
assertions: 50
failedAssertions: 0
failedSteps: []
restartPersistence: true
blockedProviderFetch: false
success: true
Temporary server stopped; ordinary development server preserved.
```

These are report fields/expected values, not literal complete terminal output. Actual per-run status remains in the sanitized local summary. A nonzero exit, failed status/assertion, attempted provider fetch or unconfirmed cleanup is not success. Do not expose raw private reports to troubleshoot it. If a local port/process issue occurs, identify the wrapper's own process before stopping it; do not kill every Node or Edge process.

Do not run the write-containing workflow collection directly against the ordinary workspace or a shared hosted demo. Use its wrapper. It performs real HTTP requests against Nudge routes and SQLite, but **the model and PayPal payment actions are simulated**. Tests cover consent/review/acceptance gates, invoice sequencing, duplicate prevention, policy rejection and status reconciliation; they do not prove live provider correctness, distributed operation or legal enforceability.

## Separate PayPal sandbox evidence

The reviewed sandbox collection previously executed successfully against PayPal sandbox: OAuth POST, invoice-list GET and existing-invoice GET, three HTTP 200 responses and four assertions. This is actual sandbox API evidence, separate from the simulation workflow. It creates/sends/pays/refunds/cancels no invoice. It still transmits private credentials and receives private records.

Repeating that run is optional, requires authorized private sandbox configuration and an existing fixture, and is **not part of the credential-free judge command sequence above**. Follow POSTMAN_VERIFICATION.md if separately authorized. Do not distribute the developer's keys, invoice reference or environment, and do not initiate a new payment to reproduce this evidence. The current review made no new PayPal requests.

## Submission tool attribution

Suggested text, accurate to existing evidence:

> Postman: We used Newman 6.2.1 to run two reviewed API collections. The isolated Nudge workflow verifies 31 local HTTP requests and 50 assertions across approval, client acceptance, simulated invoicing/payment and rejection paths, followed by a persistence check after process restart. A separate read-only PayPal sandbox collection verified authentication, invoice listing and lookup of an existing sandbox invoice with four assertions. Fixed collection fingerprints, bounded execution, destination controls and sanitized summaries protect the verification workflow.

Do not describe desktop usage, cloud monitors, a public Postman workspace, sponsor-credit redemption or another live run as completed. The sandbox runner's fingerprint/TLS/redirect controls and the workflow runner's loopback agent are distinct; this text does not claim an operating-system network sandbox or a universal guard for arbitrary collections.

## Supporting evidence and sharing

- [Local workflow evidence and isolation](POSTMAN_WORKFLOW_VERIFICATION.md)
- [Read-only sandbox evidence and private setup](POSTMAN_VERIFICATION.md)
- [Template/export sharing boundaries](POSTMAN_SHARING_REVIEW.md)
- [Functional product walkthrough](JUDGE_SETUP.md)

Share only clean repository templates, reviewed documentation and sanitized count/status evidence. Used desktop exports can contain populated collection variables, examples or history; no private environment/global/cookie/raw-run export belongs in the submission. Repository history/publication, AG licence and functional judging access remain their separate checkpoints.

October 13 M5 review: package scripts and installed pinned tool match these commands. The latest existing isolated workflow receipt records31/50, zero failed assertions, restart persistence, no blocked provider fetch and success. M3's four offline safety tests passed October 13; collections/digests/runtime code were not changed for this documentation. No redundant build/browser/live run was needed. Update this guide if the final collection, command or verified evidence changes.
