# M3: Postman sharing review — October 13

The two tracked collection templates have been reviewed for sharing as source artifacts. This does not approve repository publication, a public Postman workspace, private exports or live execution. No Postman account was needed or accessed; no private environment, ordinary database, provider receipt or cookie store was opened.

## Findings

| Repository template | Reviewed contents | Safe execution boundary |
| --- | --- | --- |
| `postman/nudge-sandbox.postman_collection.json` | Three empty variables; sandbox OAuth POST and two invoice GETs; four script blocks; no saved responses or Cookie/Set-Cookie headers. Basic/bearer authentication uses placeholders. Requests point to PayPal sandbox only. | The private reviewed wrapper needs existing sandbox credentials/invoice; do not run it for this sharing review or publish populated values. “Read-only” describes invoice operations, not an absence of network/authentication requests. |
| `postman/nudge-workflow.postman_collection.json` | Six empty variables;31requests (8GET/23POST);31script blocks; no saved responses or Cookie/Set-Cookie headers. Application requests use the supplied base URL; the deliberate cross-origin rejection case uses an illustrative header. | Use `npm.cmd run postman:workflow`, which creates its own local simulation instance. This is a write-containing collection: never point an imported copy at the ordinary workspace or hosted demo. No reset action is present, but its decisions still change the target database. |

Both parsed-JSON fingerprints match the reviewed runner constants. Scripts contain no `pm.sendRequest`, console calls or imported script modules. JSON schema links are collection-format metadata, not additional API requests. The count-based probe is ignored `data/m3-share-review.mjs`; its sanitized result is `data/m3-share-summary.json`. These checks are bounded to these exact templates, not a general validator for arbitrary imported collections.

The important export boundary is **runtime variable content**. Workflow scripts use `pm.collectionVariables.set` for the fictional bearer link, proposal/review/invoice IDs and original analysis. The sandbox script sets its access token in local runtime scope via `pm.variables`. Wrapper runs clone the templates, use no exporters/reporters and leave tracked files unchanged. That does not guarantee a separately used desktop collection/environment has stayed empty or that request history, response examples, console, cookies or cloud synchronization contain no sensitive data.

Postman's [variable reference](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-variables) distinguishes local and collection-scoped values. Its [export guide](https://learning.postman.com/docs/getting-started/importing-and-exporting/exporting-data) documents collection/environment/global JSON exports. Treat a used export as a new artifact requiring review; masking a value in an interface is not proof it has been removed from the file.

## Sharing procedure

1. Share the clean, reviewed repository templates and documentation, rather than exporting a used desktop collection. The public candidate fields are empty. Do not replace them with an owner's URL, admin token, invoice identifier or sandbox credentials for convenience.
2. Include POSTMAN_WORKFLOW_VERIFICATION.md for the simulation and POSTMAN_VERIFICATION.md for the separately authorized sandbox read-only wrapper. Explain that the first collection writes only an isolated simulation through its wrapper; the second calls sandbox APIs and requires private setup. Neither demonstrates the pending fresh-payment webhook or general live AI quality.
3. Do not attach `.env.local`, Postman environment/global exports, SDK run objects, request histories, saved response examples, cookie jars, raw Newman reports, SQLite files, screenshots containing private links, local traces or provider evidence. The project currently supplies **no Postman environment template**; the reviewed workflow wrapper injects its isolated origin itself.
4. If a public Postman workspace becomes useful, review its actual visibility/plan first under M4. Import fresh empty templates only, inspect all variables/auth/headers/examples/scripts and permissions before publication, and never run the write collection against a shared ordinary workspace. No account/signup/import/publication was performed here.
5. Before a later shared-source change, run `npm.cmd run privacy:check`, recheck both fingerprints and review any new endpoint/script/example/variable. Do not auto-update fingerprints to accept an unexplained edit. An export from a private session is not cleared just because the repository template scan passes.

Repository history, licence permissions and final public GitHub access still follow R9b/R2b/R2c. This review does not erase old commits or authorize publication. Protect local values and any sponsor licence under their existing checkpoints.

## Verification and next task

Four existing offline Postman tests pass: altered-script/destination rejection; approved sandbox options/sanitized reports; loopback restriction and failure/no-export bounds; inherited provider-secret removal and blocked child fetch. Newman transport is mocked for these tests; no live sandbox requests or production workflow were repeated. Collections, digests, application dependencies and runtime code are unchanged, so no unrelated browser/build rerun was needed.

Next independent task is **M5: final judge-facing Postman tool attribution and reproducible-command review**, separating actual Newman evidence from optional desktop/public-workspace use. M4 remains optional; no new sponsor signup or credit activation follows. Elastic stays owner-deferred; R6 Narrator/actual zoom/physical touch and sponsor/publication/human-validation gates remain pending.
