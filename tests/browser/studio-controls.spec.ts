import { test, expect, type APIRequestContext } from '@playwright/test';

async function action(request: APIRequestContext, data: Record<string, unknown>) {
  expect((await request.post('/api/workspace', { data })).status()).toBe(200);
}
async function workspace(request: APIRequestContext) {
  return (await request.get('/api/workspace')).json();
}
async function quote(request: APIRequestContext, amountCents: number) {
  await action(request, { type: 'analyze', request: 'Please add an appointment booking system to the website.' });
  let state = await workspace(request);
  const id = state.proposals.find((p: { status: string; scopeReview?: unknown }) => p.status === 'draft' && !p.scopeReview)?.id;
  expect(id).toBeTruthy();
  const deliverables = ['Appointment booking system'];
  await action(request, { type: 'reviewScope', id, expectedReviewId: '', classification: 'additional',
    rationale: 'The agreement explicitly excludes booking functionality in clause S3.', references: ['S3'], clarification: '', deliverables });
  state = await workspace(request);
  await action(request, { type: 'approveProposal', id, reviewId: state.proposals.find((p: { id: string }) => p.id === id).scopeReview.id,
    extrasConfirmed: true, amountCents, deliverables });
  return id as string;
}
async function mixedRecords(request: APIRequestContext) {
  await action(request, { type: 'reset' });
  await action(request, { type: 'approveAgreement' });
  const token = (await workspace(request)).clientToken;
  expect((await request.post(`/api/client/${token}`, { data: { type: 'acceptAgreement' } })).status()).toBe(200);
  const accepted = await quote(request, 10001);
  expect((await request.post(`/api/client/${token}`, { data: { type: 'acceptProposal', id: accepted } })).status()).toBe(200);
  await action(request, { type: 'createInvoice', id: accepted });
  const invoice = (await workspace(request)).invoices[0];
  await action(request, { type: 'sendInvoice', id: invoice.id });
  await action(request, { type: 'simulatePayment', id: invoice.id });
  await action(request, { type: 'seedOverdue' });
  await quote(request, 30001);
  const declined = await quote(request, 5002);
  expect((await request.post(`/api/client/${token}`, { data: { type: 'declineProposal', id: declined } })).status()).toBe(200);
  return workspace(request);
}

test('Studio menu adds, duplicates, deletes and resizes a custom widget; refresh retains edits and navigation resets them', async ({ page, request }) => {
  await action(request, { type: 'reset' });
  await action(request, { type: 'seedOverdue' });
  const before = await workspace(request);
  const writes: string[] = []; const errors: string[] = [];
  page.on('request', req => { if (req.method() !== 'GET' && new URL(req.url()).pathname.startsWith('/api/')) writes.push(req.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/analytics');
  await page.getByRole('button', { name: 'Load interactive reports', exact: true }).click();
  const studio = page.getByRole('region', { name: 'AG Studio report builder' });
  const widgets = studio.getByRole('region', { name: 'Changes awaiting client acceptance', exact: true });
  await expect(widgets).toHaveCount(1, { timeout: 30000 });
  await page.getByRole('button', { name: 'Edit report layout' }).click();
  await expect(studio.getByRole('button', { name: 'Nudge', exact: true })).toBeVisible();
  await studio.getByRole('button', { name: 'Changes awaiting client acceptance', exact: true }).click();
  await expect(widgets).toHaveCount(2);
  const added = studio.locator('.ag-studio-layout-widget').filter({ has: page.locator('.studio-pending-changes') }).last();
  const addedSize = await added.boundingBox();
  expect(addedSize!.width).toBeGreaterThanOrEqual(280);
  expect(addedSize!.height).toBeGreaterThanOrEqual(240);
  await added.hover();
  await added.getByRole('button', { name: 'Duplicate widget', exact: true }).click();
  await expect(widgets).toHaveCount(3);
  const duplicate = studio.locator('.ag-studio-layout-widget').filter({ has: page.locator('.studio-pending-changes') }).last();
  await duplicate.hover();
  await duplicate.getByRole('button', { name: 'Delete widget', exact: true }).click();
  await expect(widgets).toHaveCount(2);
  const first = studio.locator('.ag-studio-layout-widget').filter({ has: page.locator('.studio-pending-changes') }).last();
  await first.scrollIntoViewIfNeeded();
  const initial = await first.boundingBox(); expect(initial).not.toBeNull();
  const handle = first.locator('.ag-studio-layout-widget-overlay-resize[data-direction="s"]');
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox(); expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height - 1);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height - 1 + 90, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await first.boundingBox())!.height).toBeGreaterThan(initial!.height + 30);
  const resized = (await first.boundingBox())!.height;
  await first.scrollIntoViewIfNeeded();
  const moveStart = (await first.boundingBox())!;
  await page.mouse.move(moveStart.x + moveStart.width / 2, moveStart.y + 20);
  await page.mouse.down();
  await page.mouse.move(moveStart.x + moveStart.width / 2 + 190, moveStart.y + 20, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await first.boundingBox())!.x).toBeGreaterThan(moveStart.x + 50);
  await page.getByRole('button', { name: 'Finish editing layout' }).click();
  // Closing Compose expands the report width; compare refresh in the same view mode.
  const movedX = (await first.boundingBox())!.x;
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(widgets).toHaveCount(2);
  await expect.poll(async () => (await first.boundingBox())!.height).toBeCloseTo(resized, 0);
  await expect.poll(async () => (await first.boundingBox())!.x).toBeCloseTo(movedX, 0);
  await page.getByRole('link', { name: 'Back to workspace', exact: true }).click();
  await page.goto('/analytics');
  await page.getByRole('button', { name: 'Load interactive reports', exact: true }).click();
  await expect(widgets).toHaveCount(1, { timeout: 30000 });
  expect(await workspace(request)).toEqual(before);
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});

test('page filters affect matching invoices, retain unrelated quotes and full-workspace totals, and clear safely', async ({ page, request }) => {
  const before = await mixedRecords(request);
  const writes: string[] = []; const errors: string[] = [];
  page.on('request', req => { if (req.method() !== 'GET' && new URL(req.url()).pathname.startsWith('/api/')) writes.push(req.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/analytics');
  await page.getByRole('button', { name: 'Load interactive reports', exact: true }).click();
  const studio = page.getByRole('region', { name: 'AG Studio report builder' });
  const pending = studio.getByRole('region', { name: 'Changes awaiting client acceptance', exact: true });
  await expect(studio.getByRole('gridcell', { name: 'PAID', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(studio.getByRole('gridcell', { name: 'UNPAID', exact: true })).toBeVisible();
  await expect(pending).toContainText('$300.01');
  const totals = await page.getByRole('region', { name: 'Complete workspace totals' }).innerText();
  await page.getByRole('button', { name: 'Edit report layout' }).click();
  await studio.getByRole('button', { name: 'Filters', exact: true }).click();
  await studio.getByRole('button', { name: 'Add Filter', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Recorded status', exact: true }).click();
  await studio.getByRole('textbox', { name: 'Filter Value', exact: true }).fill('UNPAID');
  await expect(studio.getByRole('gridcell', { name: 'PAID', exact: true })).toHaveCount(0);
  await expect(studio.getByRole('gridcell', { name: 'UNPAID', exact: true })).toBeVisible();
  await expect(studio.getByRole('gridcell', { name: 'accepted', exact: true })).toBeVisible();
  await expect(studio.getByRole('gridcell', { name: 'approved', exact: true })).toBeVisible();
  await expect(studio.getByRole('gridcell', { name: 'declined', exact: true })).toBeVisible();
  await expect(pending).toContainText('$300.01');
  expect(await page.getByRole('region', { name: 'Complete workspace totals' }).innerText()).toBe(totals);
  await studio.getByRole('textbox', { name: 'Filter Value', exact: true }).first().fill('NO-MATCH');
  await expect(studio.getByRole('gridcell', { name: 'UNPAID', exact: true })).toHaveCount(0);
  await expect(pending).toContainText('$300.01');
  await page.getByRole('button', { name: 'Refresh local snapshot' }).click();
  await expect(studio.getByRole('textbox', { name: 'Filter Value', exact: true }).first()).toHaveValue('NO-MATCH');
  await expect(studio.getByRole('gridcell', { name: 'UNPAID', exact: true })).toHaveCount(0);
  await studio.getByRole('button', { name: 'Delete Filter', exact: true }).click();
  await expect(studio.getByRole('gridcell', { name: 'PAID', exact: true })).toBeVisible();
  await expect(studio.getByRole('gridcell', { name: 'UNPAID', exact: true })).toBeVisible();
  expect(await page.getByRole('region', { name: 'Complete workspace totals' }).innerText()).toBe(totals);
  expect(await workspace(request)).toEqual(before);
  expect(writes).toEqual([]); expect(errors).toEqual([]);
  await expect(studio.getByText(/^Loading[.…]/).filter({ visible: true })).toHaveCount(0, { timeout: 30000 });
  await page.screenshot({ path: test.info().outputPath('mixed-records.png'), fullPage: true });
});
