// Read-only sandbox connectivity check. Never prints credentials or access tokens.
const required = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_EMAIL'];
const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Fill these fields in .env.local first: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  try {
    const base = 'https://api-m.sandbox.paypal.com';
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials', signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Sandbox authentication failed (${response.status}). Check that both credentials belong to the same sandbox app.`);
    const auth = await response.json();
    if (!auth.access_token) throw new Error('PayPal did not return a sandbox access token.');
    console.log('PASS: PayPal sandbox authentication.');
    const invoices = await fetch(`${base}/v2/invoicing/invoices?page=1&page_size=1&total_required=true`, {
      headers: { Authorization: `Bearer ${auth.access_token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(20000),
    });
    if (!invoices.ok) throw new Error(`Invoicing access failed (${invoices.status}). Confirm Invoicing is enabled for this sandbox business account.`);
    console.log('PASS: PayPal sandbox Invoicing API access.');
    console.log('No invoice was created, sent, or paid. Next: use the workspace with your separate sandbox buyer account.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Sandbox connectivity check failed.');
    process.exitCode = 1;
  }
}
