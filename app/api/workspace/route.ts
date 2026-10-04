import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { agreementSchema, reminderGate, utcDate, money, type Proposal } from '@/lib/domain';
import { read, mutate, mutateOwned, log, requireIdle, mode, seed, baseInvoiceIdentity } from '@/lib/store';
import { authorized, sameOrigin } from '@/lib/auth';
import { analyze } from '@/lib/ai';
import { createInvoice, recoverInvoice, sendInvoice, syncInvoice, paypal } from '@/lib/paypal';
import { reconcileOutstanding } from '@/lib/reconciliation';
import { briefCandidateSchema, validateBriefCandidate, agreementFingerprint } from '@/lib/brief';
import { processingOwner, processingRecovery } from '@/lib/processing';
import { realAiEnabled, requireRealAiAccess } from '@/lib/ai-access';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('recoverProcessing'), key: z.string().min(1).max(100), confirmed: z.literal(true), note: z.string().trim().min(20).max(1000) }),
  z.object({ type: z.literal('replaceClientLink'), expectedToken: z.string().min(1).max(100), confirmed: z.literal(true) }),
  z.object({ type: z.literal('stageBrief'), expectedVersion: z.number().int(), notes: z.string().min(1).max(10000), candidate: briefCandidateSchema }),
  z.object({ type: z.literal('applyBrief'), id: z.string(), confirmed: z.literal(true), currency: z.literal('USD'), note: z.string().trim().min(20).max(1000), agreement: agreementSchema, resolutions: z.array(z.object({ issueIndex: z.number().int().min(0).max(19), explanation: z.string().trim().min(20).max(1000) }).strict()).max(20) }),
  z.object({ type: z.literal('saveAgreement'), agreement: agreementSchema }),
  z.object({ type: z.literal('approveAgreement') }),
  z.object({ type: z.literal('dismissReminder'), id: z.string() }),
  z.object({ type: z.literal('resolveReminder'), id: z.string(), draftId: z.string(), outcome: z.enum(['countAsSent', 'confirmedNotSent']), evidence: z.string().trim().min(20).max(1000), confirmed: z.literal(true) }),
  z.object({ type: z.literal('dismissProposal'), id: z.string() }),
  z.object({ type: z.literal('analyze'), request: z.string().trim().min(10).max(5000) }),
  z.object({ type: z.literal('reviewScope'), id: z.string(), expectedReviewId: z.string(), classification: z.enum(['included', 'additional', 'ambiguous']), rationale: z.string().trim().min(20).max(800), references: z.array(z.string().regex(/^S\d+$/)).max(12), clarification: z.string().trim().max(800), deliverables: z.array(z.string().trim().min(3).max(250)).min(1).max(8) }),
  z.object({ type: z.literal('approveProposal'), id: z.string(), reviewId: z.string(), extrasConfirmed: z.literal(true), amountCents: z.number().int().min(100).max(10000000), deliverables: z.array(z.string().trim().min(3).max(250)).min(1).max(8) }),
  z.object({ type: z.literal('createInvoice'), id: z.string() }),
  z.object({ type: z.literal('recoverInvoice'), id: z.string(), invoiceId: z.string().regex(/^INV2-[A-Z0-9-]+$/) }),
  z.object({ type: z.literal('sendInvoice'), id: z.string() }),
  z.object({ type: z.literal('syncInvoice'), id: z.string() }),
  z.object({ type: z.literal('simulatePayment'), id: z.string() }),
  z.object({ type: z.literal('draftReminder'), id: z.string() }),
  z.object({ type: z.literal('sendReminder'), id: z.string(), note: z.string().trim().min(10).max(2000) }),
  z.object({ type: z.literal('policies'), protectedClient: z.boolean(), reminderLimit: z.number().int().min(1).max(5), cooldownDays: z.number().int().min(1).max(30) }),
  z.object({ type: z.literal('promise'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d => !isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d, 'Invalid date') }),
  z.object({ type: z.literal('seedOverdue') }),
  z.object({ type: z.literal('reset') }),
]);
function view() {
  const s = read();
  return { ...s, aiEnabled: realAiEnabled(), processingRecovery: s.processing ? processingRecovery(s.processing) : undefined, connections: { paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_MERCHANT_EMAIL), ai: process.env.NUDGE_AI_PROVIDER === 'astropods' ? !!(process.env.ASTRO_GATEWAY_URL && process.env.ASTRO_GATEWAY_API_KEY && process.env.ASTRO_MODEL) : !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL), webhook: !!process.env.PAYPAL_WEBHOOK_ID } };
}
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Sign in to the sandbox workspace.' }, { status: 401 });
  await reconcileOutstanding();
  return NextResponse.json(view(), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 });
  if (!authorized(request)) return NextResponse.json({ error: 'Sign in to the sandbox workspace.' }, { status: 401 });
  let runningKey: string | undefined;
  try {
    const action = actionSchema.parse(await request.json());
    if (action.type === 'recoverProcessing') mutate(s => {
      const pending = s.processing;
      if (!pending || pending.key !== action.key) throw new Error('Interrupted action has changed. Refresh before recovering.');
      if (processingRecovery(pending).status !== 'exited') throw new Error('Process exit is not confirmed. Recovery remains blocked.');
      s.processing = undefined;
      s.integrationError = `Interrupted ${pending.operation}: inspect its result before any new external action. No action was replayed.`;
      log(s, 'You', 'Interrupted action unlocked', `${pending.operation}. Owning process exit verified on this host. Review: ${action.note}. Remote attempt markers preserved; no automatic replay.`, pending.key);
    });
    else if (action.type === 'replaceClientLink') mutate(s => {
      requireIdle(s);
      if (s.clientToken !== action.expectedToken) throw new Error('Client link has already changed. Refresh before replacing it.');
      baseInvoiceIdentity(s);
      s.clientToken = randomBytes(24).toString('hex');
      log(s, 'You', 'Client link replaced', 'Previous Nudge link revoked. Existing decisions and invoice identities preserved. Share the replacement privately; no message sent.');
    });
    else if (action.type === 'stageBrief') mutate(s => {
      requireIdle(s);
      if (s.agreementStatus !== 'draft') throw new Error('Approved agreements are locked.');
      if (s.version !== action.expectedVersion) throw new Error('Workspace has changed. Refresh before staging a brief.');
      const candidate = validateBriefCandidate(action.candidate, action.notes);
      s.briefDraft = { id: randomUUID(), createdAt: new Date().toISOString(), source: 'manual', notes: action.notes, candidate, agreementFingerprint: agreementFingerprint(s.agreement) };
      log(s, 'You', 'Brief candidate staged', 'Manually supplied candidate stored separately; saved agreement unchanged. No AI extraction performed.', s.briefDraft.id);
    });
    else if (action.type === 'applyBrief') mutate(s => {
      requireIdle(s);
      if (s.agreementStatus !== 'draft') throw new Error('Approved agreements are locked.');
      const draft = s.briefDraft;
      if (!draft || draft.id !== action.id || draft.review) throw new Error('Brief candidate has changed or was already used.');
      if (draft.agreementFingerprint !== agreementFingerprint(s.agreement)) throw new Error('Agreement changed after staging. Stage a fresh candidate before applying.');
      if (draft.candidate.currency !== null && draft.candidate.currency !== 'USD') throw new Error('Non-USD briefs cannot be applied or converted.');
      const indexes = new Set(action.resolutions.map(r => r.issueIndex));
      if (indexes.size !== action.resolutions.length || indexes.size !== draft.candidate.unresolved.length || [...indexes].some(i => i >= draft.candidate.unresolved.length)) throw new Error('Record one explicit resolution for every reported issue.');
      draft.review = { reviewedAt: new Date().toISOString(), note: action.note, resolutions: action.resolutions, agreement: structuredClone(action.agreement), currency: action.currency };
      s.agreement = action.agreement;
      log(s, 'You', 'Reviewed brief applied', 'Owner-reviewed USD agreement saved as a draft. Original candidate preserved; separate approval and client acceptance still required.', draft.id);
    });
    else if (action.type === 'saveAgreement') mutate(s => { requireIdle(s); if (s.agreementStatus !== 'draft') throw new Error('Approved agreements are locked. Start a separate change instead.'); s.agreement = action.agreement; log(s, 'You', 'Agreement updated', 'Draft scope and client details saved.'); });
    else if (action.type === 'approveAgreement') mutate(s => { requireIdle(s); if (s.agreementStatus !== 'draft') throw new Error('Agreement is already approved.'); agreementSchema.parse(s.agreement); s.agreementStatus = 'approved'; log(s, 'You', 'Agreement approved', 'Version 1 locked and ready for client acceptance.'); });
    else if (action.type === 'dismissReminder') mutate(s => { requireIdle(s); if (s.reminderDraft?.id !== action.id) throw new Error('Reminder draft has changed.'); s.reminderDraft = undefined; log(s, 'You', 'Reminder dismissed', 'The draft was discarded without contacting the client.'); });
    else if (action.type === 'resolveReminder') mutate(s => {
      requireIdle(s);
      const invoice = s.invoices.find(i => i.id === action.id);
      if (!invoice?.pendingReminder || invoice.pendingReminder.draftId !== action.draftId) throw new Error('This reminder outcome is no longer awaiting review.');
      if (action.outcome === 'countAsSent') {
        invoice.reminders++;
        // Start a conservative cooldown at review time, without claiming a known delivery time.
        invoice.lastRemindedAt = new Date().toISOString();
      }
      delete invoice.pendingReminder;
      if (s.reminderDraft?.id === action.draftId) s.reminderDraft = undefined;
      log(s, 'You', 'Reminder outcome manually reviewed', `${invoice.id}: ${action.outcome === 'countAsSent' ? 'counted as sent; cooldown starts at review' : 'operator confirmed not sent'}. Evidence: ${action.evidence}. Operator judgement, not API-verified delivery. No message sent by this review.`, `review-remind-${action.draftId}`);
      s.integrationError = undefined;
    });
    else if (action.type === 'dismissProposal') mutate(s => { requireIdle(s); const p = s.proposals.find(p => p.id === action.id); if (!p || p.status !== 'draft') throw new Error('Only draft proposals can be dismissed.'); s.proposals = s.proposals.filter(item => item.id !== p.id); log(s, 'You', 'Scope draft dismissed', `No proposal was shared with the client. Request: ${p.request}. Analysis: ${p.analysis.summary}`, p.id); });
    else if (action.type === 'reviewScope') mutate(s => {
      requireIdle(s);
      const p = s.proposals.find(p => p.id === action.id);
      if (!p || p.status !== 'draft') throw new Error('Only draft scope decisions can be reviewed.');
      if ((p.scopeReview?.id || '') !== action.expectedReviewId) throw new Error('Scope review has changed. Refresh before reviewing again.');
      const clauseIds = new Set(s.agreement.clauses.map(c => c.id));
      if (action.references.some(id => !clauseIds.has(id))) throw new Error('Review cites a clause that does not exist.');
      if (action.classification === 'additional' && !action.references.length && action.clarification.length < 20) throw new Error('Additional work needs supporting clauses or documented clarification.');
      p.scopeReview = { id: randomUUID(), classification: action.classification, rationale: action.rationale, references: [...new Set(action.references)], clarification: action.clarification, deliverables: action.deliverables, reviewedAt: new Date().toISOString(), actor: 'You' };
      p.deliverables = action.deliverables;
      log(s, 'You', 'Scope decision reviewed', `${action.classification}: ${action.rationale}. References: ${action.references.join(', ') || 'none'}. Clarification: ${action.clarification || 'none'}. Original analysis preserved; no client approval implied.`, p.scopeReview.id);
    });
    else if (action.type === 'approveProposal') mutate(s => {
      requireIdle(s); const p = s.proposals.find(p => p.id === action.id);
      if (!p || p.status !== 'draft') throw new Error('Only draft proposals can be approved.');
      if (!p.scopeReview || p.scopeReview.id !== action.reviewId) throw new Error('Review the current scope decision before pricing.');
      if (p.scopeReview.classification !== 'additional') throw new Error('Included or unclear work cannot be approved as a paid extra.');
      if (JSON.stringify(p.scopeReview.deliverables) !== JSON.stringify(action.deliverables)) throw new Error('Deliverables changed after scope review. Review the revised work first.');
      p.amountCents = action.amountCents; p.deliverables = action.deliverables; p.status = 'approved'; p.approvedAt = new Date().toISOString();
      log(s, 'You', 'Change proposal approved', `You set ${money(p.amountCents)} for reviewed additional work only. Awaiting client acceptance.`, p.id);
    });
    else if (action.type === 'policies') mutate(s => { requireIdle(s); s.policies = { protectedClient: action.protectedClient, reminderLimit: action.reminderLimit, cooldownDays: action.cooldownDays }; log(s, 'You', 'Rules updated', 'All reminders will be checked against these rules at execution.'); });
    else if (action.type === 'promise') mutate(s => { requireIdle(s); if (action.date < utcDate()) throw new Error('Choose today or a future payment date.'); s.promiseDate = action.date; log(s, 'You', 'Payment promise confirmed', `Reminders paused through ${action.date}. This is a recorded promise, not a payment.`); });
    else if (action.type === 'reset') mutate(s => { requireIdle(s); if (mode() !== 'demo') throw new Error('Reset is available only in simulation.'); for (const key of Object.keys(s)) delete (s as unknown as Record<string, unknown>)[key]; Object.assign(s, seed()); });
    else if (action.type === 'seedOverdue') mutate(s => { requireIdle(s); if (mode() !== 'demo') throw new Error('Synthetic invoices are not allowed in sandbox mode.'); if (s.invoices.some(i => i.id === 'SIM-OVERDUE')) throw new Error('Example already exists.'); s.invoices.push({ id: 'SIM-OVERDUE', proposalId: 'example', status: 'UNPAID', amountCents: 80000, outstandingCents: 80000, createdAt: new Date(Date.now() - 21 * 86400000).toISOString(), dueDate: utcDate(new Date(Date.now() - 9 * 86400000)), reminders: 0 }); log(s, 'Simulation', 'Overdue example added', 'Synthetic $800 invoice for exploring reminder rules.'); });
    else if (action.type === 'simulatePayment') mutate(s => { requireIdle(s); if (mode() !== 'demo') throw new Error('Payment simulation is disabled in sandbox mode.'); const invoice = s.invoices.find(i => i.id === action.id); if (!invoice || !['UNPAID', 'PARTIALLY_PAID'].includes(invoice.status)) throw new Error('Send an unpaid invoice first.'); invoice.status = 'PAID'; invoice.outstandingCents = 0; log(s, 'Simulation', 'Payment simulated', `${invoice.id} marked paid locally. No PayPal transaction occurred.`); });
    else if (action.type === 'draftReminder') mutate(s => { requireIdle(s); const invoice = s.invoices.find(i => i.id === action.id); if (!invoice) throw new Error('Invoice not found.'); const reasons = reminderGate(invoice, s.policies, s.promiseDate); if (reasons.length) throw new Error(reasons.join(' ')); s.reminderDraft = { id: randomUUID(), invoiceId: invoice.id, note: `Hi ${s.agreement.clientName.split(' ')[0]}, a quick follow-up on invoice ${invoice.id} for ${money(invoice.outstandingCents)}, due ${invoice.dueDate}. Could you let me know when payment is expected? Thank you!`, createdAt: new Date().toISOString() }; log(s, 'Nudge', 'Reminder drafted', 'A deterministic template was prepared from the outstanding balance. Review the exact note before sending.'); });
    else {
      runningKey = randomUUID(); const key = runningKey;
      const snapshot = mutate(s => {
        requireIdle(s);
        if (action.type === 'analyze') {
          if (s.agreementStatus !== 'accepted') throw new Error('The client must accept the agreement before scope comparison.');
          if (mode() === 'sandbox') requireRealAiAccess();
        }
        if (action.type === 'createInvoice' || action.type === 'recoverInvoice') {
          if (action.id === 'base') baseInvoiceIdentity(s);
          if (action.id === 'base' ? s.agreementStatus !== 'accepted' : !s.proposals.some(p => p.id === action.id && p.status === 'accepted')) throw new Error('Client acceptance is required before invoicing.');
          if (s.invoices.some(i => i.proposalId === action.id)) throw new Error('An invoice already exists for this accepted work.');
          if (action.type === 'recoverInvoice' && s.invoices.some(i => i.id === action.invoiceId)) throw new Error('This invoice is already linked to another work item.');
        }
        if (['sendInvoice', 'syncInvoice'].includes(action.type)) {
          const invoice = s.invoices.find(i => i.id === ('id' in action ? action.id : ''));
          if (!invoice) throw new Error('Invoice not found.');
          if (action.type === 'sendInvoice' && invoice.status !== 'DRAFT') throw new Error('Only a draft invoice can be sent.');
          if (action.type === 'sendInvoice' && invoice.pendingSend) throw new Error('Previous invoice sending outcome is uncertain. Refresh its status; automatic repeat sending is blocked.');
        }
        if (action.type === 'sendReminder') {
          if (!s.reminderDraft || s.reminderDraft.id !== action.id) throw new Error('Reminder draft has changed. Review it again.');
          const invoice = s.invoices.find(i => i.id === s.reminderDraft!.invoiceId);
          if (!invoice) throw new Error('Invoice not found.');
          const reasons = reminderGate(invoice, s.policies, s.promiseDate); if (reasons.length) throw new Error(reasons.join(' '));
        }
        s.processing = { key, operation: action.type, startedAt: new Date().toISOString(), owner: processingOwner() }; s.integrationError = undefined;
        return structuredClone(s);
      });
      if (action.type === 'analyze') {
        const result = await analyze(action.request, snapshot.agreement);
        mutateOwned(key, s => { s.proposals.unshift({ id: randomUUID(), request: action.request, analysis: result, amountCents: 0, deliverables: result.deliverables, status: 'draft' }); log(s, result.source === 'claude' ? 'Claude' : 'Simulation', 'Scope comparison ready', result.summary); });
      } else if (action.type === 'createInvoice' || action.type === 'recoverInvoice') {
        const proposal: Proposal = action.id === 'base' ? { id: snapshot.baseInvoiceKey!, request: 'Original agreement', analysis: { classification: 'included', summary: 'Original approved project scope.', references: [], questions: [], deliverables: [], source: 'simulation' }, amountCents: snapshot.agreement.amountCents, deliverables: [snapshot.agreement.title], status: 'accepted' } : snapshot.proposals.find(p => p.id === action.id)!;
        const invoice = action.type === 'recoverInvoice' ? await recoverInvoice(snapshot.agreement, proposal, action.invoiceId) : await createInvoice(snapshot.agreement, proposal);
        invoice.proposalId = action.id;
        mutateOwned(key, s => { s.invoices.push(invoice); log(s, 'You', action.type === 'recoverInvoice' ? 'Existing invoice recovered' : 'Invoice created', action.type === 'recoverInvoice' ? `${invoice.id}: ${invoice.status}. Verified against approved work; no create or send request made.` : `${money(invoice.amountCents)} draft. Sending requires a separate approval.`, `invoice-${proposal.id}`); });
      } else if (action.type === 'sendInvoice' || action.type === 'syncInvoice') {
        let invoice = snapshot.invoices.find(i => i.id === action.id)!;
        if (action.type === 'sendInvoice') {
          if (mode() === 'sandbox') {
            invoice = { ...invoice, pendingSend: { key, startedAt: new Date().toISOString() } };
            const pending = invoice;
            mutateOwned(key, s => { s.invoices = s.invoices.map(i => i.id === pending.id ? pending : i); log(s, 'You', 'Invoice sending started', `${pending.id}: outcome remains uncertain until confirmed.`, key); });
          }
          invoice = await sendInvoice(invoice);
          delete invoice.pendingSend;
          // Keep the confirmed send/recovered state even if the subsequent detail lookup fails.
          const sent = invoice;
          mutateOwned(key, s => { s.invoices = s.invoices.map(i => i.id === sent.id ? sent : i); });
        }
        invoice = await syncInvoice(invoice);
        mutateOwned(key, s => { s.invoices = s.invoices.map(i => i.id === invoice.id ? invoice : i); log(s, 'PayPal', action.type === 'sendInvoice' ? 'Invoice sent' : 'Invoice reconciled', mode() === 'demo' ? `${invoice.id}: ${invoice.status} (local simulation).` : `${invoice.id}: ${invoice.remoteStatus || invoice.status}.`, key); });
      } else if (action.type === 'sendReminder') {
        const draft = snapshot.reminderDraft!;
        let invoice = await syncInvoice(snapshot.invoices.find(i => i.id === draft.invoiceId)!);
        const reasons = reminderGate(invoice, read().policies, read().promiseDate);
        if (reasons.length) { mutateOwned(key, s => { s.invoices = s.invoices.map(i => i.id === invoice.id ? invoice : i); }); throw new Error(reasons.join(' ')); }
        if (mode() === 'sandbox') {
          // Persist before contacting PayPal. A timeout or process exit may hide a successful send.
          invoice = { ...invoice, pendingReminder: { draftId: draft.id, startedAt: new Date().toISOString() } };
          const pending = invoice;
          mutateOwned(key, s => {
            s.invoices = s.invoices.map(i => i.id === pending.id ? pending : i);
            log(s, 'You', 'Reminder delivery started', `Approved note: ${action.note}. Outcome remains unconfirmed until PayPal responds.`, `remind-${draft.id}`);
          });
          await paypal(`/v2/invoicing/invoices/${invoice.id}/remind`, 'POST', { note: action.note, send_to_recipient: true, send_to_invoicer: true }, `remind-${draft.id}`);
        }
        invoice = { ...invoice, reminders: invoice.reminders + 1, lastRemindedAt: new Date().toISOString() };
        delete invoice.pendingReminder;
        mutateOwned(key, s => { s.invoices = s.invoices.map(i => i.id === invoice.id ? invoice : i); s.reminderDraft = undefined; log(s, 'You', 'Reminder approved and sent', `${mode() === 'demo' ? 'Simulated: ' : ''}${action.note}`, `remind-${draft.id}`); });
      }
      mutateOwned(key, s => { if (s.processing?.key === key) s.processing = undefined; }); runningKey = undefined;
    }
    return NextResponse.json(view());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map(i => i.message).join(' ') : error instanceof Error ? error.message : 'Action failed.';
    if (runningKey && read().processing?.key === runningKey) mutate(s => { if (s.processing?.key === runningKey) { s.processing = undefined; s.integrationError = message; log(s, 'System', 'Action did not finish', `${message} For ambiguous remote errors, reconcile the invoice before repeating an external action.`, runningKey); } });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
