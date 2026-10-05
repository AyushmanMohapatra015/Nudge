import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { mode } from './store';
export const sessionLifetimeSeconds = 8 * 60 * 60;
function signingSecret() {
  const secret = process.env.NUDGE_ADMIN_TOKEN;
  if (!secret || secret.length < 24 || secret.length > 1024) throw new Error('Set NUDGE_ADMIN_TOKEN to a random value of 24 to 1024 characters before using sandbox mode.');
  return secret;
}
function signSession(payload: string) { return createHmac('sha256', signingSecret()).update(`nudge-owner-session:${payload}`).digest('hex'); }
export function sessionToken(now = Date.now()) {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Invalid session issuance time.');
  const payload = `v2.${now}.${randomBytes(16).toString('hex')}`;
  return `${payload}.${signSession(payload)}`;
}
export function validSession(token: string, now = Date.now()) {
  try {
    if (token.length > 160 || !Number.isSafeInteger(now) || now < 0) return false;
    const match = /^v2\.(0|[1-9]\d{0,15})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token);
    if (!match) return false;
    const issuedAt = Number(match[1]), age = now - issuedAt;
    if (!Number.isSafeInteger(issuedAt) || age < 0 || age >= sessionLifetimeSeconds * 1000) return false;
    return equal(match[3], signSession(`v2.${match[1]}.${match[2]}`));
  } catch { return false; }
}
export function equal(a: string, b: string) { const left = Buffer.from(a), right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export function authorized(request: NextRequest) {
  if (mode() === 'demo') return true;
  try { return validSession(request.cookies.get('nudge_session')?.value || ''); } catch { return false; }
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
