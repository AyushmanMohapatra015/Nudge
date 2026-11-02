import { test, expect, type Route } from '@playwright/test';

for (const kind of ['owner', 'client'] as const) {
  test(`${kind} hung read has a deadline, coalesces polling and recovers`, async ({ page, request }) => {
    await request.post('/api/workspace', { data: { type: 'reset' } });
    await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
    const state = await (await request.get('/api/workspace')).json();
    const endpoint = kind === 'owner' ? '/api/workspace' : `/api/client/${state.clientToken}`;
    const held: Route[] = [];
    let hold = true;
    await page.clock.install();
    await page.route(`**${endpoint}`, async route => {
      if (hold) { held.push(route); return; }
      await route.continue();
    });
    await page.goto(kind === 'owner' ? '/' : `/client/${state.clientToken}`);
    await expect.poll(() => held.length).toBe(1);
    await page.clock.runFor(5500);
    expect(held).toHaveLength(1);
    await page.clock.runFor(4600);
    await expect(page.locator('.loading').getByRole('alert')).toContainText('Connection timed out.');
    hold = false;
    // A poll at the deadline may already be waiting; abort held requests so
    // an explicit retry can proceed. No financial action is ever retried.
    for (const route of held) await route.abort().catch(() => {});
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { name: kind === 'owner' ? 'Project overview' : 'Your project scope' })).toBeVisible();
    await expect(page.locator('.loading')).toHaveCount(0);
    expect((await (await request.get('/api/workspace')).json()).agreementStatus).toBe('approved');
  });
}

for (const kind of ['owner', 'client'] as const) {
test(`${kind} mutation cancels old read and suppresses polling until action completes`, async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  if (kind === 'client') await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  const endpoint = kind === 'owner' ? '/api/workspace' : `/api/client/${state.clientToken}`;
  const buttonName = kind === 'owner' ? 'Approve scope' : 'Accept project scope';
  await page.clock.install();
  await page.goto(kind === 'owner' ? '/' : `/client/${state.clientToken}`);
  await expect(page.getByRole('button', { name: buttonName })).toBeVisible();
  if (kind === 'client') await page.getByRole('checkbox').check();
  let oldRead: Route | undefined, write: Route | undefined, getCount = 0, postCount = 0;
  await page.route(`**${endpoint}`, route => {
    if (route.request().method() === 'POST') { postCount++; write = route; }
    else { getCount++; oldRead = route; }
  });
  await page.clock.runFor(5100);
  await expect.poll(() => Boolean(oldRead)).toBe(true);
  await page.getByRole('button', { name: buttonName }).click();
  await expect.poll(() => Boolean(write)).toBe(true);
  await expect(page.getByRole('button', { name: buttonName })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: kind === 'owner' ? 'Saving your action.' : 'Saving your decision.' })).toBeVisible();
  await page.clock.runFor(6000);
  expect(getCount).toBe(1); expect(postCount).toBe(1);
  await oldRead!.abort().catch(() => {});
  await write!.continue();
  await expect(page.getByText(kind === 'owner' ? 'Waiting for client acceptance' : /Scope accepted/, { exact: kind === 'owner' })).toBeVisible();
  expect((await (await request.get('/api/workspace')).json()).agreementStatus).toBe(kind === 'owner' ? 'approved' : 'accepted');
});
}
