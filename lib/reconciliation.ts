import type { Invoice } from './domain';
import { syncInvoice } from './paypal';
import { read, mutate, log, mode } from './store';

let inFlight: Promise<void> | undefined;
let nextCheck = 0;
// Recovery for delayed/missed webhooks while the authenticated owner workspace is open.
export async function reconcileOutstanding(fetchInvoice = syncInvoice, now = Date.now()) {
  if (mode() !== 'sandbox') return;
  if (inFlight) return inFlight;
  if (now < nextCheck) return;
  const snapshot = read();
  if (snapshot.processing) return;
  const candidates = snapshot.invoices.filter(i => (['UNPAID', 'PARTIALLY_PAID', 'OTHER'].includes(i.status) || i.pendingSend) && /^INV2-[A-Z0-9-]+$/.test(i.id)).slice(0, 10);
  nextCheck = now + 30000;
  inFlight = (async () => {
    const results = await Promise.allSettled(candidates.map(i => fetchInvoice(i)));
    const changed: { before: Invoice; after: Invoice }[] = [];
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const before = candidates[index], after = result.value;
      if (before.status !== after.status || before.outstandingCents !== after.outstandingCents || before.remoteStatus !== after.remoteStatus || before.pendingSend?.key !== after.pendingSend?.key) changed.push({ before, after });
    });
    if (!changed.length) return;
    // Never overwrite a newer owner/webhook mutation with a stale network result.
    if (read().version !== snapshot.version || read().processing) return;
    mutate(s => {
      if (s.version !== snapshot.version || s.processing) return;
      for (const { after } of changed) {
        s.invoices = s.invoices.map(i => i.id === after.id ? { ...i, status: after.status, remoteStatus: after.remoteStatus, outstandingCents: after.outstandingCents, payUrl: after.payUrl, pendingSend: after.pendingSend } : i);
        log(s, 'PayPal reconciliation', 'Automatic payment status check', `${after.id}: ${after.status}. Read-only recovery for delayed webhook delivery.`);
      }
    });
  })();
  try { await inFlight; } finally { inFlight = undefined; }
}
