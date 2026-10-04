import { test, expect } from '@playwright/test';
test('sandbox UI distinguishes configured credentials from permission to call AI', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  const state = await (await request.get('/api/workspace')).json();
  // Only the displayed GET state is mocked; this test never enables a real provider.
  let enabled = false;
  await page.route('**/api/workspace', async route => {
    if (route.request().method() !== 'GET') throw new Error('Unexpected mutation in paused-UI test');
    await route.fulfill({ json: { ...state, mode: 'sandbox', agreementStatus: 'accepted', aiEnabled: enabled, connections: { ...state.connections, ai: true } } });
  });
  await page.goto('/');
  await expect(page.getByText('Scope assistant · AI calls paused')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compare with agreement' })).toBeDisabled();
  await expect(page.getByText('AI calls are paused until provider allowance is confirmed.')).toBeVisible();
  enabled = true;
  await page.reload();
  await expect(page.getByRole('button', { name: 'Compare with agreement' })).toBeEnabled();
  // Do not click: backend authorization/usage enforcement is covered by the server test.
});
