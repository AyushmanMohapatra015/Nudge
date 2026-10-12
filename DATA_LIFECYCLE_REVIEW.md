# R8: prototype privacy, retention and runtime logging

This review covers local source and fictional offline checks. It is not a production privacy policy, a legal-compliance assessment or a review of an actual hosted service. No ordinary workspace database, environment values or real client records were inspected.

## What is stored and shared

The SQLite workspace contains contact fields, agreement clauses, requests, AI explanations, scope-review decisions, prices, client-link tokens, invoice identifiers/payment links, policies and audit records. Separate tables retain webhook identifiers, remote-operation outcomes and, when used, dashboard approval/attempt accounting. These recovery records prevent duplicate or uncertain actions; they are not disposable caches while operating a workspace.

Scope AI uses an explicit allowlist: project title, clause IDs/text and the request. Separate contact fields, base price and unrelated workspace metadata are omitted. Free text and model responses can still contain personal or confidential information. Use fictional content; remove confidential details and obtain permission before any future non-fictional transmission. The owner request form already discloses this boundary. See AI_DATA_HANDLING.md. No provider retention, residency, training or account-wide spending guarantee follows from the allowlist.

The approved client projection intentionally shares project and decision information with anyone holding its current unexpired bearer link. Keep links private; rotate access when needed. A recorded acceptance is a prototype decision record, not a verified electronic-signature service. Do not describe AI drafts as legal advice or independently verified contracts.

## Retention and removal procedure

There is no automatic retention timer or complete deletion endpoint. Records remain until the operator explicitly removes their local copies. Demo reset replaces only the selected demo workspace row: it does not purge sandbox rows, webhook deduplication, operation caches, dashboard accounting, backups, exports or provider records. Dismissing a proposal is not erasure either.

For the hackathon, use fictional data throughout. Before collecting real-user content, agree on purpose, access, retention duration and who can request removal. Do not invent a legally sufficient duration. Keep only necessary private research notes and separate them from demo fixtures; note-taking consent does not authorize AI upload.

If removal is requested, inventory the specific database and its backups/recovery copies, exported reports, research notes, screenshots, build/test receipts and shared artifacts. Review any provider-side records separately under that account's deletion controls. Removing a local file cannot retract PayPal invoices, provider conversations, shared downloads, Git history or infrastructure logs.

Before deleting database files, stop the exact owning application and webhook forwarding, identify the resolved absolute database path, and reconcile pending external outcomes. This is particularly important for sandbox records: deleting deduplication or cached outcomes while leaving the integration active can permit repeated actions. A replacement database does not undo a remote action. Review each target and obtain authorization for the concrete removal; do not recursively delete the whole data directory. After the process closes, account for the database's WAL/SHM companions and every retained snapshot. No deletion was performed for this review.

SQLite row/file deletion is not secure erasure. SSD behavior, Windows permissions, device/cloud backups and provider retention require their own controls. Keep data outside Git and public assets. Local ignored files are still readable by other users/processes with filesystem access; Git ignore is not access control or encryption.

## Recovery and protection

Use the verified snapshot and offline-copy procedures in DATABASE_RECOVERY.md. Snapshots include both workspace modes and sensitive recovery data; they are not encrypted. Protect their Windows ACLs and any separately encrypted off-device copy. Multiple copies on one disk do not protect against disk loss. No scheduled backup, automatic pruning, off-device storage or real hosted restore is established here.

A restored copy can resurrect revoked client links, deleted content, old decisions or outdated payment outcomes. Keep it offline, honor recorded removal requests, rotate client access and reconcile remote state before any separate promotion. The review marker is a warning, not an application-enforced hold. Restoration never proves that a remote payment/action can safely be retried.

## Runtime-log boundary

Next.js development request logging can include client-link tokens in request paths. The project now sets `logging: false` in next.config.ts, disabling its routine development request/fetch/server-function logging and browser-console forwarding. This does not suppress all framework errors, Node warnings, browser DevTools, third-party consoles or a hosting provider's access logs. Restart an existing dev process to load the new configuration; historical terminal output is not erased.

Application API/provider modules do not deliberately console-log bodies, headers, tokens or workspace records. Provider failures use bounded generic messages; the webhook relay logs only signature-header presence and HTTP status. Database maintenance reports generated relative output paths, counts and status rather than stored content. The user-visible audit trail is private application data, not sanitized operational telemetry, and must be protected accordingly.

Before deployment, review Render/reverse-proxy access and error logs, including whether full `/client/<token>` and API paths or query strings are collected, retention, operator access and deletion controls. Never log authorization headers, cookies, raw provider error bodies, source briefs or model outputs. If actual hosting cannot mask bearer paths, record that exposure and agree on mitigation before sharing client links. Source review and local tests do not establish infrastructure behavior.

## Evidence and remaining gates

October 12 evidence: 15 targeted existing tests pass across AI payload/error privacy, PayPal/relay and helper-output privacy, SQLite snapshot/recovery and guarded Render maintenance. TypeScript passes. A disposable production build and Postman run pass all 31 requests/50 assertions, with restart persistence and no blocked-provider-fetch attempts. No ordinary database or credential file was used.

An actual-app development probe used the matching isolated source copy, a fresh fictional database and the no-provider-network guard. It opened the fictional client API URL with a private query marker and submitted a rejected fictional sign-in body. Captured stdout/stderr contained neither the client token nor the marker nor routine request lines; its owned process was stopped. The ignored probe is `data/r8-log-probe.mjs`; its sanitized receipt is retained in the isolated workflow directory. This is bounded local evidence, not proof for arbitrary framework exceptions, browser-console output or hosted access logs.

The initial test-loader attempt failed at Windows user lookup inside the sandbox, before tests executed; the approved retry passed. The first Postman attempt reached the workflow but sandbox process-cleanup restrictions prevented restart evidence. Its exact child server was identified and stopped with approved access; the approved complete rerun passed and cleaned up. No application guard was bypassed or ordinary server stopped. Live AI remains deferred; no provider calls, payments, ordinary-data deletion or hosting activation occurred.

R9 publication review remains next, beginning current source/index and existing historical-review decisions. Owner approval is still required before repository publication or any history rewrite. R6 Narrator, actual zoom and physical touch remain pending. Sponsor licence/allowance and judging-access gates remain unchanged.
