import { test, expect, type Page, type Locator } from '@playwright/test';

// Traverse the actual tab sequence: never focus/click a target programmatically.
// This fails if a core control is removed from keyboard navigation or trapped.
async function tabTo(page: Page, target: Locator, visualTarget: Locator = target) {
  await expect(target).toHaveCount(1);
  await expect(visualTarget).toBeVisible();
  for (let count = 0; count < 160; count++) {
    if (await target.evaluate(element => element === document.activeElement)) {
      await expect(target).toBeFocused();
      const visible = await visualTarget.evaluate(element => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
      });
      expect(visible, 'Focused control must be reachable in the viewport').toBe(true);
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error('Expected control was not reachable through 160 forward Tab presses.');
}
async function activate(page: Page, target: Locator) {
  await expect(target).toBeEnabled();
  await tabTo(page, target);
  await page.keyboard.press('Enter');
}
async function type(page: Page, target: Locator, value: string) {
  await expect(target).toBeEnabled();
  await tabTo(page, target);
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(value);
}

test('keyboard alone completes approved scope, reviewed quote, client consent and simulated payment', async ({ page, request }) => {
  test.setTimeout(120000);
  expect((await request.post('/api/workspace', { data: { type: 'reset' } })).status()).toBe(200);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Project overview' })).toBeVisible();
  await activate(page, page.getByRole('link', { name: 'Skip to workspace content' }));
  await activate(page, page.getByRole('button', { name: 'Approve scope', exact: true }));
  await expect(page.getByText('Waiting for client acceptance', { exact: true })).toBeVisible();
  await tabTo(page, page.getByRole('link', { name: 'Client view', exact: true }).first());
  const popup = page.waitForEvent('popup');
  await page.keyboard.press('Enter');
  const client = await popup;
  await expect(client.getByRole('checkbox')).toBeVisible();
  await expect(client.getByRole('button', { name: 'Accept project scope' })).toBeDisabled();
  await tabTo(client, client.getByRole('checkbox'));
  await client.keyboard.press('Space');
  await activate(client, client.getByRole('button', { name: 'Accept project scope' }));
  await expect(client.getByText(/Scope accepted/)).toBeVisible();
  await expect(client.getByRole('heading', { level: 1 })).toBeFocused();
  await type(page, page.getByLabel('CLIENT REQUEST', { exact: true }), 'Please add appointment booking to the website.');
  await activate(page, page.getByRole('button', { name: 'Compare with agreement' }));
  await expect(page.getByText('Outside agreed scope')).toBeVisible();
  await activate(page, page.getByRole('button', { name: 'Approvals', exact: true }));
  await type(page, page.getByRole('textbox', { name: 'Deliverables to propose', exact: true }), 'Appointment booking system');
  await type(page, page.getByLabel('Decision rationale', { exact: true }), 'Clause S3 excludes booking systems. Quote only appointment booking as additional work.');
  await type(page, page.getByLabel('Supporting clause IDs', { exact: true }), 'S3');
  await activate(page, page.getByRole('button', { name: 'Record scope decision', exact: true }));
  await expect(page.getByRole('status').filter({ hasText: 'Recorded decision:' })).toContainText('additional');
  await type(page, page.getByPlaceholder('e.g. 300.00'), '300.00');
  await type(page, page.getByLabel('Explanation for your client (optional)', { exact: true }), 'Booking is excluded by S3. This quote adds appointment scheduling for USD 300.00.');
  await tabTo(page, page.getByLabel('This quote contains only reviewed additional work.', { exact: true }));
  await page.keyboard.press('Space');
  await activate(page, page.getByRole('button', { name: 'Approve proposal', exact: true }));
  await expect(client.getByRole('button', { name: 'Accept work & price' })).toBeVisible({ timeout: 10000 });
  await tabTo(client, client.getByText('Supporting agreement clauses', { exact: true }));
  await client.keyboard.press('Enter');
  await expect(client.locator('.quote-explanation .reference').filter({ hasText: 'S3' })).toBeVisible();
  await activate(client, client.getByRole('button', { name: 'Accept work & price' }));
  await expect(client.getByRole('heading', { level: 1 })).toBeFocused();
  await activate(page, page.getByRole('button', { name: 'My project', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Create PayPal invoice', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Payments', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Approve & send invoice', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Simulate payment', exact: true }));
  await expect(client.getByText('Thank you. This invoice is settled.')).toBeVisible({ timeout: 10000 });
  const state = await (await request.get('/api/workspace')).json();
  expect(state.aiEnabled).toBe(false);
  expect(state.connections).toEqual({ paypal: false, ai: false, webhook: false });
  expect(state.proposals).toHaveLength(1);
  expect(state.proposals[0].status).toBe('accepted');
  expect(state.invoices).toHaveLength(1);
  expect(state.invoices[0]).toMatchObject({ status: 'PAID', amountCents: 30000, outstandingCents: 0 });
  await client.close();
});

test('keyboard reaches snapshot tables and moves and resizes Studio widget without financial writes', async ({ page, request }) => {
  expect((await request.post('/api/workspace', { data: { type: 'reset' } })).status()).toBe(200);
  expect((await request.post('/api/workspace', { data: { type: 'seedOverdue' } })).status()).toBe(200);
  const before = await (await request.get('/api/workspace')).json();
  const writes: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET' && new URL(request.url()).pathname.startsWith('/api/')) writes.push(new URL(request.url()).pathname); });
  await page.goto('/analytics');
  await activate(page, page.getByRole('button', { name: 'Load interactive reports', exact: true }));
  await expect(page.getByRole('region', { name: 'Changes awaiting client acceptance', exact: true })).toBeVisible({ timeout: 30000 });
  await activate(page, page.getByRole('link', { name: 'Skip to reports', exact: true }));
  await expect(page.getByRole('heading', { name: 'Invoice and change reports', exact: true })).toBeFocused();
  await tabTo(page, page.getByText('Read complete snapshot as tables', { exact: true }));
  await page.keyboard.press('Space');
  await expect(page.getByRole('table', { name: 'Invoice records · USD' })).toContainText('$800.00');
  await tabTo(page, page.getByRole('region', { name: 'Invoice snapshot table', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Edit report layout', exact: true }));
  const widget = page.locator('.ag-studio-layout-widget').filter({ has: page.locator('.studio-pending-changes') });
  const widgetFocus = widget.locator('.ag-studio-layout-widget-focus-container');
  // Studio uses a zero-size focus sentinel; the visible widget is its focus surface.
  await tabTo(page, widgetFocus, widget);
  const initial = await widget.boundingBox(); expect(initial).not.toBeNull();
  // Shrink first: the initial full-width, tightly packed layout has no free
  // space for movement or growth. Studio rejects overlapping layouts.
  await page.keyboard.press('Alt+ArrowLeft');
  await expect.poll(async () => (await widget.boundingBox())!.width).toBeLessThan(initial!.width);
  await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(async () => (await widget.boundingBox())!.x).toBeGreaterThan(initial!.x);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(widgetFocus).toBeFocused();
  await activate(page, page.getByRole('button', { name: 'Finish editing layout', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Refresh local snapshot', exact: true }));
  await expect(page.locator('.analytics-announcement')).toContainText('Local snapshot loaded. Version');
  await activate(page, page.getByRole('link', { name: 'Back to workspace', exact: true }));
  await expect(page.getByRole('heading', { name: 'Project overview' })).toBeVisible();
  expect(writes).toEqual([]);
  expect(await (await request.get('/api/workspace')).json()).toEqual(before);
});

test('successful agreement save preserves focus when the user tabs to another connected control', async ({ page, request }) => {
  expect((await request.post('/api/workspace', { data: { type: 'reset' } })).status()).toBe(200);
  await page.goto('/');
  await activate(page, page.getByRole('button', { name: 'My project', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Edit agreement', exact: true }));
  await expect(page.getByLabel('Project name', { exact: true })).toBeFocused();
  let release: (() => void) | undefined;
  await page.route('**/api/workspace', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    await new Promise<void>(resolve => { release = resolve; });
    return route.continue();
  });
  await activate(page, page.getByRole('button', { name: 'Save agreement', exact: true }));
  await expect.poll(() => Boolean(release)).toBe(true);
  const other = page.getByRole('button', { name: 'Read project setup instructions', exact: true });
  await tabTo(page, other);
  release!();
  await expect(page.getByRole('heading', { name: 'Make the agreement yours.' })).toHaveCount(0);
  await expect(other).toBeFocused();
  expect((await (await request.get('/api/workspace')).json()).invoices).toHaveLength(0);
});
