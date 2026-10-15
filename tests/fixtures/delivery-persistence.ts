import assert from 'node:assert/strict';
import { db, read, mutate } from '../../lib/store';
import { validateStoredDeliveryPlan, readDeliveryPlan } from '../../lib/delivery-plan-state';
import { deliveryStateFixture } from './delivery-state';
import { resolve, dirname, basename } from 'node:path';

// This child is only for a parent-created isolated fictional database, never the ordinary workspace.
const path = resolve(process.env.NUDGE_DB_PATH || '');
assert.equal(basename(path), 'fictional.sqlite');
assert.equal(dirname(dirname(path)), resolve('data'));
assert.ok(basename(dirname(path)).startsWith('delivery-state-'));
const phase = process.argv[2]; assert.ok(phase === 'write' || phase === 'restart');
globalThis.fetch = async () => { throw Error('Network forbidden'); };
const { workspace, plan } = deliveryStateFixture();
const legacy = { ...workspace, version: 9 };
const events = () => db().prepare('SELECT * FROM webhook_events ORDER BY id').all();
const operations = () => db().prepare('SELECT * FROM remote_operations ORDER BY key').all();
try {
  if (phase === 'write') {
    db().prepare('INSERT INTO workspaces VALUES (?, ?)').run('sandbox', JSON.stringify(legacy));
    db().prepare('INSERT INTO webhook_events VALUES (?, ?)').run('fictional-event', '2026-10-15T00:00:00.000Z');
    db().prepare('INSERT INTO remote_operations VALUES (?, ?)').run('fictional-operation', '{"outcome":"unknown"}');
    const before = db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body;
    assert.deepEqual(readDeliveryPlan(read()), { status: 'unconfigured' });
    assert.equal(db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body, before);
    const originalEvents = events(), originalOperations = operations();
    mutate(state => { state.deliveryPlan = validateStoredDeliveryPlan(plan, { ...state, version: state.version + 1 }); });
    assert.deepEqual(read(), { ...legacy, version: 10, deliveryPlan: plan });
    assert.deepEqual(events(), originalEvents); assert.deepEqual(operations(), originalOperations);
    const saved = JSON.stringify(read());
    assert.throws(() => mutate(state => { state.deliveryPlan = validateStoredDeliveryPlan({ ...plan, schemaVersion: 2 }, state); }));
    assert.equal(JSON.stringify(read()), saved, 'failed validation transaction rolls back version/state');
  } else {
    const persisted = read();
    assert.deepEqual(persisted, { ...legacy, version: 10, deliveryPlan: plan });
    assert.equal(readDeliveryPlan(persisted).status, 'ready');
    assert.equal(events().length, 1); assert.equal(operations()[0].body, '{"outcome":"unknown"}');
    const saved = JSON.stringify(persisted), copy = readDeliveryPlan(persisted);
    if (copy.status === 'ready') copy.plan.original!.snapshot.tasks[0].label = 'Output changed';
    assert.equal(JSON.stringify(read()), saved);
    // Malformed schedule stays in storage for review; unrelated paid/accepted records survive.
    const corrupt = { ...persisted, deliveryPlan: { schemaVersion: 999, secret: 'fictional-canary' } };
    db().prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(JSON.stringify(corrupt), 'sandbox');
    const before = db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body;
    assert.deepEqual(readDeliveryPlan(read()), { status: 'review-needed' });
    assert.equal(db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body, before);
    assert.deepEqual(read().invoices, persisted.invoices); assert.deepEqual(read().audit, persisted.audit);
  }
  console.log(JSON.stringify({ phase, passed: true }));
} finally { db().close(); }
