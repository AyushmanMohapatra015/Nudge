import { hostname } from 'node:os';
import type { Workspace } from './domain';
export const processingOwner = () => ({ pid: process.pid, host: hostname() });
export function processingRecovery(lock: Workspace['processing'], probe = (pid: number) => { process.kill(pid, 0); }) {
  if (!lock?.owner || lock.owner.host !== hostname() || !Number.isSafeInteger(lock.owner.pid) || lock.owner.pid < 1) return { status: 'unknown' as const, reason: 'Process ownership cannot be verified on this host. Keep the action locked for manual inspection.' };
  try {
    probe(lock.owner.pid);
    return { status: 'running' as const, reason: 'The owning process is still present. Recovery cannot unlock an active or hung process.' };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ESRCH') return { status: 'exited' as const, reason: 'The owning process is no longer present on this host. Remote outcomes may still be uncertain.' };
    return { status: 'unknown' as const, reason: 'Unable to verify process exit. Keep the action locked.' };
  }
}
