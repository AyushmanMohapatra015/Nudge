# Local historical disclosure review

October 10, 2026. Action-plan R2 investigation, while live AI is deferred. No remote Git fetch/push, publication, history rewrite, credential rotation or provider calls.

## Scope and findings

`npm run privacy:history` reviews every commit reachable from current local Git refs, including locally recorded remote-tracking refs. This run covered104 commits and763 unique non-sensitive-path blobs in a non-shallow repository. Each commit tree contributes its file paths; identical blobs are read once and checked under their historical paths. Sensitive files and objects that also appear at sensitive paths are not opened. Local environment files, databases and ignored artifacts are not read.

Historical source and commit messages use the targeted rules documented in PUBLIC_SOURCE_REVIEW.md. No matches for targeted provider-token/private-key/licence/generated-account/private-client-link patterns were found. There were26 README tunnel-pattern matches across old file versions; each is the known `YOUR-HOST` documentation placeholder, not an observed active endpoint. These findings are retained with that narrow classification rather than erased or treated as a reason to rewrite history.

One commit, `51f4dd2f977f`, has a non-GitHub-noreply email in both author and committer fields. The email and names are not printed or copied into this document. The commit is an ancestor of local `main` and appears in locally recorded `origin/main`. No fresh remote inspection occurred, so these refs do not establish current GitHub state. Git identity metadata is distinct from an API credential; the issue is intended public disclosure, not demonstrated account access.

Current effective Git email configuration uses GitHub's noreply format. That affects future commits and does not alter older metadata. Changing GitHub profile visibility, a later commit, or a `.mailmap` does not remove the original metadata from the commit object.

## Repeatability and verification

Run `npm.cmd run privacy:history` on Windows (or `npm run privacy:history`). It prints only file locations, object/commit IDs, categories and boolean configuration status. It reports no matched secret text, email addresses or author names. Its nonzero exit is intentional while a metadata finding or unresolved content/path/shallow-history gap exists; it is not a test failure or proof of a leaked credential.

Three new tests verify identity/value suppression, UTF-8 byte framing, malformed/trailing batch rejection and narrow placeholder classification. All126 offline tests and TypeScript pass. The separate current-source check is clear. Application/runtime implementation is unchanged; no repeated production build/browser run was needed.

The helper is bounded to2000 commits,10000 unique blobs,2MiB per blob and64MiB total content. It checks recognizable patterns, not arbitrary passwords, all personal data, invoice identities or every provider key format. Remote refs not present locally, unreachable/reflog objects, GitHub caches/forks/PRs/releases, assets and generated bundles remain outside its evidence. Public author names are inherent Git metadata; this review does not assert anonymity.

## Metadata decision before public release

October12 R9 refresh:116 local ref-reachable commits/882 unique blobs reviewed. Repeated historical operational matches resolve to two unique invoice identities and one sandbox payment URL; no values are printed. One older non-noreply metadata commit and26known tunnel placeholders remain. PUBLICATION_READINESS.md records the current-source/index evidence, owner disclosure/remediation decisions and unverified remote/licence gates. No history rewrite or publication occurred.

October 10 R3b update: expanded source patterns now also detect operational-format invoice IDs and sandbox invoice payment links. A refreshed107-commit review reports repeated historical occurrences of both; these were outside the earlier targeted rules above. Current-source helper/doc cleanup is verified in SANDBOX_FIXTURE_PRIVACY.md, but older copies remain. R2c requires their separate disclosure/remediation review alongside the metadata decision. Do not treat the earlier no-targeted-token finding as a guarantee that history contains no operational details.

R2 investigation is complete; R2b remains open. The owner decides whether this older identity metadata is intended to be public. Do not disclose the address here to make that decision.

If it should be removed, prepare a narrowly scoped author/committer correction using the owner's verified noreply identity. Before execution: commit the reviewed outstanding source work; inventory affected refs and collaborators; create a private recovery backup; record the remote tip for a lease-protected update; review the exact rewritten history and compare source trees. Rewriting an ancestor changes descendant commit IDs. Any forced remote update and collaborator recovery must be explicitly approved before execution. A correction cannot promise removal from all remote caches or copies.

If the owner intentionally accepts public disclosure, record that decision without copying the address, then retain history. Neither decision has been made in this task, and no Git identities or refs were changed. R3 artifact/bundle review may proceed independently while this decision is pending. Repository publication remains a separate checkpoint.
