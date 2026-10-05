// Read-only, injectable boundary. Never returns credentials or response bodies.
export async function checkSandboxConnectivity(config, forward = fetch) {
  const { clientId, clientSecret, merchantEmail } = config;
  if (![clientId, clientSecret, merchantEmail].every(value => typeof value === 'string' && value.trim())) return { success: false, message: 'Fill PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_MERCHANT_EMAIL locally.' };
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(merchantEmail)) return { success: false, message: 'PAYPAL_MERCHANT_EMAIL must contain only the sandbox business email.' };
  const base = 'https://api-m.sandbox.paypal.com';
  try {
    const response = await forward(`${base}/v1/oauth2/token`, {
      method: 'POST', redirect: 'error', cache: 'no-store',
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials', signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return { success: false, message: `Sandbox authentication failed (${response.status}). Check sandbox app access.` };
    const auth = await response.json();
    if (typeof auth?.access_token !== 'string' || !auth.access_token.trim()) return { success: false, message: 'Invalid sandbox authentication response.' };
    const invoices = await forward(`${base}/v2/invoicing/invoices?page=1&page_size=1&total_required=true`, {
      method: 'GET', redirect: 'error', cache: 'no-store',
      headers: { Authorization: `Bearer ${auth.access_token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(20000),
    });
    if (!invoices.ok) return { success: false, message: `Invoicing access failed (${invoices.status}). Check sandbox Invoicing access.` };
    return { success: true, message: 'PASS: PayPal sandbox authentication and Invoicing API access. No invoice created, sent or paid.' };
  } catch { return { success: false, message: 'Sandbox connectivity check failed or timed out. Check local configuration and connectivity; no financial action was attempted.' }; }
}
