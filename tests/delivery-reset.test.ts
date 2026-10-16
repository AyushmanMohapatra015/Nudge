import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/workspace/route';
import { db } from '../lib/store';
import { sessionToken } from '../lib/auth';
import { deliveryStateFixture } from './fixtures/delivery-state';

test('workspace reset clears demo delivery state but refuses sandbox reset without changing stored records or auxiliary evidence', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN', 'NUDGE_AI_ENABLED'] as const;
  const previous = names.map(name => process.env[name]); const oldFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'sandbox'; process.env.NUDGE_DB_PATH = `./data/delivery-reset-${randomUUID()}.sqlite`;
  process.env.NUDGE_ADMIN_TOKEN = 'fictional-owner-reset-test-only'; process.env.NUDGE_AI_ENABLED = 'false';
  let network = 0; globalThis.fetch = async () => { network++; throw Error('Network forbidden'); };
  const { workspace, plan } = deliveryStateFixture(); workspace.deliveryPlan = plan;
  const records = () => db().prepare('SELECT mode, body FROM workspaces ORDER BY mode').all();
  const auxiliary = () => ({ events: db().prepare('SELECT * FROM webhook_events ORDER BY id').all(),
    operations: db().prepare('SELECT * FROM remote_operations ORDER BY key').all() });
  const reset = () => POST(new NextRequest('http://localhost:3000/api/workspace', { method: 'POST',
    headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json', cookie: `nudge_session=${sessionToken()}` },
    body: JSON.stringify({ type: 'reset' }) }));
  try {
    db().prepare('INSERT INTO workspaces VALUES (?, ?)').run('sandbox', JSON.stringify(workspace));
    db().prepare('INSERT INTO workspaces VALUES (?, ?)').run('demo', JSON.stringify({ ...workspace, mode: 'demo' }));
    db().prepare('INSERT INTO remote_operations VALUES (?, ?)').run('fictional-operation', '{"outcome":"unknown"}');
    db().prepare('INSERT INTO webhook_events VALUES (?, ?)').run('fictional-event', '2026-10-16T00:00:00.000Z');
    const before = records(), evidence = auxiliary();
    assert.equal((await reset()).status, 400); assert.deepEqual(records(), before); assert.deepEqual(auxiliary(), evidence);
    process.env.NUDGE_MODE = 'demo';
    const response = await reset(); assert.equal(response.status, 200);
    const view = await response.json(); assert.equal('deliveryPlan' in view, false);
    const demo = JSON.parse(String(db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('demo')!.body));
    assert.equal('deliveryPlan' in demo, false); assert.equal(demo.agreementStatus, 'draft');
    assert.deepEqual(demo.proposals, []); assert.deepEqual(demo.invoices, []);
    assert.deepEqual(records().find(row => row.mode === 'sandbox'), before.find(row => row.mode === 'sandbox'));
    assert.deepEqual(auxiliary(), evidence); assert.equal(network, 0);
  } finally {
    db().close(); globalThis.fetch = oldFetch;
    names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index]; });
  }
});
