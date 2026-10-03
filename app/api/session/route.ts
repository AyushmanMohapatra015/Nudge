import { NextRequest, NextResponse } from 'next/server';
import { equal, sameOrigin, sessionToken } from '@/lib/auth';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 });
  try {
    const data = await request.json();
    if (typeof data.token !== 'string' || !equal(data.token, process.env.NUDGE_ADMIN_TOKEN || '') || !process.env.NUDGE_ADMIN_TOKEN) return NextResponse.json({ error: 'Invalid workspace token.' }, { status: 401 });
    const result = NextResponse.json({ ok: true }); result.cookies.set('nudge_session', sessionToken(), { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'strict', path: '/', maxAge: 28800 }); return result;
  } catch { return NextResponse.json({ error: 'Check the workspace token configuration.' }, { status: 400 }); }
}
