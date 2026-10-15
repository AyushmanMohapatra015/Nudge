import { NextRequest, NextResponse } from 'next/server';
import { authorized, sameOrigin } from '@/lib/auth';
import { readDeliveryPlanView, executeDeliveryCommand, DeliveryCommandError } from '@/lib/delivery-plan-actions';
import { boundedRequestText, ownerReadWindow, ownerActionWindow, RequestGuardError } from '@/lib/request-guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const denied = () => NextResponse.json({ error: 'Sign in to the sandbox workspace.' }, { status: 401, headers });
const failure = (error: unknown) => error instanceof DeliveryCommandError || error instanceof RequestGuardError ?
  NextResponse.json({ error: error.message }, { status: error.status, headers }) :
  NextResponse.json({ error: 'Delivery planning is unavailable. Refresh and review before trying again.' }, { status: 503, headers });
const limited = (retry: number) => NextResponse.json({ error: 'Too many workspace requests. Try again shortly.' }, {
  status: 429, headers: { ...headers, 'Retry-After': String(retry) },
});

export function GET(request: NextRequest) {
  if (!authorized(request)) return denied();
  const retry = ownerReadWindow.take(); if (retry) return limited(retry);
  try { return NextResponse.json(readDeliveryPlanView(), { headers }); } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403, headers });
  if (!authorized(request)) return denied();
  const retry = ownerActionWindow.take(); if (retry) return limited(retry);
  try {
    let body: unknown;
    let text: string;
    try { text = await boundedRequestText(request, 32 * 1024); }
    catch (error) {
      if (error instanceof RequestGuardError) throw error;
      throw new DeliveryCommandError('Invalid delivery command.', 400);
    }
    try { body = JSON.parse(text); } catch { throw new DeliveryCommandError('Invalid delivery command.', 400); }
    // Session may expire or be revoked while the bounded request body is read.
    if (!authorized(request)) return denied();
    return NextResponse.json(executeDeliveryCommand(body), { headers });
  } catch (error) { return failure(error); }
}
