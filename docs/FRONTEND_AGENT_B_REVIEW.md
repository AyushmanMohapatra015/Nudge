# Frontend Agent B — primary review, October 26, 2026

FD-B1 first frontend return reviewed from all four files in `Agent2/FRONTEND_AGENT2`. The contract, fixtures, tests and accompanying message are retained as proposals. Nothing has been integrated into application components, routes or the normal test suite.

## Verdict and useful work

This is a useful interaction/reliability companion to Agent A's visual work. Keep the authority trace, exact request payloads, client privacy allowlist, typed loading/login/error wrappers, acceptance-versus-payment distinctions, uncertainty controls and migration/browser-test matrix. It correctly makes explicit that attractive presentation is not evidence of correct behavior. Its 58 scenarios can become a review inventory for the makeover, but are not 58 verified browser cases.

Do not adopt it wholesale yet. The visual story uses S2 for booking exclusion and S3 for revision allowance; this fixture set reverses those IDs. Tests also contain a runner-dependent failure, a tautological owner-transition check, and several overbroad assumptions. These can be addressed incrementally without rewriting the response or touching the backend.

## Preserved inputs and source integrity

`data/frontend-agent-review/2026-10-26-b1/inventory.json` records original bytes, hashes and source comparisons; `.original` files preserve all four returns privately. Original SHA256:

| Original downloaded name | Bytes | SHA256 |
| --- | --- | --- |
| `frontend-makeover (1).ts` | 84649 | `35e6a678c2bf43da4faf190cd06d5563acb5d46e914676a1889259a4aef9ca9f` |
| `frontend-makeover-fixtures.test.ts` | 39131 | `6aef09c832c960705df5a4b1949d4debf15731f348001d7c89c9a0f12f78a955` |
| `FRONTEND_STATE_CONTRACT.md` | 59008 | `068ae1bca92cd10c08cce07d7497d23d4640540043941397f1068729278e3849` |
| `MSG_GIVEN_BY_AGENT2.txt` | 6137 | `3f818cd56e6a7641a2692b76f4362f77e129bd9bfe5f69f58f50e7831e269521` |

All **17 returned baseline hashes match current repository bytes**. All **17 embedded packet sources match repository text after CRLF/LF normalization**. The reported CIP/CIPS mismatch is not reproduced here; do not treat it as source corruption. Retain the agent's historical report, but use this primary verification for the integration decision.

Both downloaded `.ts` filenames now end in `.ts.txt`, preserving their bytes/hashes. This prevents broad `**/*.ts` application type-check inclusion of unintegrated downloads with imports relative to their intended future paths. No configuration/exclusions were changed. The contract and message remain at their original paths.

## Actual verification

Own ignored helpers: `data/frontend-agent-review/prepare-b1.cjs` and `check-b1.cjs`. They prepare a correctly named scratch tree, copying only pure source modules; no app, store, providers or databases are imported. Runtime tests use actual current domain, BrowserRead and client presentation source copies with installed repository dependencies, not the agent's stubbed types/older Zod.

- Restricted tsx startup failed before tests with the known Windows `uv_os_get_passwd ENOMEM`; approved offline rerun used an allowlisted OS environment. No dependency change was needed.
- Original test return: **25 pass, 1 fail, 26 total**. Failure: direct assignment into a frozen object silently fails in this runner mode instead of throwing TypeError. This does not demonstrate that fixture data is mutable.
- In the ignored scratch test ONLY, two direct-property `assert.throws` checks were replaced with `Reflect.set(...) === false` and unchanged-value assertions. Array push rejection remains. Corrected scratch result: **26 pass, 0 fail**. Both original and corrected logs are retained; original attachments remain unchanged.
- Isolated strict TypeScript with the optional extra `noUncheckedIndexedAccess` flag reports three diagnostics in existing transitive `brief.ts`/`delivery-plan.ts` copies, not the returned files. This flag is absent from the repository config. Do not change production code merely to satisfy an extra review probe.
- Repository-compatible strict isolated type-check and repository-wide `tsc --noEmit --incremental false` both complete with no diagnostics (exit0). No application build/browser test was run by this review.

Logs: `original-tests.log`, `portable-tests.log`, `isolated-typecheck.log` under the ignored B1 directory. Passing fixture tests establish internal consistency and selected pure-helper behavior. They do not execute the actual client projection route, owner/client React controls, server gates, visual prototype, provider workflow or assistive technology. Mirrored logic is preparation, not independent proof that a backend gate rejects a request.

## Required revisions

| ID | Finding | Correction |
| --- | --- | --- |
| B-F01 | Fixture AGREEMENT uses S2 revisions/S3 booking, conflicting with shared design/A prototype S2 booking/S3 revisions. | Align the fictional story, analyses, review citations, explanation snapshots and payloads. This is fixture alignment, not migration of real agreements. |
| B-F02 | Frozen-property tests depend on strict-mode exception behavior. | Use Reflect.set result and unchanged-value checks; add recursive Object.isFrozen checks where claiming deep immutability. Do not claim exported scenario containers are frozen unless they are. |
| B-F03 | Transition validation compares an owner destination's surface with itself: `owner ? destination.surface : 'client'`. | Compare with `t.surface` and validate meaningful destination/uncertainty context. Add a negative control showing cross-surface owner destinations are caught. |
| B-F04 | `client-accept-agreement` points its uncertainty to a quote-decision fixture with already-accepted agreement and an approved quote absent from the starting record. | Split agreement/quote uncertain wrappers, retaining last-known starting data. Lost responses may leave the authoritative operation applied; never invent a quote or assume rollback. Same distinction is needed for AI network uncertainty versus a confirmed failed AI operation. |
| B-F05 | Every invoice DRAFT is asserted to have no payUrl. Actual sandbox create may retain the provider recipient URL while status remains DRAFT (`lib/paypal.ts:56-58`). | Treat absent URL as one fixture variant, not a production invariant. Ensure a DRAFT with a URL is still excluded from the client projection and has no owner payment link. |
| B-F06 | Several tests compare hand-copied rules/allowlists/schemas with author-created expectations; the strict schema mirrors differ from the real non-strict Zod object schemas. | Name these as fixture/mirror checks, not actual route/privacy/server rejection evidence. Keep strict payload-shape lint separate from production parser equivalence. Do not change routes to make the mirrors authoritative. |
| B-F07 | Source report suggests reconciliation on every 5s poll; actual `reconcileOutstanding` throttles checks30s, skips while processing, and limits eligible invoices10. | Distinguish GET invoking the fallback from a provider call or guaranteed fresh status. Source `lib/reconciliation.ts:8-15`. |
| B-F08 | Generic failure copy says rejected actions leave workspace unchanged; provider failures may persist processing/error/audit state and external operations may already have happened. | Distinguish validation rejection, known provider failure, lost response and persisted uncertainty. No blanket rollback/retry/lock-clearing promise. |

Additional accuracy: native `noUncheckedIndexedAccess` probe errors are not repo baseline failures. The contract's "refresh is the only unblocked control" is too broad: unrelated controls can remain enabled after processing clears; uncertain-send blocks that repeat send, not the entire application forever. A failed recorded-review match clears extras confirmation; it does not automatically erase the owner's entered price. A queued read racing with a mutation makes "this tab never sees its processing" too absolute; describe the usual polling suppression rather than a universal impossibility.

## Existing-code observations: preserve evidence boundaries

- Static source supports the Overview ProposalCard missing a proposal-id key, while keyed lists exist elsewhere; local useState initializes from props. This is a credible stale-draft risk, **not yet a reproduced browser bug**. The makeover must isolate per-proposal draft state; add its real browser regression when implementing that slice. No application fix applied here.
- Current conditional view mounting discards unsaved child state on navigation. Preserving drafts is a desired design behavior, but changes lifetime/validation and needs deliberate source review plus tests. Do not silently call it existing behavior.
- Client acceptance checkbox is browser-enforced; the authenticated-by-bearer client POST carries an explicit accept action but no consent flag. This does not remove origin/link/status/idle checks. Do not imply identity verification, e-signature or that GET accepts work. No backend change is authorized by this review.
- Static source shows owner payment links can remain on non-DRAFT paid/cancelled invoices while the client restricts links to unpaid/partial. Record as a presentation decision; no new financial actions are warranted.
- Current stepper's any-PAID check must never become a claim that the whole USD1200 project is paid when only the300 extra is settled.
- Draft outstanding equals total, newest-first audit, and demo no payment URL are supported by inspected `lib/paypal.ts`/`lib/store.ts`. Other missing-source claims remain bounded; no provider testing occurred.

## Next task

Send `FRONTEND_AGENT_B_REVISION_PROMPT.md` plus this review in Agent B's existing conversation. It requests focused changes and negative controls, not a fresh large assignment. Preserve originals; revised attachments must use `.ts.txt`. Continue Agent A's visual revision in parallel. Reconcile corrected fixtures and actual handlers before F2-M2 approval/F2-M3 implementation. Manual R6, sponsor/judge access, publication and submission gates remain open.
