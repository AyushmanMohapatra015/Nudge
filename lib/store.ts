import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID, randomBytes } from 'node:crypto';
import type { Workspace } from './domain';
import { newClientLinkExpiry } from './client-access';

export const mode = () => process.env.NUDGE_MODE === 'sandbox' ? 'sandbox' as const : 'demo' as const;
let connection: DatabaseSync | undefined;
export function db() {
  if (!connection) {
    const path = resolve(/* turbopackIgnore: true */ process.env.NUDGE_DB_PATH || './data/nudge.sqlite');
    mkdirSync(dirname(path), { recursive: true });
    connection = new DatabaseSync(path);
    connection.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS workspaces (mode TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, received_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS remote_operations (key TEXT PRIMARY KEY, body TEXT NOT NULL);');
  }
  return connection;
}
export function seed(): Workspace {
  return { version: 1, mode: mode(), clientToken: randomBytes(24).toString('hex'), clientLinkExpiresAt: newClientLinkExpiry(),
    agreement: { title: 'Website redesign', clientName: 'Olivia Chen', clientEmail: 'olivia@example.com', amountCents: 120000,
      clauses: [{ id: 'S1', text: 'Design and build a five-page marketing website: Home, About, Services, Work, and Contact.' }, { id: 'S2', text: 'Includes two rounds of revisions to the agreed pages.' }, { id: 'S3', text: 'Booking systems, e-commerce, and additional pages are excluded.' }, { id: 'S4', text: 'Additional work requires a separately priced proposal approved by the client before invoicing.' }] },
    agreementStatus: 'draft', proposals: [], invoices: [], policies: { protectedClient: false, reminderLimit: 3, cooldownDays: 7 },
    audit: [{ id: randomUUID(), time: new Date().toISOString(), actor: 'System', title: 'Workspace created', detail: mode() === 'demo' ? 'Illustrative project. No AI provider calls or PayPal transactions occur in simulation mode.' : 'Sandbox workspace ready. Replace the example client with your sandbox buyer before sending.' }] };
}
export function read(): Workspace {
  const row = db().prepare('SELECT body FROM workspaces WHERE mode = ?').get(mode()) as { body: string } | undefined;
  if (row) return JSON.parse(row.body);
  const s = seed();
  db().prepare('INSERT OR IGNORE INTO workspaces (mode, body) VALUES (?, ?)').run(mode(), JSON.stringify(s));
  return read();
}
export function mutate<T>(fn: (s: Workspace) => T): T {
  const conn = db(); conn.exec('BEGIN IMMEDIATE');
  try {
    const s = read(); const result = fn(s); s.version++;
    conn.prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(JSON.stringify(s), mode());
    conn.exec('COMMIT'); return result;
  } catch (e) { conn.exec('ROLLBACK'); throw e; }
}
export function log(s: Workspace, actor: string, title: string, detail: string, key?: string) {
  s.audit.unshift({ id: randomUUID(), time: new Date().toISOString(), actor, title, detail, key });
}
export function requireIdle(s: Workspace) { if (s.processing) throw new Error('An action is already running. Refresh its status before starting another.'); }
export function mutateOwned<T>(key: string, fn: (s: Workspace) => T): T {
  return mutate(s => { if (s.processing?.key !== key) throw new Error('Action ownership changed. Discard the stale result and refresh.'); return fn(s); });
}
// Freeze the legacy identity before changing its token, preserving existing remote caches.
export function baseInvoiceIdentity(s: Workspace) { return s.baseInvoiceKey ||= `base-${s.clientToken.slice(0, 16)}`; }
export function cachedOperation<T>(key: string): T | undefined {
  const row = db().prepare('SELECT body FROM remote_operations WHERE key = ?').get(key) as { body: string } | undefined;
  return row ? JSON.parse(row.body) : undefined;
}
export function cacheOperation(key: string, data: unknown) { db().prepare('INSERT OR REPLACE INTO remote_operations (key, body) VALUES (?, ?)').run(key, JSON.stringify(data)); }
