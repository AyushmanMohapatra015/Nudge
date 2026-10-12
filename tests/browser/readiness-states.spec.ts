import { test, expect } from '@playwright/test';

for (const kind of ['owner', 'client'] as const) {
  test(`${kind} lost action response is unconfirmed and a read reconciles without repeating the write`, async ({ page, request }) => {
    await request.post('/api/workspace', { data: { type: 'reset' } });
    if (kind === 'client') await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
    const state = await (await request.get('/api/workspace')).json();
    const endpoint = kind === 'owner' ? '/api/workspace' : `/api/client/${state.clientToken}`;
    let writes = 0;
    await page.route(`**${endpoint}`, async route => {
      if (route.request().method() === 'GET') return route.continue();
      writes++;
      const completed = await route.fetch();
      expect(completed.status()).toBe(200);
      await route.abort('connectionreset');
    });
    await page.goto(kind === 'owner' ? '/' : `/client/${state.clientToken}`);
    if (kind === 'client') await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: kind === 'owner' ? 'Approve scope' : 'Accept project scope' }).click();
    await expect(page.locator(kind === 'owner' ? '.app-shell' : '.client-shell').getByRole('alert')).toContainText('Unable to confirm');
    await expect(page.getByText(kind === 'owner' ? 'Waiting for client acceptance' : /Scope accepted/, { exact: kind === 'owner' })).toBeVisible({ timeout: 10000 });
    const after = await (await request.get('/api/workspace')).json();
    expect(after.agreementStatus).toBe(kind === 'owner' ? 'approved' : 'accepted');
    expect(after.audit).toHaveLength(state.audit.length + 1);
    expect(after.invoices).toHaveLength(0);
    expect(writes).toBe(1);
  });
}

for (const kind of ['owner', 'client'] as const) {
  test(`${kind} initial failure retry moves focus to the recovered main heading`, async ({ page, request }) => {
    await request.post('/api/workspace', { data: { type: 'reset' } });
    const state = await (await request.get('/api/workspace')).json();
    let failed = true;
    await page.route(kind === 'owner' ? '**/api/workspace' : '**/api/client/*', route => failed
      ? route.fulfill({ status: 503, json: { error: 'Fictional initial read failure.' } }) : route.continue());
    await page.goto(kind === 'owner' ? '/' : `/client/${state.clientToken}`);
    await expect(page.locator('.loading').getByRole('alert')).toBeVisible();
    failed = false;
    await page.getByRole('button', { name: 'Try again' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    expect((await (await request.get('/api/workspace')).json()).invoices).toHaveLength(0);
  });
}

test('sign-in protects pending token, recovers from rejection and exposes post-auth read retry', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  const state = await (await request.get('/api/workspace')).json();
  let authenticated = false, readable = false, attempts = 0;
  let release!: () => void;
  await page.route('**/api/workspace', route => route.fulfill(authenticated
    ? readable ? { status: 200, json: state } : { status: 503, json: { error: 'Fictional post-auth read failed.' } }
    : { status: 401, json: { error: 'Authentication required.' } }));
  await page.route('**/api/session', async route => {
    attempts++;
    if (attempts === 1) {
      await new Promise<void>(resolve => { release = resolve; });
      return route.fulfill({ status: 401, json: { error: 'Fictional token rejected.' } });
    }
    authenticated = true;
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto('/');
  await page.getByLabel('Workspace token').fill('fictional-test-token');
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await expect.poll(() => Boolean(release)).toBe(true);
  await expect(page.getByLabel('Workspace token')).toBeDisabled();
  await expect(page.locator('.login-card')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.login-card').getByRole('status')).toContainText('Checking workspace access.');
  await page.locator('.login-card').evaluate(form => (form as HTMLFormElement).requestSubmit());
  expect(attempts).toBe(1);
  release();
  await expect(page.locator('.login-card').getByRole('alert')).toContainText('Fictional token rejected.');
  await expect(page.getByLabel('Workspace token')).toBeEnabled();
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await expect(page.locator('.login-card').getByRole('alert')).toContainText('Fictional post-auth read failed.');
  await expect(page.getByLabel('Workspace token')).toHaveValue('');
  readable = true;
  await page.getByRole('button', { name: 'Retry connection' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(attempts).toBe(2);
});

test('empty project, approval, payment, activity and client states explain the next step without writes', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  const state = await (await request.get('/api/workspace')).json();
  const writes: string[] = [];
  page.on('request', r => { if (r.method() !== 'GET' && new URL(r.url()).pathname.startsWith('/api/')) writes.push(r.url()); });
  await page.route('**/api/workspace', route => route.fulfill({ status: 200, json: { ...state, audit: [] } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'My project', exact: true }).click();
  await expect(page.getByText('A clear scope is your starting point.')).toBeVisible();
  await page.getByRole('button', { name: 'Approvals', exact: true }).click();
  await expect(page.getByText(/all caught up/)).toBeVisible();
  await page.getByRole('button', { name: 'Payments', exact: true }).click();
  await expect(page.getByText('No invoices yet.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create base invoice' })).toBeDisabled();
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await expect(page.getByText(/No activity recorded yet/)).toBeVisible();
  await page.goto(`/client/${state.clientToken}`);
  await expect(page.getByRole('heading', { name: 'Your project is being prepared.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept project scope' })).toHaveCount(0);
  expect(writes).toEqual([]);
});

for (const status of ['running', 'unknown', 'exited'] as const) {
  test(`${status} processing state gates recovery and pauses other actions`, async ({ page, request }) => {
    await request.post('/api/workspace', { data: { type: 'reset' } });
    const state = await (await request.get('/api/workspace')).json();
    let failed = false;
    await page.route('**/api/workspace', route => route.fulfill(failed ? { status: 503, json: { error: 'Fictional refresh failed.' } } : { status: 200, json: {
      ...state, processing: { key: 'fictional-operation', operation: 'sendInvoice', startedAt: new Date().toISOString() },
      processingRecovery: { status, reason: `Fictional ${status} ownership result.` },
    } }));
    await page.goto('/');
    await expect(page.getByRole('status').filter({ hasText: 'Processing sendInvoice' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve scope' })).toBeDisabled();
    await expect(page.getByText(/Elapsed time alone cannot prove a crash/)).toBeVisible();
    const unlock = page.getByRole('button', { name: 'Unlock interrupted action' });
    if (status !== 'exited') { await expect(unlock).toHaveCount(0); return; }
    await expect(unlock).toBeDisabled();
    await page.getByLabel('Recovery review note').fill('Fictional review: inspect invoice status before continuing.');
    await page.getByRole('checkbox', { name: /I understand this unlocks/ }).check();
    await expect(unlock).toBeEnabled();
    failed = true;
    await expect(page.getByRole('button', { name: 'Retry connection' })).toBeVisible({ timeout: 10000 });
    await expect(unlock).toBeDisabled();
  });
}

test('uncertain invoice send and reminder outcomes block repeat actions and require reviewed evidence', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  const state = await (await request.get('/api/workspace')).json();
  const now = new Date().toISOString();
  const base = { amountCents: 10000, outstandingCents: 10000, proposalId: 'base', createdAt: now, dueDate: '2026-01-01', reminders: 0 };
  let writes = 0;
  page.on('request', r => { if (r.method() !== 'GET' && new URL(r.url()).pathname.startsWith('/api/')) writes++; });
  await page.route('**/api/workspace', route => route.fulfill({ status: 200, json: { ...state, invoices: [
    { ...base, id: 'FICTIONAL-DRAFT', status: 'DRAFT', pendingSend: { key: 'fictional-send', startedAt: now } },
    { ...base, id: 'FICTIONAL-REMINDER', status: 'UNPAID', pendingReminder: { draftId: 'fictional-reminder', startedAt: now } },
  ] } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Payments', exact: true }).click();
  await expect(page.getByText(/Invoice sending outcome is uncertain/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve & send invoice' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Draft reminder' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Record reviewed outcome' })).toBeDisabled();
  await expect(page.getByText(/An absent email alone does not prove/)).toBeVisible();
  await page.getByLabel('Review outcome').selectOption('countAsSent');
  await page.getByLabel('Evidence or conservative decision rationale').fill('Fictional conservative review: count the uncertain attempt as sent.');
  await page.getByRole('checkbox', { name: /I reviewed this attempt/ }).check();
  await expect(page.getByRole('button', { name: 'Record reviewed outcome' })).toBeEnabled();
  expect(writes).toBe(0);
});
