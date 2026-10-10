import { test, expect } from '@playwright/test';

test('Analytics shows simulation allowance without activation controls or writes', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  const before = await (await request.get('/api/workspace')).json();
  const writes: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.goto('/analytics');
  const panel = page.getByRole('region', { name: 'Dashboard AI allowance', exact: true });
  await expect(panel).toContainText('Simulation mode: no AI calls or request allowance.');
  await expect(panel).toContainText('Dashboard AI is not connected.');
  await expect(panel.getByRole('button')).toHaveCount(0);
  await expect(panel.getByRole('textbox')).toHaveCount(0);
  expect(await (await request.get('/api/workspace')).json()).toEqual(before);
  expect(writes).toEqual([]);
});

test('allowance display handles refresh, UTC expiry, exhaustion, expiry and malformed views without breaking reports', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  const before = await (await request.get('/api/workspace')).json();
  const snapshot = await (await request.get('/api/analytics')).json();
  let view: unknown = { state: 'available', remainingRequests: 3, maxRequests: 5, usedRequests: 2, expiresAt: '2026-10-20T00:00:00.000Z' };
  let fail = false;
  await page.route('**/api/analytics', route => route.fulfill({ status: fail ? 503 : 200, contentType: 'application/json',
    body: JSON.stringify(fail ? { error: 'private provider detail' } : { ...snapshot, dashboardAllowance: view }) }));
  await page.goto('/analytics');
  const panel = page.getByRole('region', { name: 'Dashboard AI allowance', exact: true });
  await expect(panel).toContainText('3 of 5 request slots remain.');
  await expect(panel.locator('time')).toHaveAttribute('datetime', '2026-10-20T00:00:00.000Z');
  await expect(panel).toContainText('UTC');
  await expect(panel).toContainText('not provider credits or a spending limit');
  view = { state: 'exhausted', remainingRequests: 0, maxRequests: 5, usedRequests: 5, expiresAt: '2026-10-20T00:00:00.000Z' };
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(panel).toContainText('Request allowance exhausted. 0 request slots available.');
  view = { state: 'expired', remainingRequests: 0, maxRequests: 5, usedRequests: 2, expiresAt: '2026-10-01T00:00:00.000Z' };
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(panel).toContainText('Approval expired. 0 request slots available.');
  view = { state: 'available', remainingRequests: 999, privateKey: 'private provider detail' };
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(panel).toContainText('Allowance status is unavailable.');
  await expect(panel.locator('time')).toHaveCount(0);
  await expect(page.getByText('private provider detail')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'AG Studio report builder' })).toBeVisible();
  fail = true; await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(panel).toHaveCount(0);
  expect(await (await request.get('/api/workspace')).json()).toEqual(before);
});
