# Elastic integration: next checkpoint

User wants to proceed with Elastic despite pending support replies. The server-side adapter is now implemented and mock-tested alongside Anthropic/Astropods; this does not establish a free managed-LLM allowance or authorize paid billing. No actual Elastic project connection or model response has been verified. NUDGE_AI_ENABLED stays false, and local secret configuration was not changed.

## Implemented adapter checkpoint

Set NUDGE_AI_PROVIDER=elastic only when configuring locally. Blank placeholders are in .env.example: ELASTIC_KIBANA_URL, ELASTIC_API_KEY, ELASTIC_AGENT_ID and optional ELASTIC_SPACE_ID. Use the Kibana HTTPS origin on Elastic Cloud, a dedicated scope agent ID (the general default agent is rejected), and its encoded API key. Do not paste keys into chat or the frontend. Keep the AI enable flag false until the free first-test allowance is confirmed.

The adapter requests a private, new conversation per comparison and documented runtime overrides disabling selected tools, skills and built-in capabilities. It sends project title, clauses and the client request, excluding separate client name/email and agreement price fields; notes inside clauses/request can still contain personal data. First testing must use the fictional scope benchmark.

It rejects redirects, invalid Cloud origins, incomplete or approval-prompt responses, reported tool calls, responses over 128 KiB, markdown/non-JSON analysis, extra analysis fields and invalid clause IDs. Failures do not retry or substitute simulation. Direct adapter access also enforces the AI enable hold. Accepted output creates a zero-price draft; owner/client approval gates remain enforced and the audit/interface say Elastic AI.

All 44 server tests, eight browser tests and a production build pass. Build/browser checks ran from an isolated source snapshot without secrets or existing data, reusing installed dependencies, so the owner's active dev cache was preserved. Timeout/error/usage-hold behavior uses mocks, not real-model evaluation. Check the actual project's API supports these overrides and the completed-response shape before enabling calls. Request-time restrictions are not proof a previously misconfigured remote agent never executed a tool; review the dedicated agent and key privileges independently. The adapter does not persist provider reasoning, usage counts or claim dollar-cost measurements, and its enable flag is not a spending cap.

## Verified API direction

Elastic Agent Builder exposes a Kibana converse endpoint, POST /api/agent_builder/converse, authenticated with an Agent Builder API key. It accepts input and an agent ID. This is a Kibana endpoint, not the Elasticsearch data endpoint. Non-default Spaces require the documented space prefix. See the [official API tutorial](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/agent-builder-api-tutorial).

Prepare a dedicated scope-review agent rather than relying on the default general-purpose chat agent. Review its instructions and tool configuration before use. It must receive only fictional/evaluation content initially and have no PayPal credentials or payment tools. Keep the existing human review and pricing gates inside Nudge.

The future adapter should accept only completed responses containing valid structured analysis, reject malformed/unsupported citations or unexpected approval prompts, and surface errors without retrying, resuming an approval prompt, or substituting simulation. Record sanitized model/usage provenance without exposing reasoning steps, authentication headers or raw sensitive payloads. Token counts are not automatically a dollar-cost estimate. Model choice must be checked in the actual project; see [model configuration](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/models).

## Order of work

### Offline configuration preflight

After locally configuring the existing placeholders, leave NUDGE_AI_ENABLED=false and run `npm run elastic:check`. This checks only provider selection and the shape/presence of the endpoint, key, agent and optional space. It prints no values, makes no network request and writes no files. CHECK results require local configuration review; PASS does not prove authentication, permissions, allowance, model identity or runtime compatibility. Do not share the environment file or keys. The first model call still requires confirmed allowance.

Before the first fictional case, record non-sensitive evidence of the free managed-model allowance, expiry, dedicated agent with no payment tools, and key permissions. Record provider/model identity, test time, latency, actual output, available usage before/after and manual citation review. Leave unknown usage explicitly unknown; do not infer cost from token counts. Pause again after the single call and review before any retry or batch. No invoice or reminder should be created by this evaluation.

1. Confirm Agent Builder still opens in the existing trial. Identify its Kibana endpoint, chosen agent and exact model; keep API keys local and out of chat/Git.
2. Check Agent Builder key permissions from official docs and create a narrowly scoped key only when needed for local configuration. Do not enable a paid subscription or grant account-wide access just to make a request succeed.
3. Implement the server-side adapter with mocks, preserving the explicit AI enable hold, strict analysis schema and citation validation.
4. Establish the available managed-model allowance and trial/sponsor expiry through the project UI, official offer or support. Sponsor extension and judging-period access remain pending; do not infer unlimited free calls from a working chat screen.
5. Once the first free test is authorized, run scope case 08 only. Inspect the actual response and available usage/balance evidence before considering a batch. Offline-score it and manually review the explanation; no invoice or reminder should result from evaluation.

No account changes, API keys, model calls or spend occurred in this preparation checkpoint. The executable benchmark is ready: 25 cases, 41 server tests and TypeScript checks pass; real AI accuracy has not been measured.
