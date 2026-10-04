import type { Workspace } from './domain';
import { equal } from './auth';

export const clientLinkLifetimeMs = 30 * 24 * 60 * 60 * 1000;
export const newClientLinkExpiry = (now = Date.now()) => new Date(now + clientLinkLifetimeMs).toISOString();
// Legacy/malformed expiries fail closed. Owner rotation supplies a new bounded link.
export function clientLinkValid(s: Workspace, token: string, now = Date.now()) {
  const expiry = s.clientLinkExpiresAt ? Date.parse(s.clientLinkExpiresAt) : NaN;
  return Number.isFinite(expiry) && expiry > now && equal(token, s.clientToken);
}
