import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET as clientGet, POST as clientPost } from '../app/api/client/[token]/route';
import { GET as ownerGet, POST as ownerPost } from '../app/api/workspace/route';
import { db, read, mutate } from '../lib/store';

test('owner/client API errors keep malformed input and storage diagnostics private', async t => {
  const names = ['NUDGE_MODE', 'NUDGE_DB_PATH'];
  const before = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NUDGE_MODE: 'demo', NUDGE_DB_PATH: `./data/api-errors-${randomUUID()}.sqlite` });
  let fetches = 0;
  globalThis.fetch = async () => { fetches++; throw Error('Provider forbidden in error-boundary regression'); };
  const secret = 'fictional-private-diagnostic@example.com';
  const request = (body?: string) => new NextRequest('http://localhost:3000/api/workspace', {
    method: body === undefined ? 'GET' : 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body }),
  });
  try {
    mutate(s => { s.agreementStatus = 'approved'; });
    const state = read(), saved = JSON.stringify(state), context = { params: Promise.resolve({ token: state.clientToken }) };
    const restore = () => db().prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(saved, 'demo');
    const check = async (response: Response, status: number) => {
      assert.equal(response.status, status);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const text = await response.text();
      assert.equal(text.includes(secret), false);
      assert.equal(text.includes('workspaces'), false);
      assert.equal(text.includes('ZodError'), false);
      assert.equal(typeof JSON.parse(text).error, 'string');
    };
    await t.test('client invalid enum cannot reflect submitted text', async () => {
      await check(await clientPost(request(JSON.stringify({ type: secret })), context), 400);
      assert.equal(JSON.stringify(read()), saved);
    });
    await t.test('client malformed JSON has a fixed response', async () => {
      await check(await clientPost(request(`{"type":"${secret}"`), context), 400);
      assert.equal(JSON.stringify(read()), saved);
    });
    await t.test('owner parsing and schema errors do not reflect input', async () => {
      await check(await ownerPost(request(`{"type":"${secret}"`)), 400);
      await check(await ownerPost(request(JSON.stringify({ type: secret }))), 400);
      assert.equal(JSON.stringify(read()), saved);
    });
    await t.test('client failed storage commit returns 503 and rolls back acceptance', async () => {
      db().exec(`CREATE TRIGGER private_failure BEFORE UPDATE ON workspaces BEGIN SELECT RAISE(ABORT, '${secret}'); END;`);
      try {
        await check(await clientPost(request('{"type":"acceptAgreement"}'), context), 503);
        assert.equal(JSON.stringify(read()), saved);
      } finally { db().exec('DROP TRIGGER private_failure'); }
    });
    await t.test('owner failed storage commit is generic and leaves the record unchanged', async () => {
      db().exec(`CREATE TRIGGER private_failure BEFORE UPDATE ON workspaces BEGIN SELECT RAISE(ABORT, '${secret}'); END;`);
      try {
        await check(await ownerPost(request('{"type":"policies","protectedClient":true,"reminderLimit":2,"cooldownDays":7}')), 503);
        assert.equal(JSON.stringify(read()), saved);
      } finally { db().exec('DROP TRIGGER private_failure'); }
    });
    await t.test('failed action cleanup keeps the processing lock and never repeats completed work', async () => {
      mutate(s => { s.agreementStatus = 'accepted'; });
      db().exec(`CREATE TRIGGER private_failure BEFORE UPDATE ON workspaces WHEN json_extract(OLD.body, '$.processing') IS NOT NULL AND json_extract(NEW.body, '$.processing') IS NULL BEGIN SELECT RAISE(ABORT, '${secret}'); END;`);
      try {
        await check(await ownerPost(request('{"type":"analyze","request":"Add appointment booking with available time slots."}')), 503);
        const locked = JSON.stringify(read());
        assert.ok(read().processing);
        assert.equal(read().proposals.length, 1);
        const repeat = await ownerPost(request('{"type":"analyze","request":"Add appointment booking with available time slots."}'));
        assert.equal(repeat.status, 400);
        assert.match((await repeat.json()).error, /already running/);
        assert.equal(JSON.stringify(read()), locked);
      } finally { db().exec('DROP TRIGGER private_failure'); restore(); }
    });
    await t.test('corrupt stored JSON cannot escape owner/client read and write handlers', async () => {
      const corrupt = `{"private":"${secret}"`;
      db().prepare('UPDATE workspaces SET body = ? WHERE mode = ?').run(corrupt, 'demo');
      try {
        await check(await ownerGet(request()), 503);
        await check(await ownerPost(request('{"type":"approveAgreement"}')), 503);
        await check(await clientGet(request(), context), 503);
        await check(await clientPost(request('{"type":"acceptAgreement"}'), context), 503);
        assert.equal(db().prepare('SELECT body FROM workspaces WHERE mode = ?').get('demo')!.body, corrupt);
      } finally { restore(); }
    });
    await t.test('expected client decisions still work and preserve one-time acceptance', async () => {
      await check(await clientPost(request('{"type":"acceptProposal","id":"missing"}'), context), 400);
      const accepted = await clientPost(request('{"type":"acceptAgreement"}'), context);
      assert.equal(accepted.status, 200);
      const acceptedState = JSON.stringify(read());
      const repeated = await clientPost(request('{"type":"acceptAgreement"}'), context);
      assert.equal(repeated.status, 400);
      assert.match((await repeated.json()).error, /Only an approved agreement/);
      assert.equal(JSON.stringify(read()), acceptedState);
    });
    assert.equal(fetches, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
  }
});
