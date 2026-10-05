import { checkSandboxConnectivity } from './paypal-connectivity.mjs';

const result = await checkSandboxConnectivity({ clientId: process.env.PAYPAL_CLIENT_ID, clientSecret: process.env.PAYPAL_CLIENT_SECRET, merchantEmail: process.env.PAYPAL_MERCHANT_EMAIL });
if (result.success) console.log(result.message);
else { console.error(result.message); process.exitCode = 1; }
