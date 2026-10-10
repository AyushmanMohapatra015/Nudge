import type { AgAiAgentRun } from 'ag-studio';
import { z } from 'zod';
import { studioSnapshotSummary } from './studio-analyst';
import type { OwnerAnalytics } from './owner-analytics';

const questionSchema = z.string().trim().min(1).max(1000);
const replySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  usage: z.object({ inputTokens: z.number().int().min(0).max(4096), outputTokens: z.number().int().min(0).max(256) }).strict(),
  snapshotVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  asOf: z.string().datetime(), stateSource: z.literal('local-records'),
}).strict();

async function boundedReply(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw Error('Missing response');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 8192) throw Error('Oversized response');
      chunks.push(next.value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

/** Prepared, unregistered bridge. No provider credentials, history, tools or totals sent. */
export function createStudioAgentBridge(getSnapshot: () => OwnerAnalytics): AgAiAgentRun {
  return async function* (input, ctx) {
    if (ctx.signal?.aborted) return;
    const controller = new AbortController();
    const cancel = () => controller.abort();
    ctx.signal?.addEventListener('abort', cancel, { once: true });
    if (ctx.signal?.aborted) cancel();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; cancel(); }, 12000);
    try {
      const snapshot = studioSnapshotSummary(getSnapshot());
      const message = input.messages.filter(message => message.role === 'user').at(-1);
      const question = questionSchema.parse(message?.content);
      const response = await fetch('/api/analytics/agent', { method: 'POST', credentials: 'same-origin',
        cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedVersion: snapshot.version, question }) });
      if (!response.ok) {
        await response.body?.cancel();
        throw Error('Unavailable response');
      }
      if (response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw Error('Invalid response type');
      const reply = replySchema.parse(await boundedReply(response));
      const current = studioSnapshotSummary(getSnapshot());
      if (reply.snapshotVersion !== snapshot.version || reply.asOf !== snapshot.asOf
        || current.version !== snapshot.version || current.asOf !== snapshot.asOf) throw Error('Stale response');
      if (controller.signal.aborted) { if (ctx.signal?.aborted) return; throw Error('Timeout'); }
      const messageId = crypto.randomUUID();
      yield { type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' };
      yield { type: 'TEXT_MESSAGE_CONTENT', messageId, delta: reply.text };
      yield { type: 'TEXT_MESSAGE_END', messageId };
    } catch {
      controller.abort();
      if (ctx.signal?.aborted) return;
      throw Error(timedOut ? 'Dashboard response timed out. No retry was made.' : 'Dashboard response unavailable. Refresh the report before trying again.');
    } finally { clearTimeout(timer); ctx.signal?.removeEventListener('abort', cancel); }
  };
}
