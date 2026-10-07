import * as sqlite from 'node:sqlite';
import { createHash } from 'node:crypto';
import { createReadStream, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync, copyFileSync, chmodSync, constants } from 'node:fs';
import { join, relative, resolve, isAbsolute } from 'node:path';

const maxDatabaseBytes = 64 * 1024 * 1024;
const databaseName = 'database.sqlite';
const tableNames = ['remote_operations', 'webhook_events', 'workspaces'];
const layouts = {
  remote_operations: [['key', 'TEXT', 0, 1], ['body', 'TEXT', 1, 0]],
  webhook_events: [['id', 'TEXT', 0, 1], ['received_at', 'TEXT', 1, 0]],
  workspaces: [['mode', 'TEXT', 0, 1], ['body', 'TEXT', 1, 0]],
};
export class DatabaseLifecycleError extends Error {}
const fail = message => { throw new DatabaseLifecycleError(message); };
const inside = (parent, path) => { const rel = relative(parent, path); return rel !== '' && !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`); };

function dataDirectory(root, storageDirectory) {
  if (storageDirectory !== undefined) {
    if (typeof storageDirectory !== 'string' || !isAbsolute(storageDirectory)) fail('Use an explicit absolute storage directory.');
    const path = resolve(storageDirectory), info = lstatSync(path), canonical = realpathSync(path);
    if (!info.isDirectory() || info.isSymbolicLink() || canonical !== path) fail('Storage directory must be regular without an escaping link.');
    return canonical;
  }
  const canonicalRoot = realpathSync(root), path = join(canonicalRoot, 'data');
  const info = lstatSync(path);
  if (!info.isDirectory() || info.isSymbolicLink()) fail('Use an existing regular data directory inside the project.');
  const canonical = realpathSync(path);
  if (!inside(canonicalRoot, canonical)) fail('Data directory must stay inside the project.');
  return canonical;
}

function regularFile(data, input) {
  const path = resolve(input);
  if (!inside(data, path)) fail('Database files must stay inside the approved storage directory.');
  const info = lstatSync(path), canonical = realpathSync(path);
  if (!info.isFile() || info.isSymbolicLink() || !inside(data, canonical)) fail('Use a regular database file without an escaping link.');
  if (info.size > maxDatabaseBytes) fail('Database exceeds the prototype maintenance size limit.');
  return canonical;
}

function outputParent(data, name) {
  const path = join(data, name);
  try {
    const info = lstatSync(path);
    if (!info.isDirectory() || info.isSymbolicLink()) fail('Output directory must be a regular directory.');
  } catch (error) { if (error.code === 'ENOENT') mkdirSync(path, { mode: 0o700 }); else throw error; }
  const canonical = realpathSync(path);
  if (!inside(data, canonical)) fail('Output directory must stay inside approved storage.');
  return canonical;
}

function inspectDatabase(connection) {
  const integrity = connection.prepare('PRAGMA integrity_check').all();
  if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') fail('Database integrity check failed.');
  const names = connection.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
  if (JSON.stringify(names) !== JSON.stringify(tableNames)) fail('Database does not match the supported Nudge table layout.');
  for (const name of tableNames) {
    const columns = connection.prepare(`PRAGMA table_info(${name})`).all().map(row => [row.name, row.type, row.notnull, row.pk]);
    if (JSON.stringify(columns) !== JSON.stringify(layouts[name])) fail('Database columns or primary keys do not match the supported layout.');
  }
  if (connection.prepare("SELECT COUNT(*) AS count FROM sqlite_schema WHERE type IN ('trigger', 'view')").get().count !== 0) fail('Database contains unsupported triggers or views.');
  let workspaces = 0, pendingWorkspaces = 0;
  for (const row of connection.prepare('SELECT mode, body FROM workspaces').iterate()) {
    let body;
    try { body = JSON.parse(row.body); } catch { fail('Workspace record is not valid JSON.'); }
    if (!body || typeof body !== 'object' || !['demo', 'sandbox'].includes(row.mode) || body.mode !== row.mode || !Number.isSafeInteger(body.version) || body.version < 1 ||
      typeof body.clientToken !== 'string' || !body.clientToken || !body.agreement || !body.policies || !['draft', 'approved', 'accepted'].includes(body.agreementStatus) ||
      !Array.isArray(body.audit) || !Array.isArray(body.proposals) || !Array.isArray(body.invoices)) fail('Workspace record fails maintenance validation.');
    workspaces++;
    if (body.processing || body.invoices.some(invoice => invoice.pendingSend || invoice.pendingReminder)) pendingWorkspaces++;
  }
  if (!workspaces) fail('Database contains no initialized Nudge workspace.');
  for (const row of connection.prepare('SELECT key, body FROM remote_operations').iterate()) {
    let body; try { body = JSON.parse(row.body); } catch { fail('Operation cache record is not valid JSON.'); }
    if (typeof row.key !== 'string' || !row.key || !body || typeof body !== 'object' || Array.isArray(body)) fail('Operation cache record fails maintenance validation.');
  }
  // These queries also verify the columns needed by reconciliation/idempotency.
  connection.prepare('SELECT id, received_at FROM webhook_events LIMIT 1').all();
  return { workspaces, pendingWorkspaces,
    webhookEvents: Number(connection.prepare('SELECT COUNT(*) AS count FROM webhook_events').get().count),
    remoteOperations: Number(connection.prepare('SELECT COUNT(*) AS count FROM remote_operations').get().count) };
}

async function checksum(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function openReadonly(path) {
  const connection = new sqlite.DatabaseSync(path, { readOnly: true, enableForeignKeyConstraints: true, allowExtension: false });
  connection.exec('PRAGMA busy_timeout=5000');
  return connection;
}

export async function createDatabaseSnapshot(root, sourcePath, storageDirectory) {
  if (typeof sqlite.backup !== 'function') fail('Database maintenance requires Node 22.16 or later; Node 24 is recommended.');
  const data = dataDirectory(root, storageDirectory), source = regularFile(data, resolve(root, sourcePath));
  for (const suffix of ['-wal', '-shm']) {
    try { if (lstatSync(source + suffix).isSymbolicLink()) fail('Database sidecars must not be symbolic links.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const connection = openReadonly(source);
  let directory;
  try {
    inspectDatabase(connection);
    directory = mkdtempSync(join(outputParent(data, 'backups'), 'snapshot-'));
    const temporary = join(directory, 'database.partial.sqlite');
    await sqlite.backup(connection, temporary);
    // Normalize the standalone destination, not the live source. No WAL sidecars
    // are needed to read the finished snapshot.
    const destination = new sqlite.DatabaseSync(temporary, { allowExtension: false });
    let counts;
    try {
      const journal = destination.prepare('PRAGMA journal_mode=DELETE').get();
      if (journal.journal_mode !== 'delete') fail('Could not finalize a standalone snapshot.');
      counts = inspectDatabase(destination);
    } finally { destination.close(); }
    if (statSync(temporary).size > maxDatabaseBytes) fail('Snapshot exceeds the prototype maintenance size limit.');
    const file = join(directory, databaseName);
    renameSync(temporary, file); chmodSync(file, 0o600);
    const manifest = { format: 'nudge-sqlite-snapshot', version: 1, createdAt: new Date().toISOString(), databaseFile: databaseName,
      byteLength: statSync(file).size, sha256: await checksum(file), counts };
    writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    return { directory, counts };
  } finally { connection.close(); }
}

export async function verifyDatabaseSnapshot(root, snapshotPath, storageDirectory) {
  const data = dataDirectory(root, storageDirectory), candidate = resolve(root, snapshotPath);
  const info = lstatSync(candidate), directory = realpathSync(candidate);
  if (!info.isDirectory() || info.isSymbolicLink() || !inside(data, directory)) fail('Snapshot must be a regular directory inside approved storage.');
  const manifestPath = regularFile(data, join(directory, 'manifest.json'));
  if (statSync(manifestPath).size > 16384) fail('Snapshot manifest is too large.');
  let manifest;
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { fail('Snapshot manifest is invalid.'); }
  if (!manifest || manifest.format !== 'nudge-sqlite-snapshot' || manifest.version !== 1 || manifest.databaseFile !== databaseName ||
      typeof manifest.createdAt !== 'string' || !Number.isFinite(Date.parse(manifest.createdAt)) ||
      !Number.isSafeInteger(manifest.byteLength) || manifest.byteLength < 1 || manifest.byteLength > maxDatabaseBytes ||
      typeof manifest.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.sha256) || !manifest.counts ||
      ['workspaces', 'pendingWorkspaces', 'webhookEvents', 'remoteOperations'].some(name => !Number.isSafeInteger(manifest.counts[name]) || manifest.counts[name] < 0)) fail('Snapshot manifest is unsupported or invalid.');
  const file = regularFile(data, join(directory, databaseName));
  // A standalone manifest must not silently acquire extra WAL state.
  for (const suffix of ['-wal', '-shm']) {
    try { lstatSync(file + suffix); fail('Snapshot has unexpected SQLite sidecars.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (statSync(file).size !== manifest.byteLength || await checksum(file) !== manifest.sha256) fail('Snapshot size/checksum mismatch. No recovery copy created.');
  const connection = openReadonly(file);
  let counts;
  try { counts = inspectDatabase(connection); } finally { connection.close(); }
  if (Object.keys(counts).some(name => counts[name] !== manifest.counts[name])) fail('Snapshot record counts do not match its manifest.');
  return { directory, file, manifest, counts };
}

export async function createRecoveryCopy(root, snapshotPath, storageDirectory) {
  const snapshot = await verifyDatabaseSnapshot(root, snapshotPath, storageDirectory), data = dataDirectory(root, storageDirectory);
  const directory = mkdtempSync(join(outputParent(data, 'recovery'), 'recovered-'));
  const file = join(directory, databaseName);
  copyFileSync(snapshot.file, file, constants.COPYFILE_EXCL); chmodSync(file, 0o600);
  if (await checksum(file) !== snapshot.manifest.sha256) fail('Recovery copy checksum mismatch; do not use this incomplete copy.');
  const connection = openReadonly(file);
  try { inspectDatabase(connection); } finally { connection.close(); }
  writeFileSync(join(directory, 'RECOVERY_REVIEW_REQUIRED.json'), JSON.stringify({ version: 1, restoredAt: new Date().toISOString(), snapshotCreatedAt: snapshot.manifest.createdAt,
    status: 'offline-review-only', warning: 'Not promoted. Reconcile remote outcomes and review locks, client access and caches before configuring the application to use this copy.' }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return { directory, file, counts: snapshot.counts };
}
