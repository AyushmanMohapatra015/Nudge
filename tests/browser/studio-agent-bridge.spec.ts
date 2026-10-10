import { test, expect } from '@playwright/test';
import { buildSync } from 'esbuild';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { NextRequest } from 'next/server';
import { sessionToken } from '../../lib/auth';
import { createStudioAgentPost } from '../../lib/studio-agent-transport';
import type { OwnerAnalytics } from '../../lib/owner-analytics';
import type {} from '../fixtures/studio-agent';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { studioRequestAllowance } from '../../lib/studio-request-allowance';

const origin = 'http://127.0.0.1:3199';
const answer = 'Offline fixture: stored outstanding balance is USD 5.79. No model was called.';
const snapshot = (): OwnerAnalytics => ({ version: 2, mode: 'sandbox', asOf: '2026-10-09T00:00:00.000Z', currency: 'USD', invoices: [], changes: [],
  totals: { outstandingCents: 579, overdueCents: 123, unknownDueDateCents: 1, approvedExtraCents: 30001,
    awaitingAcceptanceCents: 30001, awaitingAcceptanceCount: 1, statusReviewCount: 0 } });

for (const scenario of ['success', 'provider-error', 'stale-server', 'stale-browser', 'extra-fields', 'wrong-version', 'oversized', 'cancel'] as const) {
  test(`Studio bridge ${scenario}: intercepted request executes the guarded handler, without providers`, async ({ page }) => {
    const previousMode = process.env.NUDGE_MODE, previousAdmin = process.env.NUDGE_ADMIN_TOKEN, previousFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw Error('Provider network forbidden in offline bridge tests'); };
    process.env.NUDGE_MODE = 'sandbox'; process.env.NUDGE_ADMIN_TOKEN = 'fictional-studio-bridge-test-secret';
    const stored = snapshot(), before = structuredClone(stored);
    let calls = 0; let release!: () => void;
    const entered = new Promise<void>(resolve => { release = resolve; });
    let finish!: () => void;
    const waiting = new Promise<void>(resolve => { finish = resolve; });
    const bodies: unknown[] = [], requests: string[] = [], errors: string[] = [];
    const ledgerDb = new DatabaseSync(':memory:');
    const ledger = studioRequestAllowance(ledgerDb);
    ledger.approve({ id: randomUUID(), maxRequests: 1, expiresAt: Date.now() + 60000 });
    const post = createStudioAgentPost({ reserveRequest: () => ledger.reserve(), enabled: () => true, getSnapshot: () => stored, adapter: async input => {
      calls++; expect(input.question).toBe('Explain this fictional stored snapshot.');
      expect(input.snapshot.totals.outstandingCents).toBe(579); expect(input.maxOutputTokens).toBe(256);
      if (scenario === 'provider-error') throw Error('private provider detail must never display');
      if (scenario === 'stale-server') stored.version++;
      if (scenario === 'stale-browser' || scenario === 'cancel') { release(); await waiting; }
      return { text: answer, usage: { inputTokens: 10, outputTokens: 20 } };
    } });
    try {
      page.on('request', request => requests.push(request.url()));
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const request = route.request();
        if (request.url() === `${origin}/`) return route.fulfill({ contentType: 'text/html', body: '<html lang="en"><head><title>Offline bridge fixture</title></head><body><div id="studio" style="width:900px;height:600px"></div></body></html>' });
        if (request.url() !== `${origin}/api/analytics/agent` || request.method() !== 'POST') return route.abort();
        bodies.push(request.postDataJSON());
        // Playwright interception, not a deployed HTTP server. Only fictional signed sessions.
        const response = await post(new NextRequest(request.url(), { method: 'POST', body: request.postData()!,
          headers: { host: new URL(origin).host, origin, 'content-type': 'application/json', cookie: `nudge_session=${sessionToken()}` } }));
        let body = await response.text();
        if (scenario === 'extra-fields') body = JSON.stringify({ ...JSON.parse(body), command: 'refund' });
        if (scenario === 'wrong-version') body = JSON.stringify({ ...JSON.parse(body), snapshotVersion: 99 });
        if (scenario === 'oversized') body = ' '.repeat(8193);
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body }).catch(error => {
          if (scenario !== 'cancel') throw error;
        });
      });
      const directory = test.info().outputPath('bundle'); mkdirSync(directory, { recursive: true });
      const bundle = resolve(directory, 'fixture.js');
      buildSync({ entryPoints: [resolve('tests/fixtures/studio-agent.ts')], outfile: bundle,
        bundle: true, platform: 'browser', format: 'iife', logLevel: 'silent' });
      await page.goto(origin); await page.addScriptTag({ path: bundle });
      await page.evaluate(() => window.studioAgentFixture.start('bridge'));
      if (scenario === 'stale-browser' || scenario === 'cancel') {
        await entered;
        if (scenario === 'cancel') await page.evaluate(() => window.studioAgentFixture.cancel());
        else await page.evaluate(() => window.studioAgentFixture.advanceSnapshot());
        finish();
      }
      await expect.poll(() => page.evaluate(() => window.studioAgentFixture.state().status)).not.toBe('running');
      const result = await page.evaluate(() => window.studioAgentFixture.state());
      expect(calls).toBe(1); expect(bodies).toEqual([{ expectedVersion: 2, question: 'Explain this fictional stored snapshot.' }]);
      expect(result.turns).toBe(1);
      expect(ledger.status().usedRequests).toBe(1);
      expect(requests).toEqual([`${origin}/`, `${origin}/api/analytics/agent`]); expect(errors).toEqual([]);
      expect(JSON.stringify(result.messages)).not.toContain('private provider detail');
      if (scenario === 'success') {
        expect(result.status).toBe('idle'); expect(JSON.stringify(result.messages)).toContain(answer);
        expect(result.observations.filter(event => event.type === 'run_finished').map(event => event.status)).toEqual(['ok']);
      } else {
        expect(JSON.stringify(result.messages)).not.toContain(answer);
        expect(result.status).toBe(scenario === 'cancel' ? 'idle' : 'error');
        expect(result.observations.filter(event => event.type === 'run_finished').map(event => event.status)).toEqual([scenario === 'cancel' ? 'cancelled' : 'error']);
      }
      expect(stored).toEqual({ ...before, version: scenario === 'stale-server' ? 3 : 2 });
      expect(result.snapshot.totals).toEqual(before.totals);
    } finally {
      finish?.();
      try { await page.evaluate(() => window.studioAgentFixture?.dispose()); }
      finally {
        if (previousMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = previousMode;
        if (previousAdmin === undefined) delete process.env.NUDGE_ADMIN_TOKEN; else process.env.NUDGE_ADMIN_TOKEN = previousAdmin;
        globalThis.fetch = previousFetch;
        ledgerDb.close();
      }
    }
  });
}
