# Storage and Recovery Assurance Addendum (PA-3 / D6 / F8b Support)

Reviewed and integrated October26,2026. This addendum supplements `DATABASE_RECOVERY.md` and `JUDGING_MAINTENANCE.md`; it does not authorise cloud deployment or close D6/F8b. The targeted offline run and exact limitations are recorded in AGENT_RESPONSE_REVIEW.md. File-symlink creation is unavailable on this Windows host: the source-sidecar symlink test is explicitly skipped, not verified. Existing directory-junction tests are separate evidence.

Maintenance validates a supported storage layout and selected record fields, not the complete runtime domain schema. SHA256 and metadata counts detect mismatches; they do not authenticate a snapshot against someone able to rewrite both files. TOCTOU and a malicious local writer are not eliminated by these checks. Keep snapshots private and use the approved single-host operational process.

## 1. Supported Guarantees vs. Unverified Platform Boundaries

### Verified by Local Code and Deterministic Tests
- **Consistent Online Snapshot (`db:backup` / `createDatabaseSnapshot`):** Uses Node's [SQLite backup API](https://nodejs.org/api/sqlite.html#sqlitebackupsourceDb-path-options) (`sqlite.backup`) from a read-only source connection (`busy_timeout=5000`) into a temporary file, normalises the snapshot copy to `PRAGMA journal_mode=DELETE` without WAL/SHM sidecars, verifies `PRAGMA integrity_check`, enforces exact table/column/primary-key layouts (`workspaces`, `webhook_events`, `remote_operations`, and optional `studio_request_allowances`), rejects SQLite views and triggers, bounds database size to 64 MiB, and seals `manifest.json` (`<= 16 KiB`) with byte length, SHA-256 digest, and record counts.
- **Fail-Closed Verification (`db:verify` / `verifyDatabaseSnapshot`):** Rejects snapshots outside approved storage, symlinked directories/files, unexpected `-wal`/`-shm` sidecars, corrupt or oversized manifests, byte-length or SHA-256 mismatches, schema deviations, and bidirectional record-count mismatches between `manifest.counts` and `inspectDatabase`.
- **Non-Destructive Offline Recovery (`db:restore` / `createRecoveryCopy`):** Verifies the snapshot before creating `<storage>/recovery/recovered-XXXXXX`, copies `database.sqlite` with `COPYFILE_EXCL`, re-verifies SHA-256 and schema integrity, revokes active dashboard AI allowances (`UPDATE studio_request_allowances SET active = 0 WHERE active = 1`) **only** inside the new recovery copy while preserving historical `used_requests`, and writes `RECOVERY_REVIEW_REQUIRED.json` (`status: "offline-review-only"`). It never overwrites the live database, modifies `.env.local` / `NUDGE_DB_PATH`, clears pending markers, or makes network requests.
- **Preservation of Financial and Approval Evidence:** Committed workspace records (`agreement`, `agreementStatus`, `proposals`, `invoices`, `audit`), private bearer token fields (`clientToken`, `clientLinkExpiresAt`, `baseInvoiceKey`), in-flight lock metadata (`processing`), uncertain delivery markers (`pendingSend`, `pendingReminder`), idempotency caches (`remote_operations`), and webhook deduplication records (`webhook_events`) are preserved verbatim.

### What Local Windows Tests Do NOT Verify (Linux / Render Gap)
- Passing `tests/database-lifecycle.test.ts`, `tests/render-database.test.ts`, `tests/render-config.test.ts`, and `tests/agent-a-storage-recovery.test.ts` on Windows verifies library logic using temporary directories and synthetic `/proc/self/mountinfo` strings.
- Local Windows tests do **not** verify:
  1. Actual Linux `/proc/self/mountinfo` kernel output on a deployed Render instance with an attached `/var/data` persistent disk.
  2. POSIX `0o700` directory and `0o600` file permission enforcement on a mounted Linux ext4 volume (Windows relies on inherited NTFS ACLs).
  3. Actual `scripts/start-render.mjs` child-process lifecycle (`next start`) and `SIGTERM`/`SIGINT` container shutdown timing on Linux.
  4. Off-disk / off-service backup export, encryption at rest, or multi-instance locking (Nudge is a single-owner, single-host prototype).

## 2. Test Matrix References

| Assurance Area | Primary Test File(s) | Key Verified Invariants |
| --- | --- | --- |
| Online WAL backup, uncommitted exclusion & fresh-process reload | `tests/database-lifecycle.test.ts` | Committed WAL frames included; uncommitted write excluded; zero network calls on reload |
| Dashboard AI allowance preservation & offline revocation | `tests/database-lifecycle.test.ts`, `tests/agent-a-storage-recovery.test.ts` | `used_requests` retained; `active` set to `0` in recovery copy only; source unchanged |
| Uncertain financial markers (`pendingSend`, `pendingReminder`, `processing`, `remote_operations`, `webhook_events`) & host/PID lock probe | `tests/agent-a-storage-recovery.test.ts` | All markers retained; `processingRecovery` returns `exited` (`ESRCH`), `running` (live PID), or `unknown` (different `hostname()`) |
| Manifest count parity (`A3-01`), oversized manifest, views/triggers rejection | `tests/agent-a-storage-recovery.test.ts` | Extra/mismatched `manifest.counts` keys, manifests `> 16 KiB`, `byteLength > 64 MiB`, and SQL `VIEW`/`TRIGGER` objects fail closed |
| Partial snapshot (`database.partial.sqlite`), unexpected snapshot `-wal`, symlinked source sidecars & escaping junctions | `tests/database-lifecycle.test.ts`, `tests/render-database.test.ts`, `tests/agent-a-storage-recovery.test.ts` | Incomplete backup dirs and unexpected sidecars fail before creating `recovery/`; escaping symlinks/junctions rejected |
| Simulated Render `/var/data` wrapper & `validateRenderConfig` preflight | `tests/render-database.test.ts`, `tests/render-config.test.ts`, `tests/agent-a-storage-recovery.test.ts` | Traversal/override args rejected; octal-escaped sibling mounts rejected; non-Linux CLI execution refused without printing secrets |

## 3. Safe Offline Rehearsal Steps (Local Project Data)

Run these steps only when explicitly rehearsing local storage recovery against an existing database under `./data` (never overwrite `./data/nudge.sqlite` automatically):

1. **Quiesce Activity:** Stop local owner actions, stop the Next.js server, and ensure no webhook forwarding tunnel is active.
2. **Create Snapshot:** Use only a dedicated fictional rehearsal database for an initial rehearsal. The commands below show syntax for an already separately approved source, not permission to run them against the ordinary database now.
   ```powershell
   npm run db:backup -- --source ./data/nudge.sqlite
   ```
3. **Verify Snapshot:** Replace `snapshot-EXAMPLE` with the folder printed in Step 2:
   ```powershell
   npm run db:verify -- --snapshot ./data/backups/snapshot-EXAMPLE
   ```
4. **Create Offline Recovery Copy:**
   ```powershell
   npm run db:restore -- --snapshot ./data/backups/snapshot-EXAMPLE --confirm-offline-copy
   ```
5. **Inspect Non-Sensitive Receipt & Review Marker:** Confirm the CLI output matches the expected receipt shape below and inspect `data/recovery/recovered-EXAMPLE/RECOVERY_REVIEW_REQUIRED.json`.

## 4. Non-Sensitive Expected Receipts

Maintenance CLIs (`db:backup`, `db:verify`, `db:restore`, `db:render`) never print `clientToken`, client emails, proposal text, operation keys, or environment secrets. Expected stdout shapes:

```json
{
  "operation": "backup",
  "directory": "data/backups/snapshot-EXAMPLE",
  "counts": {
    "workspaces": 2,
    "pendingWorkspaces": 0,
    "webhookEvents": 1,
    "remoteOperations": 2,
    "studioApprovals": 1,
    "studioReservedRequests": 1
  },
  "status": "verified"
}
```

For `restore` (`db:restore` or `db:render -- restore`):
- `status` is always `"offline-review-only"`.
- If `counts.pendingWorkspaces > 0`, at least one workspace in the snapshot holds an active `processing` lock or an invoice with `pendingSend` / `pendingReminder`. This is preserved evidence, **not** a verification failure.

## 5. Uncertain-Operation Review Checklist (Before Any Promotion)

`RECOVERY_REVIEW_REQUIRED.json` is an operator warning, not an automatic lock in `lib/store.ts`. Before ever pointing `NUDGE_DB_PATH` at a recovered database file:

1. **Processing Locks (`workspaces.body.processing`):** Check `owner.host` and `owner.pid`. If the snapshot came from a different host or container instance, `processingRecovery` reports `status: "unknown"` and keeps the lock closed until manual inspection confirms the prior process exited.
2. **Uncertain Invoice Creation (`remote_operations`):** Review `attempt-invoice-*` and `invoice-*` records, including operations that might have occurred after the snapshot. Before allowing new creation, separately authorise read-only sandbox reconciliation for the stored invoice number (`N-` plus the first16 characters of the proposal identity). Use the application's validated recovery where applicable; do not broaden a finite rehearsal grant, clear attempt markers or automatically replay operations.
3. **Uncertain Sends & Reminders (`pendingSend` / `pendingReminder`):** Never delete `pendingSend` or `pendingReminder` manually to force a retry. Run read-only invoice status reconciliation (`syncInvoice`) after verifying PayPal sandbox state; keeping `pendingSend` when PayPal still reads `DRAFT` is deliberate because an earlier in-flight request or manual review may still be unresolved.
4. **Private Client Links (`clientToken` / `clientLinkExpiresAt`):** Check whether `clientLinkExpiresAt` has passed or whether a token was rotated after the snapshot timestamp. Rotate client bearer access before re-enabling external access; note that `baseInvoiceKey` remains frozen so historical `remote_operations` caches stay linked.
5. **Dashboard AI Allowances (`studio_request_allowances`):** Recovery copies set `active = 0` while preserving `used_requests`. Keep `NUDGE_AI_ENABLED=false` unless sponsor allowance terms are confirmed and the owner explicitly issues a new approval.

## 6. Remaining Actual Linux / Render Checks and Owner Approval Points

No cloud deployment or live billing action is authorised by this addendum. If the owner separately approves a Render deployment and `F8b` rehearsal under `RENDER_DEPLOYMENT.md` and `JUDGING_MAINTENANCE.md`:

| Gate | Required Owner Approval / Precondition | Verification to Record (No Secrets) |
| --- | --- | --- |
| **G1. Provisioning & Billing Gate** | Explicit owner approval after reviewing Render credit/card terms and `RENDER_COST_PLAN.md`. | Date, owner approval, confirmed service tier, and `NUDGE_AI_ENABLED=false` setting. |
| **G2. Linux Persistent Disk Mount Gate** | Render service running on Linux with persistent disk mounted at `/var/data` and `NUDGE_DB_PATH=/var/data/nudge.sqlite`. | Startup success via `npm run start:render` and generic `/api/health` 200 check. |
| **G3. Hosted Backup / Verify / Restore Rehearsal (`F8b`)** | Owner approval to run `npm run db:render -- backup`, `verify`, and `restore --confirm-offline-copy` in the private Render shell. | Sanitized JSON receipts for `backup`, `verify`, and `restore` under `/var/data/backups` and `/var/data/recovery`, plus free disk space check. |
| **G4. Offline Promotion & Shutdown Gate (`D6` / `F8c`)** | Separate explicit owner approval before replacing an active database or shutting down hosted resources after judging. | Completed recovery review from `DATABASE_RECOVERY.md` and the applicable shutdown record from `JUDGING_MAINTENANCE.md`. |
