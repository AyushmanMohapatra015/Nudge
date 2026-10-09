// Browser-only offline fixture. Never imported by app/ or components/.
import { createStudio, createAiHarness, clientToolRunner, AgStudioAiModule,
  type AgAiAgentRun, type AgAiChatSession, type AgAiHarness, type AgAiTelemetryEvent, type AgStudioApi } from 'ag-studio';
import { createStudioAnalystDefinition } from '../../lib/studio-analyst';
import type { OwnerAnalytics } from '../../lib/owner-analytics';

type Scenario = 'normal' | 'stale' | 'invalid' | 'unknown' | 'loop' | 'cancel';
let harness: AgAiHarness; let session: AgAiChatSession;
let api: AgStudioApi;
let turns = 0; let waiting = false;
let observations: AgAiTelemetryEvent[] = [];
let inputSummaries: unknown[] = [];
let snapshot: OwnerAnalytics;

const fixture = {
  async start(scenario: Scenario) {
    turns = 0; waiting = false; observations = []; inputSummaries = [];
    snapshot = { version: 2, mode: 'demo', asOf: '2026-10-09T00:00:00.000Z', currency: 'USD', invoices: [], changes: [],
      totals: { outstandingCents: 579, overdueCents: 123, unknownDueDateCents: 1, approvedExtraCents: 30001,
        awaitingAcceptanceCents: 30001, awaitingAcceptanceCount: 1, statusReviewCount: 0 } };
    const definition = createStudioAnalystDefinition(() => snapshot);
    const scriptedTurn: AgAiAgentRun = async function* (input, ctx) {
      turns++;
      inputSummaries.push({ tools: input.tools.map(tool => tool.name), messages: input.messages });
      if (scenario === 'cancel') {
        waiting = true;
        await new Promise<void>(resolve => {
          if (ctx.signal?.aborted) resolve();
          else ctx.signal?.addEventListener('abort', () => resolve(), { once: true });
        });
        return;
      }
      if (turns === 1 || scenario === 'loop') {
        if (scenario === 'stale') snapshot = { ...snapshot, version: 3 };
        const toolCallId = `fictional-call-${turns}`;
        yield { type: 'TOOL_CALL_START', toolCallId, toolCallName: scenario === 'unknown' ? 'send_invoice' : 'nudge_snapshot_totals' };
        yield { type: 'TOOL_CALL_ARGS', toolCallId,
          delta: JSON.stringify(scenario === 'invalid' ? { expectedVersion: 2, pay: true } : { expectedVersion: 2 }) };
        yield { type: 'TOOL_CALL_END', toolCallId };
      } else {
        yield { type: 'TEXT_MESSAGE_START', messageId: 'fictional-answer', role: 'assistant' };
        yield { type: 'TEXT_MESSAGE_CONTENT', messageId: 'fictional-answer', delta: 'Offline scripted response. No model was called.' };
        yield { type: 'TEXT_MESSAGE_END', messageId: 'fictional-answer' };
      }
    };
    const runner = clientToolRunner({ ...definition, run: scriptedTurn });
    api = createStudio(document.getElementById('studio')!, { data: { sources: [] } }, { modules: [AgStudioAiModule] });
    harness = createAiHarness(api, () => ({ agents: [runner], primary: definition.id,
      observers: [{ onEvent: event => observations.push(event) }] }));
    session = await harness.createThread({ agentId: definition.id });
    session.sendMessage('Explain this fictional stored snapshot.');
  },
  state() {
    return { status: session.status, turns, waiting, observations, inputSummaries,
      messages: session.messages, snapshot, agents: harness.agents.map(agent => agent.id), threads: harness.threads.length };
  },
  cancel() { session.cancel(); },
  async deleteThread() { await harness.deleteThread(session.threadId); },
  dispose() { session?.close(); harness?.dispose?.(); api?.destroy(); },
};
declare global { interface Window { studioAgentFixture: typeof fixture } }
window.studioAgentFixture = fixture;
