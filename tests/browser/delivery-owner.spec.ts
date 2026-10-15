import { test, expect } from '@playwright/test';

test('sandbox delivery requires owner login and clears the view after session loss', async ({ page, request, context }) => {
  expect((await request.get('/api/delivery-plan')).status()).toBe(401);
  await page.goto('/delivery'); await expect(page).toHaveURL(/\/$/);
  const token = process.env.NUDGE_DELIVERY_TEST_OWNER_TOKEN;
  if (!token) throw Error('Isolated owner fixture token required');
  expect((await page.request.post('/api/session', { data: { token } })).status()).toBe(200);
  expect((await page.request.get('/api/delivery-plan')).status()).toBe(404);
  await page.goto('/delivery'); await expect(page.getByRole('main').getByRole('alert')).toContainText('Open your workspace first');
  await context.clearCookies();
  await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('owner session ended');
  await expect(page.getByRole('table')).toHaveCount(0);
  expect((await request.get('/api/delivery-plan')).status()).toBe(401);
});
