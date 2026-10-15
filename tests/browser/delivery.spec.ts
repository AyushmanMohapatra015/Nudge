import { test, expect } from '@playwright/test';
import { source } from 'axe-core';
import { deliveryStateFixture } from '../fixtures/delivery-state';

test('actual saved delivery plan renders read-only with holiday dates, no financial writes and narrow table access', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  let workspace = await (await request.get('/api/workspace')).json();
  expect((await request.post(`/api/client/${workspace.clientToken}`, { data: { type: 'acceptAgreement' } })).status()).toBe(200);
  workspace = await (await request.get('/api/workspace')).json();
  const calendar = { timezone: 'Asia/Kolkata', weekdays: [1, 2, 3, 4, 5], holidays: ['2026-10-19'] };
  const stage = await request.post('/api/delivery-plan', { data: { type: 'stage', expectedWorkspaceVersion: workspace.version,
    expectedPlanRevision: 0, expectedPreviewId: null, calendar, candidate: { tasks: [
      { key: 'new:design', label: 'Fictional design delivery', kind: 'base', proposalId: null, references: ['S1'], duration: 3, startDate: '2026-10-16', endDateExclusive: '2026-10-22' },
      { key: 'new:later', label: 'Fictional unscheduled work', kind: 'base', proposalId: null, references: ['S1'], duration: 2, startDate: null, endDateExclusive: null },
      { key: 'new:launch', label: 'Fictional launch milestone', kind: 'milestone', proposalId: null, references: ['S1'], duration: 0, startDate: '2026-10-22', endDateExclusive: '2026-10-22' },
    ], dependencies: [] } } });
  expect(stage.status()).toBe(200); const preview = await stage.json();
  expect((await request.post('/api/delivery-plan', { data: { type: 'apply', expectedWorkspaceVersion: preview.version, previewId: preview.plan.preview.id, confirmed: true } })).status()).toBe(200);
  const before = await (await request.get('/api/workspace')).json();
  const mutations: string[] = [], external: string[] = [], errors: string[] = [];
  page.on('request', req => { if (req.method() !== 'GET') mutations.push(req.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://**/*', route => { const host = new URL(route.request().url()).hostname;
    if (!['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host)) external.push(host);
    return route.fulfill({ status: 200, contentType: 'text/css', body: '' }); });
  await page.goto('/delivery');
  const table = page.getByRole('table', { name: 'Current delivery dates', exact: true });
  await expect(table).toContainText('2026-10-22'); await expect(table).toContainText('Not scheduled');
  await page.getByRole('button', { name: 'Show Gantt timeline' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Read-only timeline ready.' })).toBeVisible({ timeout: 45000 });
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await page.getByText('Fictional design delivery', { exact: true }).first().dblclick(); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Original plan', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Original delivery dates' })).toContainText('2026-10-22');
  await page.reload(); await expect(table).toContainText('2026-10-22');
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('region', { name: 'Delivery date table', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.getByRole('region', { name: 'Delivery date table', exact: true }).evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.addScriptTag({ content: source });
  expect(await page.evaluate(async () => (await (window as unknown as { axe: typeof import('axe-core') }).axe.run(document, { runOnly: { type: 'rule', values: ['nested-interactive', 'button-name', 'label', 'color-contrast'] } })).violations.map(v => v.id))).toEqual([]);
  expect(mutations).toEqual([]); expect(external).toEqual([]); expect(errors).toEqual([]);
  expect(await (await request.get('/api/workspace')).json()).toEqual(before);
});

test('stored stale previews and malformed or lost reads never enable mutations or retain a misleading chart', async ({ page }) => {
  const { plan } = deliveryStateFixture();
  const base = { version: 10, mode: 'demo', asOf: '2026-10-15T00:00:00.000Z', stateSource: 'local-records', remoteCheckedAt: null, extras: [], invoices: [], planning: { agreementAccepted: true, clauses: [], eligibleExtras: [] } };
  let response: unknown = { ...base, status: 'ready', plan, previewStale: true }, failure = false;
  await page.route('**/api/delivery-plan', route => failure ? route.abort('failed') : route.fulfill({ json: response }));
  await page.goto('/delivery'); await page.getByRole('button', { name: 'Proposed preview' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('preview is stale');
  await expect(page.getByRole('button', { name: 'Show Gantt timeline' })).toHaveCount(0);
  await expect(page.getByRole('table')).toContainText('Booking extra');
  response = { ...base, status: 'review-needed' }; await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('needs review'); await expect(page.getByRole('table')).toHaveCount(0);
  response = { ...base, status: 'unconfigured' }; await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click();
  await expect(page.getByRole('heading', { name: 'No delivery plan saved yet.' })).toBeVisible();
  response = { ...base, status: 'ready', plan, previewStale: false, clientToken: 'unexpected-private-field' };
  await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click(); await expect(page.getByRole('main').getByRole('alert')).toContainText('could not be loaded safely');
  failure = true; await page.getByRole('button', { name: 'Try again' }).click(); await expect(page.getByRole('main').getByRole('alert')).toContainText('could not be loaded safely');
  await expect(page.getByRole('table')).toHaveCount(0); await expect(page.getByRole('button', { name: /^Apply|^Discard|^Send|^Pay / })).toHaveCount(0);
});
