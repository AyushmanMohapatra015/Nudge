import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceFindings, sensitivePath } from '../scripts/check-public-source.mjs';

test('public-source review reports locations without exposing detected values and recognizes excluded private paths', () => {
  const token = ['gh', 'p_', 'a'.repeat(30)].join('');
  const licence = ['[TRIAL]', '_this_', 'fictional_licence'].join('');
  const buyer = ['sb-', 'fictional123', '@personal.example.com'].join('');
  const clientUrl = 'https://fictional.example/client/' + ['12345678', '1234', '1234', '1234', '123456789012'].join('-');
  const text = [token, licence, buyer, clientUrl].join('\n');
  const findings = sourceFindings('fixture.txt', text);
  assert.deepEqual(findings.map((f: { category: string }) => f.category), ['provider-token', 'embedded-licence', 'sandbox-account', 'private-client-url']);
  const serialized = JSON.stringify(findings);
  for (const value of [token, licence, buyer, clientUrl]) assert.equal(serialized.includes(value), false);
  assert.deepEqual(findings.map((f: { line: number }) => f.line), [1, 2, 3, 4]);
  const rotated = 'https://fictional.example/client/' + 'a'.repeat(48);
  assert.equal(sourceFindings('fixture.txt', rotated)[0].category, 'private-client-url');
  assert.equal(JSON.stringify(sourceFindings('fixture.txt', rotated)).includes(rotated), false);
  const sandboxPayUrl = ['https://www.sandbox.paypal.com', '/invoice/p/', '#FICTIONAL'].join('');
  assert.equal(sourceFindings('fixture.txt', sandboxPayUrl)[0].category, 'sandbox-payment-url');
  const invoiceId = ['INV2', 'AB12', 'CD34', 'EF56', 'GH78'].join('-');
  assert.equal(sourceFindings('fixture.txt', invoiceId)[0].category, 'operational-invoice-id');
  for (const path of ['.env.local', 'data/output.json', 'data/workspace.sqlite', '.next/cache.txt', 'nested/secret.pem']) assert.equal(sensitivePath(path), true);
  for (const path of ['.env.example', 'lib/ai.ts', 'README.md']) assert.equal(sensitivePath(path), false);
});

test('example credentials must be empty, while normal configuration and fictional fixture names are allowed', () => {
  assert.deepEqual(sourceFindings('.env.example', 'ELASTIC_API_KEY=\nNUDGE_AI_PROVIDER=elastic\nNUDGE_AI_ENABLED=false\nNUDGE_DB_PATH=./data/nudge.sqlite'), []);
  assert.equal(sourceFindings('.env.example', 'ELASTIC_API_KEY=fictional-nonempty').length, 1);
  assert.equal(sourceFindings('.env.example', 'NUDGE_SANDBOX_REFERENCE_INVOICE_ID=INV2-FICTIONAL-REFERENCE').length, 1);
  assert.deepEqual(sourceFindings('test.ts', "const key = 'mock-key'; const buyer = 'buyer@example.com';"), []);
  const fictionalBuyer = ['sb-', 'fictional', '@personal.example.com'].join('');
  assert.deepEqual(sourceFindings('fixture.ts', fictionalBuyer), []);
});
