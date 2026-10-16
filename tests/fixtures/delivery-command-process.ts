import assert from 'node:assert/strict';
import { basename, dirname, resolve } from 'node:path';
import { db, read } from '../../lib/store';
import { executeDeliveryCommand, DeliveryCommandError } from '../../lib/delivery-plan-actions';
import { deliveryStateFixture } from './delivery-state';

// Parent-created fictional fixture only; never the ordinary workspace database.
const path = resolve(process.env.NUDGE_DB_PATH || '');
assert.equal(basename(path), 'fictional.sqlite');
assert.equal(dirname(dirname(path)), resolve('data'));
assert.ok(basename(dirname(path)).startsWith('delivery-command-'));
assert.equal(process.env.NUDGE_MODE, 'sandbox');
globalThis.fetch = async () => { throw Error('Network forbidden'); };
const inspect = () => ({ workspace: read(), events: db().prepare('SELECT * FROM webhook_events ORDER BY id').all(),
  operations: db().prepare('SELECT * FROM remote_operations ORDER BY key').all() });
const phase = process.argv[2];
if (phase === 'initialize') {
  try {
    const { workspace } = deliveryStateFixture(); workspace.proposals[0].status = 'accepted';
    db().prepare('INSERT INTO workspaces VALUES (?, ?)').run('sandbox', JSON.stringify(workspace));
    db().prepare('INSERT INTO webhook_events VALUES (?, ?)').run('fictional-event', '2026-10-16T00:00:00.000Z');
    db().prepare('INSERT INTO remote_operations VALUES (?, ?)').run('fictional-operation', '{"outcome":"unknown"}');
    console.log(JSON.stringify(inspect()));
  } finally { db().close(); }
} else if (phase === 'inspect') {
  try { console.log(JSON.stringify(inspect())); } finally { db().close(); }
} else {
  assert.equal(phase, 'command'); assert.ok(process.send);
  db(); // Open a separate connection before reporting readiness to the parent.
  process.send({ ready: true, pid: process.pid });
  process.once('message', input => {
    try { executeDeliveryCommand(input); process.send!({ status: 200 }); }
    catch (error) {
      if (!(error instanceof DeliveryCommandError)) throw error;
      process.send!({ status: error.status });
    } finally { db().close(); process.disconnect(); }
  });
}
