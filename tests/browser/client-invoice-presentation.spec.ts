import { test, expect, type Page } from '@playwright/test';
import { clientInvoicePresentation } from '../../lib/client-invoice-presentation';

const receipt = 'Change accepted. No payment was taken by this acceptance.';
const payLabel = 'Pay securely on PayPal sandbox';
const payUrl = 'https://example.invalid/fictional-payment';
const proposals = [
  { id: 'fictional-change-a', deliverables: ['Fictional extra page'], amountCents: 30000, status: 'accepted' },
  { id: 'fictional-change-b', deliverables: ['Fictional extra illustration'], amountCents: 12000, status: 'accepted' },
];
const cases = [
  { id: 'fictional-unpaid', status: 'UNPAID', outstandingCents: 30000, label: 'Payment due', caption: 'Remaining of', balance: '$300.00', eligible: true },
  { id: 'fictional-partial', status: 'PARTIALLY_PAID', outstandingCents: 7500, label: 'Partially paid', caption: 'Remaining of', balance: '$75.00', eligible: true },
  { id: 'fictional-paid', status: 'PAID', outstandingCents: 0, label: 'Settled', caption: 'Balance of', balance: '$0.00', eligible: false },
  { id: 'fictional-cancelled', status: 'CANCELLED', outstandingCents: 0, label: 'Cancelled', caption: 'Reported balance of', balance: '$0.00', eligible: false },
  { id: 'fictional-other-zero', status: 'OTHER', outstandingCents: 0, label: 'Needs confirmation', caption: 'Reported balance of', balance: '$0.00', eligible: false },
  { id: 'fictional-other-positive', status: 'OTHER', outstandingCents: 30000, label: 'Needs confirmation', caption: 'Reported balance of', balance: '$300.00', eligible: false },
  { id: 'fictional-unsupported', status: 'FUTURE_STATUS', outstandingCents: 0, label: 'Needs confirmation', caption: 'Reported balance of', balance: '$0.00', eligible: false },
  // Defensive fixtures only; the real client projection filters DRAFT out.
  { id: 'fictional-draft', status: 'DRAFT', outstandingCents: 0, label: 'Needs confirmation', caption: 'Reported balance of', balance: '$0.00', eligible: false },
  { id: 'fictional-unpaid-zero', status: 'UNPAID', outstandingCents: 0, label: 'Payment due', caption: 'Remaining of', balance: '$0.00', eligible: true },
];
const invoice = (entry: typeof cases[number], withLink = true) => ({
  id: entry.id,
  status: entry.status,
  amountCents: 30000,
  outstandingCents: entry.outstandingCents,
  ...(withLink ? { payUrl } : {}),
});
const fixture = (mode: 'demo' | 'sandbox', invoices: ReturnType<typeof invoice>[]) => ({
  mode, agreement: null, agreementStatus: 'draft', proposals, invoices,
});
const invoiceCard = (page: Page, id: string) => page.locator('section.client-card')
  .filter({ has: page.locator('.invoice-id', { hasText: new RegExp(`^${id}$`) }) });

test('presentation is deterministic and does not mutate its frozen source fixture', () => {
  const source = Object.freeze({ status: 'OTHER', amountCents: 30000, outstandingCents: 0, payUrl });
  const before = JSON.stringify(source);
  const first = clientInvoicePresentation(source.status, 'sandbox');
  first.label = 'Fictional caller edit';
  expect(clientInvoicePresentation(source.status, 'sandbox')).toEqual({
    label: 'Needs confirmation',
    balanceCaption: 'Reported balance of',
    message: 'Contact your designer to confirm the current invoice status.',
  });
  expect(JSON.stringify(source)).toBe(before);
});

for (const mode of ['demo', 'sandbox'] as const) {
  test(`${mode}: server status controls wording and existing link eligibility`, async ({ page }) => {
    const data = fixture(mode, cases.map(entry => invoice(entry)));
    const before = JSON.stringify(data);
    const methods: string[] = [];
    await page.route('**/api/client/*', async route => {
      methods.push(route.request().method());
      await route.fulfill({ json: data });
    });
    await page.goto('/client/fictional-presentation');
    for (const entry of cases) {
      const card = invoiceCard(page, entry.id);
      await expect(card.locator('.badge')).toHaveText(entry.label);
      await expect(card.locator('.client-price')).toHaveText(
        `${entry.balance} USD · ${entry.caption} $300.00`,
      );
      const link = card.getByRole('link', { name: payLabel });
      await expect(link).toHaveCount(entry.eligible ? 1 : 0);
      if (entry.eligible) {
        await expect(link).toHaveAttribute('href', payUrl);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noreferrer');
      } else if (entry.status === 'PAID') {
        await expect(card).toContainText('Thank you. This invoice is settled.');
      } else if (entry.status === 'CANCELLED') {
        await expect(card).toContainText('This invoice is cancelled.');
        await expect(card).not.toContainText(/payment link|simulate its payment|refund/i);
      } else {
        await expect(card).toContainText('Contact your designer to confirm the current invoice status.');
        await expect(card).not.toContainText(/settled|payment link|simulate its payment/i);
      }
    }
    await expect(page.getByText(receipt, { exact: true })).toHaveCount(2);
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every(method => method === 'GET')).toBe(true);
    expect(JSON.stringify(data)).toBe(before);
  });

  test(`${mode}: eligible invoices without URLs keep their existing fallback`, async ({ page }) => {
    await page.route('**/api/client/*', route => route.fulfill({
      json: fixture(mode, cases.slice(0, 2).map(entry => invoice(entry, false))),
    }));
    await page.goto('/client/fictional-no-payment-url');
    await expect(page.getByRole('link', { name: payLabel })).toHaveCount(0);
    const message = mode === 'demo'
      ? 'This invoice is simulated. Your designer can simulate its payment in the workspace.'
      : 'Your invoice status is shown above. Contact your designer if you need a payment link.';
    for (const entry of cases.slice(0, 2)) {
      await expect(invoiceCard(page, entry.id)).toContainText(message);
    }
  });
}

test('neutral receipts survive polling without pairing proposals and invoices or moving focus', async ({ page }) => {
  let data = fixture('sandbox', []);
  let reads = 0;
  let posts = 0;
  await page.route('**/api/client/*', route => {
    reads++;
    if (route.request().method() === 'POST') posts++;
    return route.fulfill({ json: data });
  });
  await page.goto('/client/fictional-neutral-receipts');
  await expect(page.getByText(receipt, { exact: true })).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Your invoice', exact: true })).toHaveCount(0);
  const heading = page.getByRole('heading', { level: 1 });
  await heading.focus();
  const previousReads = reads;
  data = fixture('sandbox', [invoice(cases[2])]);
  await expect.poll(() => reads, { timeout: 12000 }).toBeGreaterThan(previousReads);
  await expect(invoiceCard(page, cases[2].id)).toContainText('Thank you. This invoice is settled.');
  await expect(page.getByText(receipt, { exact: true })).toHaveCount(2);
  await expect(heading).toBeFocused();
  data = fixture('sandbox', [invoice(cases[1]), invoice(cases[2])]);
  await expect(invoiceCard(page, cases[1].id)).toBeVisible({ timeout: 12000 });
  await expect(page.getByText(receipt, { exact: true })).toHaveCount(2);
  expect(posts).toBe(0);
});

test('320px invoice layout retains native keyboard payment link', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route('**/api/client/*', route => route.fulfill({
    json: fixture('sandbox', [invoice(cases[1])]),
  }));
  await page.goto('/client/fictional-small-screen');
  const link = page.getByRole('link', { name: payLabel });
  await expect(link).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your invoice', exact: true })).toBeVisible();
  await page.getByRole('heading', { level: 1 }).focus();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute('href', payUrl);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('client-invoice-320px.png'), fullPage: true });
});
