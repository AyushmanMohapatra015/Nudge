import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, read, mutate, log, mode, requireIdle } from '@/lib/store';
import { verifyWebhook, syncInvoice } from '@/lib/paypal';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (mode() !== 'sandbox') return NextResponse.json({ error: 'Webhooks are disabled in simulation mode.' }, { status: 400 });
  try {
    const rawBody = await request.text();
    const event = z.object({ id: z.string().min(1).max(200), event_type: z.string(), resource: z.record(z.unknown()).optional() }).passthrough().parse(JSON.parse(rawBody));
    if (!await verifyWebhook(request.headers, event, rawBody)) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
    if (db().prepare('SELECT id FROM webhook_events WHERE id = ?').get(event.id)) return NextResponse.json({ duplicate: true });
    if (!event.event_type.startsWith('INVOICING.INVOICE.')) return NextResponse.json({ ignored: true });
    // Actual Invoicing notifications can wrap the invoice inside resource.invoice.
    const nested = event.resource?.invoice;
    const candidate = nested && typeof nested === 'object' && 'id' in nested ? nested.id : event.resource?.id;
    const id = typeof candidate === 'string' ? candidate : undefined;
    const current = read().invoices.find(i => i.id === id);
    if (!current) return NextResponse.json({ ignored: true });
    // Fetch authoritative current state instead of trusting event order or treating every PAID event as full settlement.
    const invoice = await syncInvoice(current);
    mutate(s => {
      requireIdle(s); // Return 503 below so PayPal retries during an owner action rather than race its state update.
      if (db().prepare('SELECT id FROM webhook_events WHERE id = ?').get(event.id)) return;
      const latest = s.invoices.find(i => i.id === invoice.id)!;
      s.invoices = s.invoices.map(i => i.id === invoice.id ? { ...latest, status: invoice.status, remoteStatus: invoice.remoteStatus, outstandingCents: invoice.outstandingCents, payUrl: invoice.payUrl } : i);
      db().prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)').run(event.id, new Date().toISOString());
      log(s, 'Verified PayPal webhook', 'Payment status reconciled', `${invoice.id}: ${invoice.status}. Event: ${event.event_type}`, event.id);
    });
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: 'Webhook processing failed; retry delivery.' }, { status: 503 }); }
}
