# Interrupted action recovery

New asynchronous actions record the owning process ID and host in the persisted lock. The owner workspace checks whether that process is still present using a signal-zero existence probe; it does not terminate a process. An old timestamp is never enough to unlock work. If the same-host process is confirmed absent, the owner can enter a review note and explicitly unlock the matching action. The check is repeated inside the database transaction. Stale action keys, active processes, permission errors, different hosts and legacy locks without ownership metadata stay blocked.

This supports the current single-host, shared-local-SQLite prototype. It is not a distributed lease or suitable for multiple containers with different PID namespaces sharing storage. PID reuse can conservatively block recovery. A hung process must be investigated/stopped by the operator before recovery becomes available; Nudge does not kill it. Legacy unknown-owner locks need manual inspection rather than a generic force-unlock endpoint.

Unlocking changes only the processing lock and audit/error record. It never calls a provider, replays an action, clears creation caches or marks money received. Existing invoice-creation uncertainty markers and reminder-delivery markers remain intact. Completion writes must still own the original action key; stale results cannot overwrite another action.

## Review the outcome separately

- **AI comparison:** inspect whether a proposal was saved. A repeat is a new model call and may consume allowance; it is not automatic.
- **Invoice creation:** use the existing verified-ID recovery flow. An unresolved creation marker continues to block another create request.
- **Invoice sending:** the owner route persists `pendingSend` before contacting PayPal. Lost responses or process exits preserve it. Repeat sends are blocked; Refresh status, background reconciliation and verified webhooks can resolve it when PayPal confirms a sent/paid/cancelled lifecycle state. A DRAFT or unknown state leaves it blocked. A draft result alone does not authorize resending an uncertain attempt. No manual force-clear control is supplied; inspect PayPal/support before a separately reviewed recovery change.
- **Reminder sending:** existing pending-reminder controls require manual outcome review and do not equate a payment-status lookup with message delivery.
- **Status/ID recovery:** inspect the saved invoice; these operations themselves only read PayPal.

## Verification and limits

Local tests use a short-lived Node process to verify exited-process recovery on Windows, plus mocked permission/host failures, current-process blocking, stale keys, preserved attempt markers and rejected stale writes. Mocked sandbox tests verify that a lost invoice-send response produces one send request, DRAFT reconciliation retains its block, and SENT reconciliation resolves the marker without a second send. These tests do not prove real webhook delivery or a real PayPal crash scenario. No real payment, message or model request was sent for this task.
