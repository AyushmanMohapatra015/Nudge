import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, read, mutate, log, mode, requireIdle } from '@/lib/store';
import { verifyWebhook, syncInvoice } from '@/lib/paypal';
import { boundedRequestText, webhookWindow, RequestGuardError } from '@/lib/request-guards';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (mode() !== 'sandbox') return NextResponse.json({ error: 'Webhooks are disabled in simulation mode.' }, { status: 400 });
  const signedHeaders = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'];
  if (signedHeaders.some(name => !request.headers.get(name))) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  const retry = webhookWindow.take();
  if (retry) return NextResponse.json({ error: 'Webhook capacity exceeded; retry delivery.' }, { status: 503, headers: { 'Retry-After': String(retry), 'Cache-Control': 'no-store' } });
  try {
    const rawBody = await boundedRequestText(request, 262144);
    const event = z.object({ id: z.string().min(1).max(200), event_type: z.string(), resource: z.record(z.unknown()).optional() }).passthrough().parse(JSON.parse(rawBody));
    if (!await verifyWebhook(request.headers, event, rawBody)) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
    if (db().prepare('SELECT id FROM webhook_events WHERE id = ?').get(event.id)) return NextResponse.json({ duplicate: true });
    if (!event.event_type.startsWith('INVOICING.INVOICE.')) return NextResponse.json({ ignored: true });
    // Actual Invoicing notifications can wrap the invoice inside resource.invoice.
    const nested = event.resource?.invoice;
    const candidate = nested && typeof nested === 'object' && 'id' in nested ? nested.id : event.resource?.id;
    const id = typeof candidate === 'string' ? candidate : undefined;
    const snapshot = read();
    const current = snapshot.invoices.find(i => i.id === id);
    if (!current) return NextResponse.json({ ignored: true });
    // Fetch authoritative current state instead of trusting event order or treating every PAID event as full settlement.
    const invoice = await syncInvoice(current);
    mutate(s => {
      requireIdle(s); // Return 503 below so PayPal retries during an owner action rather than race its state update.
      if (db().prepare('SELECT id FROM webhook_events WHERE id = ?').get(event.id)) return;
      // Another webhook/owner action can finish while this remote GET is in flight.
      // Reject the stale result atomically; do not record it as processed or erase newer evidence.
      if (s.version !== snapshot.version) throw new Error('Workspace changed during webhook reconciliation. Retry delivery.');
      const latest = s.invoices.find(i => i.id === invoice.id)!;
      s.invoices = s.invoices.map(i => i.id === invoice.id ? { ...latest, status: invoice.status, remoteStatus: invoice.remoteStatus, outstandingCents: invoice.outstandingCents, payUrl: invoice.payUrl, pendingSend: invoice.pendingSend } : i);
      db().prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)').run(event.id, new Date().toISOString());
      log(s, 'Verified PayPal webhook', 'Payment status reconciled', `${invoice.id}: ${invoice.status}. Event: ${event.event_type}`, event.id);
    });
    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof RequestGuardError) return NextResponse.json({ error: e.message }, { status: e.status === 408 ? 503 : e.status, headers: { 'Cache-Control': 'no-store', ...(e.status === 408 ? { 'Retry-After': '10' } : {}) } });
    return NextResponse.json({ error: 'Webhook processing failed; retry delivery.' }, { status: 503 });
  }
}
