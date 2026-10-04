import { relative } from 'node:path';
import { createDatabaseSnapshot, verifyDatabaseSnapshot, createRecoveryCopy, DatabaseLifecycleError } from './database-lifecycle.mjs';

const usage = 'Use backup --source <local database>, verify --snapshot <snapshot directory>, or restore --snapshot <snapshot directory> --confirm-offline-copy. Files must stay inside project data.';
try {
  const [command, ...args] = process.argv.slice(2);
  let result;
  if (command === 'backup' && args.length === 2 && args[0] === '--source') result = await createDatabaseSnapshot(process.cwd(), args[1]);
  else if (command === 'verify' && args.length === 2 && args[0] === '--snapshot') result = await verifyDatabaseSnapshot(process.cwd(), args[1]);
  else if (command === 'restore' && args.length === 3 && args[0] === '--snapshot' && args[2] === '--confirm-offline-copy') result = await createRecoveryCopy(process.cwd(), args[1]);
  else throw new DatabaseLifecycleError(usage);
  // Never print workspace contents, link tokens, operation keys or source identity.
  console.log(JSON.stringify({ operation: command, directory: relative(process.cwd(), result.directory), counts: result.counts,
    status: command === 'restore' ? 'offline-review-only' : 'verified' }, null, 2));
  console.log('No provider calls, deletion, existing-file overwrite or application configuration change.');
  if (command === 'restore') console.log('Recovery copy requires review. Do not connect it to PayPal or AI or replace the active database automatically.');
} catch (error) {
  console.error(error instanceof DatabaseLifecycleError ? error.message : 'Database maintenance failed. Check the local file/configuration; no workspace was switched. Incomplete output folders must not be used.');
  process.exitCode = 1;
}
