import { test, expect, type Page } from '@playwright/test';
import { buildSync } from 'esbuild';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import type {} from '../fixtures/studio-agent';

const requests = new WeakMap<Page, string[]>();
const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  requests.set(page, []); runtimeErrors.set(page, []);
  page.on('request', request => requests.get(page)!.push(request.url()));
  page.on('pageerror', error => runtimeErrors.get(page)!.push(error.message));
  const directory = test.info().outputPath('bundle'); mkdirSync(directory, { recursive: true });
  const bundle = resolve(directory, 'fixture.js');
  buildSync({ entryPoints: [resolve('tests/fixtures/studio-agent.ts')], bundle: true,
    outfile: bundle, platform: 'browser', format: 'iife', logLevel: 'silent' });
  await page.route('**/*', route => route.abort());
  await page.setContent('<html lang="en"><head><title>Offline Studio test</title></head><body><div id="studio" style="height:600px;width:900px"></div></body></html>');
  await page.addScriptTag({ path: bundle });
});
test.afterEach(async ({ page }) => {
  await page.evaluate(() => window.studioAgentFixture?.dispose());
  expect(requests.get(page)).toEqual([]); expect(runtimeErrors.get(page)).toEqual([]);
});

const state = (page: Page) => page.evaluate(() => window.studioAgentFixture.state());
async function settled(page: Page) {
  await expect.poll(async () => (await state(page)).status).not.toBe('running');
  return state(page);
}

test('real Studio harness seeds totals, executes the tool and resumes the scripted turn without network or record changes', async ({ page }) => {
  await page.evaluate(() => window.studioAgentFixture.start('normal'));
  const result = await settled(page);
  expect(result.agents).toEqual(['nudge-snapshot-analyst']); expect(result.turns).toBe(2);
  expect(result.status).toBe('idle');
  const executions = result.observations.filter(event => event.type === 'tool_execution_finished');
  expect(executions).toHaveLength(2); expect(executions.every(event => event.ok && event.name === 'nudge_snapshot_totals')).toBe(true);
  for (const turn of result.inputSummaries as { tools: string[]; messages: { role: string; content?: string }[] }[]) {
    expect(turn.tools).toEqual(['nudge_snapshot_totals']);
    const outputs = turn.messages.filter(message => message.role === 'tool').map(message => JSON.parse(message.content!));
    expect(outputs.length).toBeGreaterThan(0);
    for (const output of outputs) expect(output.data.totals).toEqual(result.snapshot.totals);
  }
  expect(JSON.stringify(result.messages)).toContain('Offline scripted response. No model was called.');
  expect(result.snapshot.version).toBe(2); expect(result.snapshot.totals.outstandingCents).toBe(579);
  expect(result.observations.filter(event => event.type === 'run_finished').map(event => event.status)).toEqual(['ok']);
  await page.evaluate(() => window.studioAgentFixture.deleteThread());
  expect((await state(page)).threads).toBe(0);
});

for (const scenario of ['stale', 'invalid', 'unknown', 'loop', 'cancel'] as const) {
  test(`real Studio harness handles ${scenario} requests`, async ({ page }) => {
    await page.evaluate(scenario => window.studioAgentFixture.start(scenario), scenario);
    if (scenario === 'cancel') {
      await expect.poll(async () => (await state(page)).waiting).toBe(true);
      await page.evaluate(() => window.studioAgentFixture.cancel());
    }
    const result = await settled(page);
    const executions = result.observations.filter(event => event.type === 'tool_execution_finished');
    const finished = result.observations.filter(event => event.type === 'run_finished');
    expect(finished).toHaveLength(1);
    expect(result.snapshot.totals.outstandingCents).toBe(579);
    expect(result.snapshot).toEqual({ version: scenario === 'stale' ? 3 : 2, mode: 'demo',
      asOf: '2026-10-09T00:00:00.000Z', currency: 'USD', invoices: [], changes: [],
      totals: { outstandingCents: 579, overdueCents: 123, unknownDueDateCents: 1, approvedExtraCents: 30001,
        awaitingAcceptanceCents: 30001, awaitingAcceptanceCount: 1, statusReviewCount: 0 } });
    for (const turn of result.inputSummaries as { tools: string[] }[]) expect(turn.tools).toEqual(['nudge_snapshot_totals']);
    if (scenario === 'cancel') {
      expect(finished[0].status).toBe('cancelled');
      expect(result.status).toBe('idle'); expect(result.turns).toBe(1); expect(executions).toHaveLength(1);
      expect(executions[0].ok).toBe(true);
      expect(JSON.stringify(result.messages)).not.toContain('Offline scripted response.');
    } else if (scenario === 'loop') {
      expect(result.status).toBe('error'); expect(finished[0].status).toBe('error');
      expect(result.turns).toBe(3); expect(executions).toHaveLength(4);
      expect(finished[0].error).toContain('3-turn limit');
      expect(result.messages.flatMap(message => message.parts).filter(part => part.type === 'error')).toEqual([
        { type: 'error', message: 'This took more steps than allowed without finishing. Try asking for something narrower.' },
      ]);
    } else {
      expect(result.status).toBe('idle'); expect(result.turns).toBe(2); expect(executions).toHaveLength(2);
      expect(executions[0].ok).toBe(true); expect(executions[1].ok).toBe(false);
      if (scenario === 'stale') expect(JSON.stringify(executions[1].issues)).toContain('Snapshot changed');
      if (scenario === 'invalid') expect(JSON.stringify(executions[1].issues)).toContain('Unsupported report request');
      if (scenario === 'unknown') expect(executions[1].name).toBe('send_invoice');
      const turns = result.inputSummaries as { messages: { role: string; content?: string }[] }[];
      const outcome = turns[1].messages.filter(message => message.role === 'tool').at(-1)!;
      if (scenario === 'unknown') expect(outcome.content).toBe("Unknown tool 'send_invoice'.");
      else expect(JSON.parse(outcome.content!).success).toBe(false);
    }
  });
}
