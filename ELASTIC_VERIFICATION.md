# Elastic scope-review verification

## Verified October 6, 2026

The first successful live scope review used the dedicated private agent, Sonnet 5 inference endpoint, fictional evaluation case 08, and `_execution_mode: "local"`. The adapter sent exactly one conversation HTTP request with tools and skills disabled. The response completed, classified appointment booking as additional work, cited S5 and S7, and passed strict schema, reference and case-label checks. Reported usage was 9,060 input tokens and 882 output tokens; elapsed time was about 20 seconds. These are the round's reported counts, not proof of one internal LLM call or a particular monetary cost.

The default execution path returned HTTP 404 with the redacted error `Conversation [redacted-id] not found`. It created a conversation that could subsequently be read, with no stored rounds. Explicit Sonnet selection alone had not resolved the failure. Changing the execution mode to local while retaining explicit selection, private access, instructions and tool restrictions resolved this observed request failure. This isolates the failing background-execution handoff; it does not prove whether the provider's underlying defect is identity propagation, storage visibility, or another internal condition.

[Elastic's execution service](https://github.com/elastic/kibana/blob/main/x-pack/platform/plugins/shared/agent_builder/server/services/execution/execution_service.ts) defaults to Task Manager, schedules with a cloned API key, and supports local execution. The [Converse API reference](https://www.elastic.co/docs/api/doc/kibana/operation/operation-post-agent-builder-converse) documents `_execution_mode`, currently experimental. Nudge explicitly chooses local for its bounded synchronous review. Here local means the authenticated Elastic server request, not running a model on the user's laptop. Private conversations remain private; no permissions were broadened, public sharing enabled, or billing changed. Review compatibility if Elastic changes this experimental parameter.

All prior attempt records and the successful result remain in ignored local data. They are not committed, overwritten or treated as zero-usage evidence. Failed-attempt token counts remain unknown. The diagnostic request and successful verification each required approval; neither had an automatic retry or accessed PayPal or workspace records.

## Output-quality review

The classification and S5 citation are supported by the fixture's explicit booking exclusion. S7 supports the lack of an agreed additional price. The result proposed no new numerical quote or financial action. However, its deliverables also restated included base work, and several questions concern implementation planning rather than uncertainty about the classification. Therefore this is a verified live integration, not a completed quality evaluation or a quote ready for approval. Before pricing, the freelancer must remove included work and review the extra deliverable.

Next review the runtime instructions, which override the saved agent instructions, to require neutral descriptions of requested extra work and necessary clarification questions. Then plan a bounded evaluation with held-out cases and manual semantic checks. Do not run the full benchmark automatically, claim accuracy from one case, or treat the scorer's `modelRunVerified: false` as a failed live transport check: that field deliberately cannot establish provenance from output alone.

## Local setup for the verified model

Keep these server-only settings in ignored local configuration:

```dotenv
ELASTIC_INFERENCE_ID=.anthropic-claude-5-sonnet-chat_completion
NUDGE_AI_ENABLED=false
```

The live harness selected this model only in its child process. It did not persist a model setting or enable ordinary website AI calls. Restart the development server after any later authorized environment change. Review usage and an explicit next-call budget before enabling the website or running more cases. Trial ends November 3 according to owner/support confirmation; exact fair-use capacity remains under support review.

All 71 offline server tests, TypeScript checks and the isolated production build pass after the fix. The build reused installed dependencies and preserved the active development cache; no fresh installation or hosted deployment is claimed.
