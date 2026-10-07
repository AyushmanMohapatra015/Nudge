import { test, expect } from '@playwright/test';

for (const forcedColors of [false, true]) {
  test(`quote explanations reflow and support keyboard review${forcedColors ? ' in forced colors' : ''}`, async ({ page, request, context }) => {
    expect((await request.post('/api/workspace', { data: { type: 'reset' } })).ok()).toBe(true);
    expect((await request.post('/api/workspace', { data: { type: 'approveAgreement' } })).ok()).toBe(true);
    let state = await (await request.get('/api/workspace')).json();
    expect((await request.post(`/api/client/${state.clientToken}`, { data: { type: 'acceptAgreement' } })).ok()).toBe(true);
    expect((await request.post('/api/workspace', { data: { type: 'analyze', request: 'Add appointment booking with time slots.' } })).ok()).toBe(true);
    state = await (await request.get('/api/workspace')).json();
    const proposal = state.proposals[0];
    expect((await request.post('/api/workspace', { data: {
      type: 'reviewScope', id: proposal.id, expectedReviewId: '', classification: 'additional',
      rationale: 'Appointment booking is excluded by the approved agreement.', references: ['S3'], clarification: '', deliverables: proposal.deliverables,
    } })).ok()).toBe(true);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ forcedColors: forcedColors ? 'active' : 'none', reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Good work deserves to get paid.' })).toBeVisible();
    const editor = page.getByRole('textbox', { name: 'Explanation for your client (optional)' });
    await expect(editor).toBeEnabled();
    await page.getByPlaceholder('e.g. 300.00').fill('300.00');
    await editor.focus(); await page.keyboard.type('short');
    await expect(page.getByRole('status').filter({ hasText: 'Use at least 10 characters' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve proposal', exact: true })).toBeDisabled();
    const message = 'Booking is excluded from the original agreement.\n' + 'LongFictionalReference'.repeat(7) + '\nThis quote covers appointment scheduling only.';
    await page.keyboard.press('Control+A'); await page.keyboard.insertText(message);
    await expect(page.locator('.quote-explanation .quote-message')).toHaveText(message);
    await page.keyboard.press('Tab');
    const ownerSummary = page.getByText('Supporting agreement clauses', { exact: true });
    await expect(ownerSummary).toBeFocused();
    await expect(ownerSummary).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page.locator('.quote-explanation .reference')).toContainText('S3');
    for (const width of [320, 640]) {
      await page.setViewportSize({ width, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.getByLabel('This quote contains only reviewed additional work.').focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Approve proposal', exact: true })).toBeEnabled();
    // Editing the message requires a fresh confirmation before publication.
    await editor.focus(); await page.keyboard.press('End'); await page.keyboard.insertText(' Reviewed.');
    await expect(page.getByLabel('This quote contains only reviewed additional work.')).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Approve proposal', exact: true })).toBeDisabled();
    await editor.fill(message);
    await page.getByLabel('This quote contains only reviewed additional work.').focus(); await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Approve proposal', exact: true }).focus(); await page.keyboard.press('Enter');
    await expect(page.getByText('Waiting for client acceptance', { exact: true })).toBeVisible();

    const client = await context.newPage();
    await client.setViewportSize({ width: 320, height: 800 });
    await client.emulateMedia({ forcedColors: forcedColors ? 'active' : 'none', reducedMotion: 'reduce' });
    await client.goto(`/client/${state.clientToken}`);
    await expect(client.getByRole('heading', { name: 'Why this is additional work' })).toBeVisible();
    await expect(client.locator('.quote-message')).toHaveText(message);
    const clientSummary = client.getByText('Supporting agreement clauses', { exact: true });
    await clientSummary.focus(); await client.keyboard.press('Enter');
    await expect(client.locator('.quote-explanation .reference')).toContainText('Booking systems');
    await expect(clientSummary).toHaveCSS('outline-style', 'solid');
    expect(await client.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(forcedColors);
    for (const width of [320, 640]) {
      await client.setViewportSize({ width, height: 800 });
      expect(await client.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await client.setViewportSize({ width: 320, height: 800 });
    await clientSummary.focus(); await client.keyboard.press('Space');
    await expect(client.locator('.quote-explanation .reference')).not.toBeVisible();
    await client.keyboard.press('Space');
    await expect(client.locator('.quote-explanation .reference')).toBeVisible();
    await client.screenshot({ path: test.info().outputPath('client-explanation.png'), fullPage: true });
    await client.getByRole('button', { name: 'Accept work & price', exact: true }).focus(); await client.keyboard.press('Enter');
    await expect(client.getByText('Change accepted. Your designer can now prepare an invoice.', { exact: true })).toBeVisible();
    await expect(client.getByRole('heading', { level: 1, name: state.agreement.title, exact: true })).toBeFocused();
    const accepted = await (await request.get('/api/workspace')).json();
    expect(accepted.proposals[0].status).toBe('accepted'); expect(accepted.proposals[0].amountCents).toBe(30000);
    expect(accepted.proposals[0].clientExplanation.message).toBe(message); expect(accepted.invoices).toHaveLength(0);
    await client.close();
  });
}
