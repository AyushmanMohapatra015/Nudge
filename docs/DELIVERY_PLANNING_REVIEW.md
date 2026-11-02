# B5b: owner-entered delivery planning

October 16, 2026. The owner Delivery page now supports entering estimates, saving a proposed plan, reviewing it, and explicitly applying or discarding it through the existing B4 API. This extends the read-only B5a view; it does not give Bryntum or AI authority to change the workspace.

## Behavior and authority

- An accepted agreement is required. The owner enters the timezone, excluded holidays, task labels, supporting clauses, whole working-day estimates and optional start dates. Milestones have zero duration. Finish boundaries are exclusive; missing dates remain unscheduled. Finish-to-start dependencies are explicit and never move dates automatically.
- The owner-only projection now includes agreement acceptance, clause IDs/text and eligible reviewed additional work with its approved deliverables. Contact details, payment URLs, private notes and model reasoning are excluded. Free text is not anonymized: an owner-written clause or deliverable can still contain personal information. The client projection is unchanged.
- Unsaved entries stay in React memory and cancellation performs no request. Navigation or closing the page loses unsaved entries. Saving writes a preview only. Applying needs the proposed-preview selection and an explicit confirmation checkbox; discard has a separate confirmation. Original dates remain immutable, and the applied calendar and task provenance remain frozen.
- Extra work must reference a reviewed additional proposal. Approved work may be previewed, but apply stays blocked until client acceptance. Payments do not accept work, approve dates or reschedule tasks. No amounts, invoices, client commitments or payment links are editable here.
- The backend remains authoritative for owner authentication, origin, quotas, strict fields, server IDs, workspace/plan/preview versions, idle state, acceptance, calendar/graph validation, transactions and audit. Browser checks provide early feedback only.
- Commands have a synchronous in-flight lock, an 18-second abort deadline, bounded request/response bodies, strict response validation and expected transition checks. They are never automatically retried. An interrupted, malformed or conflicting response blocks subsequent commands until an explicit read refresh; abort does not prove rollback.
- Refresh checks local records only and preserves local draft entries. If their source version changed, saving requires explicit review against the refreshed version. Restaging a stale saved preview is also an explicit action. Unmount cancels requests and suppresses late UI publication. A successful action focuses its notice only when doing so does not displace the user's new focus.

## Verification record

Verification completed in isolated, fictional workspaces. No ordinary workspace, environment credentials, AI credits, PayPal calls or real money were used.

- All 168 offline test outcomes pass, including four new draft/response tests and the expanded owner projection privacy assertion. TypeScript passes after the recovery-label correction.
- The final disposable production build and Postman Newman workflow pass: 31 requests, 50 assertions, restart persistence and no blocked provider-fetch attempt. Receipt: ignored `data/postman-workflow/d3249340-043c-4ec9-9421-6e005ae41850/summary.json`.
- All nine Edge checks pass together against that matching build: three new planning scenarios, two existing delivery-view scenarios, one sandbox owner/session scenario and three core workflow regressions. Receipt: ignored `data/delivery-browser/43de4486-5b88-4126-ba0f-5b6bd0a54fbe/results.json`. The isolated runner compares 12 relevant source/package hashes and uses separate demo and sandbox fixture databases. This is a targeted production run, not a claim that the default development-server browser configuration runs the sandbox fixture correctly.
- The new scenarios exercise cancel without writes, initial preview versus apply, holiday calculation, frozen calendar, immutable original, explicit discard, duplicate native clicks during a held response, committed-but-lost stage response with preserved drafts, refresh/version review, extra-work acceptance, and a real stale-version HTTP conflict. Financial records are compared across planning actions.
- The editor fits a 320-CSS-pixel viewport and passes scoped nested-interactive, button-name, label and color-contrast axe rules. This does not establish complete keyboard, Gantt, Narrator, real zoom or physical-touch accessibility.
- The bounded local public-source scanner reviewed 288 candidate files with no findings or sensitive historical paths; it does not inspect remote repository contents or authenticate complete historical privacy. The final browser receipt has nine expected outcomes and zero skipped, unexpected or flaky outcomes. Its provider-fetch guard recorded no attempt; independent loopback probes confirmed ECONNREFUSED on both owned test ports 3118 and 3119. The ordinary development server was untouched.

The initial offline run exposed one incorrect assertion: the fixture deliberately has an accepted extra, whereas the new projection assertion expected approved. The initial nine-browser run passed seven checks and exposed a misleading saving label during refresh-required recovery plus an overly strict dropdown test selector. Separating the saving state from the blocked state and using the combobox role corrected those failures; the final nine passed together. Initial failures are retained in ignored `data/delivery-browser/6a39e8a7-2aad-419b-bcb2-18361c3c4c6c`; they are not a passing receipt.

## Follow-up checkpoints

Next is B6a: inventory the existing domain, persistence, API and browser coverage against the backend contract, then close material calendar, stale/concurrent, restart and financial-nonmutation gaps without duplicating tests. B6b remains the broader actual Gantt/accessibility review. Editor-specific axe and narrow-layout checks are not full vendor accessibility clearance.

Owner-deferred R6 Narrator, actual 200/400% zoom and physical touch remain pending, along with H human validation and E live-AI verification. Bryntum public hosted/source/judge permissions, exact trial dates and December 15 access remain unresolved. No new sponsor account, paid subscription, deployment or public release is activated by this work.
