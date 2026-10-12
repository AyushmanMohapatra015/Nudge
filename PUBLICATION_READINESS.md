# R9 local publication preparation — October 12

Local preparation is complete; publication is not cleared. No remote inspection, repository visibility change, history rewrite, provider operation or ordinary-data access occurred. This checklist must be rerun against the final source before publication/submission.

## Local evidence

- Initial working tree was clean. All 244 indexed paths matched their tracked working-tree files; no staged changes or sensitive indexed paths were found. The current-source scanner reviewed 244 candidate files with no targeted findings. New documentation changes the later scan count.
- Ref-reachable local history contains 116 commits and 882 unique reviewed blobs; it is not shallow. No sensitive historical paths or unsupported tree paths were found by this bounded review.
- Historical operational patterns produce 299 invoice-ID matches and 103 sandbox-payment-link matches across source versions. Deduplicating their values yields **two unique operational-format invoice IDs and one unique sandbox payment URL**. These are older operational artifacts requiring an owner disclosure/remediation decision, not payment credentials or evidence of a real-money transaction. Their values were processed privately and are not reproduced here.
- There are 26 historical tunnel matches, previously classified as the exact documentation placeholder. No new tunnel pattern was reported.
- One older commit has a non-noreply email in both author and committer metadata. Future Git identity currently uses noreply. Neither the name nor address is printed here; changing future identity does not erase the old commit metadata.
- Root LICENSE is tracked and contains the MIT licence for Nudge's original code. THIRD_PARTY_NOTICES.md preserves separate commercial/dependency boundaries. A tracked licence does not prove GitHub's About display or permission to publish every dependency/key.
- The public environment example's reviewed credential/private URL/email/invoice-reference fields are empty. Postman collections use placeholders; do not export the owner's actual environment, cookies or workspace links. Judge setup uses new fictional local data, labels simulation and retains pending live-AI/fresh-webhook evidence rather than claiming a complete live journey.

The ignored `data/r9-publication-probe.mjs` repeats the bounded historical report and aggregates operational values into counts only; its sanitized receipt is `data/r9-publication-summary.json`. Source/history scanners are heuristic, not guarantees of anonymity or exhaustive secret detection. No GitHub cache/fork/release, unreachable object, remote-only ref or external shared artifact was inspected. See PUBLIC_HISTORY_REVIEW.md for bounds.

## Decisions and remaining gates

1. **R2b:** owner decides whether the older identity metadata is intended to be public. Record the decision without printing the address. A mailmap/profile change does not remove underlying metadata.
2. **R2c:** owner reviews the two historical invoice identities and payment URL privately, then decides whether to retain or remediate them. Current-source cleanup already exists; it does not erase history. Do not open/pay/cancel an invoice just to make this decision. Never assume old links are harmless or expired without evidence.
3. **R4b/A3:** confirm AG Studio hosted evaluation, public-source and judging permissions/continuity. Do not commit the real evaluation key. The original-code MIT licence does not grant vendor redistribution/production rights. Review any prebuilt artifact under R4c before distributing it.
4. **Remote publication:** separately review actual repository visibility, collaborators, About description, detected licence link, releases/assets and public demo access. This task did not sign in, use a GitHub account or change those settings. Making the repository public remains an owner action after decisions and permissions are resolved.
5. **Judge data/access:** distribute fictional seed data and complete setup instructions, not the owner's SQLite database, screenshots, provider receipts or credentials. Simulation needs no account, but does not alone prove the live AI requirement. Final video/README must distinguish live, simulated, mocked and pending behavior; hosting/allowance and manual accessibility retain their own gates.

## If remediation is selected

Prepare a concrete narrow plan before executing: preserve the current reviewed work, inventory affected refs/collaborators, create a protected private Git recovery backup, confirm the owner's verified noreply identity and record the actual remote tip. Keep the backup private because it retains the old content.

Correct only the identified metadata/content; do not delete entire project history or operational tables. Preserve comparison evidence for intended source-tree changes and unchanged application behavior. Review changed commit IDs, affected refs, collaborator recovery and any external credential/access impact. A forced remote update requires separate explicit approval and a verified lease; no command or rewrite is executed by this document. Removal from all existing downloads/caches/forks cannot be promised.

## Completion boundary and next work

R9a local source/index/history and licence/demo preparation is complete. R9b final remote/About/permissions and owner decisions remain open; repository publication is not approved. No application implementation changed, so unrelated browser/build suites were not repeated. R8's build/Postman/privacy evidence remains the latest runtime evidence.

Next independent task is **A4: inspect existing AG Studio widgets, theming and layout against the recorded sponsor brief**, and define one useful bounded improvement with acceptance criteria. Real participant findings remain pending, so do not invent validation or activate dashboard AI. R6 Narrator, real zoom and physical touch remain pending; Elastic verification is still owner-deferred.
