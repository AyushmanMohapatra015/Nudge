import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { Agreement } from './domain';

export const agreementFingerprint = (agreement: Agreement) => createHash('sha256').update(JSON.stringify(agreement)).digest('hex');
export type BriefDraft = {
  id: string; createdAt: string; source: 'manual'; notes: string; candidate: BriefCandidate; agreementFingerprint: string;
  review?: { reviewedAt: string; note: string; resolutions: { issueIndex: number; explanation: string }[]; agreement: Agreement; currency: 'USD' };
};

const fields = ['title', 'clientName', 'clientEmail', 'amountCents', 'currency', 'clause'] as const;
export const briefCandidateSchema = z.object({
  title: z.string().trim().min(3).max(120).nullable(),
  suggestedTitle: z.boolean(),
  clientName: z.string().trim().min(2).max(100).nullable(),
  clientEmail: z.string().email().max(150).nullable(),
  amountCents: z.number().int().min(100).max(10000000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  clauses: z.array(z.string().trim().min(5).max(500)).max(12),
  evidence: z.array(z.object({
    field: z.enum(fields), clauseIndex: z.number().int().min(0).max(11).nullable(),
    excerpt: z.string().min(1).max(2000), start: z.number().int().min(0), end: z.number().int().min(1),
  }).strict()).max(40),
  unresolved: z.array(z.object({
    field: z.enum(['title', 'clientName', 'clientEmail', 'amountCents', 'currency', 'scope', 'paymentTerms']),
    kind: z.enum(['missing', 'conflict', 'unsupported']), question: z.string().trim().min(10).max(500),
  }).strict()).max(20),
}).strict();
export type BriefCandidate = z.infer<typeof briefCandidateSchema>;

// Numeric text only. Currency must be explicitly established by the caller's review.
export function parseUsdCents(value: string, currency: string): number {
  if (currency !== 'USD') throw new Error('Only explicitly confirmed USD amounts are supported.');
  const text = value.trim();
  if (!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Enter a plain USD amount with at most two decimal places.');
  }
  const [whole, decimal = ''] = text.replaceAll(',', '').split('.');
  // Bound input before BigInt; this prototype supports at most USD 100,000.
  if (whole.length > 6) throw new Error('USD amount is outside the supported range.');
  const cents = BigInt(whole) * 100n + BigInt(decimal.padEnd(2, '0'));
  if (cents < 100n || cents > 10000000n) throw new Error('USD amount is outside the supported range.');
  return Number(cents);
}

export function validateBriefCandidate(input: unknown, source: string): BriefCandidate {
  if (!source.trim() || source.length > 10000) throw new Error('Brief notes must contain 1–10,000 characters.');
  const candidate = briefCandidateSchema.parse(input);
  if (candidate.suggestedTitle && candidate.title === null) throw new Error('A suggested title cannot be empty.');
  for (const evidence of candidate.evidence) {
    if (evidence.end <= evidence.start || evidence.end > source.length || source.slice(evidence.start, evidence.end) !== evidence.excerpt) {
      throw new Error('Brief evidence does not match the supplied notes.');
    }
    if (evidence.field === 'clause') {
      if (evidence.clauseIndex === null || evidence.clauseIndex >= candidate.clauses.length) throw new Error('Evidence refers to a missing clause.');
    } else {
      if (evidence.clauseIndex !== null || candidate[evidence.field] === null) throw new Error('Evidence refers to a missing field or invalid clause index.');
    }
  }
  for (const field of fields.filter(f => f !== 'clause')) {
    if (candidate[field] !== null && !(field === 'title' && candidate.suggestedTitle) && !candidate.evidence.some(e => e.field === field)) {
      throw new Error(`Extracted ${field} needs source evidence.`);
    }
  }
  candidate.clauses.forEach((_, index) => {
    if (!candidate.evidence.some(e => e.field === 'clause' && e.clauseIndex === index)) throw new Error('Every extracted clause needs source evidence.');
  });
  return candidate;
}

export function briefBlockers(candidate: BriefCandidate): string[] {
  const reasons: string[] = [];
  for (const field of ['title', 'clientName', 'clientEmail', 'amountCents'] as const) {
    if (candidate[field] === null) reasons.push(`Confirm ${field} before using this draft.`);
  }
  if (candidate.currency !== 'USD') reasons.push('Confirm USD; other currencies cannot be applied or converted.');
  if (candidate.clauses.length < 2) reasons.push('Review at least two concrete scope clauses.');
  for (const issue of candidate.unresolved) reasons.push(issue.question);
  return reasons;
}
