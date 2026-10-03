import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/workspace/route';
import { mutate, read, seed } from '../lib/store';

test('human scope review blocks included, ambiguous, stale, and changed paid-extra approvals', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH;
  const originalFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'demo'; process.env.NUDGE_DB_PATH = `./data/scope-review-${randomUUID()}.sqlite`;
  globalThis.fetch = async () => { throw new Error('Network forbidden'); };
  const invoke = (body: unknown) => POST(new NextRequest('http://localhost:3000/api/workspace', {
    method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));
  try {
    mutate(s => { Object.assign(s, seed()); s.agreementStatus = 'accepted'; s.proposals = [{ id: 'scope-test', request: 'Colour change and booking',
      analysis: { classification: 'additional', summary: 'Booking is excluded; colour change may be included.', references: ['S3'], questions: [], deliverables: ['Booking system'], source: 'simulation' },
      deliverables: ['Booking system'], amountCents: 0, status: 'draft' }]; });
    const original = structuredClone(read().proposals[0].analysis);
    const review = { type: 'reviewScope', id: 'scope-test', expectedReviewId: '', classification: 'included', rationale: 'The requested work is covered by the original scope.', references: ['S1'], clarification: '', deliverables: ['Booking system'] };
    const approve = (reviewId: string, deliverables = ['Booking system']) => invoke({ type: 'approveProposal', id: 'scope-test', reviewId, extrasConfirmed: true, amountCents: 30000, deliverables });
    assert.equal((await approve('forged')).status, 400);
    assert.equal((await invoke({ ...review, rationale: 'guess' })).status, 400);
    assert.equal((await invoke({ ...review, references: ['S99'] })).status, 400);
    assert.equal((await invoke(review)).status, 200);
    let id = read().proposals[0].scopeReview!.id;
    assert.equal((await approve(id)).status, 400);
    assert.equal((await invoke({ ...review, classification: 'additional' })).status, 400, 'stale review cannot overwrite');
    assert.equal((await invoke({ ...review, expectedReviewId: id, classification: 'ambiguous' })).status, 200);
    id = read().proposals[0].scopeReview!.id;
    assert.equal((await approve(id)).status, 400);
    assert.equal((await invoke({ ...review, expectedReviewId: id, classification: 'additional', references: [] })).status, 400);
    assert.equal((await invoke({ ...review, expectedReviewId: id, classification: 'additional', references: [],
      clarification: 'The owner clarified that a new booking system is requested beyond the five-page site.' })).status, 200);
    id = read().proposals[0].scopeReview!.id;
    assert.equal((await approve(id, ['Booking system', 'Included colour change'])).status, 400);
    assert.equal((await approve('stale')).status, 400);
    assert.equal((await approve(id)).status, 200);
    assert.deepEqual(read().proposals[0].analysis, original);
    assert.equal(read().proposals[0].amountCents, 30000);
    assert.equal((await invoke({ ...review, expectedReviewId: id })).status, 400, 'approved work is immutable');
    assert.equal((await invoke({ type: 'createInvoice', id: 'scope-test' })).status, 400, 'human review does not imply client acceptance');
    assert.equal((await invoke({ type: 'createInvoice', id: 'base' })).status, 200, 'base invoice is unaffected');
    assert.equal(read().invoices[0].amountCents, 120000);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
