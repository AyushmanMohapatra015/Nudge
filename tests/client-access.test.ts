import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/client/[token]/route';
import { mutate, read, seed } from '../lib/store';

test('private client API hides owner records and enforces current links and one-time decisions', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH;
  process.env.NUDGE_MODE = 'demo';
  process.env.NUDGE_DB_PATH = `./data/client-access-${randomUUID()}.sqlite`;
  const context = (token: string) => ({ params: Promise.resolve({ token }) });
  const request = (body: unknown, origin = 'http://localhost:3000') => new NextRequest('http://localhost:3000/api/client/test', {
    method: 'POST', headers: { host: 'localhost:3000', origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    mutate(s => {
      Object.assign(s, seed());
      s.proposals = [{ id: 'private-draft', request: 'Owner-only notes', amountCents: 0, deliverables: ['Unreviewed work'], status: 'draft',
        analysis: { classification: 'ambiguous', summary: 'Private analysis for owner review.', references: [], questions: [], deliverables: ['Unreviewed work'], source: 'simulation' } }];
      s.invoices = [{ id: 'private-invoice', proposalId: 'base', status: 'DRAFT', amountCents: 10000, outstandingCents: 10000,
        dueDate: '2026-11-01', createdAt: new Date().toISOString(), reminders: 0 }];
    });
    const token = read().clientToken;
    const get = () => GET(new NextRequest('http://localhost:3000/api/client/test'), context(token));
    assert.equal((await GET(new NextRequest('http://localhost:3000/api/client/invalid'), context('invalid'))).status, 404);
    assert.equal((await POST(request({ type: 'acceptAgreement' }), context('invalid'))).status, 404);
    let response = await get();
    const view = await response.json();
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(view.agreement, null);
    assert.deepEqual(view.proposals, []);
    assert.deepEqual(view.invoices, []);
    for (const field of ['clientToken', 'audit', 'policies', 'processing', 'integrationError', 'reminderDraft']) assert.equal(field in view, false);
    assert.equal((await POST(request({ type: 'acceptAgreement' }), context(token))).status, 400);
    assert.equal((await POST(request({ type: 'acceptProposal', id: 'private-draft' }), context(token))).status, 400);
    assert.equal((await POST(request({ type: 'sendInvoice', id: 'private-invoice' }), context(token))).status, 400);
    assert.equal((await POST(request({ type: 'acceptAgreement' }, 'https://untrusted.example'), context(token))).status, 403);
    mutate(s => { s.agreementStatus = 'approved'; });
    response = await POST(request({ type: 'acceptAgreement' }), context(token));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const acceptedAt = read().agreementAcceptedAt;
    const auditCount = read().audit.length;
    assert.equal((await POST(request({ type: 'acceptAgreement' }), context(token))).status, 400);
    assert.equal(read().agreementAcceptedAt, acceptedAt);
    assert.equal(read().audit.length, auditCount);

    mutate(s => { s.proposals[0].status = 'approved'; s.proposals[0].amountCents = 25000; });
    assert.equal((await POST(request({ type: 'acceptProposal', id: 'private-draft', amountCents: 1 }), context(token))).status, 200);
    assert.equal(read().proposals[0].amountCents, 25000);
    assert.equal((await POST(request({ type: 'declineProposal', id: 'private-draft' }), context(token))).status, 400);
    assert.equal(read().proposals[0].status, 'accepted');

    mutate(s => { s.agreementStatus = 'approved'; });
    const stale = request({ type: 'acceptAgreement' });
    const staleReader = stale.body!.getReader(); let changed = false;
    Object.defineProperty(stale, 'body', { value: { getReader: () => ({
      read: async () => { if (!changed) { changed = true; mutate(s => { s.clientToken = randomUUID(); }); } return staleReader.read(); },
      cancel: () => staleReader.cancel(), releaseLock: () => staleReader.releaseLock(),
    }) } });
    response = await POST(stale, context(token));
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /no longer valid/);
    assert.equal(read().agreementStatus, 'approved');
    assert.equal((await get()).status, 404);
  } finally {
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
