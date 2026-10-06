// Bounded fictional scope evaluation only. No store, owner API or PayPal imports.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { analyzeWithElastic } from '../lib/elastic-ai';
import { elasticScopeInstructions } from '../lib/scope-instructions';
import { scopeAiPayload } from '../lib/ai-payload';
import { scopeAgreement } from '../evaluation/scope-cases';
import { scopeChallenges, scoreScopeChallenge } from '../evaluation/scope-challenges';

async function main() {
  const args = process.argv.slice(2), mock = args.includes('--mock'), live = args.includes('--live');
  const modelArg = args.find(a => a.startsWith('--inference-id='));
  const failureArg = args.find(a => a.startsWith('--mock-failure='));
  const casesArg = args.find(a => a.startsWith('--cases='));
  const mockFailure = failureArg?.slice('--mock-failure='.length);
  if (mock === live || new Set(args).size !== args.length || args.some(a => !['--mock', '--live', modelArg, failureArg, casesArg].includes(a)) || (failureArg && (!mock || !['http', 'citation', 'classification', 'interactive', 'blank'].includes(mockFailure!)))) throw Error('configuration');
  const caseIds = casesArg ? casesArg.slice('--cases='.length).split(',') : scopeChallenges.map(c => c.id);
  if (!caseIds.length || new Set(caseIds).size !== caseIds.length || caseIds.some(id => !scopeChallenges.some(c => c.id === id))) throw Error('configuration');
  const selected = caseIds.map(id => scopeChallenges.find(c => c.id === id)!);
  const envNames = ['NUDGE_AI_ENABLED', 'NUDGE_AI_PROVIDER', 'ELASTIC_KIBANA_URL', 'ELASTIC_API_KEY', 'ELASTIC_AGENT_ID', 'ELASTIC_SPACE_ID', 'ELASTIC_INFERENCE_ID'];
  const before = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  if (mock) Object.assign(process.env, { NUDGE_AI_ENABLED: 'false', NUDGE_AI_PROVIDER: 'elastic', ELASTIC_KIBANA_URL: 'https://fictional.kb.elastic.cloud', ELASTIC_API_KEY: 'fictional-mock-key', ELASTIC_AGENT_ID: 'fictional-scope', ELASTIC_SPACE_ID: '', ELASTIC_INFERENCE_ID: '.fictional-chat_completion' });
  if (process.env.NUDGE_AI_ENABLED !== 'false' || process.env.NUDGE_AI_PROVIDER !== 'elastic') throw Error('configuration');
  const inferenceId = modelArg?.slice('--inference-id='.length) || process.env.ELASTIC_INFERENCE_ID;
  if (live && (!inferenceId || !/^[a-zA-Z0-9_.-]{1,256}$/.test(inferenceId))) throw Error('configuration');
  if (inferenceId) process.env.ELASTIC_INFERENCE_ID = inferenceId;
  let origin: URL;
  try { origin = new URL(process.env.ELASTIC_KIBANA_URL || ''); } catch { throw Error('configuration'); }
  const key = process.env.ELASTIC_API_KEY || '', agent = process.env.ELASTIC_AGENT_ID || '', space = process.env.ELASTIC_SPACE_ID || '';
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/' || origin.port || !['.elastic.cloud', '.elastic-cloud.com', '.cloud.es.io'].some(s => origin.hostname.endsWith(s)) || !key || /\s/.test(key) || !/^[a-zA-Z0-9_-]{1,128}$/.test(agent) || agent === 'elastic-ai-agent' || (space && !/^[a-zA-Z0-9_-]{1,128}$/.test(space))) throw Error('configuration');
  const endpoint = origin.origin + (space ? `/s/${encodeURIComponent(space)}` : '') + '/api/agent_builder/converse';
  const path = resolve('data/scope-challenges', randomUUID()); mkdirSync(path, { recursive: true });
  const instructionHash = createHash('sha256').update(elasticScopeInstructions).digest('hex');
  const save = (name: string, value: unknown) => writeFileSync(resolve(path, name), JSON.stringify(value, null, 2), { flag: 'wx' });
  save('plan.json', { live, maxRequests: selected.length, caseIds, instructionHash, inferenceId: live ? inferenceId : 'fictional', observedInputStop: 75000, observedOutputStop: 10000, note: 'Observed thresholds stop subsequent calls; they cannot cap a request already running. No retry or automatic continuation.' });
  let totalRequests = 0, observedInput = 0, observedOutput = 0, unknownUsage = false, passed = 0;
  try {
    for (const fixture of selected) {
      if (totalRequests >= selected.length || observedInput >= 75000 || observedOutput >= 10000 || unknownUsage) throw Error('usage-stop');
      let caseRequests = 0, httpStatus: number | null = null, tokens: { input: number | null; output: number | null } = { input: null, output: null };
      let providerOutcome: unknown = null;
      globalThis.fetch = async (input, init) => {
        if (++caseRequests !== 1 || ++totalRequests > selected.length || String(input) !== endpoint || init?.method !== 'POST') throw Error('request-guard');
        const body = JSON.parse(String(init.body));
        if (body.agent_id !== agent || body._execution_mode !== 'local' || body.conversation_id !== undefined || body.access_control?.access_mode !== 'private' || body.inference_id !== process.env.ELASTIC_INFERENCE_ID || body.configuration_overrides?.instructions !== elasticScopeInstructions || JSON.stringify(body.configuration_overrides?.tools) !== '[{"tool_ids":[]}]' || body.configuration_overrides?.enable_elastic_capabilities !== false || JSON.stringify(body.configuration_overrides?.skill_ids) !== '[]' || body.input !== JSON.stringify(scopeAiPayload(fixture.request, scopeAgreement))) throw Error('request-guard');
        save(`${fixture.id}.attempt.json`, { caseId: fixture.id, startedAt: new Date().toISOString(), retryAllowed: false, live });
        let response: Response;
        if (mock) {
          const analysis = { classification: mockFailure === 'classification' ? 'included' : fixture.expected, summary: 'Fictional mock response for validating the evaluation harness only.', references: mockFailure === 'citation' ? ['S99'] : fixture.references, questions: fixture.needsQuestion ? [fixture.mockQuestion!] : [], deliverables: [mockFailure === 'blank' ? '   ' : fixture.mockDeliverable] };
          response = Response.json(mockFailure === 'http' ? { error: 'Unprinted mocked error' } : { status: mockFailure === 'interactive' ? 'awaiting_prompt' : 'completed', conversation_id: 'fictional-conversation', steps: [], response: { message: JSON.stringify(analysis) }, model_usage: { input_tokens: 120, output_tokens: 80 } }, { status: mockFailure === 'http' ? 429 : 200 });
        } else response = await originalFetch(input, init);
        httpStatus = response.status;
        if (!response.body) return response;
        const reader = response.body.getReader(), parts: Uint8Array[] = []; let bytes = 0;
        for (;;) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 131072) { await reader.cancel(); throw Error('bounded-response'); } parts.push(part.value); }
        const buffer = Buffer.concat(parts);
        try {
          const data = JSON.parse(buffer.toString('utf8'));
          const count = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0 ? n as number : null;
          tokens = { input: count(data.model_usage?.input_tokens), output: count(data.model_usage?.output_tokens) };
          const types = ['tool_call', 'ask_user_question', 'confirmation', 'authorization', 'reasoning'];
          providerOutcome = { status: ['completed', 'awaiting_prompt', 'failed'].includes(data.status) ? data.status : 'other', promptsPresent: Boolean(data.response && 'prompts' in data.response), codeFenced: typeof data.response?.message === 'string' && /^```(?:json)?[ \t]*\r?\n[\s\S]*?\r?\n```$/.test(data.response.message.trim()), stepTypes: Array.isArray(data.steps) ? data.steps.map((s: any) => types.includes(s?.type) ? s.type : 'other').slice(0, 100) : null };
        } catch { /* Adapter validates. Never retain raw responses, reasoning or IDs. */ }
        return new Response(buffer, { status: response.status, headers: { 'content-type': 'application/json' } });
      };
      const started = Date.now();
      try {
        process.env.NUDGE_AI_ENABLED = 'true';
        const output = await analyzeWithElastic(fixture.request, scopeAgreement);
        const score = scoreScopeChallenge(fixture.id, output);
        save(`${fixture.id}.result.json`, { caseId: fixture.id, live, instructionHash, requests: caseRequests, latencyMs: Date.now() - started, tokens, providerOutcome, output, score, manualSemanticReview: 'pending', modelIdentity: 'requested endpoint; actual internal models unverified', cost: 'unknown' });
        console.log(`${mock ? 'MOCK' : 'LIVE'} ${fixture.id}: ${score.automatedChecksPassed ? 'checks pass' : 'checks FAIL'}; classification=${output.classification}; questions=${output.questions.length}; input=${tokens.input ?? 'unknown'}; output=${tokens.output ?? 'unknown'}`);
        if (!score.automatedChecksPassed) throw Error('score-failure');
        passed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const category = message === 'score-failure' ? 'score-failure' : /^Elastic request failed \(\d{3}\)/.test(message) ? 'provider-http-error' : message.startsWith('Elastic returned') ? 'unsupported-or-invalid-output' : 'transport-or-guard';
        save(`${fixture.id}.failure.json`, { caseId: fixture.id, category, httpStatus, requests: caseRequests, tokens, providerOutcome, live, retryAllowed: false });
        console.log(`STOP ${fixture.id}: ${category}; HTTP=${httpStatus ?? 'unknown'}; no retry or later case.`);
        process.exitCode = 1; break;
      } finally {
        process.env.NUDGE_AI_ENABLED = 'false';
        observedInput += tokens.input ?? 0; observedOutput += tokens.output ?? 0;
        unknownUsage ||= tokens.input === null || tokens.output === null;
      }
    }
  } catch { console.log('STOP: observed usage threshold or unknown usage; no further call.'); process.exitCode = 1; }
  finally {
    save('summary.json', { live, totalRequests, automatedPassed: passed, caseCount: selected.length, caseIds, reportedInput: observedInput, reportedOutput: observedOutput, unknownUsage, manualReviewRequired: true, heldOut: false, cost: 'unknown', noAutomaticRetry: true });
    globalThis.fetch = originalFetch;
    for (const name of envNames) { if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name]; }
    console.log(JSON.stringify({ artifactDirectory: path, live, totalRequests, automatedPassed: passed, manualReviewRequired: true }));
  }
}
main().catch(() => { console.error('STOP: evaluation configuration failed; no raw credentials or provider details printed.'); process.exitCode = 1; });
