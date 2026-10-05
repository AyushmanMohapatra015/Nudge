import { NextRequest, NextResponse } from 'next/server';
import { equal, sameOrigin, sessionToken, sessionLifetimeSeconds } from '@/lib/auth';
import { boundedRequestText, ownerLoginWindow, RequestGuardError } from '@/lib/request-guards';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 });
  const retry = ownerLoginWindow.take();
  if (retry) return NextResponse.json({ error: 'Too many login attempts. Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(retry), 'Cache-Control': 'no-store' } });
  try {
    const data = JSON.parse(await boundedRequestText(request, 4096));
    if (!data || typeof data.token !== 'string' || data.token.length > 1024 || !equal(data.token, process.env.NUDGE_ADMIN_TOKEN || '') || !process.env.NUDGE_ADMIN_TOKEN) return NextResponse.json({ error: 'Invalid workspace token.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    const result = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } }); result.cookies.set('nudge_session', sessionToken(), { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'strict', path: '/', maxAge: sessionLifetimeSeconds }); return result;
  } catch (e) { return NextResponse.json({ error: e instanceof RequestGuardError ? e.message : 'Check the workspace token configuration.' }, { status: e instanceof RequestGuardError ? e.status : 400, headers: { 'Cache-Control': 'no-store' } }); }
}
