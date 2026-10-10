import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { studioRequestAllowance, readStudioRequestAllowance } from '../lib/studio-request-allowance';

const now = 1800000000000;
const approval = (maxRequests = 2) => ({ id: randomUUID(), maxRequests, expiresAt: now + 60000 });

test('allowance starts denied; validates explicit bounded approval, expiry, exhaustion and revocation', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const ledger = studioRequestAllowance(db);
    assert.equal(ledger.reserve(now), false); assert.equal(ledger.status(now).state, 'unapproved');
    for (const value of [{ ...approval(), maxRequests: 0 }, { ...approval(), maxRequests: 101 },
      { ...approval(), expiresAt: now }, { ...approval(), expiresAt: now + 31 * 86400000 },
      { ...approval(), id: 'invalid' }, { ...approval(), enableAi: true }]) assert.throws(() => ledger.approve(value, now));
    ledger.approve(approval(), now);
    assert.equal(ledger.reserve(now - 1), false); assert.throws(() => ledger.reserve(NaN));
    assert.equal(ledger.reserve(now), true); assert.equal(ledger.reserve(now), true); assert.equal(ledger.reserve(now), false);
    assert.equal(ledger.status(now).state, 'exhausted'); assert.equal(ledger.status(now).usedRequests, 2);
    assert.equal(ledger.reserve(now + 60000), false); assert.equal(ledger.status(now + 60000).state, 'expired');
    ledger.revoke(); assert.equal(ledger.reserve(now), false);
    assert.equal(db.prepare('SELECT used_requests FROM studio_request_allowances').get()!.used_requests, 2);
  } finally { db.close(); }
});

test('status reads require no schema write and never advertise expired or corrupted allowance', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA query_only=ON;');
    assert.deepEqual(readStudioRequestAllowance(db, now), { state: 'unapproved', remainingRequests: 0 });
    assert.equal(db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all().length, 0);
    db.exec('PRAGMA query_only=OFF;');
    const ledger = studioRequestAllowance(db); ledger.approve(approval(), now); ledger.reserve(now);
    db.exec('PRAGMA query_only=ON;');
    assert.equal(readStudioRequestAllowance(db, now).remainingRequests, 1);
    assert.equal(readStudioRequestAllowance(db, now + 60000).remainingRequests, 0);
    assert.equal(readStudioRequestAllowance(db, now - 1).remainingRequests, 0);
    db.exec('PRAGMA query_only=OFF; PRAGMA ignore_check_constraints=ON; UPDATE studio_request_allowances SET used_requests = 999;');
    assert.throws(() => readStudioRequestAllowance(db, now));
  } finally { db.close(); }
});

test('approval IDs cannot reset consumption; replacement requires revocation or expiry and preserves history', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const ledger = studioRequestAllowance(db), first = approval(); ledger.approve(first, now); ledger.reserve(now);
    assert.throws(() => ledger.approve(approval(), now)); assert.throws(() => ledger.approve(first, now));
    assert.equal(ledger.status(now).usedRequests, 1);
    ledger.revoke(); ledger.approve(approval(1), now);
    assert.throws(() => ledger.approve({ ...first, expiresAt: now + 120000 }, now + 60000));
    assert.equal(ledger.status(now).maxRequests, 1); // Transaction rollback preserves replacement approval.
    ledger.approve({ ...approval(3), expiresAt: now + 120000 }, now + 60000);
    assert.equal(ledger.status(now + 60000).remainingRequests, 3);
    assert.equal(db.prepare('SELECT count(*) AS count FROM studio_request_allowances').get()!.count, 3);
  } finally { db.close(); }
});

test('reservations survive connection restart and share a cap across separate SQLite connections', () => {
  const root = resolve('data/studio-allowance-tests'); mkdirSync(root, { recursive: true });
  const file = resolve(mkdtempSync(resolve(root, 'ledger-')), 'fictional.sqlite');
  let db = new DatabaseSync(file); db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  studioRequestAllowance(db).approve(approval(3), now);
  assert.equal(studioRequestAllowance(db).reserve(now), true); db.close();
  db = new DatabaseSync(file); const other = new DatabaseSync(file);
  try {
    const a = studioRequestAllowance(db), b = studioRequestAllowance(other);
    assert.equal(a.status(now).usedRequests, 1);
    assert.equal(b.reserve(now), true); assert.equal(a.reserve(now), true);
    assert.equal(b.reserve(now), false); assert.equal(a.reserve(now), false);
    assert.equal(a.status(now).usedRequests, 3); assert.equal(b.status(now).usedRequests, 3);
    db.exec('PRAGMA query_only=ON;'); assert.throws(() => a.reserve(now));
  } finally { db.close(); other.close(); }
});

test('parallel workers reserve exactly the shared approved cap without oversubscription', async () => {
  const root = resolve('data/studio-allowance-tests'); mkdirSync(root, { recursive: true });
  const file = resolve(mkdtempSync(resolve(root, 'parallel-')), 'fictional.sqlite');
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    studioRequestAllowance(db).approve(approval(7), now);
    const counts = await Promise.all(Array.from({ length: 4 }, () => new Promise<number>((accept, reject) => {
      const worker = new Worker(`
        const { workerData, parentPort } = require('node:worker_threads');
        const { DatabaseSync } = require('node:sqlite');
        const { studioRequestAllowance } = require(workerData.modulePath);
        globalThis.fetch = async () => { throw Error('Network forbidden'); };
        const connection = new DatabaseSync(workerData.file);
        connection.exec('PRAGMA busy_timeout=5000;');
        try {
          const ledger = studioRequestAllowance(connection); let reserved = 0;
          for (let i = 0; i < 10; i++) if (ledger.reserve(workerData.now)) reserved++;
          parentPort.postMessage(reserved);
        } finally { connection.close(); }
      `, { eval: true, execArgv: ['--import', 'tsx'], workerData: { file, now, modulePath: resolve('lib/studio-request-allowance.ts') } });
      let count: number | undefined;
      worker.on('message', value => { count = value; }); worker.on('error', reject);
      worker.on('exit', code => code === 0 && count !== undefined ? accept(count) : reject(Error('Offline reservation worker failed.')));
    })));
    assert.equal(counts.reduce((sum, count) => sum + count, 0), 7);
    assert.equal(studioRequestAllowance(db).status(now).usedRequests, 7);
    assert.equal(studioRequestAllowance(db).reserve(now), false);
  } finally { db.close(); }
});
