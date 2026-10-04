import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/workspace/route';
import { read, mutate } from '../lib/store';

test('brief staging and review preserve evidence and reject incomplete, stale, repeated and locked applications', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH, originalFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'demo'; process.env.NUDGE_DB_PATH = `./data/brief-review-${randomUUID()}.sqlite`;
  globalThis.fetch = async () => { throw new Error('Network forbidden'); };
  const invoke = (body: unknown) => POST(new NextRequest('http://localhost:3000/api/workspace', { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  const candidate = { title: null, suggestedTitle: false, clientName: null, clientEmail: null, amountCents: null, currency: null, clauses: [], evidence: [], unresolved: [{ field: 'paymentTerms', kind: 'unsupported', question: 'Should the deposit be removed from this prototype agreement?' }] };
  const stage = () => invoke({ type: 'stageBrief', expectedVersion: read().version, notes: 'Fictional website brief with a deposit request.', candidate });
  try {
    const original = structuredClone(read().agreement);
    assert.equal((await stage()).status, 200);
    assert.deepEqual(read().agreement, original);
    const id = read().briefDraft!.id;
    const apply = { type: 'applyBrief', id, confirmed: true, currency: 'USD', note: 'I checked all details and explicitly confirmed the USD price.', agreement: { ...original, title: 'Reviewed website project' }, resolutions: [{ issueIndex: 0, explanation: 'The fictional client agreed to one full invoice instead of a deposit.' }] };
    assert.equal((await invoke({ ...apply, confirmed: false })).status, 400);
    assert.equal((await invoke({ ...apply, resolutions: [] })).status, 400);
    assert.equal((await invoke({ ...apply, resolutions: [...apply.resolutions, ...apply.resolutions] })).status, 400);
    assert.equal((await invoke({ ...apply, agreement: { ...original, clauses: [] } })).status, 400);
    mutate(s => { s.agreement.title = 'Another saved draft'; });
    assert.equal((await invoke(apply)).status, 400);
    assert.equal((await stage()).status, 200);
    assert.equal((await invoke(apply)).status, 400, 'replaced candidate cannot be applied');
    const current = { ...apply, id: read().briefDraft!.id };
    assert.equal((await invoke(current)).status, 200);
    assert.equal(read().agreementStatus, 'draft');
    assert.deepEqual(read().briefDraft!.candidate, candidate);
    assert.deepEqual(read().briefDraft!.review!.agreement, current.agreement);
    assert.equal(read().briefDraft!.source, 'manual');
    assert.equal(read().invoices.length, 0);
    assert.equal((await invoke(current)).status, 400);
    assert.equal((await invoke({ type: 'stageBrief', expectedVersion: 0, notes: 'Old version notes', candidate })).status, 400);
    mutate(s => { s.agreementStatus = 'approved'; });
    assert.equal((await stage()).status, 400);
    assert.equal((await invoke(current)).status, 400);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
