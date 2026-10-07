import { resolve } from 'node:path';
import { createDatabaseSnapshot, verifyDatabaseSnapshot, createRecoveryCopy, DatabaseLifecycleError } from './database-lifecycle.mjs';

// Trusted library boundary: the CLI validates Render/mount state, then supplies
// only /var/data. Tests supply a fresh fictional storage directory instead.
export async function renderMaintenanceOperation(root, storage, args) {
  const [operation, ...options] = args;
  if (operation === 'backup' && options.length === 0) {
    return { operation, result: await createDatabaseSnapshot(root, resolve(storage, 'nudge.sqlite'), storage) };
  }
  if (['verify', 'restore'].includes(operation) && options[0] === '--snapshot' && /^backups\/snapshot-[A-Za-z0-9_-]+$/.test(options[1] || '') &&
      (operation === 'verify' ? options.length === 2 : options.length === 3 && options[2] === '--confirm-offline-copy')) {
    const snapshot = resolve(storage, options[1]);
    const result = operation === 'verify' ? await verifyDatabaseSnapshot(root, snapshot, storage) : await createRecoveryCopy(root, snapshot, storage);
    return { operation, result };
  }
  throw new DatabaseLifecycleError('Use backup, verify --snapshot backups/snapshot-ID, or restore --snapshot backups/snapshot-ID --confirm-offline-copy.');
}
