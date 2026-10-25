// Allowlisted own application sources only. Never reads environment files, data, Git or vendor code.
import { readFileSync, writeFileSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sourceFindings } from './check-public-source.mjs';
const files = ['lib/domain.ts', 'lib/paypal.ts', 'lib/store.ts', 'lib/processing.ts', 'lib/reconciliation.ts', 'lib/auth.ts', 'lib/request-guards.ts', 'app/api/workspace/route.ts', 'app/api/paypal/webhook/route.ts', 'app/api/client/[token]/route.ts', 'scripts/sandbox-rehearsal-controller.cjs', 'scripts/sandbox-payment-plan.cjs', 'scripts/sandbox-payment-child.cjs', 'tests/sandbox-payment-continuation.test.ts'];
const intro = `# Nudge: self-contained web-agent master packet

Prepared ${new Date().toISOString().slice(0, 10)}. The owner will give you this single Markdown file. You have no terminal or access to the repository. All source you can inspect is included below. Do not claim to have run it. The primary coding workspace continues independently; your work is a proposed review/patch for us to verify, not an automatic merge.

## Your assignment: payment integrity and crash recovery

Perform a rigorous review of the included application and rehearsal-controller sources. Focus on a freelancer's accepted USD300 extra-work quote becoming one sandbox invoice, one send and an authoritative payment status. Investigate uncertain responses, process death/restart, concurrent requests, stale workers and duplicate/out-of-order webhooks. Find practical, reproducible faults or establish the limits honestly. Then propose minimal code fixes and meaningful tests for the highest-impact confirmed issues. Complete the analysis and proposals together; ask for a missing source file only when the conclusion depends on it.

### Required return format

1. Executive assessment: what appears sound and the top three risks, with confidence.
2. Evidence table for each finding: severity, exact file/function and quoted short code, triggering sequence, current consequence, expected consequence, confirmed-from-code versus hypothesis, and any missing evidence. Explain an actual failure path; a generic best-practice checklist is insufficient.
3. Failure matrix: before/after local reservation, remote create/send, lost response, local persistence, restart, recovery, webhook verification and reconciliation. State what durable evidence remains and which operation is blocked or permitted.
4. For at most three high-value fixes, return unified diffs against the included files, plus proposed deterministic tests with fictional responses. Keep public interfaces compatible unless a change is necessary. Do not rewrite unaffected files. If no defect merits a patch, say so.
5. Explain integration order, tradeoffs, rollback and exactly which checks the terminal agent must run. Mark every test as proposed/unexecuted. Separate blocking fixes from optional improvements.
6. End with a concise handback the primary agent can act on. Include source fingerprints for each proposed changed file so we detect edits made since this packet.

## Product, audience and hackathon

Nudge is a single-owner prototype for freelance web designers and micro-agencies handling scope creep. Flow: accepted original agreement -> pasted client request -> structured AI assessment with clause citations/ambiguity -> recorded human scope decision -> owner-set price and editable client explanation -> client acceptance through a private link -> separate PayPal invoice creation and sending -> reconciled payment. AI cannot set prices, execute payments or bypass approval.

The selected demo is a USD1200 five-page site whose S2 explicitly excludes appointment booking, scheduling calendars and booking integrations. A request for booking with available time slots is additional. The selected owner-set fictional extra is USD300. Keep this one story coherent. AI rationale is not legal advice; link acceptance does not establish verified signer identity or legally binding e-signature.

User-supplied requirements: meaningfully integrate PayPal's free sandbox and AI; working prototype; documented tools/functionality; public open-source application repository with a licence; runnable complete instructions OR a hosted working demo; public YouTube video under three minutes. Criteria: technology, design, credible specific impact, innovation and presentation. Sponsors are optional. User wants quality, faster progress, no unapproved charges and minimal scope expansion. Internal target is early November; judge access planning extends through December15,2026. Treat current official dates/terms as needing verification if your recommendation depends on them.

## Architecture and deliberate decisions

- Next16 App Router, React19, TypeScript, Node24.12 verified, Zod; single-owner SQLite on one host, atomic mutations and durable remote-operation markers. Keep architecture and existing visual design. No PostgreSQL migration or multi-user platform is selected.
- PayPal sandbox Invoicing/OAuth only. Orders/Payouts are not implemented. Exact USD cents, idempotency keys, signed webhook verification, deduplication and a read-only polling fallback. Normal owner reads can reconcile status: distinguish polling from a fresh paid webhook.
- Elastic Agent Builder/managed LLM supplies structured scope analysis, with tools/skills/capabilities disabled. Server validates schema and references; human review gates pricing. Normal AI is paused. Do not request keys or run additional AI calls.
- Authenticated owner session and expiring/rotatable private bearer client links. No identity/e-signature claim. Cross-origin/body/rate protections are local prototype controls; inspect included code before asserting their reach.
- AG Studio3.0.0 provides actual embedded analytics/custom widgets/layout/filter/export and a native-table fallback. Optional dashboard AI remains disconnected. Bryntum Gantt7.3.7 is an optional read-only original/current/proposed delivery timeline; Nudge's backend controls plan changes, and payment never moves dates. Proprietary vendor files/licence keys are excluded here.
- Postman/Newman local API verification requires no cloud account. Render credits are claimed but no deployment is verified. Astropods inactive; Elastic is selected. APIMatic was explicitly excluded by the owner. Kernel/Channel3/Zapier are not adopted. Add no new services merely to use more sponsors.

## Verified state and unresolved limits

- One live Elastic comparison on the selected fictional case completed, additional/S2. The same saved response received recorded human review, USD300 owner approval and fictional client acceptance in the actual UI. Operator played both roles; this is not independent client/user research. Current accepted quote has zero invoices and zero financial attempts. No confidential record is included here.
- A separate seeded disposable fixture passed the actual website create/restart/send/reconcile journey using fictional PayPal responses. The original deadline remained expired, a separate ten-minute payment permission used the original durable ledger, one create/send was reserved, and browser/app closure was confirmed. Injected failure after fictional creation also cleaned up. This does not prove matched live sandbox payment or fresh PAID delivery.
-45 focused offline checks and TypeScript passed at this snapshot. These are bounded engineering checks, not product validation, full-system security certification, model accuracy or independent user evidence.
- Prior real PayPal sandbox checkout/reconciliation exists at a different amount. Retained signed events prove SENT/redelivery behavior, not the selected quote's fresh PAID webhook. Do not overclaim.
- Numerical Elastic allowance/billing exhaustion and judging continuity are not fully established. Sponsor permission/access/technical-expiry checks, manual Narrator/actual zoom/touch, user validation, public-source/history decisions, final judge access and video remain open. No paid subscription, public deployment or final submission is established.
- The main agent is preparing the finite live sandbox payment launcher while you review core integrity. Do not duplicate that launcher implementation. Changes you propose to shared controller/runtime files will be checked against current source before application.

## Boundaries for your answer

Do not request environment files, keys, credentials, licence text, private links, databases, raw event payloads or private emails. Use fictional values. Do not suggest disabling checks, fake time in a real session, resetting attempts, extending old grants or creating replacement invoices to escape uncertainty. Do not publish, contact sponsors or claim to execute anything. No broad redesign, new sponsor, dependency upgrade, new authentication system or speculative refactor. Support any external API claim with official documentation and label unverified claims. Included code controls are not necessarily effective against an attacker who can rewrite local state; distinguish operational guardrails from security boundaries.

## How the primary workspace will use your response

We will save it privately, verify file fingerprints, reproduce findings with fictional inputs, accept/defer/reject each recommendation in the action plan, apply only reviewed changes, run appropriate checks and then commit with the owner. Existing user work and historical evidence must be preserved. If required context is absent, ask for the precise missing function/file and explain why; do not invent its behavior.

## Source snapshot

Each file below is our own source, copied exactly with a SHA256 fingerprint. File line1 is the first line of its code block. Tests describe intended behavior and are not proof of unstated guarantees. No actual environment, database, Git history, vendor distribution, secret value or financial record is included.
`;
let output = intro, bytes = 0;
for (const file of files) {
  const stat = lstatSync(file); if (!stat.isFile() || stat.isSymbolicLink() || (bytes += stat.size) > 180000) throw Error('Packet source boundary rejected');
  const source = readFileSync(file, 'utf8'); if (sourceFindings(file, source).length) throw Error('Selected source needs private review before packet export');
  const hash = createHash('sha256').update(source).digest('hex');
  output += '\n### ' + file + '\n\nSHA256: ' + hash + '\n\n```' + (file.endsWith('.ts') ? 'typescript' : 'javascript') + '\n' + source + '\n```\n';
}
writeFileSync('WEB_AGENT_MASTER_PACKET.md', output, { flag: 'wx' });
console.log(JSON.stringify({ file: 'WEB_AGENT_MASTER_PACKET.md', sourceFiles: files.length, sourceBytes: bytes, packetBytes: Buffer.byteLength(output), privateDataIncluded: false }));
