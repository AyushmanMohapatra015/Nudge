import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';
import { POST as ownerPost } from '../app/api/workspace/route';
import { GET as clientGet, POST as clientPost } from '../app/api/client/[token]/route';
import { mutate, read, seed } from '../lib/store';
import QuoteExplanation from '../components/quote-explanation';

test('client explanation is owner-approved, clause-snapshotted and immutable without leaking private reviews', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH, oldFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'demo'; process.env.NUDGE_DB_PATH = `./data/quote-explanation-${randomUUID()}.sqlite`;
  let networkCalls = 0; globalThis.fetch = async () => { networkCalls++; throw Error('Network forbidden'); };
  const request = (body: unknown) => new NextRequest('http://localhost:3000/api/workspace', {
    method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const message = 'Booking is excluded from the original website scope. This quote covers the scheduling addition only.';
  try {
    mutate(s => {
      Object.assign(s, seed()); s.agreementStatus = 'accepted';
      s.proposals = [{ id: 'explained-change', request: 'Private client request', status: 'draft', amountCents: 0, deliverables: ['Appointment scheduling'],
        analysis: { classification: 'additional', summary: 'Private AI output for the owner.', references: ['S3'], questions: [], deliverables: ['Appointment scheduling'], source: 'simulation' },
        scopeReview: { id: 'review-1', classification: 'additional', rationale: 'Private rationale that must never be published automatically.', references: ['S3'], clarification: 'Private clarification', deliverables: ['Appointment scheduling'], reviewedAt: new Date().toISOString(), actor: 'You' },
      }];
    });
    const token = read().clientToken, context = { params: Promise.resolve({ token }) };
    const view = async () => (await clientGet(new NextRequest('http://localhost:3000/api/client/test'), context)).json();
    assert.deepEqual((await view()).proposals, []);
    const approval = { type: 'approveProposal', id: 'explained-change', reviewId: 'review-1', extrasConfirmed: true, amountCents: 30000, deliverables: ['Appointment scheduling'], clientMessage: message };
    for (const bad of ['', 'short', ' '.repeat(20), 'x'.repeat(801), { message }]) {
      assert.equal((await ownerPost(request({ ...approval, clientMessage: bad }))).status, 400);
      assert.equal(read().proposals[0].status, 'draft');
    }
    assert.equal((await ownerPost(request({ ...approval, reviewId: 'stale' }))).status, 400);
    const clause = structuredClone(read().agreement.clauses.find(c => c.id === 'S3')!);
    const analysis = structuredClone(read().proposals[0].analysis);
    assert.equal((await ownerPost(request({ ...approval, clientMessage: `  ${message}  `, clientExplanation: { references: [{ id: 'S99', text: 'Forged clause' }] } }))).status, 200);
    const expected = { message, references: [clause] };
    assert.deepEqual(read().proposals[0].clientExplanation, expected);
    assert.deepEqual(read().proposals[0].analysis, analysis);
    const client = await view();
    assert.deepEqual(client.proposals[0].clientExplanation, expected);
    for (const field of ['analysis', 'scopeReview', 'request']) assert.equal(field in client.proposals[0], false);
    assert.equal(JSON.stringify(client).includes('Private rationale'), false);
    assert.equal(JSON.stringify(client).includes('Private clarification'), false);
    assert.equal((await ownerPost(request({ ...approval, clientMessage: 'Replacement after approval' }))).status, 400);
    assert.equal((await ownerPost(request({ type: 'createInvoice', id: 'explained-change' }))).status, 400);
    assert.equal((await clientPost(request({ type: 'acceptProposal', id: 'explained-change', amountCents: 1, clientMessage: 'Client replacement', clientExplanation: { references: [] } }), context)).status, 200);
    assert.deepEqual(read().proposals[0].clientExplanation, expected);
    assert.equal(read().proposals[0].amountCents, 30000);
    assert.equal((await clientPost(request({ type: 'acceptProposal', id: 'explained-change' }), context)).status, 400);
    // Simulate future agreement data changing: approved evidence must not drift.
    mutate(s => { s.agreement.clauses.find(c => c.id === 'S3')!.text = 'Changed wording'; });
    assert.deepEqual((await view()).proposals[0].clientExplanation, expected);
    const html = renderToStaticMarkup(createElement(QuoteExplanation, { explanation: { message: '<script>window.fake=true</script>', references: [{ id: 'S3', text: '<img src=x onerror=alert(1)>' }] } }));
    assert.equal(html.includes('<script>'), false); assert.equal(html.includes('<img'), false);
    assert.ok(html.includes('&lt;script&gt;')); assert.ok(html.includes('&lt;img'));
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
