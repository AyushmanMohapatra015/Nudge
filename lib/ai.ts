import { analysisSchema, simulatedAnalysis, validateReferences, type Agreement, type Analysis } from './domain';
import { mode } from './store';
import { requireRealAiAccess } from './ai-access';
import { analyzeWithElastic } from './elastic-ai';
import { scopeAiPayload } from './ai-payload';
import { toolScopeInstructions } from './scope-instructions';

export function aiCredentialsConfigured() {
  const provider = process.env.NUDGE_AI_PROVIDER || 'anthropic';
  if (provider === 'elastic') return !!(process.env.ELASTIC_KIBANA_URL && process.env.ELASTIC_API_KEY && process.env.ELASTIC_AGENT_ID);
  if (provider === 'astropods') return !!(process.env.ASTRO_GATEWAY_URL && process.env.ASTRO_GATEWAY_API_KEY && process.env.ASTRO_MODEL);
  return provider === 'anthropic' && !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL);
}

export async function analyze(request: string, agreement: Agreement): Promise<Analysis> {
  if (mode() === 'demo') return simulatedAnalysis(request, agreement);
  requireRealAiAccess();
  const provider = process.env.NUDGE_AI_PROVIDER || 'anthropic';
  if (provider === 'elastic') return analyzeWithElastic(request, agreement);
  if (!['anthropic', 'astropods'].includes(provider)) throw new Error('NUDGE_AI_PROVIDER must be anthropic, astropods or elastic.');
  let endpoint = 'https://api.anthropic.com/v1/messages';
  let model = process.env.ANTHROPIC_MODEL;
  const headers: Record<string, string> = { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' };
  if (provider === 'astropods') {
    if (!process.env.ASTRO_GATEWAY_URL || !process.env.ASTRO_GATEWAY_API_KEY) throw new Error('Configure the Astropods managed gateway locally. No simulated AI is substituted.');
    let gateway: URL;
    try { gateway = new URL(process.env.ASTRO_GATEWAY_URL); }
    catch { throw new Error('ASTRO_GATEWAY_URL must be a valid HTTPS gateway host.'); }
    if (gateway.protocol !== 'https:' || gateway.username || gateway.password || gateway.search || gateway.hash || gateway.pathname !== '/') throw new Error('ASTRO_GATEWAY_URL must be the HTTPS gateway host supplied by Astropods.');
    endpoint = `${gateway.origin}/anthropic/v1/messages`;
    model = process.env.ASTRO_MODEL;
    if (!model || !/^bedrock\/claude-[A-Za-z0-9-]+$/.test(model)) throw new Error('ASTRO_MODEL must be a supported bedrock/claude model ID.');
    headers['x-bf-vk'] = process.env.ASTRO_GATEWAY_API_KEY;
  } else {
    if (!process.env.ANTHROPIC_API_KEY || !model) throw new Error('Configure the Anthropic API key and model locally. No simulated AI is substituted.');
    headers['x-api-key'] = process.env.ANTHROPIC_API_KEY;
  }
  let response: Response;
  try { response = await fetch(endpoint, {
    method: 'POST', headers, redirect: 'error', cache: 'no-store',
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({ model, max_tokens: 1400,
      system: toolScopeInstructions,
      messages: [{ role: 'user', content: JSON.stringify(scopeAiPayload(request, agreement)) }],
      tools: [{ name: 'report_scope', description: 'Return a scope comparison for human review; never executes an external action.', input_schema: { type: 'object', properties: { classification: { type: 'string', enum: ['included', 'additional', 'ambiguous'] }, summary: { type: 'string' }, references: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: { type: 'string' } }, deliverables: { type: 'array', items: { type: 'string' } } }, required: ['classification', 'summary', 'references', 'questions', 'deliverables'], additionalProperties: false } }], tool_choice: { type: 'tool', name: 'report_scope' } }),
  }); } catch { throw new Error('AI request failed or timed out. No automatic retry or simulation was substituted.'); }
  if (!response.ok) throw new Error(`AI request failed (${response.status}). Check provider access, model, and billing.`);
  let parsed: ReturnType<typeof analysisSchema.parse>;
  try {
    const data = await response.json();
    const tool = data.content?.find((b: { type: string; name?: string }) => b.type === 'tool_use' && b.name === 'report_scope');
    parsed = analysisSchema.strict().parse(tool?.input);
  } catch { throw new Error('AI returned invalid scope analysis. Review manually; no automatic retry.'); }
  const result = validateReferences(parsed, agreement);
  return { ...result, source: 'claude' };
}
