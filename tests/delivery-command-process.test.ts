import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import type { Workspace } from '../lib/domain';
import type { DeliveryCommand } from '../lib/delivery-plan-actions';

test('separate SQLite processes serialize stage/apply/discard and preserve previews, originals and financial evidence across restarts', async () => {
  mkdirSync('data', { recursive: true });
  const directory = mkdtempSync(resolve('data/delivery-command-'));
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'test', SystemRoot: process.env.SystemRoot, PATH: process.env.PATH,
    TEMP: process.env.TEMP, TMP: process.env.TMP, NUDGE_MODE: 'sandbox', NUDGE_AI_ENABLED: 'false',
    NUDGE_DB_PATH: join(directory, 'fictional.sqlite') };
  const args = ['--import', 'tsx', 'tests/fixtures/delivery-command-process.ts'];
  type Snapshot = { workspace: Workspace; events: unknown[]; operations: unknown[] };
  const inspect = (phase = 'inspect'): Snapshot => {
    const result = spawnSync(process.execPath, [...args, phase], { cwd: process.cwd(), env, encoding: 'utf8', timeout: 20_000 });
    assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout);
  };
  const financial = ({ workspace, ...tables }: Snapshot) => {
    const { deliveryPlan: _plan, audit: _audit, version: _version, ...records } = workspace; return { records, ...tables };
  };
  const race = async (commands: DeliveryCommand[]) => {
    const workers = commands.map(() => {
      const child = spawn(process.execPath, [...args, 'command'], { cwd: process.cwd(), env, windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
      let stderr = '', status: number | undefined;
      child.stderr!.on('data', value => { stderr += value.toString().slice(0, 4096 - stderr.length); });
      let readyResolve!: () => void, readyReject!: (error: Error) => void;
      const ready = new Promise<void>((done, reject) => { readyResolve = done; readyReject = reject; });
      const outcome = new Promise<number>((done, reject) => {
        child.once('error', error => { readyReject(error); reject(error); });
        child.on('message', (message: { ready?: boolean; pid?: number; status?: number }) => {
          if (message.ready && message.pid === child.pid) readyResolve();
          if (typeof message.status === 'number') status = message.status;
        });
        child.once('exit', code => {
          if (code === 0 && status !== undefined) done(status);
          else { const error = Error('Isolated worker failed: ' + stderr); readyReject(error); reject(error); }
        });
      });
      // Attach rejection handling before waiting for the readiness barrier.
      void outcome.catch(() => {}); void ready.catch(() => {});
      return { child, ready, outcome };
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([(async () => {
        await Promise.all(workers.map(worker => worker.ready));
        assert.equal(new Set(workers.map(worker => worker.child.pid)).size, commands.length);
        workers.forEach((worker, i) => worker.child.send(commands[i]));
        return Promise.all(workers.map(worker => worker.outcome));
      })(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Isolated command deadline exceeded')), 20_000); })]);
    } finally {
      clearTimeout(timer);
      for (const worker of workers) if (worker.child.exitCode === null && worker.child.signalCode === null) worker.child.kill();
    }
  };
  const baseline = inspect('initialize');
  const stage: DeliveryCommand = { type: 'stage', expectedWorkspaceVersion: baseline.workspace.version, expectedPlanRevision: 0,
    expectedPreviewId: null, calendar: { timezone: 'Asia/Kolkata', weekdays: [1,2,3,4,5], holidays: ['2026-10-19'] },
    candidate: { tasks: [{ key: 'new:website', label: 'Website delivery', kind: 'base', proposalId: null, references: ['S1'],
      duration: 3, startDate: '2026-10-16', endDateExclusive: '2026-10-22' }], dependencies: [] } };
  assert.deepEqual((await race([stage, stage])).sort(), [200,409]);
  let saved = inspect(); assert.deepEqual(saved, inspect(), 'fresh processes read an identical persisted initialization preview');
  assert.equal(saved.workspace.version, baseline.workspace.version + 1);
  assert.equal(saved.workspace.audit.length, baseline.workspace.audit.length + 1);
  assert.equal(saved.workspace.deliveryPlan!.revision, 0); assert.equal(saved.workspace.deliveryPlan!.current, null);
  assert.notEqual(saved.workspace.deliveryPlan!.preview!.candidate.snapshot.tasks[0].id, 'new:website');
  const decision = (type: 'apply' | 'discard'): DeliveryCommand => ({ type, expectedWorkspaceVersion: saved.workspace.version,
    previewId: saved.workspace.deliveryPlan!.preview!.id, confirmed: true });
  assert.deepEqual((await race([decision('apply'), decision('discard')])).sort(), [200,409]);
  let settled = inspect(); assert.equal(settled.workspace.version, saved.workspace.version + 1);
  assert.equal(settled.workspace.audit.length, saved.workspace.audit.length + 1);
  assert.equal(settled.workspace.deliveryPlan?.preview, undefined);
  assert.deepEqual(financial(settled), financial(baseline));
  if (!settled.workspace.deliveryPlan) {
    assert.deepEqual(await race([{ ...stage, expectedWorkspaceVersion: settled.workspace.version }]), [200]);
    saved = inspect(); assert.deepEqual(await race([decision('apply')]), [200]); settled = inspect();
  }
  assert.equal(settled.workspace.deliveryPlan!.revision, 1);
  const original = structuredClone(settled.workspace.deliveryPlan!.original);
  const next: DeliveryCommand = { ...stage, expectedWorkspaceVersion: settled.workspace.version, expectedPlanRevision: 1,
    candidate: { tasks: settled.workspace.deliveryPlan!.current!.snapshot.tasks.map(({ id, ...task }) => ({ ...task, key: id,
      duration: 4, endDateExclusive: '2026-10-23' })), dependencies: [] } };
  assert.deepEqual(await race([next]), [200]); saved = inspect();
  assert.deepEqual(saved, inspect(), 'change preview survives another process restart');
  const apply = decision('apply'); assert.deepEqual((await race([apply, apply])).sort(), [200,409]);
  const after = inspect(); assert.equal(after.workspace.deliveryPlan!.revision, 2);
  assert.deepEqual(after.workspace.deliveryPlan!.original, original);
  assert.equal(after.workspace.deliveryPlan!.current!.snapshot.tasks[0].endDateExclusive, '2026-10-23');
  assert.equal(after.workspace.audit.length, saved.workspace.audit.length + 1);
  assert.deepEqual(financial(after), financial(baseline));
  assert.deepEqual(await race([apply]), [409]); assert.deepEqual(inspect(), after, 'lost-response retry has no version/audit/financial effect');
});
