import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readDeliveryPlan, validateStoredDeliveryPlan, deliveryImpact, type DeliveryPlan } from '../lib/delivery-plan-state';
import { validateDeliverySnapshot } from '../lib/delivery-plan';
import { ownerAnalytics } from '../lib/owner-analytics';
import { scopeAiPayload } from '../lib/ai-payload';
import { deliveryStateFixture, baseTaskId, planStamp } from './fixtures/delivery-state';

test('legacy reads are unconfigured without migration, and malformed schedules fail closed without disclosure', () => {
  const { workspace } = deliveryStateFixture(), before = JSON.stringify(workspace);
  assert.deepEqual(readDeliveryPlan(workspace), { status: 'unconfigured' });
  for (const bad of [null, {}, { schemaVersion: 2, secret: 'private-canary' }, 'private-canary']) {
    assert.deepEqual(readDeliveryPlan({ ...workspace, deliveryPlan: bad }), { status: 'review-needed' });
    assert.throws(() => validateStoredDeliveryPlan(bad, workspace), { message: 'Stored delivery plan requires review.' });
  }
  assert.equal(JSON.stringify(workspace), before);
});

test('stored current/original/preview round trip into detached records with a computed impact', () => {
  const { workspace, plan } = deliveryStateFixture(), before = structuredClone(plan);
  const oldFetch = globalThis.fetch; globalThis.fetch = async () => { throw Error('Network forbidden'); };
  try {
    const result = readDeliveryPlan({ ...workspace, deliveryPlan: plan });
    assert.equal(result.status, 'ready'); if (result.status !== 'ready') throw Error('Fixture rejected');
    assert.equal(result.previewStale, false);
    assert.equal(result.plan.preview!.diff.finishDeltaCalendarDays, 3);
    assert.equal(result.plan.preview!.diff.taskChanges.length, 1);
    assert.equal(result.plan.preview!.warnings.length, 1);
    result.plan.original!.snapshot.tasks[0].label = 'Changed result'; result.plan.preview!.candidate.calendar.holidays.push('2026-10-19');
    assert.deepEqual(plan, before);
  } finally { globalThis.fetch = oldFetch; }
});

test('revision-zero initialization requires a standalone base preview, never an applied plan or extra', () => {
  const { workspace, plan } = deliveryStateFixture();
  const validated = validateDeliverySnapshot(plan.calendar, plan.current!.snapshot, workspace, { phase: 'preview' });
  const initial: DeliveryPlan = { schemaVersion: 1, revision: 0, calendar: null, original: null, current: null, preview: {
    ...plan.preview!, kind: 'initialize', basePlanRevision: 0, candidate: { calendar: validated.calendar, snapshot: validated.snapshot },
    diff: deliveryImpact(null, validated), warnings: [],
  } };
  assert.equal(readDeliveryPlan({ ...workspace, deliveryPlan: initial }).status, 'ready');
  for (const patch of [{ preview: undefined }, { current: plan.current }, { calendar: plan.calendar }, { original: plan.original }]) {
    assert.equal(readDeliveryPlan({ ...workspace, deliveryPlan: { ...initial, ...patch } }).status, 'review-needed');
  }
  initial.preview!.candidate = structuredClone(plan.preview!.candidate);
  assert.equal(readDeliveryPlan({ ...workspace, deliveryPlan: initial }).status, 'review-needed');
});

test('declined or accepted decisions after staging preserve a stale preview, not a silent rebase', () => {
  for (const status of ['accepted', 'declined'] as const) {
    const { workspace, plan } = deliveryStateFixture(); workspace.proposals[0].status = status;
    const before = JSON.stringify({ workspace, plan });
    const result = readDeliveryPlan({ ...workspace, version: 11, deliveryPlan: plan });
    assert.equal(result.status, 'ready'); if (result.status !== 'ready') throw Error('Stale fixture rejected');
    assert.equal(result.previewStale, true); assert.equal(result.plan.preview!.stagedWorkspaceVersion, 10);
    assert.equal(result.plan.preview!.warnings.length, 1);
    assert.equal(JSON.stringify({ workspace, plan }), before);
    assert.equal(readDeliveryPlan({ ...workspace, deliveryPlan: plan }).status, 'review-needed', 'without a version change the warnings must agree');
  }
});

test('forged metadata, immutable source/calendar changes, invalid history and invented impact are rejected', () => {
  const { workspace, plan } = deliveryStateFixture();
  const alterations: ((p: DeliveryPlan) => void)[] = [
    p => { p.revision = 0; }, p => { p.revision = 11; }, p => { p.current = null; },
    p => { p.current!.snapshot.tasks[0].label = 'Different revision one'; },
    p => { p.current!.appliedAt = '2026-10-14T00:00:00.000Z'; },
    p => { p.current!.appliedAt = 'invalid-private-canary'; },
    p => { p.calendar!.timezone = 'UTC'; }, p => { p.original!.snapshot.tasks[0].references = ['S3']; },
    p => { p.preview!.kind = 'initialize'; }, p => { p.preview!.basePlanRevision = 0; },
    p => { p.preview!.stagedWorkspaceVersion = 11; }, p => { p.preview!.baseWorkspaceVersion = 8; },
    p => { p.preview!.stagedAt = '2026-10-14T00:00:00.000Z'; },
    p => { p.preview!.warnings = []; }, p => { p.preview!.warnings.push(p.preview!.warnings[0]); },
    p => { p.preview!.warnings[0].taskId = baseTaskId; },
    p => { p.preview!.diff.finishDeltaCalendarDays = -3; },
    p => { p.preview!.diff.taskChanges[0].after.label = 'Forged impact'; },
    p => { p.preview!.candidate.snapshot.tasks[1].endDateExclusive = '2026-10-23'; },
  ];
  for (const alter of alterations) {
    const candidate = structuredClone(plan); alter(candidate);
    assert.equal(readDeliveryPlan({ ...workspace, deliveryPlan: candidate }).status, 'review-needed');
  }
  assert.equal(readDeliveryPlan({ ...workspace, deliveryPlan: { ...plan, autoSend: true } }).status, 'review-needed');
});

test('later applied revisions preserve original scope, can include accepted extras, and have independent previews', () => {
  const { workspace, plan } = deliveryStateFixture(); workspace.proposals[0].status = 'accepted';
  plan.revision = 2; plan.current = { snapshot: structuredClone(plan.preview!.candidate.snapshot), appliedAt: plan.preview!.stagedAt, actor: 'You' };
  delete plan.preview;
  assert.equal(validateStoredDeliveryPlan(plan, workspace).original!.createdAt, planStamp);
  plan.current.snapshot.tasks[0].references = ['S3'];
  assert.equal(readDeliveryPlan({ ...workspace, deliveryPlan: plan }).status, 'review-needed');
});

test('internal plan labels do not enter existing analytics or scope AI allowlists', () => {
  const { workspace, plan } = deliveryStateFixture();
  const before = { analytics: ownerAnalytics(workspace), ai: scopeAiPayload('Booking request', workspace.agreement) };
  workspace.deliveryPlan = plan;
  assert.deepEqual(ownerAnalytics(workspace).invoices, before.analytics.invoices);
  assert.deepEqual(scopeAiPayload('Booking request', workspace.agreement), before.ai);
  assert.equal(JSON.stringify(ownerAnalytics(workspace)).includes('Fictional website'), false);
  assert.equal(JSON.stringify(scopeAiPayload('Booking request', workspace.agreement)).includes('Booking extra'), false);
});

test('actual store preserves plan, legacy bytes, original financial state and auxiliary evidence across fresh processes', () => {
  mkdirSync('data', { recursive: true });
  const directory = mkdtempSync(resolve('data/delivery-state-')), dbPath = join(directory, 'fictional.sqlite');
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'test', SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, TEMP: process.env.TEMP,
    TMP: process.env.TMP, NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: dbPath, NUDGE_AI_ENABLED: 'false' };
  for (const phase of ['write', 'restart']) {
    const child = spawnSync(process.execPath, ['--import', 'tsx', 'tests/fixtures/delivery-persistence.ts', phase], {
      cwd: process.cwd(), env, encoding: 'utf8', timeout: 20_000,
    });
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), { phase, passed: true });
  }
});
