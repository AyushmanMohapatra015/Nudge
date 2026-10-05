import { test, expect } from '@playwright/test';

test('keyboard users can skip navigation and reach the owner content', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/');
  const skip = page.getByRole('link', { name: 'Skip to workspace content' });
  await expect(skip).toBeAttached();
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#workspace-content')).toBeFocused();
  await page.getByRole('button', { name: 'My project', exact: true }).focus();
  await expect(page.getByRole('button', { name: 'My project', exact: true })).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'One agreement. A clear way forward.' })).toBeVisible();
});

test('client load failure is announced and a keyboard retry recovers without accepting work', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  let failed = true;
  await page.route('**/api/client/*', route => failed ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary fictional connection failure.' }) }) : route.continue());
  await page.goto(`/client/${state.clientToken}`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Temporary fictional connection failure.');
  const retry = page.getByRole('button', { name: 'Try again' });
  failed = false;
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your project scope' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept project scope' })).toBeDisabled();
  const after = await (await request.get('/api/workspace')).json();
  expect(after.agreementStatus).toBe('approved');
});
