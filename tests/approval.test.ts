import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/workspace/route';
import { mutate, read, seed } from '../lib/store';

test('workspace execution rejects stale reminders, policy changes, repeated approvals, and concurrent actions', async () => {
  const oldMode = process.env.NUDGE_MODE, oldPath = process.env.NUDGE_DB_PATH;
  const originalFetch = globalThis.fetch;
  process.env.NUDGE_MODE = 'demo';
  process.env.NUDGE_DB_PATH = `./data/approval-${randomUUID()}.sqlite`;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error('Network forbidden in approval tests'); };
  const invoke = async (body: unknown) => {
    const response = await POST(new NextRequest('http://localhost:3000/api/workspace', {
      method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }));
    return { status: response.status, body: await response.json() };
  };
  const setup = () => mutate(s => {
    Object.assign(s, seed());
    s.invoices = [{ id: 'SIM-APPROVAL', proposalId: 'base', status: 'UNPAID', amountCents: 10000,
      outstandingCents: 10000, createdAt: '2020-01-01T00:00:00Z', dueDate: '2020-01-02', reminders: 0 }];
  });
  try {
    setup();
    assert.equal((await invoke({ type: 'draftReminder', id: 'SIM-APPROVAL' })).status, 200);
    let draft = read().reminderDraft!;
    mutate(s => { s.invoices[0].status = 'PAID'; s.invoices[0].outstandingCents = 0; });
    let result = await invoke({ type: 'sendReminder', id: draft.id, note: draft.note });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /unpaid outstanding/);
    assert.equal(read().invoices[0].reminders, 0);

    setup();
    await invoke({ type: 'draftReminder', id: 'SIM-APPROVAL' });
    draft = read().reminderDraft!;
    assert.equal((await invoke({ type: 'policies', protectedClient: true, reminderLimit: 3, cooldownDays: 7 })).status, 200);
    result = await invoke({ type: 'sendReminder', id: draft.id, note: draft.note });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /protected/);
    assert.equal(read().invoices[0].reminders, 0);

    setup();
    await invoke({ type: 'draftReminder', id: 'SIM-APPROVAL' });
    draft = read().reminderDraft!;
    assert.equal((await invoke({ type: 'sendReminder', id: draft.id, note: draft.note })).status, 200);
    assert.equal(read().invoices[0].reminders, 1);
    result = await invoke({ type: 'sendReminder', id: draft.id, note: draft.note });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /draft has changed/);
    assert.equal(read().invoices[0].reminders, 1);

    setup();
    mutate(s => { s.processing = { key: 'existing-action', operation: 'sendInvoice', startedAt: new Date().toISOString() }; });
    result = await invoke({ type: 'draftReminder', id: 'SIM-APPROVAL' });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /already running/);
    assert.equal(read().processing?.key, 'existing-action');
    assert.equal(read().reminderDraft, undefined);
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldMode === undefined) delete process.env.NUDGE_MODE; else process.env.NUDGE_MODE = oldMode;
    if (oldPath === undefined) delete process.env.NUDGE_DB_PATH; else process.env.NUDGE_DB_PATH = oldPath;
  }
});
