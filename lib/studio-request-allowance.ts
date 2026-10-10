import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

const approvalSchema = z.object({
  id: z.string().uuid(), maxRequests: z.number().int().min(1).max(100),
  expiresAt: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
}).strict();
const validTime = (now: number) => Number.isSafeInteger(now) && now >= 0;

/** Trusted server administration only. Never accepts browser approval or provider credentials. */
export function studioRequestAllowance(connection: DatabaseSync) {
  connection.exec(`CREATE TABLE IF NOT EXISTS studio_request_allowances (
    id TEXT PRIMARY KEY,
    max_requests INTEGER NOT NULL CHECK(max_requests BETWEEN 1 AND 100),
    used_requests INTEGER NOT NULL DEFAULT 0 CHECK(used_requests BETWEEN 0 AND max_requests),
    expires_at INTEGER NOT NULL CHECK(expires_at >= 0),
    approved_at INTEGER NOT NULL CHECK(approved_at >= 0),
    active INTEGER NOT NULL CHECK(active IN (0, 1))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS studio_one_active_allowance ON studio_request_allowances(active) WHERE active = 1;`);
  return {
    approve(value: unknown, now = Date.now()) {
      const approval = approvalSchema.parse(value);
      if (!validTime(now) || approval.expiresAt <= now || approval.expiresAt - now > 30 * 86400000) throw Error('Invalid allowance expiration.');
      connection.exec('BEGIN IMMEDIATE');
      try {
        // Replenishing an unexpired active approval requires explicit revocation first.
        const active = connection.prepare('SELECT id FROM studio_request_allowances WHERE active = 1 AND expires_at > ?').get(now);
        if (active) throw Error('Revoke the current approval before approving another.');
        connection.prepare('UPDATE studio_request_allowances SET active = 0 WHERE active = 1').run();
        // INSERT, never UPSERT: a used approval ID cannot reset its consumed count.
        connection.prepare('INSERT INTO studio_request_allowances (id, max_requests, expires_at, approved_at, active) VALUES (?, ?, ?, ?, 1)')
          .run(approval.id, approval.maxRequests, approval.expiresAt, now);
        connection.exec('COMMIT');
      } catch (error) { connection.exec('ROLLBACK'); throw error; }
    },
    revoke() { connection.prepare('UPDATE studio_request_allowances SET active = 0 WHERE active = 1').run(); },
    reserve(now = Date.now()) {
      if (!validTime(now)) throw Error('Invalid allowance time.');
      // One atomic write: connections sharing this database cannot oversubscribe the same approval.
      const row = connection.prepare(`UPDATE studio_request_allowances SET used_requests = used_requests + 1
        WHERE active = 1 AND approved_at <= ? AND expires_at > ? AND used_requests < max_requests
        RETURNING used_requests`).get(now, now);
      return row !== undefined;
    },
    status(now = Date.now()) {
      if (!validTime(now)) throw Error('Invalid allowance time.');
      const row = connection.prepare(`SELECT max_requests, used_requests, expires_at, approved_at
        FROM studio_request_allowances WHERE active = 1`).get() as {
          max_requests: number; used_requests: number; expires_at: number; approved_at: number;
        } | undefined;
      if (!row) return { state: 'unapproved' as const, remainingRequests: 0 };
      const remainingRequests = Math.max(0, row.max_requests - row.used_requests);
      return { state: row.approved_at > now || row.expires_at <= now ? 'expired' as const
        : remainingRequests === 0 ? 'exhausted' as const : 'available' as const,
      maxRequests: row.max_requests, usedRequests: row.used_requests, remainingRequests,
      expiresAt: row.expires_at };
    },
  };
}
