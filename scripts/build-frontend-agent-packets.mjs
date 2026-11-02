// Self-contained source-only design packets. Create-only; no provider or env access.
import { readFileSync, writeFileSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sourceFindings } from './check-public-source.mjs';
const mode = process.argv[2];
if (process.argv.length !== 3 || !['--a', '--b'].includes(mode)) throw Error('Choose --a or --b');
const shared = `
## Shared context and requirements

You are an external web AI with no terminal, filesystem or repository access. Sources below are the complete initial packet. Work from them, label uncertainty and do not claim to execute tests or inspect a running app. Our primary workspace reviews/renders/tests before adoption. No contact with providers, account access, keys, databases, private links or paid generation is needed. Keep original response/packet baselines; do not redo previous PA tasks.

Nudge is a single-owner Next16/React19/TypeScript/SQLite prototype for freelance designers: accepted scope -> client request -> clause-cited AI draft -> human decision -> owner-priced proposal -> client acceptance -> separate PayPal sandbox invoice/create/send -> authoritative reconciliation. The same fictional USD300 booking extra reached actual website Elastic analysis and PayPal PAID/$0 across sessions; this is one development example, not broad AI accuracy or real customer validation. USD1200 original project was not invoiced in that example. Fresh PAID webhook, final judge access, real user findings, manual Narrator/zoom/touch and final submission remain open.

Backend authority is deliberately stable. No changes to routes/APIs, data/schema, auth, polling/mutation control, prices, policies, payment actions or provider settings. AI is normally paused. No spending or dependencies. AG Studio and Bryntum are meaningful optional working features with native data fallbacks, not marketing decorations. Render is not deployed. APIMatic excluded, Astropods inactive. No extra sponsors or fabricated features.

The supplied FRONTEND_DESIGN_PLAN.md is the current proposed direction: original editorial/project-desk design, warm ivory/deep green, expressive but readable typography, calmer task hierarchy, a candidate original document-to-receipt animation. It is a full visual/layout makeover; it is not approved production code. Existing palette associations can remain while composition changes completely. Finlytic is not chosen. Reference previews are not source redistribution licences. No copied template code/assets or client logos. Prototype/demo states must be labelled fictional; only real server-confirmed results are presented as live in the application.

Round-one lessons: accurate appearance is not enough. Earlier mockup had actual mobile overflow and wrong pricing/acceptance states; a previous code response had incomplete diff hunk counts despite git apply --check. Return complete files, no omissions, closing delimiters included. If reporting line counts, count honestly or say unverified. No hidden first-pass proposal is automatically adopted. No modification of existing app code is permitted in these design assignments.

## Return contract

Return a single coherent implementation/proposal, not competing incomplete versions. New files must be COMPLETE contents in separate fenced blocks with exact intended filenames, imports and final newline; no ellipses, count-sensitive new-file diffs, bundled third-party files or base64 assets. If attachments are available, attach complete text/HTML files and include an inventory. For every supplied source you depend on, copy its path/SHA256 into a JSON manifest with task_id, packet_revision, baseline_files:[{path,sha256}], files_added:[], files_changed:[], dependencies_added:[], test_status:'proposed-not-run', unresolved_questions:[]. No invented output hashes. Empty existing changes/dependencies. New files are proposals, not current files.

End with reasoning, specific primary render/test steps, limits and a concise integration handback. You cannot honestly claim visual inspection at a real viewport, tests passed, accessibility compliance or measured performance. Any missing API/function essential to your conclusion must be named precisely; do not invent it. No git reset/clean/force-push, deletion of evidence, provider calls, active database operations or unapproved backend fixes.
`;
const visual = `# Nudge frontend agent A — original visual prototype

Revision FD-A1 / task FD-A, supporting F2-M2. This assignment is visual implementation in a standalone prototype, not replacement of the functioning application.
${shared}

## Your deliverables

1. COMPLETE NUDGE_DESIGN_PROTOTYPE.html: original self-contained HTML/CSS/inline SVG and small plain JavaScript. No network requests, imports/CDNs, external images/fonts, build step, remote embeds or fetch. Use system sans/Georgia and original vector primitives. No proprietary preview images. Maximum150KiB source target; explain if a necessary exception arises. The primary saves/renders it under ignored data, not as the functional hackathon demo.
2. COMPLETE NUDGE_VISUAL_SPEC.md: visual rationale, token values, page/section structure, responsive behavior, motion map, contrast pairs to verify, limits and handback. Keep it actionable, avoid generic best-practice filler. Explain deviations from the supplied proposed plan before introducing them.

Prototype must have accessible local navigation for FOUR distinct views: Introduction, Today, Change review and Client review. A clearly labelled review toolbar can switch views and fictional states; it must wrap on320px and remain separate from in-product actions. No fake browser-width toggle: the CSS must actually respond to viewport width. Support keyboard, visible focus and prefers-reduced-motion. Main semantic landmarks/headings, labels and native controls. State toolbar must not leak into proposed production UI.

Make the four views look like one considered product rather than a generic card grid. Intro: original signature document/evidence/quote/receipt scene, strong copy, spacious composition, clear Open workspace local navigation. Today: short current-project context, one primary next action, restrained monetary summaries and recent activity. Change review: readable original request + cited S2 booking exclusion, owner decision and separated extra, manually entered USD300 amount and approved explanation. Client: standalone readable work/price, separate acceptance and payment stages, no owner chrome.

Use the same fictional story: USD1200 five-page website, S1 five responsive pages, S2 excludes appointment booking/scheduling integrations, S3 two minor revision rounds. One booking request and owner-set USD300 extra. Demo preset controls must make loading, review-needed, included, ambiguous, additional-reviewed, approved quote, client-accepted, unpaid, partial (USD75 remaining of USD300), paid, cancelled and uncertain-send states inspectable where relevant. You may share state presets between views; do not create fictitious backend entities. Marketing illustrations remain permanently labelled illustrative, separate from prototype operational state.

Important: do not auto-price, accept work or mark paid because an animation or scroll completes. Only the local fictional state selector can show a simulated paid fixture. Client acceptance never triggers payment. Included/ambiguous states cannot expose enabled paid-extra approval. Client invoice UI must not invent invoice/proposal linkage, since client projection lacks it. Uncertain-send state shows a review/reconciliation message and does not invite retry. Critical errors and prices cannot be hidden in collapsed details. No submission to real URLs.

Work at actual widths320/390/768/1440 with natural wrapping. Wide graphs are unnecessary; no forced desktop canvas inside mobile. Intro motion can use layered document planes/line paths and staged transitions, but scrolling/keyboard navigation remain usable without animation. Page transitions must not reset unsaved local inputs or steal focus under ordinary state refresh. No endless marquees, elaborate 3D, cursor replacement, fake metrics or unsupported trust badges. Build delight through type, spacing and meaningful small interactions. This is original app-specific art direction, not a copied commercial template.

Include an inspection checklist tied to concrete selectors/controls and each preset. Explicitly distinguish implemented local prototype interactions from production API actions and unknown runtime results. Primary will render, inspect screenshots and request refinements before app integration. Do not patch components/workspace.tsx, global CSS or any backend file in your answer.
`;
const contract = `# Nudge frontend agent B — state and interaction assurance

Revision FD-B1 / task FD-B, supporting F2-M2/M3 verification. This is an independent source-grounded interaction contract and fictional-fixture assignment. Agent A separately creates the visual prototype; do not duplicate its HTML or compete on art direction.
${shared}

## Your deliverables

1. COMPLETE FRONTEND_STATE_CONTRACT.md: trace existing UI -> handler -> server gate/projection -> intended new view for the CORE owner/project/change/payment/client journey. Include source references, exact payload fields, loading/error/busy/expiry/uncertain states, focus rules and evidence visibility. Explain which local view/component reorganisations preserve current behavior and which require a separately reviewed change. No backend API redesign or new production polling/state architecture.
2. COMPLETE tests/fixtures/frontend-makeover.ts: pure typed fictional review/test fixtures. Import types only from existing domain where useful, never store/provider modules. Use no random IDs, timestamps tied to Date.now, env, files, databases, fetch, timers or real private values. Include a clear type for scenario wrappers distinguishing loading/error/login/loaded states; do not pretend loading/401 is a Workspace. Use fictional stable project/request/invoice identifiers and explicit simulation labels. Do not change/export new domain contracts into production.
3. COMPLETE tests/frontend-makeover-fixtures.test.ts: meaningful proposed fixture validation/privacy/transition controls using the current node:test/assert runner. Prove fixture consistency and that client projections omit owner-only records; avoid asserting your own new object fields alone. These tests are preparation, not proof the redesigned app renders or preserves behavior. No imports of the actual visual prototype or unavailable backend/helper APIs.

Map at least20 meaningful core states, grouping repeated conditions: owner unauthenticated/expired, initial read/loading/error/retry, stale data with actions disabled, agreement draft/approved/accepted, AI paused/in-flight/failed, draft included/additional/ambiguous, recorded review versus edited deliverables, quote awaiting approval/client acceptance/declined, invoice DRAFT/UNPAID/PARTIALLY_PAID/PAID/CANCELLED/OTHER, uncertain send, client consent/unavailable link and poll-versus-mutation focus. Not every scenario needs a giant copied Workspace: reuse immutable base fixture builders and keep source compact. At least16 typed scenarios should exercise the core distinctions and document remaining states without manufactured coverage. Do not label a schema-invalid synthetic analysis as an accepted Analysis object or unsafe pending state as a clean success.

Private client fixtures must use only the current client API's allowlisted fields and the current client presentation rules. Do not include owner audit/policies/raw AI analysis, a real link token or invented invoice.proposalId. Model steps are simulation fixtures, not actual Elastic responses. Canonical amounts are120000 original and30000 extra; partial invoice7500 remaining, paid0, cancelled0 must not imply paid. A quote accepted at30000 is not itself an invoice or cash. No synthetic action may imply a real server command was executed.

For each transition list: starting authority, user control, request payload if one exists, pending UI behavior, server success outcome, uncertain/failure outcome and recovery affordance. Preserve current mutationPending/busy/loadError/processing locks, stale-read cancellation, explicit consent, human price/review identity, separate invoice create/send, no automatic retry, link rotation/expiry and generic privacy-safe error behavior. Existing behavior can have limitations; identify them with evidence rather than silently fixing backend contracts. Invoice state must remain server-authoritative.

Provide a migration map for current Overview/Project/Approvals/Payments/Activity/Rules into Today/Project/Changes/Payments/Tools/Settings, with /analytics, /delivery and /client/[token] preserved. Do not propose a root-route migration, public simulation service or new sign-up. Design component props/interfaces as a concise appendix with existing callbacks passed through; production extraction code is primary-owned, not part of this assignment. Vendor internals are outside the supplied sources; list them as later inspection rather than claiming coverage.

Give a risk-based proposed browser test matrix naming existing suites from the packet and exactly what assertion must survive intentional label/layout changes. Include reduced-motion, real viewport widths, unsaved-input preservation, response reordering and keyboard focus. Label human Narrator/actual zoom/touch and vendor interactions pending; no invented pass counts. Aim to catch attractive-but-invalid UI states before they reach implementation.

Allowed output files are the three named new files ONLY; existing files_changed must be empty. No edits to handlers, polling code, shared CSS, APIs, packages/config or action-plan/status/handoffs. If a sample requires a source not supplied, state the exact missing file and limit the claim. Primary reviews fixtures against actual types and runs meaningful checks before adoption.
`;
const spec = mode === '--a' ? {
  file: 'FRONTEND_AGENT_A_PACKET.md', intro: visual,
  files: ['docs/FRONTEND_DESIGN_PLAN.md', 'docs/FRONTEND_REFERENCE_REVIEW.md', 'lib/domain.ts', 'lib/client-invoice-presentation.ts', 'components/client-page.tsx'],
} : {
  file: 'FRONTEND_AGENT_B_PACKET.md', intro: contract,
  files: ['docs/FRONTEND_DESIGN_PLAN.md', 'package.json', 'lib/domain.ts', 'lib/browser-read.ts', 'lib/client-invoice-presentation.ts', 'components/workspace.tsx', 'components/client-page.tsx', 'components/brief-review.tsx', 'components/processing-recovery.tsx', 'components/client-link-settings.tsx', 'components/quote-explanation.tsx', 'app/api/workspace/route.ts', 'app/api/client/[token]/route.ts', 'tests/browser/workflow.spec.ts', 'tests/browser/connection-recovery.spec.ts', 'tests/browser/keyboard-journey.spec.ts', 'tests/browser/client-invoice-presentation.spec.ts'],
};
let output = spec.intro + '\n## Source snapshot\n\nOwn source/documentation only. SHA256 detects drift. Code/document line1 begins at the fenced block; no dependency or secret contents exported.\n';
let bytes = 0;
for (const file of spec.files) {
  const info = lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink() || (bytes += info.size) > 230000) throw Error('Source export boundary');
  const source = readFileSync(file, 'utf8');
  if (source.includes('````') || sourceFindings(file, source).length) throw Error('Selected source needs private review: ' + file);
  const hash = createHash('sha256').update(source).digest('hex');
  const lang = file.endsWith('.md') ? 'markdown' : file.endsWith('.json') ? 'json' : file.endsWith('.tsx') ? 'tsx' : 'typescript';
  output += '\n### Source: ' + file + '\n\nSHA256: ' + hash + '\n\n````' + lang + '\n' + source + '\n````\n';
}
if (Buffer.byteLength(output) > 260000) throw Error('Packet too large');
writeFileSync(spec.file, output, { flag: 'wx' });
console.log(JSON.stringify({ packet: spec.file, sourceFiles: spec.files.length, sourceBytes: bytes, packetBytes: Buffer.byteLength(output), originalPacketsPreserved: true }));
