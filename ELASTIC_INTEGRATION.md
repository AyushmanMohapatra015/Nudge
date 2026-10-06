# Elastic integration: next checkpoint

## October 6 explicit-model routing checkpoint (supersedes default-dropdown instructions)

Owner clarified that the actual UI shows assigned models, not a Default model field. Do not infer a blank default from this UI. The adapter now accepts optional server-only ELASTIC_INFERENCE_ID and sends inference_id, never both routing parameters. Offline validation rejects display names, URLs, whitespace and oversized IDs before fetch. Mock tests cover omitted/explicit selection and a 404 causing exactly one request without fallback or retry. All 71 server tests and typecheck pass.

Production build also passes in an isolated source snapshot using installed dependencies. The active development cache was preserved; this is not a fresh dependency-install verification. Offline local preflight passes with AI still paused and no persistent explicit-model override configured.

Read-only connector metadata identified a unique Sonnet 5 inference endpoint after tightening the display-name matcher so Sonnet 4.5 cannot match Sonnet 5. Selection was prepared only in ignored data; .env.local and account settings were not changed. The [official model guide](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/models) supports per-request inference_id and describes automatic fast-model routing; an explicit main model does not disable fast routing or guarantee exactly one internal LLM call.

After approval, the separate attempt-3 harness sent exactly one fictional case-08 conversation request with explicit Sonnet 5 routing. It still returned HTTP 404, without usable analysis or numeric token counts. Read-only conversation inspection found one matching conversation with zero stored rounds. All three attempt records are preserved. No automatic retry, PayPal access, workspace-data changes or subscription changes occurred; workspace AI remains paused. Do not claim the missing UI dropdown caused the failure, model selection resolved it, zero usage, or live AI success.

Next non-executing diagnostic: in owner Dev Tools Console, GET /_inference/chat_completion/.anthropic-claude-5-sonnet-chat_completion. Report only status and whether task_type is chat_completion, never raw configuration or credentials. The [Get inference endpoint API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-inference-get) reads endpoint configuration without running inference. A 200 confirms endpoint registration, not runtime provider health. A missing endpoint or task mismatch requires investigation before any further model request; do not activate billing or broaden the key. Further conversation attempts require a separately reviewed checkpoint.

Local configuration, only after verifying the endpoint:

```dotenv
ELASTIC_INFERENCE_ID=.anthropic-claude-5-sonnet-chat_completion
NUDGE_AI_ENABLED=false
```

This public model identifier is not an API key. Keep real keys and project URLs in ignored local configuration. The adapter still overrides saved-agent instructions with its existing runtime instructions; prompt quality alignment remains a separate review after execution works.

## October 6 actual first-attempt checkpoint

### Reviewed retry after permission correction

Owner authorized one retry. The ignored harness passed an offline mock with separate attempt-2 paths, preserved the first marker, then sent exactly one additional conversation request. It returned HTTP 404 and no usable analysis or numeric token counts. Safe diagnostics show no completed/message/steps/conversation fields and no recognized quota or authorization indication; these boolean checks do not identify the missing resource or prove zero usage. Attempt-2 marker/failure metadata are retained; there was no automatic retry or workspace/payment action.

Read-only connector inventory remains HTTP 200 and reports eight preconfigured connectors, seven inference-type. This does not prove the configured Agent Builder default model points to an available endpoint. Next inspect Model management / Feature settings in the owner UI: record only the selected Agent Builder default model and any non-sensitive missing/invalid-model warning, without sending chat messages or changing billing. The [model guide](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/models) explains default selection; [API overview](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api) explains per-request model routing. Do not assume 404 means the model is absent; agent/conversation/routing causes remain possible. No third model request is authorized by this outcome record.

### Read-only diagnosis after the failed attempt

Owner applied the recommended restricted descriptor. Read-only connector metadata now returns HTTP 200 instead of 403, confirming that permission gap is resolved. A fresh read-only agent check also returns HTTP 200 and all private/no-tools/no-skills/no-plugins/no-workflows/capabilities-off checks pass. This does not establish inference execution, usage allowance remaining, or the original failure's precise cause. No second conversation was sent. Preserve the first attempt marker; any reviewed retry must use a separate attempt record and bounded request with safe failure/usage capture.

Agent access authenticates, but a separate GET /api/actions/connectors returns HTTP 403 with an authorization/privilege indication. This confirms a connector-read permission gap, not the HTTP status or precise cause of the original converse failure. The original ignored harness discarded its error category; that evidence cannot be reconstructed from the zero-round conversation. Its future diagnostics now retain only HTTP status, fixed error category, request count and numeric usage; an offline simulated 403 check correctly reports the category without printing raw provider text. No live model retry occurred.

The [official key guide](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/api-keys) documents feature_actions.read for connector access and monitor_inference for Elasticsearch inference endpoints. The [Elastic Agent Builder investigation example](https://www.elastic.co/observability-labs/blog/automated-root-cause-analysis-agent-builder) includes both alongside Agent Builder read access. Our earlier key descriptor omitted both; that was sufficient for metadata, not verified model access. This is the leading permission hypothesis, not proof that trial limits, prompt format or connectivity caused the failed inference.

Recommended narrow correction for the owner to review in the Default-space key editor (not applied):

```json
{
  "nudge-scope-client": {
    "cluster": ["monitor_inference"],
    "indices": [],
    "applications": [
      {
        "application": "kibana-.kibana",
        "privileges": ["feature_agentBuilder.read", "feature_actions.read"],
        "resources": ["space:default"]
      }
    ]
  }
}
```

This adds inference monitoring/connector read, not index access, workflow execution, administration or unrestricted privileges. Keep the existing expiry, agent tools disabled and AI=false. Review effective model permissions with read-only checks after an owner-applied correction; further model execution remains a separate checkpoint. The consumption API's management requirement is unrelated and is not included. Do not create an unrestricted key or activate billing as a diagnostic shortcut. Changes to a key descriptor replace its prior assigned descriptor, so retain the Agent Builder read permission and space restriction. Tokens from the original attempt remain unknown.

Owner confirms trial expiry November 3 and no paid subscription; support confirms managed LLM trial fair-use access, exact expanded allowance still pending. Corrected Kibana origin/key authenticate against agent metadata (HTTP 200). Private dedicated agent has instructions, disabled capabilities and no assigned tools/skills/plugins/pre-or-post workflows/associated indices/connectors. These agent checks do not establish space-wide workflow state or model execution permissions.

One fictional case 08 conversation request was attempted through the existing adapter using an ignored one-shot harness. Its mocked harness check passed beforehand. The live verification failed and retained a retry-blocking attempt marker. Read-only conversation list/detail lookup found one matching conversation with zero stored rounds, no valid output and no token counts. Do not claim live AI success, zero usage or a specific failure cause. No second model call, payment actions or environment edits were performed; workspace AI remains paused. Next work is failure diagnosis and usage inspection before separately considering another model request. Preserve the marker; do not delete it to force a retry.

The [usage guide](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/monitor-usage) states one round may involve multiple internal LLM calls and counts include prompts/history/internal processing. Monitor actual returned usage rather than assuming one HTTP request means one model call or estimating cost from text length. The [consumption endpoint](https://www.elastic.co/docs/api/doc/kibana/operation/operation-post-agent-builder-agents-agent-id-consumption) requires agent-management privilege; the deliberately read-only client key does not provide it. Do not broaden that key merely for monitoring. Owner dashboard/Console inspection can provide usage evidence without sending another conversation. The API reports consumption and does not enforce a hard quota.

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
