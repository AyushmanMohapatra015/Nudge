// Round-two exports are separate immutable snapshots; original packets stay unchanged.
import { readFileSync, writeFileSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sourceFindings } from './check-public-source.mjs';

const mode = process.argv[2];
if (process.argv.length !== 3 || !['--a', '--b'].includes(mode)) throw Error('Choose --a or --b');
const common = `
## Context shared by both assignments

You are a web-based AI collaborator with no filesystem/terminal access. All sources you need initially are below. Do not ask for credentials or pretend to run commands. Return proposals; the primary terminal workspace reproduces, reviews and integrates selectively. Continue useful prior reasoning if this is the same conversation, but this packet is the authoritative snapshot for this new assignment. Do not redo PA-1/PA-2 or mix their patches into this response.

Nudge helps freelance web designers and micro-agencies connect accepted scope, a client change request, clause-cited AI draft, recorded human scope review, owner-set quote, client acceptance and separate PayPal sandbox invoicing/payment reconciliation. Next16 App Router/React19/TypeScript/Node24.12, Zod and single-owner SQLite on one host. Keep the architecture, current design and human authority. No new dependencies, services, schema migration, live-money feature, autonomous payments or multi-user redesign.

The same fictional USD300 booking extra has verified actual website Elastic assessment, owner review, fictional client acceptance, PayPal sandbox create/send, owner checkout and authoritative PAID/$0 reconciliation across sessions. That is one development example, not general model quality, real customer benefit, an uncut final video or a fresh PAID webhook. The original USD1200 base was not paid in that example. AI cannot price or execute payments. Private client links are expiring bearer access, not verified identity/e-signatures.

PayPal integration is central. Elastic is the selected scope provider with tools/skills/capabilities disabled; normal AI is paused. AG Studio3.0.0 supplies actual embedded analytics and native reading fallbacks; its dashboard AI is disconnected. Bryntum Gantt7.3.7 supplies optional owner delivery planning. Postman/Newman is local, no cloud account needed. Render credits were claimed but no deployment/billing configuration is verified. Astropods inactive, APIMatic explicitly excluded; no other sponsor integration is selected.

Hackathon requirements supplied by the owner: meaningful PayPal sandbox plus AI, working prototype, public MIT original source excluding proprietary distributions, complete runnable instructions OR hosted build, tools/description and public YouTube video under3minutes. Judging: implementation, coherent design, credible specific impact, innovation, presentation. Owner values quality, faster progress, budget control and the existing action plan. Preparing packets does not make features complete. Real-user research/manual Narrator/actual zoom/physical touch, sponsor/judge continuity, public-source/history decisions and final deliverables remain open. Demo-script work is explicitly deferred; do not spend this assignment writing a pitch or video script.

Latest owner-reported Elastic trial ends November4,2026 at05:29UTC; numerical managed-LLM allowance/exhaustion and December15 access are unconfirmed. AG expiry November21; permission/December15 request outcome unverified. Bryntum written project permission allows free public non-commercial judging through December15,2026 with separate proprietary dependency, but technical/local-judge acquisition checks remain. These facts are context, not authority to activate anything or legal conclusions.

## Lessons from round one — mandatory corrections

Agent A labelled limitations as confirmed severe deadlocks without distinguishing existing recovery, deliberate fail-closed boundaries and absent launcher context. Primary reproductions showed that incomplete cached drafts have fully validated recovery; a stale parent session can close through the launcher's existing reopen-before-cleanup path. Keeping an uncertain-send marker when PayPal reads DRAFT is deliberate: a snapshot does not prove an earlier request cannot still complete. Blanket DRAFT clearing and wider arbitrary recovery reads were not adopted. A leftover lock is separate from version mismatch. Do not weaken either boundary to make a test pass, invent provenance guarantees, or mark missing evidence as none.

Agent B's bounded invoice-copy proposal was useful and is now integrated. Final TypeScript, isolated production build/Postman47requests/77assertions/restart and17targeted Playwright checks passed. However, two new-file diff headers undercounted their added lines; git apply --check accepted them but actual application omitted closing tails. Primary corrected that and test-tail placement before passing verification. Never equate patch parsing with complete code or runtime success. The first round's source snapshots remain preserved; do not regenerate them or assume old UI hashes still match.

## Return format — stricter integration contract

1. Start with a compact inventory of sources actually reviewed, evidence-backed conclusions, missing evidence and outcome. Distinguish a reproduced-in-your-reasoning sequence from an executed test; you execute none. No defect quota: a no-change correctness result is valid.
2. For each finding, quote the exact supplied function/short code; give a fictional trigger, existing guard/test/recovery, precise consequence, intended contract, evidence confidence and remaining hypothesis. Analyse delayed responses and competing activity before proposing guard changes. Rank impact against this single-owner hackathon prototype, not an imagined distributed production platform.
3. For every independently integrable change return one JSON manifest: task_id, packet_revision, change_id, baseline_files:[{path,sha256}], files_changed:[], files_added:[], requires:[], conflicts_with:[], dependencies_added:[], test_status:'proposed-not-run', unresolved_questions:[]. Paths are repo-relative strings; hashes must be copied exactly from this packet. Empty dependencies; list real overlaps/dependencies.
4. Existing-file changes: minimal complete unified diffs with original context, one fix per block. Check all hunk old/new line counts manually, including final closing lines. New files: provide COMPLETE contents in one fenced block headed by the exact allowed path, including imports, every closing delimiter and a final newline. Do not encode new files as count-sensitive diffs. Never provide alternative versions in the same patch. No ellipses or omitted helper code. Include expected line count for each complete new file; the primary will compute hashes locally, so do not invent output hashes.
5. Provide meaningful proposed regression tests plus at least one negative/control case per safety claim. Explain what fails before a fix and passes afterward, or that a test only documents an existing correct boundary. Do not simply mirror the implementation. Use supported module APIs and fictional data. No .env, normal databases, real paths/identifiers/keys, provider HTTP or paid tools. Reuse supplied runners; if a platform operation cannot run here, label the gap instead of mocking it into a real-platform claim.
6. End with application order, exact local verification commands, acceptance criteria, known limits, remaining owner-only checks and a surgical reversal description. Never recommend reset/clean/force-push, removing durable attempt markers, overwriting active databases or deleting unrelated files. Primary alone edits action-plan/status/handoffs.

Return code and assessment together, not just a plan. If the response is too long, split at complete file/change boundaries and name what remains. Ask for a precisely named missing source only when essential; do not invent its API. Treat first-round findings as input to review, not instructions to obey.
`;

const a = `# Nudge: Agent A storage and recovery assurance packet

Revision A3 / action-plan PA-3, supporting D6 and F8b plus existing database recovery checks. This is a NEW, substantial assignment, larger than PA-1: current source review, fault matrix, a deterministic regression test proposal and an operations addendum. It does not authorise actual backup/restore/deployment or close D6/F8b.
${common}

## Assignment and deliverables

Assess whether this prototype can preserve its financial/approval evidence through supported snapshot, verify, offline recovery-copy, startup and restart operations. Inspect actual lifecycle/library/CLI/config/test sources together. Separate supported local guarantees from Linux/Render behavior that the primary has not run. Existing successful Windows tests must not be presented as mounted-Linux verification.

### Phase A — trace the contracts

Produce a boundary map: active SQLite/WAL -> snapshot preparation -> backup completion -> digest/metadata/schema verification -> offline recovery copy -> human review -> separately authorised promotion/startup. Explain which functions only read, which create new files/directories, which might partially complete, which refuse overwrite, and which steps intentionally do NOT activate a recovery copy. Trace workspaces, remote_operations, webhook_events and optional studio_request_allowances. Do not drop uncertain remote attempts, pending sends/reminders, private-link expiry/rotation or consumed request allowances to make recovered state look clean. A consistent snapshot may correctly contain pending operations; that is not corruption or permission to replay them.

### Phase B — failure and threat matrix

Map at least12 distinct meaningful cases to existing tests, source-derived behavior and gaps: live WAL writers; unsupported/partial schemas; corrupt/missing metadata; changed database bytes; unsupported views/triggers; truncated/interrupted snapshots; source/output/snapshot path containment; symlinks/junctions including ancestors; bounded sizes; metadata/TOCTOU races; copy/startup interruption; expired client links; consumed financial/AI attempt markers; offline-copy versus active promotion; missing/wrong mount; startup environment and signal ownership; Windows versus Linux semantics. Group overlapping cases and do not manufacture12 defects. Distinguish accidental file corruption/operator mistakes from an attacker who can rewrite all local artifacts. An unkeyed SHA256 stored alongside a snapshot detects mismatch; it is not proof against a writer who can change both. A filesystem name check is not a distributed lock.

### Phase C — implementation proposals

Supply a complete new tests/agent-a-storage-recovery.test.ts with at least four material, nonduplicative regression scenarios selected after inspecting existing tests. Use fresh ignored data fixtures and Node SQLite; no real storage mounts or app workspace. At least one case must protect preserved uncertain financial/request evidence, one must challenge a filesystem/metadata boundary, one must test partial-output refusal/recovery semantics and one must separate simulated configuration from real Linux mount verification. If a requested case is already fully covered, add a harder justified variant or explain a no-new-test decision instead of copying it. Test source is proposed/unexecuted.

For at most two independently justified defects, propose minimal fixes plus corresponding tests. Accepted existing patch targets ONLY: scripts/database-lifecycle.mjs, scripts/render-database-operations.mjs, scripts/render-config.mjs, scripts/start-render.mjs. Read other supplied files for context, do not patch them. No weakening fail-closed guards, automatic stale-lock deletion, retries, active restoration/promotion, schema expansion, provider actions or new CLI activation. If the safe fix needs an unlisted file, state why and stop that fix at a precise recommendation. Do not change lib/store.ts, lib/processing.ts, application routes or payment controllers.

Supply COMPLETE new STORAGE_RECOVERY_ADDENDUM.md, concise and operational: supported guarantees, test matrix references, safe offline rehearsal steps, what actual Linux/Render checks remain, non-sensitive expected receipts, uncertain-operation review and owner approval points. Keep it an addendum; do not replace existing recovery/maintenance docs. No real billing prices, external service guarantees or sponsor permission claims inferred from local source. External documentation claims need first-party links or 'unverified'.

Allowed new files ONLY tests/agent-a-storage-recovery.test.ts and STORAGE_RECOVERY_ADDENDUM.md. Test proposal can accompany a no-runtime-fix result. IDs PA-3/A3 with changes A3-01/A3-02/etc. No overlap with PA-4's evaluation paths or the primary's app/judge-access work. Use 'larger task' to mean deeper useful verification, not more features or speculative rewriting.

## Safe verification the primary may later run

Known existing commands: node node_modules/tsx/dist/cli.mjs --test tests/database-lifecycle.test.ts tests/render-database.test.ts tests/render-config.test.ts tests/agent-a-storage-recovery.test.ts; npm.cmd run typecheck. Windows restricted tsx may fail before tests with uv_os_get_passwd ENOMEM; primary uses the approved outside-sandbox rerun, not dependency changes. No actual backup CLI, Render startup or service provisioning should be executed from your response automatically.
`;

const b = `# Nudge: Agent B offline AI evaluation comparison packet

Revision B2 / action-plan PA-4, supporting E7/E8 offline preparation. This is a NEW substantial implementation assignment, larger than PA-2: saved-output comparison library, bounded CLI, deterministic tests and an evaluation guide. Live model evaluation, new inference, research/outreach and sponsor usage remain deferred; this work must function entirely offline.
${common}

## Assignment and fixed boundaries

The existing scorer and summarizer measure25 development-visible fictional cases. They already separate invalid outputs, simulation, error directions and manual semantic review. Build a companion comparison tool for the SAME benchmark: compare saved lexical/plain-LLM/Nudge outputs and repeated runs without changing the old scores, labels or runners. This makes later approved evaluation auditable; it does not prove AI improves outcomes today. Current baseline16/25 classifications and12/25 automated checks are historical measured lexical results, not model accuracy.

Deliver COMPLETE new files ONLY:
- evaluation/compare-scope-runs.ts
- scripts/compare-scope-runs.ts
- tests/scope-run-comparison.test.ts
- EVALUATION_COMPARISON_GUIDE.md

No existing-file patches, package/config updates, model calls, provider adapters, app/UI changes or new benchmark fixtures. Read supplied code and reuse scoreScope/summarizeScope rather than redefine their semantics. Keep original cases and their public development exposure. Do not claim independent/human-authored held-out results: you are another AI and have seen the benchmark.

### Input contract

Export compareScopeRuns(raw: unknown). Input is a strict object with exactly records and expectedRepeats. expectedRepeats is integer1..3. records is a nonempty array, max225 rows (25cases x3systems x3repeats). Each strict row has system ('lexical'|'plain_llm'|'nudge'), caseId (known existing two-digit ID), repeat (integer1..expectedRepeats), output (unknown, assessed by existing scorer), and optional telemetry (strict object with optional inputTokens/outputTokens as safe nonnegative integers and latencyMs as finite nonnegative number). Reject unknown IDs, duplicate system/case/repeat keys, unknown metadata keys, invalid numeric metadata and inconsistent repeat indices with generic errors. Malformed model output belongs in invalid-output counts, not an exception hiding the other rows. Do not trust an output.source label or caller-supplied system as proof of an actual run.

### Required report semantics

Produce deterministic stable ordering. For each PRESENT system and each expected repeat report existing summarizeScope results from that slice; for an absent repeat, report missing/zero coverage without calling the summarizer on an empty array. Report absent systems as absent, never zero-error measured competitors. Include submitted/expected slot counts, case coverage and invalid/excluded simulation/missing slots. Report claimed-source counts using ONLY fixed buckets claude/elastic/simulation/absent/unrecognized; never echo arbitrary source values. System labels describe the caller's experimental groups, not the provider: plain_llm can also use Elastic. Do not declare a provider mismatch from those names or silently relabel provenance. Include per-repeat directional confusion/error counts using existing scoring semantics; schema/reference failures and simulation must not be promoted into valid predictions.

Cross-repeat stability: consider classification from schema/reference-valid, non-simulation outputs, matching existing score semantics; missing/invalid/simulation rows reduce coverage and are explicitly reported. Count cases with all expected repeats valid, cases with enough predictions to compare (at least2), and cases with classification disagreement. For expectedRepeats1, agreement/disagreement is not measured. Do not equate agreement with correctness. Give exact denominators; do not hide partial runs or report unsupported percentage summaries.

Matched comparisons: for each pair of PRESENT systems and repeat, expose the same case IDs with valid non-simulation predictions on both sides, and classification/automated-check/error counts for that common subset plus excluded/missing counts. Compare only like repeat indices. No composite winner or superiority claim from unmatched samples. Report cost-weighted error directions (additional->included, included->additional, ambiguity collapse) as COUNTS; do not invent currency losses or numeric weights. Citation-ID/schema validity is structural, not semantic support. Include manualSemanticReviewRequired:true, modelRunVerified:false, heldOutEvaluation:false and factual limitations.

Telemetry: report only supplied observations, field coverage, totals when safe and latency count/min/max/mean. Missing means unknown, not0; reject nonfinite/unsafe aggregates generically. Mark these as reported/not provider-verified; no token-price conversion, budget assurance or billing guarantee. Never include raw model summaries/questions/deliverables, arbitrary metadata, credentials or full input rows in the report/errors. Canonical system names and known case IDs are sufficient. Pure function must not mutate inputs or import environment, database, providers or network.

### CLI and tests

CLI accepts exactly one explicit JSON file, at most256KiB, regular non-symlink file; read with a byte bound rather than trusting an earlier stat alone. Do not expand directories, follow input links, load .env, invoke providers, scan project/data or write report files automatically. Print summary JSON to stdout and generic error to stderr; invalid arguments/input exit1. Local path is caller-controlled; errors must not echo it or raw model text. No default input file. CLI imports the pure comparison library only plus required built-in read APIs.

Return meaningful deterministic tests including at least12 nonduplicative scenarios spanning: clean matched systems; unequal missing cases/repeats; absent competitors; invalid schema/references; simulation/source claims; duplicate/unknown inputs; stable versus disagreeing repetitions; single-repeat not-measured; directional errors; partial telemetry/zero/unsafe aggregation; frozen input preservation and output/error privacy; CLI extra arguments/oversize/symlink/malformed inputs with no provider. Reuse fixed existing cases and construct synthetic outputs in tests; these are tool fixtures, NOT live AI evidence. Distinguish classification correctness from automated checks and both from semantic validity. Do not tune expected labels to make Nudge win.

Guide: input schema with one explicitly synthetic example, commands for current tsx/test runners, exact report interpretation/denominators, manual semantic-citation rubric (supports/contradicts/insufficient), independent exposure/consent caveats, a separately approved future small live-comparison protocol with explicit stop/usage conditions and why no result is measured yet. Do not tell the user to run a provider batch now. Keep current instructions/prompts/data unchanged.

Use PA-4/B2 in manifests, change IDs B2-01 library+tests, B2-02 CLI+CLI tests (same new test file means requires B2-01 and record overlap), B2-03 guide; or return one coherent manifest if the entire companion is inseparable. Avoid conflicting alternative full-file versions. Suggested primary checks: node node_modules/tsx/dist/cli.mjs --test tests/scope-run-comparison.test.ts tests/scope-summary.test.ts tests/scope-evaluation.test.ts; npm.cmd run typecheck. All your tests are proposed/unexecuted.
`;

const spec = mode === '--a' ? {
  file: 'WEB_AGENT_A_STORAGE_PACKET.md', intro: a,
  files: ['package.json', 'scripts/database-lifecycle.mjs', 'scripts/database-maintenance.mjs', 'scripts/render-database-operations.mjs', 'scripts/render-database-maintenance.mjs', 'scripts/render-config.mjs', 'scripts/start-render.mjs', 'lib/store.ts', 'lib/processing.ts', 'tests/database-lifecycle.test.ts', 'tests/render-database.test.ts', 'tests/render-config.test.ts', 'DATABASE_RECOVERY.md', 'JUDGING_MAINTENANCE.md'],
} : {
  file: 'WEB_AGENT_B_EVALUATION_PACKET.md', intro: b,
  files: ['package.json', 'lib/domain.ts', 'lib/scope-instructions.ts', 'evaluation/scope-cases.ts', 'evaluation/score-scope.ts', 'evaluation/summarize-scope.ts', 'evaluation/scope-challenges.ts', 'evaluation/lexical-baseline.ts', 'scripts/score-scope.ts', 'scripts/summarize-scope.ts', 'scripts/run-scope-baseline.ts', 'tests/scope-evaluation.test.ts', 'tests/scope-summary.test.ts', 'tests/scope-challenges.test.ts', 'BASELINE_EVALUATION.md'],
};

let output = spec.intro + '\n## Exact source snapshot\n\nDocumentation snapshots can contain older checkpoints; current verified state above governs this assignment. Source hashes detect drift, not execution or correctness.\n';
let bytes = 0;
for (const file of spec.files) {
  const info = lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink() || (bytes += info.size) > 210000) throw Error('Source boundary rejected');
  const source = readFileSync(file, 'utf8');
  if (source.includes('````') || sourceFindings(file, source).length) throw Error('Selected source requires private export review: ' + file);
  const hash = createHash('sha256').update(source).digest('hex');
  const language = file.endsWith('.md') ? 'markdown' : file.endsWith('.json') ? 'json' : file.endsWith('.ts') ? 'typescript' : 'javascript';
  output += '\n### Source: ' + file + '\n\nSHA256: ' + hash + '\n\n````' + language + '\n' + source + '\n````\n';
}
// Assemble and validate both safety/size boundaries before writing the one chosen output.
if (Buffer.byteLength(output) > 240000) throw Error('Packet size boundary exceeded');
writeFileSync(spec.file, output, { flag: 'wx' });
console.log(JSON.stringify({ file: spec.file, sourceFiles: spec.files.length, sourceBytes: bytes, packetBytes: Buffer.byteLength(output), originalPacketsPreserved: true }));
