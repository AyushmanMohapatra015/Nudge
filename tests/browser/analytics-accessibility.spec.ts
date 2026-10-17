import { test, expect, type Page } from '@playwright/test';
import { source } from 'axe-core';

async function audit(page: Page) {
  await page.addScriptTag({ content: source });
  return page.evaluate(async () => {
    const result = await (window as typeof window & { axe: typeof import('axe-core') }).axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
    });
    return result.violations.map(violation => ({ id: violation.id, impact: violation.impact,
      nodes: violation.nodes.map(node => ({ target: node.target, html: node.html })) }));
  });
}

test('snapshot tables, keyboard skip, mobile report scrolling and bounded Studio accessibility findings', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'seedOverdue' } });
  await page.goto('/analytics');
  await page.getByRole('button', { name: 'Load interactive reports', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('region', { name: 'AG Studio report builder' }).getByText(/^Loading[.…]/).filter({ visible: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Skip to reports' }).focus();
  await expect(page.getByRole('link', { name: 'Skip to reports' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Invoice and change reports' })).toBeFocused();
  await page.getByText('Read complete snapshot as tables', { exact: true }).click();
  await expect(page.getByRole('table', { name: 'Invoice records · USD' })).toContainText('$800.00');
  await expect(page.getByRole('table', { name: 'Change quote records · USD' })).toContainText('No change records.');
  expect(await audit(page)).toEqual([]);
  await page.getByRole('button', { name: 'Edit report layout' }).click();
  // Do not exclude the vendor panel from scans. Bound its known nested button defect
  // explicitly so new findings or affected controls fail this regression check.
  const assertKnownVendorIssue = async () => {
    const violations = await audit(page);
    expect(violations.map(v => v.id)).toEqual(['nested-interactive']);
    expect(violations[0].nodes).toHaveLength(2);
    for (const node of violations[0].nodes) {
      expect(node.html).toContain('aria-controls="ag-');
      expect(node.target).toHaveLength(1);
      await expect(page.locator(String(node.target[0])).getByRole('button', { name: 'Add computed column', exact: true })).toHaveCount(1);
    }
  };
  await assertKnownVendorIssue();
  await page.setViewportSize({ width: 320, height: 900 });
  const reports = page.getByRole('region', { name: 'AG Studio report builder' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await reports.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => reports.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await reports.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await expect(page.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toBeVisible();
  await assertKnownVendorIssue();
  await page.screenshot({ path: test.info().outputPath('mobile-edit.png'), fullPage: true });
});

test('refresh announces success and error retry retains keyboard focus', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/analytics');
  await page.getByRole('button', { name: 'Load interactive reports', exact: true }).click();
  const announcement = page.locator('.analytics-announcement');
  await expect(announcement).toContainText('Local snapshot loaded. Version');
  await page.route('**/api/analytics', route => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(page.locator('.analytics-page').getByRole('alert')).toContainText('Unable to load analytics.');
  await page.unroute('**/api/analytics');
  await page.getByRole('button', { name: 'Try again', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(announcement).toContainText('Local snapshot loaded. Version');
  await expect(page.getByRole('button', { name: 'Refresh local snapshot' })).toBeFocused();
});
