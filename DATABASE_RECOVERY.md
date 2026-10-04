# SQLite snapshots and offline recovery

## What the tools do

Nudge stores workspace decisions and audit records, webhook-event deduplication, and remote-operation caches in one SQLite database. The live database uses WAL. Do not copy only its main file while running or delete its WAL/SHM files: committed records may be in the write-ahead log.

`db:backup` uses SQLite's online backup API through Node, finalizes a standalone snapshot, checks integrity and the supported table/column/primary-key layout, and writes a size/SHA-256 manifest. Both demo and sandbox workspace rows and all recovery records are included. `db:verify` checks the manifest, checksum, database structure and record counts. `db:restore` verifies first, then creates a new offline recovery copy without replacing any existing database or changing the app configuration.

The project minimum is now Node 22.16 because of the backup API and its recovery tests; Node 24 is tested/recommended. No Node installation or dependency version was changed by this task. Reference: [Node SQLite backup API](https://nodejs.org/api/sqlite.html#sqlitebackupsourceDb-path-options), [SQLite online backup](https://www.sqlite.org/backup.html).

## Create and check a snapshot

Run from the project root. The database must already exist under the regular, ignored `data` directory. Explicitly choose the correct source; these commands do not read `.env.local` or automatically use `NUDGE_DB_PATH`.

```powershell
npm run db:backup -- --source ./data/nudge.sqlite
```

Use the generated directory printed by the command in place of `snapshot-EXAMPLE`:

```powershell
npm run db:verify -- --snapshot ./data/backups/snapshot-EXAMPLE
```

Backups can include committed records while the app is open, but for a controlled recovery point stop owner actions and the app before taking one. Busy/invalid sources fail rather than clearing locks or creating a fresh empty workspace. The completion timestamp is not a guarantee of zero data loss or a precise remote-payment cutoff. Source reads may involve SQLite's normal WAL/SHM coordination; the live tables and configuration are not rewritten by the tool.

The command reports only generated paths and counts. New snapshot folders contain `database.sqlite` and `manifest.json`. A failure may leave an incomplete ignored folder: it is not a usable snapshot unless verification succeeds. No automatic deletion or retry is performed.

## Restore to a new offline copy

```powershell
npm run db:restore -- --snapshot ./data/backups/snapshot-EXAMPLE --confirm-offline-copy
```

This creates a unique directory under `data/recovery` containing a standalone database and `RECOVERY_REVIEW_REQUIRED.json`. It never overwrites the active file, updates environment settings, starts a server, clears pending operations or makes provider calls. Repeating it creates another copy; it does not promote either copy.

**The marker is an operator warning, not an application-enforced recovery hold.** Do not point a credentialed app or public webhook endpoint at a restored copy until review is complete. Automated promotion/unlocking is deliberately not implemented. The restoration test uses fictional data and a fresh process with network access blocked; it does not switch the real workspace.

Before any future promotion:

1. Keep the app and temporary/public webhook forwarding stopped. Preserve the current database separately if available, and keep its sidecars together; do not replace or delete files blindly.
2. Compare the snapshot age with actions taken since it. A consistent local snapshot cannot roll back PayPal or recover newer client decisions automatically.
3. Review PayPal sandbox invoice identities, totals, current balances and outcomes using read-only checks. Search for already-created invoices before allowing creation; old snapshots can lack later remote-operation caches.
4. Preserve and inspect processing locks, pending sends/reminders and uncertain creation markers. Follow existing reviewed recovery controls; never infer non-delivery from missing local history or clear markers to force retries.
5. Review accepted scope/proposals and client access. An older snapshot may restore a previously revoked token or older decisions. Rotate client access before exposing the recovered workspace and verify expiry; restoration does not establish identity or legal acceptance.
6. Recheck reminder policies, payment promises, provider hold and owner authentication. Allow only explicitly reviewed actions after local and remote state are reconciled. Any actual promotion should be a separate concrete, reviewed task.

## Privacy, retention and hosting boundaries

Snapshots contain client contact fields, request text, audit records, bearer links and payment identifiers. They are not anonymized or encrypted. SHA-256 detects accidental corruption; it does not authenticate a snapshot from an untrusted source. Use only trusted locally generated snapshots. Files/folders request restrictive POSIX permissions; Windows access depends on inherited ACLs. Keep backups out of Git, public downloads, screenshots and shared demo artifacts.

The tools constrain files/output to the project data directory and reject escaping links. They do not archive `.env.local` or provider keys. Copies of workspace data still require the same protection as the original database. Do not share raw databases with another agent or judges.

This task adds no scheduled backups, automatic retention/deletion, encryption, external disaster-recovery storage, hosted persistent disk or multi-node support. Multiple copies on the same drive do not protect against drive failure. Agree on retention and encrypted off-device storage before real-user use. A future deletion workflow must account for backups and external provider data; SQLite row deletion alone is not secure erasure.

Local testing covers committed/uncommitted WAL state, complete record preservation, fresh-process application reload without provider calls, separate repeated recoveries, checksum/manifest failures, unknown schemas, missing primary keys, output-path junctions and sanitized CLI output. These checks do not prove production load behavior, power-loss durability or successful restoration of the actual personal workspace; that workspace was not read or copied during implementation.
