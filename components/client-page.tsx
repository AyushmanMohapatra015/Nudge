'use client';
import { BrowserRead } from '@/lib/browser-read';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowUpRight, Check, FileText, Loader2, ShieldCheck, X } from 'lucide-react';
import QuoteExplanation from './quote-explanation';
import { money, type Agreement, type Invoice, type Proposal } from '@/lib/domain';
type ClientData = { mode: 'demo' | 'sandbox'; agreement: Agreement | null; agreementStatus: string; agreementAcceptedAt?: string; proposals: Pick<Proposal, 'id' | 'deliverables' | 'amountCents' | 'status' | 'acceptedAt' | 'clientExplanation'>[]; invoices: Pick<Invoice, 'id' | 'status' | 'amountCents' | 'outstandingCents' | 'payUrl'>[] };
export default function ClientPage({ token }: { token: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const actionControl = useRef<Element | null>(null);
  const reads = useRef(new BrowserRead());
  const mutationPending = useRef(false);
  const [data, setData] = useState<ClientData>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [consent, setConsent] = useState(false);
  const [loadError, setLoadError] = useState('');
  const refresh = useCallback(() => {
    if (mutationPending.current) return Promise.resolve();
    return reads.current.run(async signal => {
      const r = await fetch(`/api/client/${token}`, { cache: 'no-store', signal });
      if (r.status === 404 || r.status === 410) return { invalid: true as const };
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      return { invalid: false as const, data: d as ClientData };
    }, result => {
      if (result.invalid) { setData(undefined); setConsent(false); setLoadError('This client link is unavailable or expired. Ask the project owner for a current link.'); }
      else { setData(result.data); setLoadError(''); }
    }, e => setLoadError(e instanceof Error ? e.message : 'Unable to load project.'));
  }, [token]);
  useEffect(() => { refresh(); const timer = setInterval(refresh, 5000); const reader = reads.current; return () => { clearInterval(timer); reader.cancel(); }; }, [refresh]);
  useEffect(() => {
    if (busy || !actionControl.current) return;
    const control = actionControl.current;
    actionControl.current = null;
    const active = document.activeElement;
    if (!control.isConnected && (!active || active === document.body || !active.isConnected)) heading.current?.focus();
  }, [busy, data]);
  async function act(type: string, id?: string) { if (mutationPending.current || busy || loadError) return; mutationPending.current = true; reads.current.cancel(); actionControl.current = document.activeElement; setBusy(true); setError(''); try { const r = await fetch(`/api/client/${token}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, id }) }); if (r.status === 404 || r.status === 410) { setData(undefined); setConsent(false); setLoadError('This client link is unavailable or expired. Ask the project owner for a current link.'); return; } const d = await r.json(); if (!r.ok) throw new Error(d.error); setData(d); } catch (e) { setError(e instanceof TypeError || e instanceof SyntaxError ? 'Unable to confirm your decision. Check the latest project status before trying again.' : e instanceof Error ? e.message : 'Unable to confirm your decision. Check project status before trying again.'); } finally { mutationPending.current = false; setBusy(false); } }
  function retryRead() { actionControl.current = document.activeElement; void refresh(); }
  if (!data) return <main className="loading"><Loader2 size={23} className="spin" aria-hidden="true" /><p role={loadError ? 'alert' : 'status'}>{loadError || 'Opening your project…'}</p>{loadError && <button className="btn" onClick={retryRead}>Try again</button>}</main>;
  return <main className="client-shell"><header className="client-top"><div className="wordmark"><span className="brand-icon">n</span>nudge<span className="brand-dot">.</span></div><span className="mode-indicator"><span />{data.mode === 'demo' ? 'Simulated client experience' : 'PayPal sandbox · test money'}</span></header><div className="client-intro"><p className="eyebrow">GOOD WORK STARTS WITH A CLEAR AGREEMENT.</p><h1 ref={heading} tabIndex={-1}>{data.agreement?.title || 'Your project is being prepared.'}</h1><p>{data.agreement ? `${data.agreement.clientName}, here’s the work for your review.` : 'Your designer will share the scope once it is ready.'}</p></div>{loadError && <div className="error-banner" role="alert">{loadError} Showing the last loaded project; decisions are paused until connection recovers.<button className="btn" onClick={retryRead}>Retry connection</button></div>}{error && <div className="error-banner" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16} /></button></div>}
    {busy && <p role="status">Saving your decision. Please wait; do not repeat it until the result is known.</p>}{data.agreement && <section className="card client-card"><div className="card-header"><h2>Your project scope</h2><span className={`badge ${data.agreementStatus === 'accepted' ? 'green' : 'amber'}`}>{data.agreementStatus === 'accepted' ? 'Accepted' : 'For your review'}</span></div><p>These are the deliverables and boundaries of your project. Changes will be proposed separately.</p><div className="clauses">{data.agreement.clauses.map(c => <div key={c.id}><span className="clause-id">{c.id}</span><p>{c.text}</p></div>)}</div><div className="client-price">{money(data.agreement.amountCents)} <small>USD · Original project</small></div>{data.agreementStatus === 'approved' ? <><label className="client-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I have reviewed the scope, deliverables, exclusions, and project price above.</label><button className="btn primary full" disabled={busy || !!loadError || !consent} onClick={() => act('acceptAgreement')}>Accept project scope <Check size={16} /></button></> : <p className="client-receipt"><ShieldCheck size={17} />Scope accepted {data.agreementAcceptedAt && new Date(data.agreementAcceptedAt).toLocaleString()}. No payment was taken by this acceptance.</p>}</section>}
    {data.proposals.map(p => <section className="card client-card" key={p.id}><div className="card-header"><h2>Proposed additional work</h2><span className={`badge ${p.status === 'accepted' ? 'green' : 'amber'}`}>{p.status}</span></div><p>This work is separate from your original agreement.</p>{p.clientExplanation && <QuoteExplanation explanation={p.clientExplanation} />}{p.deliverables.map(d => <div className="deliverable" key={d}><FileText size={15} />{d}</div>)}<div className="client-price">{money(p.amountCents)} <small>USD · Additional price</small></div>{p.status === 'approved' ? <div className="card-actions"><button className="btn" disabled={busy || !!loadError} onClick={() => act('declineProposal', p.id)}>Decline change</button><button className="btn primary" disabled={busy || !!loadError} onClick={() => act('acceptProposal', p.id)}>Accept work & price <Check size={15} /></button></div> : <p className="client-receipt">{p.status === 'accepted' ? 'Change accepted. Your designer can now prepare an invoice.' : 'Change declined. No additional invoice will be created for this proposal.'}</p>}</section>)}
    {data.invoices.map(i => <section className="card client-card" key={i.id}><div className="card-header"><h2>Your invoice</h2><span className={`badge ${i.status === 'PAID' ? 'green' : 'amber'}`}>{i.status.replaceAll('_', ' ').toLowerCase()}</span></div><p className="invoice-id">{i.id}</p><div className="client-price">{money(i.outstandingCents)} <small>Outstanding of {money(i.amountCents)}</small></div>{i.payUrl && ['UNPAID', 'PARTIALLY_PAID'].includes(i.status) ? <a href={i.payUrl} className="btn primary full" target="_blank" rel="noreferrer">Pay securely on PayPal sandbox <ArrowUpRight size={16} /></a> : <p>{i.status === 'PAID' ? 'Thank you. This invoice is settled.' : data.mode === 'demo' ? 'This invoice is simulated. Your designer can simulate its payment in the workspace.' : 'Your invoice status is shown above. Contact your designer if you need a payment link.'}</p>}</section>)}
    <footer className="client-footer"><ShieldCheck size={15} /><span>Acceptance records the decision of the person holding this private link.</span><span>{data.mode === 'demo' ? 'Illustrative data only. No real payment, AI call, or email.' : 'Sandbox prototype. No real money is transferred.'}</span></footer>
  </main>;
}
