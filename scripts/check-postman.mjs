import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runPostmanChecks, verifyReviewedCollection } from './postman-runner.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== '--use-existing-fixture')) throw Error('Use no arguments or --use-existing-fixture.');
  const collection = JSON.parse(readFileSync(new URL('../postman/nudge-sandbox.postman_collection.json', import.meta.url), 'utf8'));
  verifyReviewedCollection(collection);
  let invoiceId = process.env.POSTMAN_INVOICE_ID;
  if (args.length) {
    const file = new URL('../data/fresh-payment-webhook-session.json', import.meta.url);
    if (statSync(file).size > 16384) throw Error('Fixture is too large.');
    const fixture = JSON.parse(readFileSync(file, 'utf8'));
    if (fixture.environment !== 'sandbox') throw Error('Sandbox fixture required.');
    invoiceId = fixture.invoiceId;
  }
  // Tool installation is isolated under ignored data; no app dependency added.
  const require = createRequire(import.meta.url);
  const newman = require('../data/postman-runner/node_modules/newman');
  if (require('../data/postman-runner/node_modules/newman/package.json').version !== '6.2.1') throw Error('Reviewed Newman version required.');
  const result = await runPostmanChecks(newman, collection, { clientId: process.env.PAYPAL_CLIENT_ID, clientSecret: process.env.PAYPAL_CLIENT_SECRET, invoiceId });
  console.log(JSON.stringify(result, null, 2));
  console.log('Only sandbox OAuth and invoice GET requests. No workspace write, financial action, AI call or raw report export.');
  if (!result.success) process.exitCode = 1;
} catch {
  console.error('Read-only Postman check stopped. Verify the reviewed collection, local Newman installation, sandbox configuration and invoice fixture privately. No raw errors or credentials are printed.');
  process.exitCode = 1;
}
