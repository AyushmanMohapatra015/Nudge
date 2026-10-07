import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  try {
    db().prepare('SELECT 1 FROM workspaces LIMIT 1').get();
    return NextResponse.json({ status: 'ready' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
