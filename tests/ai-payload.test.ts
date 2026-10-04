import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scopeAiPayload } from '../lib/ai-payload';
import type { Agreement } from '../lib/domain';

test('scope provider payload allowlists evidence and excludes nested runtime metadata without claiming text redaction', () => {
  const agreement = { title: 'Fictional project', clientName: 'Private contact', clientEmail: 'contact@example.com', amountCents: 120000,
    privateNote: 'owner-only', clauses: [{ id: 'S1', text: 'Contact example@example.com for supplied copy.', privateNote: 'do not transmit' }] };
  const request = 'Please add booking for example@example.com.';
  const payload = scopeAiPayload(request, agreement as Agreement);
  assert.deepEqual(payload, { approvedAgreement: { title: agreement.title, clauses: [{ id: 'S1', text: agreement.clauses[0].text }] }, clientRequest: request });
  assert.equal(JSON.stringify(payload).includes('owner-only'), false);
  assert.equal(JSON.stringify(payload).includes('do not transmit'), false);
  assert.ok(JSON.stringify(payload).includes('example@example.com'));
});
