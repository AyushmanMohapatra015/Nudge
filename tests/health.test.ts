import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { GET } from '../app/api/health/route';
import { db } from '../lib/store';

test('health check reports database readiness without seeding workspaces or contacting providers', async () => {
  const oldPath = process.env.NUDGE_DB_PATH, oldFetch = globalThis.fetch;
  process.env.NUDGE_DB_PATH = `./data/health-${randomUUID()}.sqlite`;
  let calls = 0; globalThis.fetch = async () => { calls++; throw Error('Network forbidden'); };
  try {
    const response = GET();
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { status: 'ready' });
    assert.equal(db().prepare('SELECT COUNT(*) AS count FROM workspaces').get()!.count, 0);
    assert.equal(db().prepare('SELECT COUNT(*) AS count FROM remote_operations').get()!.count, 0);
    db().exec('ALTER TABLE workspaces RENAME TO health_unavailable_fixture');
    const unavailable = GET(); assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { status: 'unavailable' });
    assert.equal(unavailable.headers.get('cache-control'), 'no-store');
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
