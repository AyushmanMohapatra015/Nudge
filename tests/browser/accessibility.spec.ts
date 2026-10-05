import { test, expect } from '@playwright/test';

test('agreement save rejection and connection failure preserve every edit until successful retry', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  const original = await (await request.get('/api/workspace')).json();
  await page.goto('/');
  await page.getByRole('button', { name: 'My project', exact: true }).click();
  await page.getByRole('button', { name: 'Edit agreement' }).click();
  const values = { title: 'Fictional recovery project', name: 'Fictional buyer', email: 'fictional-recovery@example.com', price: '456.78', clauses: 'Three informational pages are included.\nBooking systems are excluded.' };
  await page.getByLabel('Project name', { exact: true }).fill(values.title);
  await page.getByLabel('Client name', { exact: true }).fill(values.name);
  await page.getByLabel('Client email', { exact: true }).fill(values.email);
  await page.getByLabel('Project price (USD)', { exact: true }).fill(values.price);
  await page.getByRole('textbox', { name: 'Scope clauses (one per line; at least two)', exact: true }).fill(values.clauses);
  let attempt = 0;
  let release: (() => void) | undefined;
  await page.route('**/api/workspace', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    attempt++;
    if (attempt === 1) {
      await new Promise<void>(resolve => { release = resolve; });
      return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Fictional validation failure. Review your agreement.' }) });
    }
    if (attempt === 2) return route.abort('failed');
    return route.continue();
  });
  const pendingClick = page.getByRole('button', { name: 'Save agreement' }).click();
  await expect(page.getByLabel('Project name', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled();
  await expect.poll(() => Boolean(release)).toBe(true);
  release!();
  await pendingClick;
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Fictional validation failure.');
  for (const failure of [1, 2]) {
    if (failure === 2) { await page.getByRole('button', { name: 'Save agreement' }).click(); await expect(page.getByRole('main').getByRole('alert')).toBeVisible(); }
    await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(values.title);
    await expect(page.getByLabel('Client name', { exact: true })).toHaveValue(values.name);
    await expect(page.getByLabel('Client email', { exact: true })).toHaveValue(values.email);
    await expect(page.getByLabel('Project price (USD)', { exact: true })).toHaveValue(values.price);
    await expect(page.getByRole('textbox', { name: 'Scope clauses (one per line; at least two)', exact: true })).toHaveValue(values.clauses);
    const unchanged = await (await request.get('/api/workspace')).json();
    expect(unchanged.agreement).toEqual(original.agreement);
    expect(unchanged.agreementStatus).toBe('draft');
  }
  await page.getByRole('button', { name: 'Save agreement' }).click();
  await expect(page.getByRole('heading', { name: 'Make the agreement yours.' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: values.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One agreement. A clear way forward.' })).toBeFocused();
  const saved = await (await request.get('/api/workspace')).json();
  expect(saved.agreement.amountCents).toBe(45678);
  expect(saved.agreementStatus).toBe('draft');
  expect(saved.invoices).toHaveLength(0);
  expect(attempt).toBe(3);
});

// Solid-color rendered text check; not a substitute for a full accessibility scanner.
async function contrastFailures(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rgb = (value: string) => value.match(/[\d.]+/g)?.map(Number) || [];
    const luminance = (values: number[]) => values.slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const failures: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      if (!Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) || !element.getClientRects().length || element.closest('button:disabled,input:disabled,textarea:disabled,select:disabled,svg')) continue;
      const style = getComputedStyle(element);
      if (style.visibility !== 'visible') continue;
      let background = [255, 255, 255];
      for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
        const candidate = rgb(getComputedStyle(ancestor).backgroundColor);
        if (candidate.length === 3 || candidate[3] === 1) { background = candidate; break; }
      }
      const foreground = rgb(style.color);
      const a = luminance(foreground), b = luminance(background);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      if (ratio < 4.5) failures.push(`${element.tagName}.${element.className}: ${ratio.toFixed(2)}`);
    }
    return failures;
  });
}

test('rendered owner and client text meets the solid-color contrast check', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/');
  for (const name of ['Overview', 'My project', 'Approvals', 'Payments', 'Activity', 'Agent rules']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect(await contrastFailures(page), name).toEqual([]);
  }
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  await page.goto(`/client/${state.clientToken}`);
  await expect(page.getByRole('heading', { name: 'Your project scope' })).toBeVisible();
  expect(await contrastFailures(page)).toEqual([]);
});

test('keyboard users can skip navigation and reach the owner content', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/');
  const skip = page.getByRole('link', { name: 'Skip to workspace content' });
  await expect(skip).toBeAttached();
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#workspace-content')).toBeFocused();
  await page.getByRole('button', { name: 'My project', exact: true }).focus();
  await expect(page.getByRole('button', { name: 'My project', exact: true })).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'One agreement. A clear way forward.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One agreement. A clear way forward.' })).toBeFocused();
});

test('owner views and forms reflow at narrow and half-width zoom-equivalent sizes with named fields', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/');
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['Overview', 'My project', 'Approvals', 'Payments', 'Activity', 'Agent rules']) {
      await page.getByRole('button', { name, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflow at ${width}`).toBe(true);
      const unnamed = await page.locator('input,textarea,select').evaluateAll(elements => elements.filter(element => !element.getAttribute('aria-label') && !(element as HTMLInputElement).labels?.length).map(element => element.tagName));
      expect(unnamed, `${name} fields`).toEqual([]);
    }
    await page.getByRole('button', { name: 'My project', exact: true }).click();
    await page.getByRole('button', { name: 'Edit agreement' }).click();
    await expect(page.getByLabel('Project name', { exact: true })).toBeFocused();
    await expect(page.getByLabel('Client email', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'One agreement. A clear way forward.' })).toBeFocused();
    if (width === 320) await page.screenshot({ path: test.info().outputPath('owner-mobile.png'), fullPage: true });
  }
});

test('reminder editor has a label and disappearing approval returns focus to heading', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'seedOverdue' } });
  await page.goto('/');
  await page.getByRole('button', { name: 'Payments', exact: true }).click();
  await page.getByRole('button', { name: 'Draft reminder', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Reminder message', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'From agreed to paid.' })).toBeFocused();
});

test('client reflow, reduced motion, invalid-link alert and keyboard acceptance remain accessible', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/client/${state.clientToken}`);
  await expect(page.getByRole('heading', { name: 'Your project scope' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('client-mobile.png'), fullPage: true });
  await page.getByRole('checkbox').focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Accept project scope' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.getByText(/Scope accepted/)).toBeVisible();
  await page.goto('/client/invalid-fictional-link');
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('failed owner approval is announced and leaves scope unapproved', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Approve scope' })).toBeVisible();
  await page.route('**/api/workspace', route => route.request().method() === 'POST' ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary fictional action failure. Retry after checking status.' }) }) : route.continue());
  await page.getByRole('button', { name: 'Approve scope' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Temporary fictional action failure.');
  expect((await (await request.get('/api/workspace')).json()).agreementStatus).toBe('draft');
  await expect(page.getByRole('button', { name: 'Approve scope' })).toBeEnabled();
});

test('client load failure is announced and a keyboard retry recovers without accepting work', async ({ page, request }) => {
  await request.post('/api/workspace', { data: { type: 'reset' } });
  await request.post('/api/workspace', { data: { type: 'approveAgreement' } });
  const state = await (await request.get('/api/workspace')).json();
  let failed = true;
  await page.route('**/api/client/*', route => failed ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary fictional connection failure.' }) }) : route.continue());
  await page.goto(`/client/${state.clientToken}`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Temporary fictional connection failure.');
  const retry = page.getByRole('button', { name: 'Try again' });
  failed = false;
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your project scope' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept project scope' })).toBeDisabled();
  const after = await (await request.get('/api/workspace')).json();
  expect(after.agreementStatus).toBe('approved');
});
