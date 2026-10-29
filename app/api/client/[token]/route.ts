import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { read, mutate, log } from '@/lib/store';
import { sameOrigin } from '@/lib/auth';
import { clientLinkValid } from '@/lib/client-access';
import { boundedRequestText, clientReadWindow, clientDecisionWindow, RequestGuardError } from '@/lib/request-guards';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ token: string }> };
class ClientDecisionError extends Error {}
const unavailable = () => NextResponse.json({ error: 'Client workspace is unavailable. Refresh to check the recorded decision before retrying.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
function clientView() {
  const s = read();
  return { mode: s.mode, agreement: s.agreementStatus === 'draft' ? null : s.agreement, agreementStatus: s.agreementStatus, agreementAcceptedAt: s.agreementAcceptedAt, proposals: s.proposals.filter(p => p.status !== 'draft').map(p => ({ id: p.id, deliverables: p.deliverables, amountCents: p.amountCents, status: p.status, acceptedAt: p.acceptedAt, clientExplanation: p.clientExplanation })), invoices: s.invoices.filter(i => i.status !== 'DRAFT' && i.proposalId !== 'example').map(i => ({ id: i.id, status: i.status, amountCents: i.amountCents, outstandingCents: i.outstandingCents, payUrl: i.payUrl })) };
}
export async function GET(_request: NextRequest, context: Context) {
  const retry = clientReadWindow.take();
  if (retry) return NextResponse.json({ error: 'Too many client requests. Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(retry), 'Cache-Control': 'no-store' } });
  try {
    if (!clientLinkValid(read(), (await context.params).token)) return NextResponse.json({ error: 'Client link not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json(clientView(), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return unavailable(); }
}
export async function POST(request: NextRequest, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 });
  const retry = clientDecisionWindow.take();
  if (retry) return NextResponse.json({ error: 'Too many client decisions. Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(retry), 'Cache-Control': 'no-store' } });
  try {
    const token = (await context.params).token;
    if (!clientLinkValid(read(), token)) return NextResponse.json({ error: 'Client link not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const text = await boundedRequestText(request, 8192);
    let input: unknown;
    try { input = JSON.parse(text); } catch { throw new ClientDecisionError('Invalid client decision. Supply valid JSON.'); }
    const parsed = z.object({ type: z.enum(['acceptAgreement', 'acceptProposal', 'declineProposal']), id: z.string().optional() }).safeParse(input);
    if (!parsed.success) throw new ClientDecisionError('Invalid client decision. Review the submitted fields.');
    const action = parsed.data;
    mutate(s => {
      // Recheck after body parsing: the token can rotate or expire meanwhile.
      if (!clientLinkValid(s, token)) throw new ClientDecisionError('Client link is no longer valid.');
      if (s.processing) throw new ClientDecisionError('An action is already running. Refresh its status before starting another.');
      if (action.type === 'acceptAgreement') { if (s.agreementStatus !== 'approved') throw new ClientDecisionError('Only an approved agreement can be accepted.'); s.agreementStatus = 'accepted'; s.agreementAcceptedAt = new Date().toISOString(); log(s, 'Client link holder', 'Agreement accepted', 'Approved scope version 1 accepted through the private client link.'); }
      else { const p = s.proposals.find(p => p.id === action.id); if (!p || p.status !== 'approved') throw new ClientDecisionError('Proposal is no longer awaiting a decision.'); p.status = action.type === 'acceptProposal' ? 'accepted' : 'declined'; if (p.status === 'accepted') p.acceptedAt = new Date().toISOString(); log(s, 'Client link holder', p.status === 'accepted' ? 'Change accepted' : 'Change declined', 'The client link holder recorded a decision on the reviewed proposal.', p.id); }
    });
    return NextResponse.json(clientView(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e instanceof RequestGuardError || e instanceof ClientDecisionError) return NextResponse.json({ error: e.message }, { status: e instanceof RequestGuardError ? e.status : 400, headers: { 'Cache-Control': 'no-store' } });
    return unavailable();
  }
}
