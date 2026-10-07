import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { validateRenderConfig } from './render-config.mjs';
import { renderMaintenanceOperation } from './render-database-operations.mjs';

try {
  if (process.platform !== 'linux') throw Error('Linux required.');
  validateRenderConfig(process.env, readFileSync('/proc/self/mountinfo', 'utf8'));
  const storage = '/var/data';
  const { operation, result } = await renderMaintenanceOperation(process.cwd(), storage, process.argv.slice(2));
  console.log(JSON.stringify({ operation, directory: relative(storage, result.directory), counts: result.counts,
    status: operation === 'restore' ? 'offline-review-only' : 'verified' }, null, 2));
  console.log('No provider calls, deletion, existing database replacement or configuration change.');
  if (operation === 'restore') console.log('Recovery copy requires remote-outcome and client-access review before any separate promotion.');
} catch {
  console.error('Render maintenance refused or failed. Check the mounted disk, explicit command and DATABASE_RECOVERY.md. Incomplete folders are not verified snapshots. No configuration or record values printed.');
  process.exitCode = 1;
}
