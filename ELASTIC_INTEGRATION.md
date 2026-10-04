# Elastic integration: next checkpoint

User wants to proceed with Elastic despite pending support replies. We can implement and mock-test an adapter now; this does not establish a free managed-LLM allowance or authorize paid billing. The current runtime still supports Anthropic/Astropods only. No Elastic adapter is connected and NUDGE_AI_ENABLED stays false.

## Verified API direction

Elastic Agent Builder exposes a Kibana converse endpoint, POST /api/agent_builder/converse, authenticated with an Agent Builder API key. It accepts input and an agent ID. This is a Kibana endpoint, not the Elasticsearch data endpoint. Non-default Spaces require the documented space prefix. See the [official API tutorial](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/agent-builder-api-tutorial).

Prepare a dedicated scope-review agent rather than relying on the default general-purpose chat agent. Review its instructions and tool configuration before use. It must receive only fictional/evaluation content initially and have no PayPal credentials or payment tools. Keep the existing human review and pricing gates inside Nudge.

The future adapter should accept only completed responses containing valid structured analysis, reject malformed/unsupported citations or unexpected approval prompts, and surface errors without retrying, resuming an approval prompt, or substituting simulation. Record sanitized model/usage provenance without exposing reasoning steps, authentication headers or raw sensitive payloads. Token counts are not automatically a dollar-cost estimate. Model choice must be checked in the actual project; see [model configuration](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/models).

## Order of work

1. Confirm Agent Builder still opens in the existing trial. Identify its Kibana endpoint, chosen agent and exact model; keep API keys local and out of chat/Git.
2. Check Agent Builder key permissions from official docs and create a narrowly scoped key only when needed for local configuration. Do not enable a paid subscription or grant account-wide access just to make a request succeed.
3. Implement the server-side adapter with mocks, preserving the explicit AI enable hold, strict analysis schema and citation validation.
4. Establish the available managed-model allowance and trial/sponsor expiry through the project UI, official offer or support. Sponsor extension and judging-period access remain pending; do not infer unlimited free calls from a working chat screen.
5. Once the first free test is authorized, run scope case 08 only. Inspect the actual response and available usage/balance evidence before considering a batch. Offline-score it and manually review the explanation; no invoice or reminder should result from evaluation.

No account changes, API keys, model calls or spend occurred in this preparation checkpoint. The executable benchmark is ready: 25 cases, 41 server tests and TypeScript checks pass; real AI accuracy has not been measured.
