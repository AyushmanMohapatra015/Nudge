import { createHash } from 'node:crypto';

// Parsed-JSON digest is stable across Git line endings. Changes to requests,
// scripts, destinations or variables require a fresh review and digest update.
const reviewedDigest = '47f4fc86b3f756b5e414bb43c9eb7679af352e8cffcc55c92e62b1f85dc25192';
export function verifyReviewedCollection(collection) {
  if (createHash('sha256').update(JSON.stringify(collection)).digest('hex') !== reviewedDigest) throw Error('Collection differs from the reviewed read-only sandbox version. Stop and review before running.');
}

export function runPostmanChecks(newman, collection, credentials) {
  verifyReviewedCollection(collection);
  if (![credentials.clientId, credentials.clientSecret].every(value => typeof value === 'string' && value.trim() && value.length <= 1024) ||
      typeof credentials.invoiceId !== 'string' || !/^INV2-[A-Z0-9-]{1,90}$/.test(credentials.invoiceId)) throw Error('Configure sandbox credentials and an existing sandbox invoice privately.');
  return new Promise(resolve => {
    newman.run({ collection: structuredClone(collection),
      envVar: [{ key: 'paypal_client_id', value: credentials.clientId }, { key: 'paypal_client_secret', value: credentials.clientSecret }, { key: 'invoice_id', value: credentials.invoiceId }],
      reporters: [], iterationCount: 1, timeout: 90000, timeoutRequest: 20000, timeoutScript: 3000,
      bail: true, ignoreRedirects: true, insecure: false, insecureFileRead: false,
    }, (error, summary) => {
      const executions = summary?.run?.executions || [];
      const requests = executions.map((execution, index) => ({ step: index + 1, status: Number.isInteger(execution.response?.code) ? execution.response.code : null }));
      const assertions = summary?.run?.stats?.assertions;
      const total = Number.isSafeInteger(assertions?.total) ? assertions.total : 0;
      const failed = Number.isSafeInteger(assertions?.failed) ? assertions.failed : 0;
      const success = !error && summary?.run?.failures?.length === 0 && requests.length === 3 && requests.every(request => request.status === 200) && total === 4 && failed === 0;
      // Deliberately omit SDK errors, URLs, headers, bodies, IDs and variables.
      resolve({ tool: 'Postman Newman', environment: 'PayPal sandbox', requests, assertions: total, failedAssertions: failed, success });
    });
  });
}
