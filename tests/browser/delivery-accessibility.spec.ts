import { test, expect } from '@playwright/test';
import { source } from 'axe-core';
import { deliveryStateFixture, baseTaskId, extraTaskId } from '../fixtures/delivery-state';

async function savedPlan(page: import('@playwright/test').Page) {
  const { workspace, plan } = deliveryStateFixture(); delete plan.preview;
  plan.current!.snapshot.tasks.push({ id: extraTaskId, label: 'Delivery checkpoint', kind: 'milestone', proposalId: null,
    references: [], duration: 0, startDate: '2026-10-21', endDateExclusive: '2026-10-21' });
  plan.current!.snapshot.dependencies.push({ predecessorId: baseTaskId, successorId: extraTaskId, type: 'finish-to-start' });
  plan.original!.snapshot = structuredClone(plan.current!.snapshot);
  await page.route('https://**/*', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('**/api/delivery-plan', route => route.fulfill({ json: {
    version: 10, mode: 'demo', asOf: '2026-10-16T00:00:00.000Z', stateSource: 'local-records', remoteCheckedAt: null,
    status: 'ready', plan, previewStale: false, extras: [], invoices: [],
    planning: { agreementAccepted: true, clauses: workspace.agreement.clauses, eligibleExtras: [] },
  } }));
  await page.goto('/delivery');
}

test('actual Gantt supports keyboard exit, reduced motion and narrow reflow; known ARIA findings stay explicit', async ({ page }, testInfo) => {
  const writes: string[] = []; page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await savedPlan(page);
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to delivery records' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#delivery-records')).toBeFocused();
  const toggle = page.getByRole('button', { name: 'Show Gantt timeline', exact: true });
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Read-only timeline ready.' })).toBeVisible({ timeout: 45000 });
  const chart = page.getByRole('region', { name: 'Read-only delivery timeline; scroll horizontally for dates' });
  await chart.focus(); await page.keyboard.press('Tab');
  let escaped = false;
  for (let i = 0; i < 35; i++) {
    if (!(await chart.evaluate(el => el.contains(document.activeElement)))) { escaped = true; break; }
    await page.keyboard.press('Tab');
  }
  expect(escaped, 'Tab must leave the read-only vendor region').toBe(true);
  await page.addScriptTag({ content: source });
  const violations = await page.evaluate(async () => (await (window as unknown as { axe: typeof import('axe-core') }).axe.run(document, {
    runOnly: { type: 'rule', values: ['nested-interactive', 'button-name', 'label', 'color-contrast', 'aria-valid-attr-value', 'aria-required-children', 'aria-required-parent'] },
  })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) })));
  await testInfo.attach('gantt-axe-findings', { body: JSON.stringify(violations, null, 2), contentType: 'application/json' });
  // Keep the vendor's actual failure visible; do not disable the rule or mark the chart accessible.
  expect(violations.map(v => v.id)).toEqual(['aria-required-children']);
  expect(violations[0].nodes).toHaveLength(2);
  expect(violations[0].nodes.every(n => n.target.length === 1 && typeof n.target[0] === 'string' &&
    (n.target[0] === '.b-grid-panel-body' || /^#b-gantt-\d+-normalSubgrid$/.test(n.target[0])))).toBe(true);
  testInfo.annotations.push({ type: 'known-vendor-finding', description: 'Two split-Gantt aria-required-children findings remain unresolved; native table and dependency list provide a separate reading path.' });
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await chart.evaluate(el => [...el.querySelectorAll('*')].every(node => {
    const style = getComputedStyle(node); return style.animationDuration.split(',').every(value => parseFloat(value) === 0) && style.transitionDuration.split(',').every(value => parseFloat(value) === 0);
  }))).toBe(true);
  await page.getByRole('region', { name: 'Delivery date table', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.getByRole('region', { name: 'Delivery date table', exact: true }).evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.getByRole('link', { name: 'Skip timeline to date table' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Delivery date table', exact: true })).toBeFocused();
  await expect(page.getByRole('list', { name: 'Finish-to-start dependencies' })).toContainText('Delivery checkpoint starts after Fictional website finishes.');
  await page.getByRole('button', { name: 'Hide Gantt timeline' }).focus(); await page.keyboard.press('Enter');
  await expect(chart).toHaveCount(0); expect(writes).toEqual([]);
});

test('keyboard editor entry and cancel restore meaningful focus; failed chart download retains the table', async ({ page }) => {
  const writes: string[] = []; page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await savedPlan(page);
  await page.getByRole('button', { name: 'Edit delivery preview' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Owner-entered plan' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByLabel('Calendar timezone', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Cancel local edits' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Local edits cancelled.' })).toBeFocused();
  await page.route('**/_next/static/chunks/*.js', route => route.abort('failed'));
  await page.getByRole('button', { name: 'Show Gantt timeline' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('timeline could not load', { timeout: 30000 });
  await expect(page.getByRole('table', { name: 'Current delivery dates' })).toContainText('2026-10-21');
  await page.unroute('**/_next/static/chunks/*.js');
  await page.getByRole('link', { name: 'Reload page to retry timeline' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('table', { name: 'Current delivery dates' })).toContainText('2026-10-21');
  await page.getByRole('button', { name: 'Show Gantt timeline' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Read-only timeline ready.' })).toBeVisible({ timeout: 45000 });
  expect(writes).toEqual([]);
});
