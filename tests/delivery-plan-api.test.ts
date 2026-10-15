import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/delivery-plan/route';
import { db, read, mutate } from '../lib/store';
import { sessionToken } from '../lib/auth';
import { ownerReadWindow, ownerActionWindow } from '../lib/request-guards';
import { deliveryStateFixture } from './fixtures/delivery-state';
import type { DeliveryCommand } from '../lib/delivery-plan-actions';

test('delivery API owns schedule changes without seeding, provider calls or financial side effects', async t => {
  const savedEnv = { mode: process.env.NUDGE_MODE, path: process.env.NUDGE_DB_PATH, admin: process.env.NUDGE_ADMIN_TOKEN };
  const oldFetch = globalThis.fetch; let calls = 0;
  process.env.NUDGE_MODE = 'sandbox'; process.env.NUDGE_DB_PATH = `./data/delivery-api-${randomUUID()}.sqlite`;
  process.env.NUDGE_ADMIN_TOKEN = 'fictional-delivery-owner-token-for-tests-only';
  globalThis.fetch = async () => { calls++; throw Error('Network forbidden'); };
  const cookie = sessionToken(), origin = 'http://localhost:3000';
  const get = (token: string | undefined = cookie) => GET(new NextRequest(`${origin}/api/delivery-plan?mode=demo&includePrivate=true`, {
    headers: token ? { cookie: `nudge_session=${token}` } : {},
  }));
  const request = (body: unknown, token: string | undefined = cookie, source = origin) => new NextRequest(`${origin}/api/delivery-plan`, {
    method: 'POST', headers: { host: 'localhost:3000', origin: source, 'content-type': 'application/json',
      ...(token ? { cookie: `nudge_session=${token}` } : {}) }, body: JSON.stringify(body),
  });
  const post = (body: unknown) => POST(request(body));
  const body = () => String(db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('sandbox')!.body);
  const fixture = () => {
    const { workspace } = deliveryStateFixture();
    workspace.proposals[0].status = 'accepted';
    db().prepare('INSERT OR REPLACE INTO workspaces VALUES (?, ?)').run('sandbox', JSON.stringify(workspace));
    return workspace;
  };
  const stage = (): Extract<DeliveryCommand, { type: 'stage' }> => ({ type: 'stage', expectedWorkspaceVersion: read().version,
    expectedPlanRevision: read().deliveryPlan?.revision || 0, expectedPreviewId: read().deliveryPlan?.preview?.id || null,
    calendar: { timezone: 'Asia/Kolkata', weekdays: [1, 2, 3, 4, 5], holidays: [] }, candidate: { tasks: [{
      key: 'new:website', label: 'Website delivery', kind: 'base', proposalId: null, references: ['S1'], duration: 3,
      startDate: '2026-10-16', endDateExclusive: '2026-10-21',
    }], dependencies: [] } });
  const command = (type: 'apply' | 'discard') => ({ type, expectedWorkspaceVersion: read().version,
    previewId: read().deliveryPlan!.preview!.id, confirmed: true });
  const finances = () => {
    const { deliveryPlan: _plan, version: _version, audit: _audit, ...rest } = read();
    return JSON.stringify({ rest, operations: db().prepare('SELECT * FROM remote_operations ORDER BY key').all(),
      events: db().prepare('SELECT * FROM webhook_events ORDER BY id').all() });
  };
  async function initialize() {
    assert.equal((await post(stage())).status, 200);
    assert.equal((await post(command('apply'))).status, 200);
  }
  const changed = () => {
    const action = stage(), current = read().deliveryPlan!.current!.snapshot;
    action.candidate.tasks = current.tasks.map(({ id, ...task }) => ({ ...task, key: id }));
    action.candidate.dependencies = current.dependencies.map(edge => ({ predecessorKey: edge.predecessorId, successorKey: edge.successorId, type: edge.type }));
    action.candidate.tasks[0].duration = 4; action.candidate.tasks[0].endDateExclusive = '2026-10-22';
    return action;
  };
  try {
    await t.test('owner/origin gates and missing workspaces never seed a record', async () => {
      for (const token of ['', 'fictional-client-token', sessionToken(Date.now() - 8 * 60 * 60 * 1000)]) {
        assert.equal(get(token).status, 401);
        assert.equal((await POST(request({}, token))).status, 401);
      }
      assert.equal((await POST(request({}, cookie, 'https://untrusted.example'))).status, 403);
      assert.equal(get().status, 404);
      assert.equal((await post({ type: 'discard', expectedWorkspaceVersion: 1, previewId: randomUUID(), confirmed: true })).status, 404);
      assert.equal(db().prepare('SELECT COUNT(*) AS count FROM workspaces').get()!.count, 0);
    });
    await t.test('read-only snapshot omits private URLs, tokens, notes, invoices identities and provider fetching', async () => {
      fixture();
      db().prepare('INSERT INTO remote_operations VALUES (?, ?)').run('fictional-operation', '{"pending":true}');
      db().prepare('INSERT INTO webhook_events VALUES (?, ?)').run('fictional-event', '2026-10-15T00:00:00.000Z');
      const original = body(); db().exec('PRAGMA query_only=ON');
      try {
        const response = get(), view = await response.json();
        assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(view.status, 'unconfigured'); assert.equal(view.stateSource, 'local-records'); assert.equal(view.remoteCheckedAt, null);
        assert.equal(view.invoices[0].status, 'PAID'); assert.equal(view.invoices[0].outstandingCents, 0);
        assert.equal(view.planning.agreementAccepted, true);
        assert.deepEqual(view.planning.clauses.map((clause: { id: string }) => clause.id), ['S1', 'S3']);
        assert.equal(view.planning.eligibleExtras[0].status, 'accepted');
        assert.deepEqual(view.planning.eligibleExtras[0].references, ['S3']);
        for (const value of ['fictional-client-token', 'fictional-original-base-key', 'private.example', 'buyer@example.com', 'INV2-FICTIONAL', 'Fictional history retained']) {
          assert.equal(JSON.stringify(view).includes(value), false);
        }
        assert.equal(body(), original);
      } finally { db().exec('PRAGMA query_only=OFF'); }
    });
    await t.test('stage/apply/discard preserve financial records and consume one preview only', async () => {
      fixture(); const financialBefore = finances(), initial = read();
      let response = await post(stage()); assert.equal(response.status, 200);
      let state = read(); assert.equal(state.deliveryPlan!.current, null); assert.equal(state.version, initial.version + 1);
      assert.notEqual(state.deliveryPlan!.preview!.candidate.snapshot.tasks[0].id, 'new:website');
      assert.equal(state.audit.length, initial.audit.length + 1); assert.equal(finances(), financialBefore);
      assert.equal((await post(command('discard'))).status, 200); assert.equal(read().deliveryPlan, undefined);
      await initialize();
      const baseline = structuredClone(read().deliveryPlan!.original);
      response = await post(changed()); assert.equal(response.status, 200);
      assert.equal(read().deliveryPlan!.current!.snapshot.tasks[0].duration, 3);
      assert.equal((await response.json()).plan.preview.diff.finishDeltaCalendarDays, 1);
      const apply = command('apply');
      // Treat the first response as lost. Repeating it must not apply or audit again.
      assert.equal((await post(apply)).status, 200);
      const applied = body(); assert.equal((await post(apply)).status, 409); assert.equal(body(), applied);
      assert.equal(read().deliveryPlan!.revision, 2); assert.deepEqual(read().deliveryPlan!.original, baseline);
      assert.equal(read().deliveryPlan!.current!.snapshot.tasks[0].duration, 4); assert.equal(finances(), financialBefore);
      assert.equal(get().status, 200);
      assert.equal((await post(changed())).status, 200);
      const discard = command('discard'); assert.equal((await post(discard)).status, 200);
      const discarded = body(); assert.equal((await post(discard)).status, 409); assert.equal(body(), discarded);
    });
    await t.test('parallel stage requests, mismatched preview/revision and busy workspaces reject atomically', async () => {
      fixture(); const action = stage(), count = read().audit.length;
      const responses = await Promise.all([post(action), post(action)]);
      assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]); assert.equal(read().audit.length, count + 1);
      const old = body(); assert.equal((await post({ ...stage(), expectedPreviewId: null })).status, 409); assert.equal(body(), old);
      assert.equal((await post({ ...stage(), expectedPlanRevision: 9 })).status, 409); assert.equal(body(), old);
      const apply = command('apply');
      const applied = await Promise.all([post(apply), post(apply)]);
      assert.deepEqual(applied.map(r => r.status).sort(), [200, 409]);
      assert.equal(read().deliveryPlan!.revision, 1); assert.equal(read().audit.length, count + 2);
      assert.equal((await post(changed())).status, 200);
      mutate(s => { s.processing = { key: 'fictional-pending', operation: 'manual review', startedAt: new Date().toISOString() }; });
      const busy = body(); assert.equal((await post(command('apply'))).status, 409); assert.equal(body(), busy);
      assert.equal((await post(command('discard'))).status, 409); assert.equal(body(), busy);
    });
    await t.test('extra acceptance and payment-state changes stale previews, with explicit restaging required', async () => {
      fixture(); await initialize();
      mutate(s => { s.proposals[0].status = 'approved'; });
      const add = changed(); add.candidate.tasks[0].duration = 3; add.candidate.tasks[0].endDateExclusive = '2026-10-21';
      add.candidate.tasks.push({ key: 'new:booking', label: 'Booking extra', kind: 'extra', proposalId: read().proposals[0].id,
        references: ['S3'], duration: 3, startDate: '2026-10-21', endDateExclusive: '2026-10-24' });
      add.candidate.dependencies.push({ predecessorKey: add.candidate.tasks[0].key, successorKey: 'new:booking', type: 'finish-to-start' });
      assert.equal((await post(add)).status, 200);
      const blocked = body(); assert.equal((await post(command('apply'))).status, 400); assert.equal(body(), blocked);
      mutate(s => { s.proposals[0].status = 'accepted'; });
      assert.equal((await get().json()).previewStale, true);
      const stale = body(); assert.equal((await post(command('apply'))).status, 409); assert.equal(body(), stale);
      const restage = changed();
      restage.candidate.tasks = read().deliveryPlan!.preview!.candidate.snapshot.tasks.map(({ id, ...task }) => ({ ...task, key: id }));
      restage.candidate.dependencies = read().deliveryPlan!.preview!.candidate.snapshot.dependencies.map(edge => ({
        predecessorKey: edge.predecessorId, successorKey: edge.successorId, type: edge.type,
      }));
      const extraId = read().deliveryPlan!.preview!.candidate.snapshot.tasks[1].id;
      assert.equal((await post(restage)).status, 200);
      assert.equal(read().deliveryPlan!.preview!.candidate.snapshot.tasks[1].id, extraId, 'restage preserves server preview identities');
      mutate(s => { s.invoices[0].status = 'PARTIALLY_PAID'; s.invoices[0].outstandingCents = 1; });
      assert.equal((await post(command('apply'))).status, 409);
      assert.equal((await post({ ...restage, expectedWorkspaceVersion: read().version, expectedPreviewId: read().deliveryPlan!.preview!.id })).status, 200);
      const financialBefore = finances(); assert.equal((await post(command('apply'))).status, 200); assert.equal(finances(), financialBefore);
      assert.equal(read().deliveryPlan!.current!.snapshot.tasks.length, 2);
    });
    await t.test('strict command fields, forged identities, unsupported calendar and body size fail without writes', async () => {
      fixture();
      const action = stage(), original = body();
      const badTasks = [
        { ...action.candidate.tasks[0], key: randomUUID() },
        { ...action.candidate.tasks[0], id: randomUUID() },
        { ...action.candidate.tasks[0], payUrl: 'private-canary' },
      ];
      for (const bad of [{ ...action, sendInvoice: true }, { ...action, confirmed: true }, ...badTasks.map(task => ({ ...action, candidate: { tasks: [task], dependencies: [] } }))]) {
        const response = await post(bad); assert.equal(response.status, 400); assert.equal(body(), original);
        assert.equal(JSON.stringify(await response.json()).includes('private-canary'), false);
      }
      const noConfirmation = { type: 'apply', expectedWorkspaceVersion: read().version, previewId: randomUUID() };
      assert.equal((await post(noConfirmation)).status, 400); assert.equal(body(), original);
      assert.equal((await post({ ...action, candidate: { ...action.candidate, tasks: [action.candidate.tasks[0], action.candidate.tasks[0]] } })).status, 400);
      const huge = request({ note: 'x'.repeat(33 * 1024) });
      assert.equal((await POST(huge)).status, 413); assert.equal(body(), original);
      const invalidText = new NextRequest(`${origin}/api/delivery-plan`, { method: 'POST', headers: {
        host: 'localhost:3000', origin, cookie: `nudge_session=${cookie}` }, body: new Uint8Array([255]) });
      assert.equal((await POST(invalidText)).status, 400); assert.equal(body(), original);
      await initialize(); const baseline = body(), calendar = { ...stage().calendar, timezone: 'UTC' };
      assert.equal((await post({ ...changed(), calendar })).status, 400); assert.equal(body(), baseline);
    });
    await t.test('auth revoked during body reading, malformed stored plans and raw database errors remain bounded', async () => {
      fixture(); const original = body(); const req = request(stage()), reader = req.body!.getReader(); let changed = false;
      const oldSecret = process.env.NUDGE_ADMIN_TOKEN;
      Object.defineProperty(req, 'body', { value: { getReader: () => ({
        read: async () => { if (!changed) { changed = true; process.env.NUDGE_ADMIN_TOKEN = 'fictional-revoked-token-for-tests-only'; } return reader.read(); },
        cancel: () => reader.cancel(), releaseLock: () => reader.releaseLock(),
      }) } });
      assert.equal((await POST(req)).status, 401); assert.equal(body(), original); process.env.NUDGE_ADMIN_TOKEN = oldSecret;
      const corrupt = { ...read(), deliveryPlan: { schemaVersion: 99, privateValue: 'private-canary' } };
      db().prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(JSON.stringify(corrupt), 'sandbox');
      const response = get(); assert.equal(response.status, 200); const view = await response.json();
      assert.equal(view.status, 'review-needed'); assert.equal('plan' in view, false); assert.equal(JSON.stringify(view).includes('private-canary'), false);
      const bad = body(); assert.equal((await post(stage())).status, 409); assert.equal(body(), bad);
      db().prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run('private-canary invalid JSON', 'sandbox');
      const unavailable = get(); assert.equal(unavailable.status, 503); assert.equal(JSON.stringify(await unavailable.json()).includes('private-canary'), false);
      fixture();
      mutate(s => { s.invoices[0].outstandingCents = 0.5; });
      const invalidMoney = body();
      assert.equal((await post(stage())).status, 503);
      assert.equal(body(), invalidMoney, 'projection validation failure rolls back the staged plan, audit and version');
      fixture();
    });
    await t.test('demo cannot select sandbox records; shared quotas block before database work', async () => {
      process.env.NUDGE_MODE = 'demo'; assert.equal(get('').status, 404); process.env.NUDGE_MODE = 'sandbox';
      while (!ownerReadWindow.take()) { /* Exhaust process-local read quota. */ }
      while (!ownerActionWindow.take()) { /* Exhaust process-local write quota. */ }
      db().exec('ALTER TABLE workspaces RENAME TO delivery_quota_fixture');
      assert.equal(get().status, 429); assert.ok(Number(get().headers.get('retry-after')) > 0);
      assert.equal((await post({})).status, 429); assert.equal(get('').status, 401);
      assert.equal(calls, 0);
    });
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of [['NUDGE_MODE', savedEnv.mode], ['NUDGE_DB_PATH', savedEnv.path], ['NUDGE_ADMIN_TOKEN', savedEnv.admin]] as const) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
