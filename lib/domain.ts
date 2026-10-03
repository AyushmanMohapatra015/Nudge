import { z } from 'zod';

export const agreementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  clientName: z.string().trim().min(2).max(100),
  clientEmail: z.string().email().max(150),
  amountCents: z.number().int().min(100).max(10000000),
  clauses: z.array(z.object({ id: z.string().regex(/^S\d+$/), text: z.string().trim().min(5).max(500) })).min(2).max(12),
}).refine(a => new Set(a.clauses.map(c => c.id)).size === a.clauses.length, 'Clause references must be unique');
export type Agreement = z.infer<typeof agreementSchema>;
export const analysisSchema = z.object({
  classification: z.enum(['included', 'additional', 'ambiguous']),
  summary: z.string().min(10).max(800),
  references: z.array(z.string().regex(/^S\d+$/)).max(12),
  questions: z.array(z.string().min(3).max(250)).max(5),
  deliverables: z.array(z.string().min(3).max(250)).min(1).max(8),
});
export type Analysis = z.infer<typeof analysisSchema> & { source: 'claude' | 'simulation' };
export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'OTHER';
export type Invoice = { id: string; proposalId: string; status: InvoiceStatus; amountCents: number; outstandingCents: number; payUrl?: string; createdAt: string; dueDate: string; reminders: number; lastRemindedAt?: string; remoteStatus?: string; recipientEmail?: string; pendingReminder?: { draftId: string; startedAt: string } };
export type ScopeReview = { id: string; classification: Analysis['classification']; rationale: string; references: string[]; clarification: string; deliverables: string[]; reviewedAt: string; actor: 'You' };
export type Proposal = { id: string; request: string; analysis: Analysis; amountCents: number; deliverables: string[]; status: 'draft' | 'approved' | 'accepted' | 'declined'; approvedAt?: string; acceptedAt?: string; scopeReview?: ScopeReview };
export type Audit = { id: string; time: string; actor: string; title: string; detail: string; key?: string };
export type Policies = { protectedClient: boolean; reminderLimit: number; cooldownDays: number };
export type Workspace = {
  version: number; mode: 'demo' | 'sandbox'; clientToken: string;
  agreement: Agreement; agreementStatus: 'draft' | 'approved' | 'accepted'; agreementAcceptedAt?: string;
  proposals: Proposal[]; invoices: Invoice[]; audit: Audit[]; policies: Policies;
  promiseDate?: string; processing?: { key: string; operation: string; startedAt: string }; integrationError?: string;
  reminderDraft?: { id: string; invoiceId: string; note: string; createdAt: string };
};
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(cents / 100);
export const utcDate = (d = new Date()) => d.toISOString().slice(0, 10);
export function reminderGate(invoice: Invoice, policies: Policies, promiseDate?: string, now = new Date()) {
  const reasons: string[] = [];
  if (invoice.pendingReminder) reasons.push('A previous reminder has an uncertain delivery outcome. Further reminders are blocked pending manual review.');
  if (!['UNPAID', 'PARTIALLY_PAID'].includes(invoice.status) || invoice.outstandingCents <= 0) reasons.push('Only an unpaid outstanding balance can be chased.');
  if (invoice.dueDate >= utcDate(now)) reasons.push('The invoice is not overdue yet.');
  if (policies.protectedClient) reasons.push('This client is protected from reminders.');
  if (invoice.reminders >= policies.reminderLimit) reasons.push('The reminder limit has been reached.');
  if (promiseDate && promiseDate >= utcDate(now)) reasons.push(`Client promised payment by ${promiseDate}; reminders are paused.`);
  if (invoice.lastRemindedAt && now.getTime() - Date.parse(invoice.lastRemindedAt) < policies.cooldownDays * 86400000) reasons.push('The reminder cooldown has not elapsed.');
  return reasons;
}
export function validateReferences(analysis: z.infer<typeof analysisSchema>, agreement: Agreement) {
  const ids = new Set(agreement.clauses.map(c => c.id));
  if (analysis.references.some(id => !ids.has(id))) throw new Error('AI returned a clause reference that does not exist. Review the request manually.');
  if (analysis.classification !== 'ambiguous' && !analysis.references.length) throw new Error('AI must cite the agreement for its classification.');
  return analysis;
}
export function simulatedAnalysis(request: string, agreement: Agreement): Analysis {
  const booking = /booking|appointment|scheduling/i.test(request);
  const revision = /revision|round/i.test(request);
  const text = agreement.clauses.map(c => c.text).join(' ').toLowerCase();
  const excludedBooking = booking && /booking.*(excluded|not included)|exclud.*booking/i.test(text);
  return {
    classification: excludedBooking ? 'additional' : 'ambiguous',
    summary: excludedBooking ? 'The request adds booking functionality that the approved agreement explicitly excludes. Any extra revision allowance needs clarification before pricing.' : 'This local simulation cannot confidently resolve the request. Review the agreement and clarify the deliverable before proposing a price.',
    references: agreement.clauses.filter(c => /booking|revision/i.test(c.text)).map(c => c.id),
    questions: revision ? ['Does the requested revision round apply to the existing pages or the new deliverable?'] : ['What are the acceptance criteria for this request?'],
    deliverables: [booking ? 'One booking page with appointment scheduling' : request.slice(0, 250)],
    source: 'simulation',
  };
}
