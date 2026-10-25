import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createSession } = require('../scripts/sandbox-rehearsal-controller.cjs');
const { paidReadOnlyFetch } = require('../scripts/sandbox-paid-readonly.cjs');
const base = 'https://api-m.sandbox.paypal.com';
const get = () => ({ method: 'GET', redirect: 'error', signal: AbortSignal.timeout(1000) });
function fixture() {
  const run = createSession({ buyerEmail: 'sb-fictional@personal.example.com', merchantEmail: 'fictional@business.example.com' });
  const state: any = { phase: 'closed', attempts: { create: 1, send: 1 }, invoiceId: 'INV2-FICTIONAL-READONLY' };
  return { state, session: { directory: run.directory, snapshot: () => structuredClone(state) }, expiresAt: 2000, now: () => 1000 };
}
test('read-only verification rejects create/send/foreign requests before transport and preserves financial history', async () => {
  const f = fixture(), before = structuredClone(f.state); let calls = 0;
  const fetch = paidReadOnlyFetch({ ...f, transport: async () => { calls++; return Response.json({ id: f.state.invoiceId, status: 'PAID' }); } });
  for (const [url, options] of [[base + '/v2/invoicing/invoices', { ...get(), method: 'POST' }], [base + '/v2/invoicing/invoices/' + f.state.invoiceId + '/send', { ...get(), method: 'POST' }], ['https://api-m.paypal.com/v2/invoicing/invoices/' + f.state.invoiceId, get()], [base + '/v2/invoicing/invoices/INV2-OTHER', get()]] as const) await assert.rejects(fetch(url, options));
  assert.equal(calls, 0); await fetch(base + '/v2/invoicing/invoices/' + f.state.invoiceId, get()); assert.equal(calls, 1); assert.deepEqual(f.state, before);
});
test('lost response remains consumed after constructing another verifier', async () => {
  const f = fixture(); let calls = 0; const transport = async () => { calls++; throw Error('fictional lost response'); };
  await assert.rejects(paidReadOnlyFetch({ ...f, transport })(base + '/v2/invoicing/invoices/' + f.state.invoiceId, get()));
  await assert.rejects(paidReadOnlyFetch({ ...f, transport })(base + '/v2/invoicing/invoices/' + f.state.invoiceId, get())); assert.equal(calls, 1);
});
test('expiry, changed source and mismatched returned identity fail closed', async () => {
  const f = fixture(); let clock = 1000, calls = 0;
  const fetch = paidReadOnlyFetch({ ...f, now: () => clock, transport: async () => { calls++; return Response.json({ id: 'INV2-OTHER', status: 'PAID' }); } });
  clock = 2000; await assert.rejects(fetch(base + '/v2/invoicing/invoices/' + f.state.invoiceId, get())); assert.equal(calls, 0);
  clock = 1000; f.state.attempts.create = 2; await assert.rejects(fetch(base + '/v2/invoicing/invoices/' + f.state.invoiceId, get())); assert.equal(calls, 0);
  f.state.attempts.create = 1; await assert.rejects(fetch(base + '/v2/invoicing/invoices/' + f.state.invoiceId, get())); assert.equal(calls, 1);
});
