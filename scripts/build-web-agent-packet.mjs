// Allowlisted own application sources only. Never reads environment files, data, Git or vendor code.
import { readFileSync, writeFileSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sourceFindings } from './check-public-source.mjs';
const medium = process.argv.includes('--medium');
const update = process.argv.includes('--a-update');
if (medium && update) throw Error('Choose one packet mode');
const files = update ? ['scripts/sandbox-paid-readonly.cjs'] : medium ? ['components/client-page.tsx', 'components/quote-explanation.tsx', 'lib/domain.ts', 'lib/browser-read.ts', 'app/api/client/[token]/route.ts', 'tests/browser/connection-recovery.spec.ts', 'playwright.config.ts'] : ['lib/domain.ts', 'lib/paypal.ts', 'lib/store.ts', 'lib/processing.ts', 'lib/reconciliation.ts', 'lib/auth.ts', 'lib/request-guards.ts', 'app/api/workspace/route.ts', 'app/api/paypal/webhook/route.ts', 'app/api/client/[token]/route.ts', 'scripts/sandbox-rehearsal-controller.cjs', 'scripts/sandbox-payment-plan.cjs', 'scripts/sandbox-payment-child.cjs', 'tests/sandbox-payment-continuation.test.ts', 'scripts/sandbox-paid-readonly.cjs'];
const mediumIntro = `# Nudge: web-agent B client invoice clarity packet

Revision B1 / action-plan task PA-2. Prepared ${new Date().toISOString().slice(0, 10)}. This is a self-contained medium-sized implementation proposal for a web agent. You cannot run commands or inspect anything outside the attached sources. Our terminal workspace reviews and tests before integration. All code below is existing source with SHA256 fingerprints; application code must not be changed directly by this assignment.

## Product and current evidence

Nudge is a Next16/React19/TypeScript single-owner freelance scope-change prototype: accepted scope -> AI clause-cited assessment -> human review -> owner USD300 quote -> fictional client acceptance -> separate PayPal sandbox invoice/send -> authoritative payment reconciliation. The same-record live journey now works across sessions and shows PAID/$0 in Nudge and local Analytics. This is one fictional development example; not a real-money transaction, independent user study, final video or fresh PAID webhook proof. The example original agreement is USD1200, booking is excluded, and only the USD300 extra was invoiced.

Hackathon priorities are a coherent functioning PayPal+AI experience, credible usefulness, good design and an under-three-minute demo, plus public licensed application source and complete setup or hosted access. Keep the existing palette/layout, backend architecture and sponsor use. No new service, AI call, dependency, paid usage, design overhaul or authentication/acceptance policy change. Backend payment review belongs to another agent; this task edits only presentation.

## Medium-sized task: make client invoice status clear and truthful

Concrete source observations to address: the accepted-proposal receipt always says the designer can now prepare an invoice, even when the page already shows a paid invoice. The generic invoice fallback can tell the client to contact the designer for a payment link even when that invoice is cancelled. Invoice badges use raw status wording and the balance caption can be clearer across partial, settled, cancelled and unknown states. The client API does not expose proposalId on invoices: do not infer which invoice belongs to a particular quote or add backend fields for this task.

Propose a small typed presentation helper, integrate it only in the client component, and return focused tests. Required behavior:

1. Use neutral accepted-change receipt wording that remains correct before and after an invoice appears; make no unsupported quote-to-invoice association. Do not conflate acceptance with payment or a verified legal signature.
2. Present UNPAID as payment due, PARTIALLY_PAID as partial payment with the remaining amount distinguished from the total, PAID as settled with its receipt wording, CANCELLED as cancelled without suggesting a new payment link or claiming a refund, and OTHER/unsupported states as needing confirmation. DRAFT is not exposed by the client projection; handle a defensive fixture without claiming it is a real public state.
3. Use server status as authority. A zero balance alone is not proof of PAID. Preserve the existing money formatter/integer-cent data and do not calculate totals or mutate anything. Display remaining and original amounts accurately, including e.g. USD75 remaining of USD300.
4. Preserve the existing PayPal-link eligibility policy, destinations and labels for UNPAID/PARTIALLY_PAID. Do not generate links, infer status from URLs, alter payUrl trust policy or introduce refunds/payment actions. Backend payment/link security is outside this task; flag any concern separately for the primary agent.
5. Retain loading, expired-link, error/recovery and busy states, focus restoration, five-second refresh, consent checkboxes, decision POSTs and action locks exactly. Do not replace BrowserRead. Preserve native headings/links and keyboard behavior; avoid wrapping the full polling page in a live region or moving focus after refresh. Do not claim Narrator/physical touch was tested.
6. Use existing CSS/classes, no CSS edits, new icons or animation. No server-route/domain/storage edits. Shared types and route source below are read-only context.

## Allowed patch ownership

- Modify only components/client-page.tsx.
- Add lib/client-invoice-presentation.ts if the pure helper makes the change clearer; do not move networking or authority into it.
- Add tests/client-invoice-presentation.test.ts and, if useful, tests/browser/client-invoice-presentation.spec.ts. Use fictional data and route mocks; no real API calls, environment files or database changes. Tests are proposals you cannot run here.
- Do not edit any other existing file. In particular, lib/domain.ts, lib/browser-read.ts, app/api/client/[token]/route.ts, shared CSS, backend/controller/AI/provider code, dependencies and configuration are read-only. Backend agent PA-1 owns a different review scope.

## Acceptance cases and non-goals

Cover unpaid30000/30000, partial30000/7500, paid30000/0, cancelled30000/0, OTHER30000/0 and OTHER30000/30000; do not display an unknown zero balance as paid. Include accepted change with no invoice and accepted change with an already paid invoice using neutral receipt text. Multiple proposals/invoices must not be paired by array order. Check eligible PayPal links remain as before and no pay action appears for paid/cancelled/unknown states. Include a route-mocked browser test or precise manual steps for 320px readability and keyboard links, plus assurance of no source-state mutation. Do not invent user research, video proof or runtime results.

## Exact return format for easy integration

1. Short before/after behavior table, noting decisions and any missing evidence.
2. One JSON integration manifest: task_id PA-2, packet_revision B1, change_id B-01, baseline_files (an array of objects with path and sha256 string fields copied from the snapshot), files_changed/files_added (arrays of repo-relative filename strings), dependencies_added (empty array), test_status proposed-not-run, conflicts_with (empty string array: no PA-1 owned edits), requires (empty string array for this independent task), and unresolved_questions (string array).
3. One unified diff per allowed file using exact repo-relative paths and original context. New files use /dev/null. No ellipses, pseudocode, omitted imports, complete unrelated rewrites or commands that change state. Preserve existing strings/selectors outside the requested clarity changes.
4. Proposed tests with expected assertions and exact existing runner commands for the terminal agent to verify; label them unexecuted. Browser fixtures must be local route mocks and never use real tokens/accounts.
5. A short handback: patch application order, expected impact, integration risks and fallback if a baseline hash differs. If the request cannot be completed within the allowed scope, explain the specific dependency rather than silently expanding scope.

The primary workspace will compare hashes, read the diff, verify behavior, run targeted checks, record accepted/deferred findings in the action plan, and apply only approved changes. You may suggest that no helper is needed if the resulting diff stays small and testable. Never claim a patch was applied here.

## Source snapshots

The client API source is provided to show exactly which fields and states exist; it is not permission to change it. Connection-recovery tests show fixture patterns and existing UI behavior to preserve. Playwright configuration is read-only runner context; do not assume the web agent can execute it. Only own source is included, no environment files/data/licences/vendor files/history or private correspondence.
`;
const intro = medium ? mediumIntro : `# Nudge: self-contained web-agent master packet

Prepared ${new Date().toISOString().slice(0, 10)}. The owner will give you this single Markdown file. You have no terminal or access to the repository. All source you can inspect is included below. Do not claim to have run it. The primary coding workspace continues independently; your work is a proposed review/patch for us to verify, not an automatic merge.

Revision A2 / action-plan task PA-1. This revision tightens the return contract and updates verified evidence; the original14 source snapshots are preserved, with one additional read-only verification guard supplied. If you already reviewed revision A1, retain valid reasoning and update only what this addendum affects. PA-2 is a separate frontend presentation task; do not duplicate it.

## Your assignment: payment integrity and crash recovery

Perform a rigorous review of the included application and rehearsal-controller sources. Focus on a freelancer's accepted USD300 extra-work quote becoming one sandbox invoice, one send and an authoritative payment status. Investigate uncertain responses, process death/restart, concurrent requests, stale workers and duplicate/out-of-order webhooks. Find practical, reproducible faults or establish the limits honestly. Then propose minimal code fixes and meaningful tests for the highest-impact confirmed issues. Complete the analysis and proposals together; ask for a missing source file only when the conclusion depends on it.

### Required return format

1. Executive assessment: what appears sound and the top three risks, with confidence.
2. Evidence table for each finding: severity, exact file/function and quoted short code, triggering sequence, current consequence, expected consequence, confirmed-from-code versus hypothesis, and any missing evidence. Explain an actual failure path; a generic best-practice checklist is insufficient.
3. Failure matrix: before/after local reservation, remote create/send, lost response, local persistence, restart, recovery, webhook verification and reconciliation. State what durable evidence remains and which operation is blocked or permitted.
4. For at most three high-value fixes, return unified diffs against the included files, plus proposed deterministic tests with fictional responses. Keep public interfaces compatible unless a change is necessary. Do not rewrite unaffected files. If no defect merits a patch, say so.
5. Explain integration order, tradeoffs, rollback and exactly which checks the terminal agent must run. Mark every test as proposed/unexecuted. Separate blocking fixes from optional improvements.
6. End with a concise handback the primary agent can act on. Include source fingerprints for each proposed changed file so we detect edits made since this packet.

### Integration contract (A2 addendum)

- Review all supplied sources, but propose at most three independent fixes labelled A-01/A-02/A-03. Order confirmed correctness/recovery faults first. Distinguish ordinary failure behavior from an attacker who can rewrite local files. If tests or authority elsewhere block the alleged path, explain that instead of reporting a false defect.
- Allowed existing patch targets are the supplied backend/controller/guard files and tests/sandbox-payment-continuation.test.ts. You may add tests/agent-a-payment-integrity.test.ts for deterministic regression proposals. No frontend component, CSS, dependency/configuration, database/schema, sponsor or unrelated documentation changes. Do not implement the launcher or expand the product.
- For each independent fix, provide a JSON manifest with task_id PA-1, packet_revision A2, change_id, confirmed_or_hypothesis, baseline_files (path + supplied SHA256), files_changed, files_added, requires (other change IDs), conflicts_with, dependencies_added (empty), test_status proposed-not-run and unresolved_questions. Copy baseline hashes from this packet; do not invent or calculate unseen file versions.
- Use baseline_files as an array of objects with path and sha256 string fields. Use arrays of repo-relative filename strings for files_changed/files_added, and string arrays for requires/conflicts_with/dependencies_added/unresolved_questions. These types also apply to PA-2. Use one manifest per independently applicable fix; do not mix alternatives into the same patch.
- Follow each manifest with a complete minimal unified diff using repo-relative a/ and b/ paths; new files use /dev/null. Include actual imports and original context; no ellipses, pseudocode, unrelated reformatting or whole-file replacement. Keep tests with their corresponding fix. If a needed file is not supplied, request it precisely rather than fabricating a compatible API.
- Include one exact fictional failure sequence/reproduction and expected durable markers before/after for each fix, and explain whether it prevents a duplicate, preserves recovery evidence or merely improves diagnostics. Separate unexecuted test proposals from actual source-derived conclusions.
- End with application order, reproduction/check commands for our existing runners, behavior risks and a non-destructive reversal description. Do not suggest reset/force-push, deletion of attempts/evidence or automatic network retries. Primary workspace will compare hashes and independently reproduce before applying.
- PA-2 alone owns components/client-page.tsx and its optional new presentation helper/tests. Flag cross-scope concerns as observations for the primary workspace, not overlapping patches. If no fault is confirmed, a concise evidence-backed no-change result is valid; do not manufacture fixes to fill the requested slots.

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

- One live Elastic comparison on the selected fictional case completed, additional/S2. The same saved response received recorded human review, USD300 owner approval and fictional client acceptance in the actual UI. Operator played both roles; this is not independent client/user research. The same quote then produced one live sandbox invoice/send; owner checkout and exact provider/local PAID/$0 reconciliation with matching local Analytics are now verified across sessions. No confidential record is included here.
- A separate seeded disposable fixture passed the actual website create/restart/send/reconcile journey using fictional PayPal responses. The original deadline remained expired, a separate ten-minute payment permission used the original durable ledger, one create/send was reserved, and browser/app closure was confirmed. Injected failure after fictional creation also cleaned up. Later live evidence above is separate; neither proves fresh PAID webhook delivery or a finished uninterrupted video. Original financial history remains create1/send1; the closed financial grant was not revived for the separate read-only paid check.
-47 focused offline checks passed earlier; three later read-only guard tests, TypeScript and actual provider/UI/Analytics checks also passed. Do not combine different runs into one claimed suite. These are bounded engineering checks, not product validation, full-system security certification, model accuracy or independent user evidence.
- Prior real PayPal sandbox checkout/reconciliation exists at a different amount. Retained signed events prove SENT/redelivery behavior, not the selected quote's fresh PAID webhook. Do not overclaim.
- Numerical Elastic allowance/billing exhaustion and judging continuity are not fully established. Sponsor permission/access/technical-expiry checks, manual Narrator/actual zoom/touch, user validation, public-source/history decisions, final judge access and video remain open. No paid subscription, public deployment or final submission is established.
- The main agent continues judge readiness, sponsor-access and demo work here. The payment launcher has already run successfully; do not duplicate its implementation. Changes you propose to shared controller/runtime files will be checked against current source before application. Its source is not included; ask for a precise missing file if a finding actually depends on it.

## Boundaries for your answer

Do not request environment files, keys, credentials, licence text, private links, databases, raw event payloads or private emails. Use fictional values. Do not suggest disabling checks, fake time in a real session, resetting attempts, extending old grants or creating replacement invoices to escape uncertainty. Do not publish, contact sponsors or claim to execute anything. No broad redesign, new sponsor, dependency upgrade, new authentication system or speculative refactor. Support any external API claim with official documentation and label unverified claims. Included code controls are not necessarily effective against an attacker who can rewrite local state; distinguish operational guardrails from security boundaries.

## How the primary workspace will use your response

We will save it privately, verify file fingerprints, reproduce findings with fictional inputs, accept/defer/reject each recommendation in the action plan, apply only reviewed changes, run appropriate checks and then commit with the owner. Existing user work and historical evidence must be preserved. If required context is absent, ask for the precise missing function/file and explain why; do not invent its behavior.

## Source snapshot

Each file below is our own source, copied exactly with a SHA256 fingerprint. File line1 is the first line of its code block. Tests describe intended behavior and are not proof of unstated guarantees. No actual environment, database, Git history, vendor distribution, secret value or financial record is included.
`;
const updateIntro = update ? '# Nudge: agent A revision A2 update only\n\nUse this only if you already have revision A1 of WEB_AGENT_MASTER_PACKET.md. Keep your prior reasoning and original14 source snapshots; those blocks were verified byte-for-byte unchanged. This addendum changes the return contract/current evidence and supplies one additional read-only guard. It does not restart your assignment. PA-2 owns only client UI presentation; avoid that scope. The main workspace will review and test every proposal.\n\n' + intro.slice(intro.indexOf('### Integration contract'), intro.indexOf('## Product, audience')) + intro.slice(intro.indexOf('## Verified state'), intro.indexOf('## Boundaries for your answer')) + '\n## Additional source snapshot\n' : intro;
let output = updateIntro, bytes = 0;
for (const file of files) {
  const stat = lstatSync(file); if (!stat.isFile() || stat.isSymbolicLink() || (bytes += stat.size) > 180000) throw Error('Packet source boundary rejected');
  const source = readFileSync(file, 'utf8'); if (sourceFindings(file, source).length) throw Error('Selected source needs private review before packet export');
  const hash = createHash('sha256').update(source).digest('hex');
  output += '\n### ' + file + '\n\nSHA256: ' + hash + '\n\n```' + (file.endsWith('.tsx') ? 'tsx' : file.endsWith('.ts') ? 'typescript' : 'javascript') + '\n' + source + '\n```\n';
}
const refresh = process.argv.includes('--refresh'), outputFile = update ? 'WEB_AGENT_A_UPDATE.md' : medium ? 'WEB_AGENT_MEDIUM_PACKET.md' : 'WEB_AGENT_MASTER_PACKET.md';
const title = update ? '# Nudge: agent A revision A2 update only' : medium ? '# Nudge: web-agent B client invoice clarity packet' : '# Nudge: self-contained web-agent master packet';
if (refresh && !readFileSync(outputFile, 'utf8').startsWith(title)) throw Error('Unexpected packet; do not overwrite');
writeFileSync(outputFile, output, { flag: refresh ? 'w' : 'wx' });
console.log(JSON.stringify({ file: outputFile, sourceFiles: files.length, sourceBytes: bytes, packetBytes: Buffer.byteLength(output), privateDataIncluded: false }));
