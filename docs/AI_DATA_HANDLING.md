# AI data handling in the prototype

## Scope comparison

In sandbox mode, an explicitly enabled comparison sends the project title, clause IDs/text and client request to the configured provider. Elastic, Anthropic and Astropods share an explicit payload allowlist. Separate client name, email, base amount and unrelated runtime metadata are excluded. Provider authentication is server-side and is never supplied to the model as agreement content.

This is data minimization, not automatic anonymization. Free text can contain names, emails, prices, business details or injected instructions. Text is preserved for faithful evidence; the owner must remove confidential details and have permission to share the remaining content. The request form explains this before comparison. Use fictional content for demos and initial evaluations. User research permission to take notes is not permission to upload them to an AI service.

Simulation does not send text to a provider. Paused real-AI mode does not authorize a request; configured credentials and the disclosure do not establish free allowance. No provider retention, residency or zero-training guarantee is claimed. Those settings and terms need account-specific review before non-fictional use.

## Local records and remaining review

Nudge stores agreement and request text, analysis, decisions and audit records in its local workspace database. Model explanations may repeat submitted content. Existing price fields and client details remain available locally for the invoicing workflow; excluding them from model requests does not delete them from storage. Client pages still receive approved, shared project information.

Automatic provider-connected brief extraction is not enabled. Its eventual source-note transmission needs a separate disclosure and minimization review. Local snapshots and offline recovery are implemented and tested with fictional records; see DATABASE_RECOVERY.md. They include private workspace data and are not encrypted or anonymized. DATA_LIFECYCLE_REVIEW.md documents current retention, reviewed removal/recovery procedures and development-log protection. There is no automatic deletion or retention enforcement; hosted logging, protected off-device storage and provider access/residency remain release gates. This document is not a completed privacy audit or a production privacy policy.
