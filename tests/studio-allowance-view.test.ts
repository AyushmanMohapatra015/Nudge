import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyStudioAllowance, studioAllowanceViewSchema } from '../lib/studio-allowance-view';

test('allowance projection validates consistent status and rejects IDs, invented credits and invalid counts', () => {
  for (const state of ['simulation', 'unapproved', 'unavailable'] as const) assert.deepEqual(studioAllowanceViewSchema.parse(emptyStudioAllowance(state)), emptyStudioAllowance(state));
  const valid = { state: 'available', remainingRequests: 3, maxRequests: 5, usedRequests: 2, expiresAt: '2026-10-20T00:00:00.000Z' };
  assert.deepEqual(studioAllowanceViewSchema.parse(valid), valid);
  for (const value of [{ ...valid, id: 'private-approval' }, { ...valid, credits: 10 }, { ...valid, remainingRequests: 4 },
    { ...valid, usedRequests: -1 }, { ...valid, expiresAt: 'private bad date' }, { ...valid, state: 'exhausted' },
    { ...emptyStudioAllowance('unavailable'), remainingRequests: 10 }]) assert.equal(studioAllowanceViewSchema.safeParse(value).success, false);
});
