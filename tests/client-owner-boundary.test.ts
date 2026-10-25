import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET as ownerGet, POST as ownerPost } from '../app/api/workspace/route';
import { GET as clientGet, POST as clientPost } from '../app/api/client/[token]/route';
import { sessionToken } from '../lib/auth';
import { mutate, read } from '../lib/store';

async function isolated(check: (networkCalls: () => number) => Promise<void>) {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  let calls = 0;
  Object.assign(process.env, {
    NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/client-owner-boundary-${randomUUID()}.sqlite`,
    NUDGE_ADMIN_TOKEN: 'fictional-boundary-test-secret-never-a-real-credential',
  });
  globalThis.fetch = async () => { calls++; throw new Error('Provider access forbidden in boundary tests'); };
  try { await check(() => calls); }
  finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    }
  }
}

function request(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test('client bearer credentials cannot become owner credentials or replace client access', async () => {
  await isolated(async networkCalls => {
    const baseline = read(), token = baseline.clientToken;
    const context = { params: Promise.resolve({ token }) };
    const replace = { type: 'replaceClientLink', expectedToken: token, confirmed: true };
    const clientCredentials: Record<string, string>[] = [
      {},
      { cookie: `nudge_session=${token}` },
      { authorization: `Bearer ${token}` },
    ];
    for (const headers of clientCredentials) {
      const denied = await ownerGet(request('/api/workspace', undefined, headers));
      assert.equal(denied.status, 401);
      assert.equal(denied.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await denied.json(), { error: 'Sign in to the sandbox workspace.' });
      assert.equal((await ownerPost(request('/api/workspace', replace, headers))).status, 401);
      assert.deepEqual(read(), baseline);
    }
    assert.equal((await clientPost(request(`/api/client/${token}`, replace), context)).status, 400);
    assert.deepEqual(read(), baseline);

    // Positive control: the owner session deliberately receives the shareable token.
    // Removing it from this response would break the existing sharing/rotation UI.
    const owner = await ownerGet(request('/api/workspace', undefined, { cookie: `nudge_session=${sessionToken()}` }));
    assert.equal(owner.status, 200);
    assert.equal((await owner.json()).clientToken, token);
    assert.deepEqual(read(), baseline);
    assert.equal(networkCalls(), 0);
  });
});

test('scanner-like client GETs cannot accept work and approved views still omit owner-only data', async () => {
  await isolated(async networkCalls => {
    mutate(s => {
      s.agreementStatus = 'approved';
      s.integrationError = 'fictional-owner-integration-marker';
      s.proposals = [{
        id: 'fictional-approved-change', request: 'fictional-private-request-marker',
        amountCents: 30000, deliverables: ['Appointment booking'], status: 'approved',
        analysis: { classification: 'additional', summary: 'fictional-private-analysis-marker',
          references: ['S3'], questions: [], deliverables: ['Appointment booking'], source: 'simulation' },
      }];
    });
    const baseline = read(), token = baseline.clientToken;
    const context = { params: Promise.resolve({ token }) };
    for (const query of ['', '?type=acceptAgreement', '?type=acceptProposal&id=fictional-approved-change']) {
      const response = await clientGet(request(`/api/client/${token}${query}`, undefined,
        { 'user-agent': 'Fictional-Link-Preview-Scanner' }), context);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const view = await response.json();
      assert.equal(view.agreementStatus, 'approved');
      assert.equal(view.proposals[0].status, 'approved');
      assert.equal(view.proposals[0].amountCents, 30000);
      for (const field of ['clientToken', 'audit', 'policies', 'processing', 'integrationError', 'connections']) {
        assert.equal(field in view, false);
      }
      assert.equal('request' in view.proposals[0], false);
      assert.equal('analysis' in view.proposals[0], false);
      assert.deepEqual(read(), baseline, 'GET must not record decisions or advance workspace version');
    }
    assert.equal(networkCalls(), 0);
  });
});
