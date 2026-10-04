import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/workspace/route';
import { mutate, read } from '../lib/store';
import { sessionToken } from '../lib/auth';

test('lost invoice send response blocks repeat sends until authoritative status confirms the transition', async () => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH', 'NUDGE_ADMIN_TOKEN', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]])), originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'sandbox', NUDGE_DB_PATH: `./data/send-outcome-${randomUUID()}.sqlite`, NUDGE_ADMIN_TOKEN: 'fictional-owner-secret-long-enough', PAYPAL_CLIENT_ID: 'test-id', PAYPAL_CLIENT_SECRET: 'test-secret' });
  let sends = 0, status = 'DRAFT';
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'test-token', expires_in: 3600 });
    if (url.endsWith('/INV2-SEND-OUTCOME/send')) {
      assert.ok(read().invoices[0].pendingSend); sends++;
      throw new Error('Mock lost send response');
    }
    if (url.endsWith('/INV2-SEND-OUTCOME')) { assert.equal(init?.method, 'GET'); return Response.json({ id: 'INV2-SEND-OUTCOME', amount: { currency_code: 'USD', value: '100.00' }, status, due_amount: { currency_code: 'USD', value: '100.00' } }); }
    throw new Error('Unexpected mocked request');
  };
  const invoke = (type: string) => POST(new NextRequest('http://localhost:3000/api/workspace', { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', cookie: `nudge_session=${sessionToken()}`, 'content-type': 'application/json' }, body: JSON.stringify({ type, id: 'INV2-SEND-OUTCOME' }) }));
  try {
    mutate(s => { s.invoices = [{ id: 'INV2-SEND-OUTCOME', proposalId: 'base', status: 'DRAFT', amountCents: 10000, outstandingCents: 10000, createdAt: '2026-10-04', dueDate: '2026-10-11', reminders: 0 }]; });
    assert.equal((await invoke('sendInvoice')).status, 400);
    assert.ok(read().invoices[0].pendingSend);
    assert.equal((await invoke('sendInvoice')).status, 400); assert.equal(sends, 1);
    assert.equal((await invoke('syncInvoice')).status, 200); assert.ok(read().invoices[0].pendingSend);
    status = 'SENT';
    assert.equal((await invoke('syncInvoice')).status, 200);
    assert.equal(read().invoices[0].status, 'UNPAID'); assert.equal(read().invoices[0].pendingSend, undefined);
    assert.equal((await invoke('sendInvoice')).status, 400); assert.equal(sends, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
