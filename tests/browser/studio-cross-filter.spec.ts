import { test, expect, type APIRequestContext, type Locator } from '@playwright/test';

async function seed(request: APIRequestContext) {
  const action = async (data: Record<string, unknown>) => {
    expect((await request.post('/api/workspace', { data })).status()).toBe(200);
  };
  const state = async () => (await request.get('/api/workspace')).json();
  await action({ type: 'reset' }); await action({ type: 'approveAgreement' });
  const token = (await state()).clientToken;
  expect((await request.post(`/api/client/${token}`, { data: { type: 'acceptAgreement' } })).status()).toBe(200);
  await action({ type: 'createInvoice', id: 'base' });
  await action({ type: 'sendInvoice', id: (await state()).invoices[0].id });
  await action({ type: 'seedOverdue' });
  await action({ type: 'analyze', request: 'Please add appointment booking functionality to the website.' });
  const id = (await state()).proposals[0].id;
  const deliverables = ['Appointment booking system'];
  await action({ type: 'reviewScope', id, expectedReviewId: '', classification: 'additional',
    rationale: 'Clause S3 excludes booking functionality from the agreed website scope.', references: ['S3'], clarification: '', deliverables });
  await action({ type: 'approveProposal', id, reviewId: (await state()).proposals[0].scopeReview.id,
    extrasConfirmed: true, amountCents: 30001, deliverables });
  return state();
}

/** Actual canvas hit testing, not a synthetic API/state selection. The fixture has
 * current/overdue bars; click inside the lower overdue bar, away from the axes. */
async function clickOverdue(chart: Locator) {
  await chart.scrollIntoViewIfNeeded();
  const bounds = await chart.boundingBox(); expect(bounds).not.toBeNull();
  await chart.click({ position: { x: bounds!.width * 0.5, y: bounds!.height * 0.65 } });
}

test('chart click filters invoices only; same-bar and filter-card reset work, and refresh preserves selection', async ({ page, request }) => {
  const before = await seed(request);
  const writes: string[] = []; const errors: string[] = [];
  page.on('request', req => { if (req.method() !== 'GET' && new URL(req.url()).pathname.startsWith('/api/')) writes.push(req.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/analytics');
  const studio = page.getByRole('region', { name: 'AG Studio report builder' });
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(studio.getByText(/^Loading[.…]/).filter({ visible: true })).toHaveCount(0, { timeout: 30000 });
  const chart = studio.getByRole('figure', { name: 'chart, 1 series' });
  const totals = await page.getByRole('region', { name: 'Complete workspace totals' }).innerText();
  const pending = studio.getByRole('region', { name: 'Changes awaiting client acceptance', exact: true });
  await clickOverdue(chart);
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toHaveCount(0);
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toBeVisible();
  await expect(studio.getByRole('gridcell', { name: 'approved', exact: true })).toBeVisible();
  await expect(pending).toContainText('$300.01');
  expect(await page.getByRole('region', { name: 'Complete workspace totals' }).innerText()).toBe(totals);
  await clickOverdue(chart);
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toBeVisible();
  await clickOverdue(chart);
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toHaveCount(0);
  await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === '/api/analytics'),
    page.getByRole('button', { name: 'Refresh local snapshot' }).click(),
  ]);
  await expect(page.getByRole('button', { name: 'Refresh local snapshot' })).toBeEnabled();
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toHaveCount(0);
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toBeVisible();
  await studio.getByRole('button', { name: 'Filters', exact: true }).click();
  await expect(studio.getByRole('button', { name: 'Cross Filters', exact: true })).toBeVisible();
  await expect(studio.getByRole('heading', { name: 'Ageing equals "1-30 days overdue"', exact: true })).toBeVisible();
  await studio.getByRole('button', { name: 'Delete Filter', exact: true }).click();
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toBeVisible();
  await expect(studio.getByRole('button', { name: 'Cross Filters', exact: true })).toHaveCount(0);
  expect(await page.getByRole('region', { name: 'Complete workspace totals' }).innerText()).toBe(totals);
  expect(await (await request.get('/api/workspace')).json()).toEqual(before);
  expect(writes).toEqual([]); expect(errors).toEqual([]);
  await expect(studio.getByText(/^Loading[.…]/).filter({ visible: true })).toHaveCount(0, { timeout: 30000 });
  await page.screenshot({ path: test.info().outputPath('cross-filter-cleared.png'), fullPage: true });
});

test('conflicting page and chart filters produce empty invoice results; clearing either does not clear the other', async ({ page, request }) => {
  const before = await seed(request);
  const writes: string[] = []; const errors: string[] = [];
  page.on('request', req => { if (req.method() !== 'GET' && new URL(req.url()).pathname.startsWith('/api/')) writes.push(req.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/analytics');
  const studio = page.getByRole('region', { name: 'AG Studio report builder' });
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(studio.getByText(/^Loading[.…]/).filter({ visible: true })).toHaveCount(0, { timeout: 30000 });
  const totals = await page.getByRole('region', { name: 'Complete workspace totals' }).innerText();
  await clickOverdue(studio.getByRole('figure', { name: 'chart, 1 series' }));
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit report layout' }).click();
  await studio.getByRole('button', { name: 'Filters', exact: true }).click();
  await studio.getByRole('button', { name: 'Add Filter', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ageing', exact: true }).click();
  await studio.getByRole('textbox', { name: 'Filter Value', exact: true }).first().fill('Current');
  await expect(studio.getByRole('gridcell', { name: /^Invoice [12]$/ })).toHaveCount(0);
  await expect(studio.getByRole('gridcell', { name: 'approved', exact: true })).toBeVisible();
  await expect(studio.getByRole('region', { name: 'Changes awaiting client acceptance', exact: true })).toContainText('$300.01');
  expect(await page.getByRole('region', { name: 'Complete workspace totals' }).innerText()).toBe(totals);
  const crossCard = studio.getByRole('heading', { name: 'Ageing equals "1-30 days overdue"', exact: true }).locator('..');
  await crossCard.getByRole('button', { name: 'Delete Filter', exact: true }).click();
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toBeVisible();
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toHaveCount(0);
  await expect(studio.getByRole('textbox', { name: 'Filter Value', exact: true }).first()).toHaveValue('Current');
  await studio.getByRole('heading', { name: 'Ageing', exact: true }).locator('..').getByRole('button', { name: 'Delete Filter', exact: true }).click();
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toBeVisible();
  expect(await (await request.get('/api/workspace')).json()).toEqual(before);
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});
