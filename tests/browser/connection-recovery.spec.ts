import { test, expect, type Page } from '@playwright/test';

// Scope to application surfaces: Next also installs its own route-announcer alert.
const alerts = (page: Page) => page.locator('.loading [role="alert"], .app-shell [role="alert"], .login-wrap [role="alert"], .client-shell [role="alert"]');

test('owner initial read failure recovers without a stale error or mutation', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  let failed = true;
  await page.route('**/api/workspace', route => failed && route.request().method() === 'GET'
    ? route.fulfill({ status: 503, json: { error: 'Fictional workspace unavailable.' } }) : route.continue());
  await page.goto('/');
  await expect(alerts(page)).toContainText('Fictional workspace unavailable.');
  failed = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Project overview' })).toBeVisible();
  await expect(alerts(page)).toHaveCount(0);
  const state = await (await request.get('/api/workspace')).json();
  expect(state.agreementStatus).toBe('draft');
  expect(state.invoices).toHaveLength(0);
});

test('owner failed refresh pauses actions and recovery preserves an unresolved action error', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  let failed = false;
  await page.route('**/api/workspace', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 503, json: { error: 'Fictional action outcome requires review.' } })
    : failed ? route.fulfill({ status: 503, json: { error: 'Fictional refresh failed.' } }) : route.continue());
  await page.goto('/');
  const approve = page.getByRole('button', { name: 'Approve scope', exact: true });
  await approve.click();
  await expect(alerts(page)).toContainText('Fictional action outcome requires review.');
  failed = true;
  await expect(alerts(page).filter({ hasText: 'Fictional refresh failed.' })).toBeVisible({ timeout: 10000 });
  await expect(approve).toBeDisabled();
  failed = false;
  await page.getByRole('button', { name: 'Retry connection' }).click();
  await expect(approve).toBeEnabled();
  await expect(alerts(page)).toHaveCount(1);
  await expect(alerts(page)).toContainText('Fictional action outcome requires review.');
  expect((await (await request.get('/api/workspace')).json()).agreementStatus).toBe('draft');
});

test('owner action session expiry hides workspace and shows protected sign-in', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Approve scope' })).toBeVisible();
  await page.route('**/api/workspace', route => route.fulfill({ status: 401, json: { error: 'Authentication required.' } }));
  await page.getByRole('button', { name: 'Approve scope' }).click();
  await expect(page.getByRole('heading', { name: 'Your workspace, protected.' })).toBeVisible();
  await expect(alerts(page)).toContainText('Your session has expired.');
  await expect(page.getByLabel('Workspace token')).toHaveAttribute('type', 'password');
  await expect(page.getByRole('button', { name: 'Approve scope' })).toHaveCount(0);
  expect((await (await request.get('/api/workspace')).json()).agreementStatus).toBe('draft');
});

test('client failed refresh pauses consent decision and retry clears only connection error', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  let failed = false;
  await page.route('**/api/client/*', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 503, json: { error: 'Fictional decision outcome requires review.' } })
    : failed ? route.fulfill({ status: 503, json: { error: 'Fictional project refresh failed.' } }) : route.continue());
  await page.goto(`/client/${state.clientToken}`);
  await page.getByRole('checkbox').check();
  const accept = page.getByRole('button', { name: 'Accept project scope' });
  await accept.click();
  await expect(alerts(page)).toContainText('Fictional decision outcome requires review.');
  failed = true;
  await expect(alerts(page).filter({ hasText: 'Fictional project refresh failed.' })).toBeVisible({ timeout: 10000 });
  await expect(accept).toBeDisabled();
  failed = false;
  await page.getByRole('button', { name: 'Retry connection' }).click();
  await expect(accept).toBeEnabled();
  await expect(alerts(page)).toHaveCount(1);
  await expect(alerts(page)).toContainText('Fictional decision outcome requires review.');
  expect((await (await request.get('/api/workspace')).json()).agreementStatus).toBe('approved');
});

test('actual link rotation removes already displayed client scope and decision controls', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  await page.goto(`/client/${state.clientToken}`);
  await expect(page.getByRole('heading', { name: 'Your project scope' })).toBeVisible();
  expect((await request.post('/api/workspace', { data: { type: 'replaceClientLink', expectedToken: state.clientToken, confirmed: true } })).status()).toBe(200);
  await expect(alerts(page)).toContainText('Ask the project owner for a current link.', { timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Your project scope' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Accept project scope' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(alerts(page)).toContainText('unavailable or expired');
  const after = await (await request.get('/api/workspace')).json();
  expect(after.agreementStatus).toBe('approved');
  expect(after.invoices).toHaveLength(0);
});

test('client decision rejected by invalid link removes stale controls immediately', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  await page.goto(`/client/${state.clientToken}`);
  await page.getByRole('checkbox').check();
  await page.route('**/api/client/*', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 410, json: { error: 'Gone.' } }) : route.fulfill({ status: 404, json: { error: 'Client link not found.' } }));
  await page.getByRole('button', { name: 'Accept project scope' }).click();
  await expect(alerts(page)).toContainText('Ask the project owner for a current link.');
  await expect(page.getByRole('button', { name: 'Accept project scope' })).toHaveCount(0);
  expect((await (await request.get('/api/workspace')).json()).agreementStatus).toBe('approved');
});
