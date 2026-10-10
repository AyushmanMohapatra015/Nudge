import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized, sameOrigin } from './auth';
import { realAiEnabled } from './ai-access';
import { mode } from './store';
import { boundedRequestText, RequestGuardError, RequestWindow } from './request-guards';
import { studioSnapshotSummary } from './studio-analyst';
import type { OwnerAnalytics } from './owner-analytics';

const inputSchema = z.object({ expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  question: z.string().trim().min(1).max(1000) }).strict();
const replySchema = z.object({ text: z.string().trim().min(1).max(2000),
  usage: z.object({ inputTokens: z.number().int().min(0).max(4096), outputTokens: z.number().int().min(0).max(256) }).strict() }).strict();
export type StudioReplyAdapter = (input: { question: string; snapshot: ReturnType<typeof studioSnapshotSummary>;
  maxOutputTokens: 256; signal: AbortSignal }) => Promise<unknown>;

/** Trusted server configuration, never browser-supplied. No adapter is registered by the website. */
export function createStudioAgentPost(options: { getSnapshot: () => OwnerAnalytics; adapter?: StudioReplyAdapter;
  enabled?: () => boolean; window?: RequestWindow; deadlineMs?: number }) {
  const window = options.window ?? new RequestWindow(4);
  let inFlight = false;
  const json = (body: unknown, status = 200, retry?: number) => NextResponse.json(body, { status,
    headers: { 'Cache-Control': 'no-store', ...(retry ? { 'Retry-After': String(retry) } : {}) } });
  return async (request: NextRequest) => {
    if (!sameOrigin(request)) return json({ error: 'Cross-site request rejected.' }, 403);
    if (!authorized(request)) return json({ error: 'Sign in to the sandbox workspace.' }, 401);
    if (mode() !== 'sandbox') return json({ error: 'Dashboard AI requires an authenticated sandbox workspace.' }, 503);
    if (!options.adapter || !(options.enabled ?? realAiEnabled)()) return json({ error: 'Dashboard AI is not connected or enabled.' }, 503);
    const retry = window.take();
    if (retry) return json({ error: 'Dashboard request limit reached. Try again later.' }, 429, retry);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({ error: 'Send a JSON report request.' }, 415);
    let input: z.infer<typeof inputSchema>;
    try { input = inputSchema.parse(JSON.parse(await boundedRequestText(request, 8192, 5000))); }
    catch (cause) { return json({ error: cause instanceof RequestGuardError ? cause.message : 'Invalid report request.' }, cause instanceof RequestGuardError ? cause.status : 400); }
    if (request.signal.aborted) return json({ error: 'Report request cancelled.' }, 408);
    if (inFlight) return json({ error: 'A dashboard request is still in progress.' }, 409);
    let snapshot: ReturnType<typeof studioSnapshotSummary>;
    try { snapshot = studioSnapshotSummary(options.getSnapshot()); }
    catch { return json({ error: 'Snapshot totals are unavailable. Refresh the owner report.' }, 503); }
    if (snapshot.version !== input.expectedVersion) return json({ error: 'Snapshot changed. Refresh the owner report.' }, 409);
    inFlight = true;
    const controller = new AbortController(); let timedOut = false;
    const cancel = () => controller.abort(); request.signal.addEventListener('abort', cancel, { once: true });
    if (request.signal.aborted) cancel();
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.deadlineMs ?? 10000);
    const stopped = new Promise<never>((_, reject) => {
      if (controller.signal.aborted) reject(Error('cancelled'));
      else controller.signal.addEventListener('abort', () => reject(Error('cancelled')), { once: true });
    });
    // Retain the lock until the adapter settles, even if it ignores cancellation.
    const job = Promise.resolve().then(() => {
      if (controller.signal.aborted) throw Error('cancelled');
      return options.adapter!({ question: input.question, snapshot, maxOutputTokens: 256, signal: controller.signal });
    });
    void job.then(() => { inFlight = false; }, () => { inFlight = false; });
    try {
      const reply = replySchema.parse(await Promise.race([job, stopped]));
      if (controller.signal.aborted) return json({ error: 'Report request cancelled.' }, timedOut ? 504 : 408);
      // Reject a now-stale answer, without retries or substituting a simulation.
      if (studioSnapshotSummary(options.getSnapshot()).version !== snapshot.version) return json({ error: 'Snapshot changed. Refresh the owner report.' }, 409);
      return json({ ...reply, snapshotVersion: snapshot.version, asOf: snapshot.asOf, stateSource: 'local-records' });
    } catch { return json({ error: timedOut ? 'Dashboard response timed out. No retry was made.'
      : controller.signal.aborted ? 'Report request cancelled.' : 'Dashboard response unavailable. No retry was made.' }, timedOut ? 504 : controller.signal.aborted ? 408 : 502); }
    finally { clearTimeout(timer); request.signal.removeEventListener('abort', cancel); }
  };
}
