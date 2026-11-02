# Zapier research and fit decision

October13,2026. Public-source research requested by owner. No signup, connection, MCP activation, live tool call, notification, data export or provider setting change. Bryntum B1b remains the next selected implementation task; this research does not authorise a second parallel integration.

## Why it was conditional

Nudge already creates/reconciles PayPal invoices through its own reviewed backend. Duplicating that authority in another automation platform would add failure and approval paths. Earlier planning correctly flagged premium/trial/judging questions but left sandbox support unconfirmed. Current first-party guidance confirms sandbox configuration; it is inaccurate to treat PayPal sandbox as unsupported or describe the entire current connector as IPN-only.

## Verified public evidence

| Area | Finding | Source |
| --- | --- | --- |
| Sponsor access | New accounts receive a14-day Professional trial without a card, then Free; no longer hackathon-specific allowance/extension is promised on the page | [Official sponsor page](https://paypalaihackathon.devpost.com/details/zapier) |
| Standard PayPal integration | Premium, with paid-plan/trial entitlement. Connection accepts client ID/secret and an explicit sandbox selector. Current documentation includes API webhook triggers and invoice/payment operations; manual-payment trigger limitations remain | [PayPal setup](https://help.zapier.com/hc/en-us/articles/8495999676045-How-to-get-started-with-PayPal-on-Zapier) |
| Standard free workflows |100 shared monthly tasks, one trigger/one action; premium access ends with trial unless covered by a permitted arrangement | [Free plan](https://help.zapier.com/hc/en-us/articles/32337438839565-What-s-included-in-Zapier-s-Free-plan) |
| Webhooks / paid features | Professional includes Webhooks and premium apps. Do not assume a Catch Hook remains usable on Free | [Pricing](https://zapier.com/pricing) |
| MCP usage | Successful external tool call costs two tasks; tests count; failed calls do not. Usage shares account quota; overages depend on pay-per-task settings | [MCP usage](https://docs.zapier.com/mcp/overview/usage) |
| MCP access | Pricing states MCP available to all accounts; this does not prove every premium tool remains entitled on Free | [Pricing MCP FAQ](https://zapier.com/pricing), [premium apps](https://help.zapier.com/hc/en-us/articles/37982571569421-What-is-a-premium-app) |
| Tool authority | New servers default to agentic discovery. Managed mode offers a fixed configured toolset and locked fields | [How tools work](https://docs.zapier.com/mcp/overview/how-tools-work) |
| Trial nuance | Initial new-user trial downgrades to Free; additional self-serve trials can auto-upgrade. Do not assume all later trials/extensions have the same terms | [Trial policy](https://help.zapier.com/hc/en-us/articles/8496197192461-Get-started-with-your-free-Zapier-trial) |

100 unused Free tasks / two per successful MCP action = at most50 successful external calls in a month, only if no other tasks are consumed. An action requiring search then write uses at least two calls. Local attempt quotas are not an account-wide billing cap. Monitor actual account usage and reset dates; keep paid overages disabled where applicable. This is a quota illustration, not a claimed balance or guaranteed app entitlement.

No private account was inspected. Connector availability, chosen Google/Slack permissions, trial start/expiry, actual quotas, premium-MCP entitlements and provider retention terms require confirmation before adoption. Public docs do not establish successful Nudge invoice-payment trigger delivery through Zapier.

## Concrete roles worth considering

| Candidate | Product benefit | Assessment |
| --- | --- | --- |
| Owner-reviewed export of a paid accepted extra to a dedicated spreadsheet | Fits an existing bookkeeping workflow without changing Nudge's invoice/schedule authority | Best bounded first integration; proposed Google Sheets managed-MCP tool, exact account/action entitlement still unverified |
| Notification to the owner's private channel after authoritative payment reconciliation | Owner need not keep dashboard open; useful after stable events and hosted delivery exist | Strong candidate, but external recipient consent, delivery/retry handling and free connector coverage need review |
| Weekly owner digest | Cross-app convenience, modest ongoing usage | Later; avoid new AI calls when a factual deterministic summary is sufficient |
| AI-connected PayPal invoice creation/send or refunds | Duplicates money authority and creates another route around Nudge approvals | Reject for current scope |
| Replace Elastic with Zapier Agents/AI | Adds provider/pricing work without resolving current verification gaps | Reject; Elastic remains selected, live usage deferred |
| Auto-reschedule Bryntum work when payment arrives | Can silently change commitments based on unrelated payment state | Reject; owner schedule review remains mandatory |

Recommendation: Zapier has real product value as an optional workflow bridge and is more directly useful than a catalog/search pivot. Prepare one minimal owner-approved export after the selected Bryntum contract/core work; do not start its timed trial or add broad agent tools merely to increase sponsor count. If no destination workflow is useful, defer with that reason.

## Proposed integration boundaries, if selected

Backend builds a small snapshot of an accepted proposal and authoritative invoice state. Owner reviews that exact export and destination; server checks workspace version/current eligibility before executing one allowlisted managed-MCP action. No payment tools, automatic discovery, client email/payment URL, bearer link, keys, full agreement or raw AI/provider output in exported fields. Do not connect Nudge's tool-free scope agent to Zapier. Direct MCP invocation can be deterministic; no extra LLM call is required merely to export reviewed structured data, subject to verifying actual client/SDK support.

External export is not a payment ledger. Use event/export identity and durable pending/sent/uncertain records. A timeout may follow a successful external write; do not blindly retry or claim exactly-once Google Sheets delivery. Reconcile uncertainty before another attempt; preserve review/destination scope on retry. A duplicate PayPal event must not automatically duplicate an export. Zapier failure must not roll back a paid invoice or block client acceptance. Destination and OAuth permission review precedes connection. Public judge usage must not allow arbitrary messages/rows in a personal account.

## Future checkpoints, not activation approval

1. Z2: owner selects dedicated spreadsheet or private-owner channel and exact useful outcome; define minimal payload and explicit consent/review.
2. Z3: inspect exact free/MCP action entitlement and permissions, no-card/signup/trial terms, task/overage limits and coverage through December15. Remind owner before signup; an extension request is not a grant.
3. Z4: specify durable outbox/approval/version/dedup/uncertain-delivery contract; approved destination allowlist, private MCP configuration, no dynamic financial tools.
4. Z5: implement and test offline against transport fixtures with no external messages/data exports.
5. Z6: only after explicit approval, owner connects a dedicated destination and verifies one fictional action; inspect actual task use and cleanup. Stop at paid/card/permission mismatch.
6. Z7: test failure/retry/privacy and judge-access behavior; document actual use and retain functional Nudge without Zapier.

Optional owner support question when ready: “I am considering a managed Zapier MCP server with one Google Sheets export action for a PayPal AI Hackathon demo. Can this action remain available on Free after the initial trial, within100 monthly tasks and without paid overages? Is any additional hackathon allowance available through December15,2026? Please clarify whether premium app restrictions apply to MCP and the chosen action. I would like to remain entirely within free allowances. Thank you!” No message sent.
