# Targeted public-source readiness check

October 10, 2026. Core action-plan R1, performed while live AI verification is owner-deferred. No publication, provider requests, credit use or ordinary workspace changes.

## Repeatable local check

Run `npm run privacy:check` (Windows: `npm.cmd run privacy:check`). The Node helper uses local Git to inventory tracked files plus non-ignored candidate files. It reads only those working-tree text candidates within the repository; sensitive paths are flagged without opening them. Ignored `.env.local`, normal `data/` databases, screenshots, receipts, build caches and installed dependencies are not read. No environment credentials are loaded.

The bounded helper reports path, line and category only, never matched content. It looks for selected recognizable provider tokens, private-key headers, AG licence text, generated sandbox addresses, UUID client URLs, public tunnel addresses and nonempty credential/identifier fields in `.env.example`. Findings require review and cause a nonzero exit. Unsupported/oversized files cause a fixed failure instead of a silent partial success. It is a targeted review aid, not a complete secret/PII detector.

Local history is inspected for added sensitive **paths only**. Historical file contents, author emails, remote GitHub state, deleted/unreachable objects, exported artifacts and browser bundles are not inspected. A clear report is not permission or a guarantee of safety to publish. R2/R3 track those remaining reviews.

## Findings and changes

The first scan flagged a README tunnel placeholder and two occurrences of an explicit fictional buyer address in a mocked payment test. They were not evidence of a real secret leak. The guide now uses a generic tunnel-host placeholder. The fictional fixture remains readable and unchanged; the scanner allows that exact fictional buyer name without suppressing generated sandbox addresses broadly.

The public environment example now selects Elastic and leaves live AI disabled, with credentials blank. The owner's actual environment is untouched. JUDGE_SETUP.md now accurately distinguishes existing limited live Elastic adapter responses from pending owner website/live semantic evaluation and fresh payment-triggered delivery.

Two tests check location-only output, sensitive paths, empty credential examples, normal configuration and the explicit fictional exception. All123 offline tests and TypeScript pass. No application implementation changed; no new production build/browser run was needed for this helper/documentation/template task. Prior production evidence remains unchanged.

The completed scan reports no targeted findings or historical sensitive paths. Run it again after any source changes; file count varies as new documentation is added. Historical content and operational invoice identifiers remain a separate manual/local review, and full judging readiness remains pending.

## Next task

Follow R2 in REVIEW_ACTION_PLAN.md: historical disclosure review with value-suppressed reporting, including commit metadata. Do not rewrite history, rotate credentials or publish the repository automatically. Record concrete findings and review remediation first. Current sponsor roles and deferred AI gates are in the authoritative checklist.
