import { NextRequest, NextResponse } from 'next/server';
import { authorized } from '@/lib/auth';
import { db, mode } from '@/lib/store';
import { ownerReadWindow } from '@/lib/request-guards';
import { ownerAnalytics } from '@/lib/owner-analytics';
import { readStudioRequestAllowance } from '@/lib/studio-request-allowance';
import { emptyStudioAllowance, studioAllowanceViewSchema } from '@/lib/studio-allowance-view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

/** Local snapshot only: deliberately no payment reconciliation or workspace seeding. */
export function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Sign in to the sandbox workspace.' }, { status: 401, headers });
  const retry = ownerReadWindow.take();
  if (retry) return NextResponse.json({ error: 'Too many workspace reads. Try again shortly.' }, {
    status: 429, headers: { ...headers, 'Retry-After': String(retry) },
  });
  try {
    const row = db().prepare('SELECT body FROM workspaces WHERE mode = ?').get(mode()) as { body: string } | undefined;
    if (!row) return NextResponse.json({ error: 'Open the workspace before viewing analytics.' }, { status: 404, headers });
    let dashboardAllowance = emptyStudioAllowance(mode() === 'demo' ? 'simulation' : 'unavailable');
    if (mode() === 'sandbox') {
      try {
        const status = readStudioRequestAllowance(db());
        dashboardAllowance = status.state === 'unapproved' ? emptyStudioAllowance('unapproved') : studioAllowanceViewSchema.parse({
          state: status.state, remainingRequests: status.remainingRequests, maxRequests: status.maxRequests,
          usedRequests: status.usedRequests, expiresAt: new Date(status.expiresAt!).toISOString(),
        });
      } catch { /* Keep reports usable, but never imply known allowance after a storage failure. */ }
    }
    return NextResponse.json({ ...ownerAnalytics(JSON.parse(row.body)), dashboardAllowance, stateSource: 'local-records' }, { headers });
  } catch {
    return NextResponse.json({ error: 'Analytics are unavailable. Review the workspace before trying again.' }, { status: 503, headers });
  }
}
