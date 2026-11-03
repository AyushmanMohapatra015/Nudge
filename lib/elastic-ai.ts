import { analysisSchema, agreementSchema, validateReferences, type Agreement, type Analysis } from './domain';
import { requireRealAiAccess } from './ai-access';
import { scopeAiPayload } from './ai-payload';
import { elasticScopeInstructions } from './scope-instructions';

export { elasticScopeInstructions } from './scope-instructions';

export async function analyzeWithElastic(request: string, agreement: Agreement): Promise<Analysis> {
  requireRealAiAccess();
  const { ELASTIC_KIBANA_URL: origin, ELASTIC_API_KEY: key, ELASTIC_AGENT_ID: agent, ELASTIC_SPACE_ID: space, ELASTIC_INFERENCE_ID: inferenceId } = process.env;
  if (!origin || !key || !agent) throw Error('Configure the Elastic Kibana endpoint, API key and dedicated scope agent locally.');
  let url: URL;
  try { url = new URL(origin); } catch { throw Error('Invalid Elastic Kibana endpoint.'); }
  const host = url.hostname;
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || url.port || !['.elastic.cloud', '.elastic-cloud.com', '.cloud.es.io'].some(suffix => host.endsWith(suffix))) throw Error('Use the HTTPS Elastic Cloud Kibana origin without paths or credentials.');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(agent) || agent === 'elastic-ai-agent' || (space && !/^[a-zA-Z0-9_-]{1,128}$/.test(space)) || /\s/.test(key)) throw Error('Use a dedicated scope agent, valid space ID and locally stored encoded API key.');
  if (inferenceId && !/^[a-zA-Z0-9_.-]{1,256}$/.test(inferenceId)) throw Error('Use a valid Elastic inference endpoint ID, not a model display name or URL.');
  agreementSchema.parse(agreement);
  if (request.trim().length < 10 || request.length > 5000) throw Error('Scope request must be between 10 and 5000 characters.');
  const path = `${space ? `/s/${encodeURIComponent(space)}` : ''}/api/agent_builder/converse`;
  let response: Response;
  try {
    response = await fetch(url.origin + path, { method: 'POST', redirect: 'error', cache: 'no-store',
      headers: { authorization: `ApiKey ${key}`, 'kbn-xsrf': 'true', 'content-type': 'application/json' },
      // Keep this bounded synchronous review on the authenticated request instead of
      // handing a private conversation to Task Manager under another request context.
      signal: AbortSignal.timeout(45000), body: JSON.stringify({ agent_id: agent, _execution_mode: 'local', ...(inferenceId ? { inference_id: inferenceId } : {}), access_control: { access_mode: 'private' },
        configuration_overrides: { instructions: elasticScopeInstructions, tools: [{ tool_ids: [] }], skill_ids: [], enable_elastic_capabilities: false },
        input: JSON.stringify(scopeAiPayload(request, agreement)) }) });
  } catch { throw Error('Elastic request failed or timed out. No automatic retry or simulation was substituted.'); }
  if (!response.ok) throw Error(`Elastic request failed (${response.status}). Check access and allowance before retrying.`);
  try {
    if (!response.body) throw Error('Missing response.');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = '', bytes = 0;
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 131072) { await reader.cancel(); throw Error('Oversized response.'); }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    const data = JSON.parse(text);
    if (data.status !== 'completed' || typeof data.conversation_id !== 'string' || !data.conversation_id ||
        !data.response || 'prompts' in data.response || typeof data.response.message !== 'string' || data.response.message.length > 16000 ||
        !Array.isArray(data.steps) || data.steps.some((s: unknown) => !s || typeof s !== 'object' || ('type' in s && ['tool_call', 'ask_user_question', 'confirmation', 'authorization'].includes(String(s.type))))) throw Error('Unsupported agent outcome.');
    // Accept raw JSON, one complete standalone Markdown wrapper, or one fenced JSON
    // object surrounded by prose. Never salvage multiple blocks or repair output.
    const message = data.response.message.trim();
    const fences = [...message.matchAll(/```([^\r\n`]*)\r?\n([\s\S]*?)\r?\n```/g)];
    if (fences.length > 1) throw Error('Multiple fenced blocks.');
    const fence = fences[0];
    const label = fence?.[1].trim().toLowerCase();
    const isStandalone = !!fence && fence.index === 0 && fence[0].length === message.length;
    if (fence && label !== 'json' && !(isStandalone && label === '')) throw Error('Unsupported fenced block.');
    const jsonText = fence ? fence[2] : message;
    const analysis = validateReferences(analysisSchema.strict().parse(JSON.parse(jsonText)), agreement);
    return { ...analysis, source: 'elastic' };
  } catch { throw Error('Elastic returned incomplete, tool-using or invalid scope analysis. Review manually; no automatic retry.'); }
}
