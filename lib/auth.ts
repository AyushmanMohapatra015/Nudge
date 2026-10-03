import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { mode } from './store';
export function sessionToken() {
  const secret = process.env.NUDGE_ADMIN_TOKEN;
  if (!secret || secret.length < 24) throw new Error('Set NUDGE_ADMIN_TOKEN to a random value of at least 24 characters before using sandbox mode.');
  return createHmac('sha256', secret).update('nudge-admin-session-v1').digest('hex');
}
export function equal(a: string, b: string) { const left = Buffer.from(a), right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export function authorized(request: NextRequest) {
  if (mode() === 'demo') return true;
  try { return equal(request.cookies.get('nudge_session')?.value || '', sessionToken()); } catch { return false; }
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  // Next may normalize nextUrl to localhost while the browser uses 127.0.0.1.
  // Compare the browser's origin to the actual HTTP Host, including its port.
  let matches = !origin;
  if (origin) { try { const parsed = new URL(origin); matches = ['http:', 'https:'].includes(parsed.protocol) && parsed.host === request.headers.get('host'); } catch { return false; } }
  return matches && (!fetchSite || ['same-origin', 'none'].includes(fetchSite));
}
