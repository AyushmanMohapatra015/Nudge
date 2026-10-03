import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { agreementSchema, reminderGate, utcDate, money, type Proposal } from '@/lib/domain';
import { read, mutate, log, requireIdle, mode, seed } from '@/lib/store';
import { authorized, sameOrigin } from '@/lib/auth';
import { analyze } from '@/lib/ai';
import { createInvoice, recoverInvoice, sendInvoice, syncInvoice, paypal } from '@/lib/paypal';
import { reconcileOutstanding } from '@/lib/reconciliation';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('saveAgreement'), agreement: agreementSchema }),
  z.object({ type: z.literal('approveAgreement') }),
  z.object({ type: z.literal('dismissReminder'), id: z.string() }),
  z.object({ type: z.literal('resolveReminder'), id: z.string(), draftId: z.string(), outcome: z.enum(['countAsSent', 'confirmedNotSent']), evidence: z.string().trim().min(20).max(1000), confirmed: z.literal(true) }),
  z.object({ type: z.literal('dismissProposal'), id: z.string() }),
  z.object({ type: z.literal('analyze'), request: z.string().trim().min(10).max(5000) }),
  z.object({ type: z.literal('approveProposal'), id: z.string(), amountCents: z.number().int().min(100).max(10000000), deliverables: z.array(z.string().trim().min(3).max(250)).min(1).max(8) }),
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
  return { ...s, connections: { paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_MERCHANT_EMAIL), ai: process.env.NUDGE_AI_PROVIDER === 'astropods' ? !!(process.env.ASTRO_GATEWAY_URL && process.env.ASTRO_GATEWAY_API_KEY && process.env.ASTRO_MODEL) : !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL), webhook: !!process.env.PAYPAL_WEBHOOK_ID } };
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
    if (action.type === 'saveAgreement') mutate(s => { requireIdle(s); if (s.agreementStatus !== 'draft') throw new Error('Approved agreements are locked. Start a separate change instead.'); s.agreement = action.agreement; log(s, 'You', 'Agreement updated', 'Draft scope and client details saved.'); });
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
    else if (action.type === 'approveProposal') mutate(s => { requireIdle(s); const p = s.proposals.find(p => p.id === action.id); if (!p || p.status !== 'draft') throw new Error('Only draft proposals can be approved.'); p.amountCents = action.amountCents; p.deliverables = action.deliverables; p.status = 'approved'; p.approvedAt = new Date().toISOString(); log(s, 'You', 'Change proposal approved', `You set ${money(p.amountCents)}. Awaiting client acceptance.`, p.id); });
    else if (action.type === 'policies') mutate(s => { requireIdle(s); s.policies = { protectedClient: action.protectedClient, reminderLimit: action.reminderLimit, cooldownDays: action.cooldownDays }; log(s, 'You', 'Rules updated', 'All reminders will be checked against these rules at execution.'); });
    else if (action.type === 'promise') mutate(s => { requireIdle(s); if (action.date < utcDate()) throw new Error('Choose today or a future payment date.'); s.promiseDate = action.date; log(s, 'You', 'Payment promise confirmed', `Reminders paused through ${action.date}. This is a recorded promise, not a payment.`); });
    else if (action.type === 'reset') mutate(s => { requireIdle(s); if (mode() !== 'demo') throw new Error('Reset is available only in simulation.'); Object.assign(s, seed()); });
    else if (action.type === 'seedOverdue') mutate(s => { requireIdle(s); if (mode() !== 'demo') throw new Error('Synthetic invoices are not allowed in sandbox mode.'); if (s.invoices.some(i => i.id === 'SIM-OVERDUE')) throw new Error('Example already exists.'); s.invoices.push({ id: 'SIM-OVERDUE', proposalId: 'example', status: 'UNPAID', amountCents: 80000, outstandingCents: 80000, createdAt: new Date(Date.now() - 21 * 86400000).toISOString(), dueDate: utcDate(new Date(Date.now() - 9 * 86400000)), reminders: 0 }); log(s, 'Simulation', 'Overdue example added', 'Synthetic $800 invoice for exploring reminder rules.'); });
    else if (action.type === 'simulatePayment') mutate(s => { requireIdle(s); if (mode() !== 'demo') throw new Error('Payment simulation is disabled in sandbox mode.'); const invoice = s.invoices.find(i => i.id === action.id); if (!invoice || !['UNPAID', 'PARTIALLY_PAID'].includes(invoice.status)) throw new Error('Send an unpaid invoice first.'); invoice.status = 'PAID'; invoice.outstandingCents = 0; log(s, 'Simulation', 'Payment simulated', `${invoice.id} marked paid locally. No PayPal transaction occurred.`); });
    else if (action.type === 'draftReminder') mutate(s => { requireIdle(s); const invoice = s.invoices.find(i => i.id === action.id); if (!invoice) throw new Error('Invoice not found.'); const reasons = reminderGate(invoice, s.policies, s.promiseDate); if (reasons.length) throw new Error(reasons.join(' ')); s.reminderDraft = { id: randomUUID(), invoiceId: invoice.id, note: `Hi ${s.agreement.clientName.split(' ')[0]}, a quick follow-up on invoice ${invoice.id} for ${money(invoice.outstandingCents)}, due ${invoice.dueDate}. Could you let me know when payment is expected? Thank you!`, createdAt: new Date().toISOString() }; log(s, 'Nudge', 'Reminder drafted', 'A deterministic template was prepared from the outstanding balance. Review the exact note before sending.'); });
    else {
      runningKey = randomUUID(); const key = runningKey;
      const snapshot = mutate(s => {
        requireIdle(s);
        if (action.type === 'analyze' && s.agreementStatus !== 'accepted') throw new Error('The client must accept the agreement before scope comparison.');
        if (action.type === 'createInvoice' || action.type === 'recoverInvoice') {
          if (action.id === 'base' ? s.agreementStatus !== 'accepted' : !s.proposals.some(p => p.id === action.id && p.status === 'accepted')) throw new Error('Client acceptance is required before invoicing.');
          if (s.invoices.some(i => i.proposalId === action.id)) throw new Error('An invoice already exists for this accepted work.');
          if (action.type === 'recoverInvoice' && s.invoices.some(i => i.id === action.invoiceId)) throw new Error('This invoice is already linked to another work item.');
        }
        if (['sendInvoice', 'syncInvoice'].includes(action.type)) {
          const invoice = s.invoices.find(i => i.id === ('id' in action ? action.id : ''));
          if (!invoice) throw new Error('Invoice not found.');
          if (action.type === 'sendInvoice' && invoice.status !== 'DRAFT') throw new Error('Only a draft invoice can be sent.');
        }
        if (action.type === 'sendReminder') {
          if (!s.reminderDraft || s.reminderDraft.id !== action.id) throw new Error('Reminder draft has changed. Review it again.');
          const invoice = s.invoices.find(i => i.id === s.reminderDraft!.invoiceId);
          if (!invoice) throw new Error('Invoice not found.');
          const reasons = reminderGate(invoice, s.policies, s.promiseDate); if (reasons.length) throw new Error(reasons.join(' '));
        }
        s.processing = { key, operation: action.type, startedAt: new Date().toISOString() }; s.integrationError = undefined;
        return structuredClone(s);
      });
      if (action.type === 'analyze') {
        const result = await analyze(action.request, snapshot.agreement);
        mutate(s => { s.proposals.unshift({ id: randomUUID(), request: action.request, analysis: result, amountCents: 0, deliverables: result.deliverables, status: 'draft' }); log(s, result.source === 'claude' ? 'Claude' : 'Simulation', 'Scope comparison ready', result.summary); });
      } else if (action.type === 'createInvoice' || action.type === 'recoverInvoice') {
        const proposal: Proposal = action.id === 'base' ? { id: `base-${snapshot.clientToken.slice(0, 16)}`, request: 'Original agreement', analysis: { classification: 'included', summary: 'Original approved project scope.', references: [], questions: [], deliverables: [], source: 'simulation' }, amountCents: snapshot.agreement.amountCents, deliverables: [snapshot.agreement.title], status: 'accepted' } : snapshot.proposals.find(p => p.id === action.id)!;
        const invoice = action.type === 'recoverInvoice' ? await recoverInvoice(snapshot.agreement, proposal, action.invoiceId) : await createInvoice(snapshot.agreement, proposal);
        invoice.proposalId = action.id;
        mutate(s => { s.invoices.push(invoice); log(s, 'You', action.type === 'recoverInvoice' ? 'Existing invoice recovered' : 'Invoice created', action.type === 'recoverInvoice' ? `${invoice.id}: ${invoice.status}. Verified against approved work; no create or send request made.` : `${money(invoice.amountCents)} draft. Sending requires a separate approval.`, `invoice-${proposal.id}`); });
      } else if (action.type === 'sendInvoice' || action.type === 'syncInvoice') {
        let invoice = snapshot.invoices.find(i => i.id === action.id)!;
        if (action.type === 'sendInvoice') {
          invoice = await sendInvoice(invoice);
          // Keep the confirmed send/recovered state even if the subsequent detail lookup fails.
          const sent = invoice;
          mutate(s => { s.invoices = s.invoices.map(i => i.id === sent.id ? sent : i); });
        }
        invoice = await syncInvoice(invoice);
        mutate(s => { s.invoices = s.invoices.map(i => i.id === invoice.id ? invoice : i); log(s, 'PayPal', action.type === 'sendInvoice' ? 'Invoice sent' : 'Invoice reconciled', mode() === 'demo' ? `${invoice.id}: ${invoice.status} (local simulation).` : `${invoice.id}: ${invoice.remoteStatus || invoice.status}.`, key); });
      } else if (action.type === 'sendReminder') {
        const draft = snapshot.reminderDraft!;
        let invoice = await syncInvoice(snapshot.invoices.find(i => i.id === draft.invoiceId)!);
        const reasons = reminderGate(invoice, read().policies, read().promiseDate);
        if (reasons.length) { mutate(s => { s.invoices = s.invoices.map(i => i.id === invoice.id ? invoice : i); }); throw new Error(reasons.join(' ')); }
        if (mode() === 'sandbox') {
          // Persist before contacting PayPal. A timeout or process exit may hide a successful send.
          invoice = { ...invoice, pendingReminder: { draftId: draft.id, startedAt: new Date().toISOString() } };
          const pending = invoice;
          mutate(s => {
            s.invoices = s.invoices.map(i => i.id === pending.id ? pending : i);
            log(s, 'You', 'Reminder delivery started', `Approved note: ${action.note}. Outcome remains unconfirmed until PayPal responds.`, `remind-${draft.id}`);
          });
          await paypal(`/v2/invoicing/invoices/${invoice.id}/remind`, 'POST', { note: action.note, send_to_recipient: true, send_to_invoicer: true }, `remind-${draft.id}`);
        }
        invoice = { ...invoice, reminders: invoice.reminders + 1, lastRemindedAt: new Date().toISOString() };
        delete invoice.pendingReminder;
        mutate(s => { s.invoices = s.invoices.map(i => i.id === invoice.id ? invoice : i); s.reminderDraft = undefined; log(s, 'You', 'Reminder approved and sent', `${mode() === 'demo' ? 'Simulated: ' : ''}${action.note}`, `remind-${draft.id}`); });
      }
      mutate(s => { if (s.processing?.key === key) s.processing = undefined; }); runningKey = undefined;
    }
    return NextResponse.json(view());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map(i => i.message).join(' ') : error instanceof Error ? error.message : 'Action failed.';
    if (runningKey) mutate(s => { if (s.processing?.key === runningKey) { s.processing = undefined; s.integrationError = message; log(s, 'System', 'Action did not finish', `${message} For ambiguous remote errors, reconcile the invoice before repeating an external action.`, runningKey); } });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
