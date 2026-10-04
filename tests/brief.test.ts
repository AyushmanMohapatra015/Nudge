import { test } from 'node:test';
import assert from 'node:assert/strict';
import { briefCandidateSchema, validateBriefCandidate, briefBlockers, parseUsdCents, type BriefCandidate } from '../lib/brief';

const empty = (): BriefCandidate => ({ title: null, suggestedTitle: false, clientName: null, clientEmail: null,
  amountCents: null, currency: null, clauses: [], evidence: [], unresolved: [] });

test('brief candidates preserve missing data and reject injected actions or invalid money', () => {
  const candidate = validateBriefCandidate(empty(), 'Need a modern website.');
  assert.equal(candidate.clientEmail, null);
  assert.equal(candidate.amountCents, null);
  assert.deepEqual(candidate.clauses, []);
  assert.equal(briefBlockers(candidate).length, 6);
  assert.equal(briefCandidateSchema.safeParse({ ...empty(), sendInvoice: true }).success, false);
  for (const amountCents of [0, 30005.5, -100, 10000001]) assert.equal(briefCandidateSchema.safeParse({ ...empty(), amountCents }).success, false);
});

test('USD amounts parse exactly and never infer currency or round excess precision', () => {
  for (const [text, cents] of [['300.05', 30005], ['1,200', 120000], ['1.1', 110], ['100000.00', 10000000]] as const) {
    assert.equal(parseUsdCents(text, 'USD'), cents);
  }
  for (const text of ['$1,200', '1,20', '1.005', '-5', '0.99', '100000.01', '1e3', 'NaN', '01.00', '1200 deposit']) {
    assert.throws(() => parseUsdCents(text, 'USD'));
  }
  assert.throws(() => parseUsdCents('25000', 'INR'), /confirmed USD/);
  assert.throws(() => parseUsdCents('1200', ''), /confirmed USD/);
});

test('brief evidence must cite exact source spans and existing fields and clauses', () => {
  const source = 'Booking is excluded. Mobile layouts are included.';
  const candidate = { ...empty(), clauses: ['Booking is excluded.', 'Mobile layouts are included.'],
    evidence: [{ field: 'clause' as const, clauseIndex: 0, excerpt: source.slice(0, 20), start: 0, end: 20 },
      { field: 'clause' as const, clauseIndex: 1, excerpt: source.slice(21), start: 21, end: source.length }] };
  assert.equal(validateBriefCandidate(candidate, source).clauses.length, 2);
  assert.throws(() => validateBriefCandidate({ ...candidate, evidence: [{ ...candidate.evidence[0], excerpt: 'Booking is included.' }, candidate.evidence[1]] }, source), /does not match/);
  assert.throws(() => validateBriefCandidate({ ...candidate, evidence: [candidate.evidence[0]] }, source), /Every extracted clause/);
  assert.throws(() => validateBriefCandidate({ ...candidate, evidence: [{ ...candidate.evidence[0], clauseIndex: 7 }, candidate.evidence[1]] }, source), /missing clause/);
  assert.throws(() => validateBriefCandidate({ ...empty(), amountCents: 120000 }, source), /needs source evidence/);
  assert.throws(() => validateBriefCandidate(empty(), ' '), /notes must/);
});

test('a complete evidenced candidate remains blocked by conflicts or unsupported payment terms', () => {
  const source = 'Website refresh\nFictional Studio\nbuyer@example.com\nUSD\n1,200\nFive pages included.\nBooking excluded.';
  const fields = ['title', 'clientName', 'clientEmail', 'currency', 'amountCents', 'clause', 'clause'] as const;
  let cursor = 0;
  const evidence = source.split('\n').map((excerpt, index) => {
    const start = cursor; cursor += excerpt.length + 1;
    return { field: fields[index], clauseIndex: index >= 5 ? index - 5 : null, excerpt, start, end: start + excerpt.length };
  });
  const candidate = validateBriefCandidate({ title: 'Website refresh', suggestedTitle: false, clientName: 'Fictional Studio',
    clientEmail: 'buyer@example.com', currency: 'USD', amountCents: 120000, clauses: ['Five pages included.', 'Booking excluded.'], evidence, unresolved: [] }, source);
  assert.deepEqual(briefBlockers(candidate), []);
  assert.match(briefBlockers({ ...candidate, unresolved: [{ field: 'paymentTerms', kind: 'unsupported', question: 'How should the requested deposit be handled?' }] }).join(' '), /deposit/);
  assert.match(briefBlockers({ ...candidate, unresolved: [{ field: 'amountCents', kind: 'conflict', question: 'Which price was actually agreed with the client?' }] }).join(' '), /Which price/);
  assert.match(briefBlockers({ ...candidate, currency: 'INR' }).join(' '), /other currencies/);
  assert.equal(validateBriefCandidate({ ...empty(), title: 'Suggested site title', suggestedTitle: true }, 'Some project notes.').suggestedTitle, true);
});
