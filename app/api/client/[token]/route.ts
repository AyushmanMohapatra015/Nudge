import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { read, mutate, log, requireIdle } from '@/lib/store';
import { equal, sameOrigin } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ token: string }> };
function clientView() {
  const s = read();
  return { mode: s.mode, agreement: s.agreementStatus === 'draft' ? null : s.agreement, agreementStatus: s.agreementStatus, agreementAcceptedAt: s.agreementAcceptedAt, proposals: s.proposals.filter(p => p.status !== 'draft').map(p => ({ id: p.id, deliverables: p.deliverables, amountCents: p.amountCents, status: p.status, acceptedAt: p.acceptedAt })), invoices: s.invoices.filter(i => i.status !== 'DRAFT' && i.proposalId !== 'example').map(i => ({ id: i.id, status: i.status, amountCents: i.amountCents, outstandingCents: i.outstandingCents, payUrl: i.payUrl })) };
}
export async function GET(_request: NextRequest, context: Context) {
  if (!equal((await context.params).token, read().clientToken)) return NextResponse.json({ error: 'Client link not found.' }, { status: 404 });
  return NextResponse.json(clientView(), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 });
  if (!equal((await context.params).token, read().clientToken)) return NextResponse.json({ error: 'Client link not found.' }, { status: 404 });
  try {
    const action = z.object({ type: z.enum(['acceptAgreement', 'acceptProposal', 'declineProposal']), id: z.string().optional() }).parse(await request.json());
    mutate(s => {
      requireIdle(s);
      if (action.type === 'acceptAgreement') { if (s.agreementStatus !== 'approved') throw new Error('Only an approved agreement can be accepted.'); s.agreementStatus = 'accepted'; s.agreementAcceptedAt = new Date().toISOString(); log(s, 'Client link holder', 'Agreement accepted', 'Approved scope version 1 accepted through the private client link.'); }
      else { const p = s.proposals.find(p => p.id === action.id); if (!p || p.status !== 'approved') throw new Error('Proposal is no longer awaiting a decision.'); p.status = action.type === 'acceptProposal' ? 'accepted' : 'declined'; if (p.status === 'accepted') p.acceptedAt = new Date().toISOString(); log(s, 'Client link holder', p.status === 'accepted' ? 'Change accepted' : 'Change declined', 'The client link holder recorded a decision on the reviewed proposal.', p.id); }
    });
    return NextResponse.json(clientView());
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to record acceptance.' }, { status: 400 }); }
}
