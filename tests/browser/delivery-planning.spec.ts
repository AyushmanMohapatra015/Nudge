import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { source } from 'axe-core';

async function accepted(request: APIRequestContext) {
  expect((await request.post('/api/workspace', { data: { type: 'reset' } })).status()).toBe(200);
  expect((await request.post('/api/workspace', { data: { type: 'approveAgreement' } })).status()).toBe(200);
  const state = await (await request.get('/api/workspace')).json();
  expect((await request.post(`/api/client/${state.clientToken}`, { data: { type: 'acceptAgreement' } })).status()).toBe(200);
}
async function initialEditor(page: Page, scheduled = true) {
  await page.goto('/delivery'); await page.getByRole('button', { name: 'Plan base scope' }).click();
  await page.getByLabel('Calendar timezone', { exact: true }).fill('Asia/Kolkata');
  await page.getByLabel('Excluded holidays', { exact: false }).fill('2026-10-19');
  await page.getByLabel('Task 1 label', { exact: true }).fill('Website delivery');
  await page.getByLabel('Task 1 estimated working days', { exact: true }).fill('3');
  await page.getByText('Task 1 scope evidence', { exact: true }).click();
  await page.getByRole('checkbox', { name: /^S1:/ }).check();
  if (scheduled) { await page.getByLabel('Set a start date for task 1', { exact: true }).check(); await page.getByLabel('Task 1 start date', { exact: true }).fill('2026-10-16'); }
}
const state = async (request: APIRequestContext) => (await request.get('/api/workspace')).json();
const finances = (workspace: Record<string, unknown>) => { const { deliveryPlan: _plan, version: _version, audit: _audit, ...rest } = workspace; return rest; };
const apply = async (page: Page) => { await page.getByLabel('I reviewed this preview and want to apply it internally.', { exact: true }).focus(); await page.keyboard.press('Space'); await page.getByRole('button', { name: 'Apply internal plan', exact: true }).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('status').filter({ hasText: 'Internal plan applied.' })).toBeVisible(); };

test('owner enters, reviews and applies a holiday plan; cancellation and discard preserve original dates and money', async ({ page, request }) => {
  await accepted(request); const baseline = await state(request);
  await initialEditor(page);
  await expect(page.getByText('2026-10-22', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel local edits' }).click();
  expect(await state(request)).toEqual(baseline);
  await page.getByRole('button', { name: 'Plan base scope' }).click();
  await page.getByLabel('Task 1 label', { exact: true }).fill('Website delivery');
  await page.getByLabel('Task 1 estimated working days', { exact: true }).fill('3');
  await page.getByLabel('Calendar timezone', { exact: true }).fill('Asia/Kolkata');
  await page.getByLabel('Excluded holidays', { exact: false }).fill('2026-10-19');
  await page.getByText('Task 1 scope evidence', { exact: true }).click(); await page.getByRole('checkbox', { name: /^S1:/ }).check();
  await page.getByLabel('Set a start date for task 1', { exact: true }).check(); await page.getByLabel('Task 1 start date', { exact: true }).fill('2026-10-16');
  await page.getByRole('button', { name: 'Save delivery preview' }).focus(); await page.keyboard.press('Enter');
  const saved = page.getByRole('status').filter({ hasText: 'Preview saved.' }); await expect(saved).toBeVisible(); await expect(saved).toBeFocused();
  let workspace = await state(request);
  expect(workspace.deliveryPlan.current).toBeNull(); expect(workspace.deliveryPlan.original).toBeNull();
  expect(finances(workspace)).toEqual(finances(baseline));
  await expect(page.getByRole('button', { name: 'Apply internal plan', exact: true })).toBeDisabled();
  let release!: () => void; const held = new Promise<void>(done => { release = done; }); let applies = 0;
  await page.route('**/api/delivery-plan', async route => {
    if (route.request().method() === 'POST' && route.request().postDataJSON().type === 'apply') { applies++; const response = await route.fetch(); await held; await route.fulfill({ response }); }
    else await route.continue();
  });
  await page.getByLabel('I reviewed this preview and want to apply it internally.', { exact: true }).check();
  await page.getByRole('button', { name: 'Apply internal plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apply internal plan', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Apply internal plan', exact: true }).evaluate((button: HTMLButtonElement) => button.click());
  release(); await expect(page.getByRole('status').filter({ hasText: 'Internal plan applied.' })).toBeVisible(); expect(applies).toBe(1);
  await page.unroute('**/api/delivery-plan');
  workspace = await state(request); expect(workspace.deliveryPlan.revision).toBe(1); expect(workspace.deliveryPlan.current.snapshot.tasks[0].endDateExclusive).toBe('2026-10-22');
  await page.getByRole('button', { name: 'Edit delivery preview' }).click();
  await expect(page.getByLabel('Calendar timezone', { exact: true })).toHaveAttribute('readonly', '');
  await page.getByLabel('Task 1 estimated working days', { exact: true }).focus(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type('4');
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.addScriptTag({ content: source });
  expect(await page.evaluate(async () => (await (window as unknown as { axe: typeof import('axe-core') }).axe.run(document, { runOnly: { type: 'rule', values: ['nested-interactive', 'button-name', 'label', 'color-contrast'] } })).violations.map(v => v.id))).toEqual([]);
  await page.getByRole('button', { name: 'Save delivery preview' }).click(); await expect(saved).toBeVisible();
  await page.getByRole('button', { name: 'Current plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apply internal plan', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Proposed preview', exact: true }).click(); await apply(page);
  workspace = await state(request); expect(workspace.deliveryPlan.current.snapshot.tasks[0].endDateExclusive).toBe('2026-10-23');
  expect(workspace.deliveryPlan.original.snapshot.tasks[0].endDateExclusive).toBe('2026-10-22');
  await page.getByRole('button', { name: 'Edit delivery preview' }).click(); await page.getByLabel('Task 1 estimated working days', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Save delivery preview' }).click(); await expect(saved).toBeVisible();
  await page.getByLabel('Discard this saved preview; keep applied dates.', { exact: true }).focus(); await page.keyboard.press('Space'); await page.getByRole('button', { name: 'Discard saved preview' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Preview discarded.' })).toBeVisible();
  const after = await state(request); expect(after.deliveryPlan.preview).toBeUndefined(); expect(after.deliveryPlan.current).toEqual(workspace.deliveryPlan.current); expect(after.deliveryPlan.original).toEqual(workspace.deliveryPlan.original);
  expect(finances(after)).toEqual(finances(baseline));
});

test('lost stage response blocks repetition, preserves local entries and requires explicit refresh/review', async ({ page, request }) => {
  await accepted(request); await initialEditor(page, false); let stages = 0;
  await page.route('**/api/delivery-plan', async route => {
    if (route.request().method() === 'POST') { stages++; await route.fetch(); await route.abort('failed'); }
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Save delivery preview' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('do not repeat an unconfirmed request');
  await expect(page.getByLabel('Task 1 label', { exact: true })).toHaveValue('Website delivery');
  await expect(page.getByRole('button', { name: 'Save delivery preview' })).toBeDisabled(); expect(stages).toBe(1);
  const committed = await state(request); expect(committed.deliveryPlan.preview).toBeDefined(); expect(committed.deliveryPlan.current).toBeNull();
  await page.unroute('**/api/delivery-plan'); await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click();
  await expect(page.getByLabel('Task 1 label', { exact: true })).toHaveValue('Website delivery');
  await expect(page.getByRole('button', { name: 'Save replacement preview' })).toBeDisabled();
  await expect(page.getByLabel(/I reviewed my entries against refreshed version/)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel local edits' }).click();
  expect((await state(request)).deliveryPlan).toEqual(committed.deliveryPlan);
});

test('extra-work acceptance and workspace versions gate apply; restaging is explicit', async ({ page, request }) => {
  await accepted(request); await initialEditor(page, false);
  await page.getByRole('button', { name: 'Save delivery preview' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Preview saved.' })).toBeVisible(); await apply(page);
  expect((await request.post('/api/workspace', { data: { type: 'analyze', request: 'Please add a booking page with appointment scheduling.' } })).status()).toBe(200);
  let workspace = await state(request), proposal = workspace.proposals[0];
  expect((await request.post('/api/workspace', { data: { type: 'reviewScope', id: proposal.id, expectedReviewId: '', classification: 'additional', rationale: 'Booking is excluded by S3; quote only the separately requested booking work.', references: ['S3'], clarification: '', deliverables: ['Booking page'] } })).status()).toBe(200);
  workspace = await state(request); proposal = workspace.proposals[0];
  expect((await request.post('/api/workspace', { data: { type: 'approveProposal', id: proposal.id, reviewId: proposal.scopeReview.id, extrasConfirmed: true, amountCents: 30000, deliverables: ['Booking page'] } })).status()).toBe(200);
  const financialBefore = await state(request);
  await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click(); await page.getByRole('button', { name: 'Edit delivery preview' }).click();
  await page.getByRole('button', { name: 'Add reviewed extra' }).click();
  await page.getByRole('combobox', { name: 'Reviewed change for task 2', exact: true }).selectOption(proposal.id);
  await page.getByLabel('Task 2 estimated working days', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Save delivery preview' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Preview saved.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply internal plan', exact: true })).toBeDisabled();
  expect((await request.post(`/api/client/${workspace.clientToken}`, { data: { type: 'acceptProposal', id: proposal.id } })).status()).toBe(200);
  await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click();
  await page.getByRole('button', { name: 'Proposed preview', exact: true }).click(); await expect(page.getByRole('main').getByRole('alert')).toContainText('preview is stale');
  await page.getByRole('button', { name: 'Edit delivery preview' }).click(); await page.getByRole('button', { name: 'Save replacement preview' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Preview saved.' })).toBeVisible();
  const beforeConflict = await state(request);
  await page.getByLabel('I reviewed this preview and want to apply it internally.', { exact: true }).check();
  expect((await request.post('/api/workspace', { data: { type: 'policies', protectedClient: false, reminderLimit: 3, cooldownDays: 7 } })).status()).toBe(200);
  await page.getByRole('button', { name: 'Apply internal plan', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Stored records changed');
  expect((await state(request)).deliveryPlan).toEqual(beforeConflict.deliveryPlan);
  await page.getByRole('button', { name: 'Refresh delivery snapshot' }).click(); await page.getByRole('button', { name: 'Edit delivery preview' }).click();
  await page.getByRole('button', { name: 'Save replacement preview' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Preview saved.' })).toBeVisible(); await apply(page);
  const after = await state(request); expect(after.deliveryPlan.current.snapshot.tasks).toHaveLength(2);
  expect(after.invoices).toEqual(financialBefore.invoices); expect(after.agreement).toEqual(financialBefore.agreement); expect(after.proposals[0].amountCents).toBe(30000); expect(after.proposals[0].status).toBe('accepted');
});
