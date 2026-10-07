import { test, expect } from '@playwright/test';

test('Studio uses real local analytics records, exact USD display and session-only editable reports without mutations', async ({ page, request }) => {
  expect((await request.post('/api/workspace', { data: { type: 'reset' } })).status()).toBe(200);
  expect((await request.post('/api/workspace', { data: { type: 'seedOverdue' } })).status()).toBe(200);
  const before = await (await request.get('/api/workspace')).json();
  const pageErrors: string[] = []; page.on('pageerror', error => pageErrors.push(error.message));
  const writes: string[] = []; page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname.startsWith('/api/')) writes.push(req.method()); });
  await page.goto('/analytics');
  await expect(page.getByRole('heading', { name: 'Your work, in perspective.' })).toBeVisible();
  const totals = page.getByRole('region', { name: 'Complete workspace totals' });
  await expect(totals.getByText('$800.00', { exact: true })).toHaveCount(2);
  await expect(page.getByText(/Illustrative simulation data/)).toBeVisible();
  const studio = page.getByRole('region', { name: 'AG Studio report builder' });
  await expect(studio.getByText('Invoice 1', { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(studio.getByText('$800.00', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Edit report layout' }).click();
  await expect(page.getByRole('button', { name: 'Finish editing layout' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Finish editing layout' }).click();
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(studio.getByText('Invoice 1', { exact: true })).toBeVisible();
  await expect(studio.getByText(/^Loading[.…]/).filter({ visible: true })).toHaveCount(0, { timeout: 30000 });
  await page.screenshot({ path: test.info().outputPath('analytics-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('analytics-320.png'), fullPage: true });
  const after = await (await request.get('/api/workspace')).json();
  expect(after.version).toBe(before.version); expect(after.invoices).toEqual(before.invoices); expect(after.audit).toEqual(before.audit);
  expect(writes).toEqual([]); expect(pageErrors).toEqual([]);
});

test('analytics hides records after a failed refresh and offers safe recovery without displaying server errors', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/analytics');
  await expect(page.getByText(/No invoice or change records yet/)).toBeVisible();
  await page.route('**/api/analytics', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'private server credential' }) }));
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(page.locator('.analytics-page').getByRole('alert')).toContainText('Unable to load analytics.');
  await expect(page.getByRole('region', { name: 'AG Studio report builder' })).toHaveCount(0);
  await expect(page.getByText('private server credential')).toHaveCount(0);
  await page.unroute('**/api/analytics');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText(/No invoice or change records yet/)).toBeVisible();
});
