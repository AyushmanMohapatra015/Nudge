import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

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

async function csv(page: Page, widget: Locator, filename: string) {
  await widget.scrollIntoViewIfNeeded(); await widget.hover();
  await widget.locator('.ag-studio-layout-widget-focus-container').focus();
  const pending = page.waitForEvent('download', { timeout: 10000 });
  await widget.getByRole('button', { name: 'Export widget data', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(filename);
  expect(await download.failure()).toBeNull();
  const text = (await readFile((await download.path())!, 'utf8')).replace(/^\uFEFF/, '');
  // The fixture fields contain no embedded newlines. Assert the complete CSV,
  // including formatted monetary cells, rather than just the presence of a label.
  const rows = text.split(/\r?\n/).filter(Boolean).map(line =>
    Array.from(line.matchAll(/"((?:[^"\r\n]|"")*)"(?:,|$)/g), match => match[1].replace(/""/g, '"')));
  expect(text).toBe(rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n'));
  return { text, rows };
}

test('Studio exports respect invoice selections, preserve quote cents and contain only projected fields', async ({ page, request }) => {
  const before = await seed(request);
  const writes: string[] = []; const errors: string[] = [];
  page.on('request', req => { if (req.method() !== 'GET' && new URL(req.url()).pathname.startsWith('/api/')) writes.push(req.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/analytics');
  const studio = page.getByRole('region', { name: 'AG Studio report builder' });
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(studio.getByText(/^Loading[.…]/).filter({ visible: true })).toHaveCount(0);
  const invoice = studio.locator('.ag-studio-layout-widget').filter({ has: page.getByRole('grid') }).first();
  const quotes = studio.locator('.ag-studio-layout-widget').filter({ has: page.getByRole('grid') }).last();
  const chartWidget = studio.locator('.ag-studio-layout-widget').filter({ has: page.getByRole('figure', { name: 'chart, 1 series' }) });
  await expect(chartWidget.getByText('Outstanding invoices by age (USD)', { exact: true })).toBeVisible();
  await expect(chartWidget.getByText('Stored snapshot. Not a live PayPal check.', { exact: true })).toBeVisible();
  const header = ['Invoice', 'Recorded status', 'Ageing', 'Outstanding USD', 'Due date (UTC)'];
  const current = ['Invoice 1', 'UNPAID', 'Current', '$1,200.00', before.invoices[0].dueDate];
  const overdue = ['Invoice 2', 'UNPAID', '1-30 days overdue', '$800.00', before.invoices[1].dueDate];
  const quoteRows = [['Change', 'Decision status', 'Approved quote USD'], ['Change 1', 'approved', '$300.01']];
  const chartRows = [['Ageing', 'Outstanding USD (chart only) (sum)'], ['Current', '1,200.00'], ['1-30 days overdue', '800.00']];
  const exported = await csv(page, invoice, 'Invoice balances _USD_.csv');
  expect(exported.rows).toEqual([header, current, overdue]);
  const quoteCsv = await csv(page, quotes, 'Change quotes _USD_.csv');
  expect(quoteCsv.rows).toEqual(quoteRows);
  const chartCsv = await csv(page, chartWidget, 'Outstanding invoices by age _USD_.csv');
  expect(chartCsv.rows).toEqual(chartRows);
  for (const text of [exported.text, quoteCsv.text, chartCsv.text]) {
    for (const privateValue of [before.clientToken, before.agreement.clientName, before.agreement.clientEmail,
      ...before.invoices.map((row: { id: string }) => row.id), ...before.proposals.map((row: { id: string }) => row.id)]) {
      if (privateValue) expect(text).not.toContain(privateValue);
    }
  }
  const chart = chartWidget.getByRole('figure', { name: 'chart, 1 series' });
  await chart.scrollIntoViewIfNeeded(); const bounds = (await chart.boundingBox())!;
  await chart.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.65 } });
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toHaveCount(0);
  expect((await csv(page, invoice, 'Invoice balances _USD_.csv')).rows).toEqual([header, overdue]);
  expect((await csv(page, quotes, 'Change quotes _USD_.csv')).rows).toEqual(quoteRows);
  expect((await csv(page, chartWidget, 'Outstanding invoices by age _USD_.csv')).rows).toEqual(chartRows);
  // The image is a real binary download, not a screenshot of the application.
  await chartWidget.locator('.ag-studio-layout-widget-focus-container').focus(); await chartWidget.hover();
  const imagePending = page.waitForEvent('download', { timeout: 10000 });
  await chartWidget.getByRole('button', { name: 'Download chart image', exact: true }).click();
  const image = await imagePending;
  expect(image.suggestedFilename()).toMatch(/\.png$/);
  expect(await image.failure()).toBeNull();
  const imagePath = test.info().outputPath('ageing-export.png'); await image.saveAs(imagePath);
  const png = await readFile(imagePath);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(600); expect(png.readUInt32BE(20)).toBe(300);
  await studio.getByRole('button', { name: 'Filters', exact: true }).click();
  await studio.getByRole('button', { name: 'Delete Filter', exact: true }).click();
  await expect(studio.getByRole('gridcell', { name: 'Invoice 1', exact: true })).toBeVisible();
  expect((await csv(page, invoice, 'Invoice balances _USD_.csv')).rows).toEqual([header, current, overdue]);
  await page.getByRole('button', { name: 'Edit report layout' }).click();
  await studio.getByRole('button', { name: 'Add Filter', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ageing', exact: true }).click();
  const filter = studio.getByRole('textbox', { name: 'Filter Value', exact: true }).first();
  await filter.fill('Current');
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toHaveCount(0);
  expect((await csv(page, invoice, 'Invoice balances _USD_.csv')).rows).toEqual([header, current]);
  expect((await csv(page, chartWidget, 'Outstanding invoices by age _USD_.csv')).rows).toEqual([chartRows[0], chartRows[1]]);
  expect((await csv(page, quotes, 'Change quotes _USD_.csv')).rows).toEqual(quoteRows);
  await filter.fill('No matching ageing bucket');
  await expect(studio.getByRole('gridcell', { name: /^Invoice [12]$/ })).toHaveCount(0);
  await invoice.locator('.ag-studio-layout-widget-focus-container').focus(); await invoice.hover();
  await expect(invoice.getByRole('button', { name: 'Export widget data', exact: true })).toHaveCount(0);
  expect((await csv(page, quotes, 'Change quotes _USD_.csv')).rows).toEqual(quoteRows);
  await studio.getByRole('heading', { name: 'Ageing', exact: true }).locator('..').getByRole('button', { name: 'Delete Filter', exact: true }).click();
  await expect(studio.getByRole('gridcell', { name: 'Invoice 2', exact: true })).toBeVisible();
  expect((await csv(page, invoice, 'Invoice balances _USD_.csv')).rows).toEqual([header, current, overdue]);
  expect(await (await request.get('/api/workspace')).json()).toEqual(before);
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});
