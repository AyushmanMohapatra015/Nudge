'use client';
import { useState } from 'react';
export default function ClientLinkSettings({ token, busy, act }: { token: string; busy: boolean; act: (action: Record<string, unknown>) => Promise<void> }) {
  const [confirmed, setConfirmed] = useState(false);
  return <section className="card editor brief-review"><h2>Private client access</h2><p>Anyone holding the current link can view shared work and record pending decisions. Replace it if you shared it with the wrong person.</p><p>Replacing the link blocks the previous Nudge URL. Existing acceptance records and invoices remain in place. PayPal payment URLs and information already viewed are not revoked.</p><label className="brief-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />I understand the old Nudge link will stop working and I must share the new link privately.</label><button className="btn" disabled={busy || !confirmed} onClick={() => act({ type: 'replaceClientLink', expectedToken: token, confirmed })}>Replace client link</button></section>;
}
