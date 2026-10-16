# B2a: Gantt package and integration review

October 16 R5b update: fresh installs exposed parent-before-helper lifecycle order and an unprocessed bundle marker despite npm success. Foreground install and subsequent parent-only rebuild were insufficient. CLEAN_CHECKOUT_VERIFICATION.md records failures and the verified fresh-unpack/helper-first/all-normal-lifecycles sequence with helper unchanged, bundle prepared and11Edge checks. No manual vendor edit, expiry bypass, helper reset or package/lock version change. Local evaluation evidence does not establish public/hosted/judge permissions; B2b/c remain open.

## October 15: B2d exact installation verification complete

Owner approved proceeding with local evaluation. This supersedes earlier notes that all component integration must await public-demo permission: local evaluation can proceed, while hosted use, public distribution, exact trial dates and judging coverage remain B2b/c questions. No vendor package has been installed or executed in this verification step. No private registry account, licence key, paid subscription or AI call was used.

### Actual registry archive checks

Downloaded the three exact public npm archives as data into memory, verified their complete SHA-512 digests against the corresponding HTTPS registry metadata, and inspected tar headers and selected files without extracting the packages or executing their contents. All entries processed had valid tar-header checksums; no traversal/rooted paths or tar links/extended headers were encountered. Registry metadata and embedded package name/version agreed. Matching registry integrity verifies consistency of the downloaded bytes, not publisher signing, absence of vulnerabilities or a full security audit.

| Package | Compressed bytes | Tar entries | Embedded install hooks / dependencies |
| --- | --- | --- | --- |
| `@bryntum/gantt-trial@7.3.7` | 10,926,674 | 102 | `postinstall: node postinstall.js`; exact dependency `@bryntum/gantt-trial-lib: 1.0.1` |
| `@bryntum/gantt-react@7.3.7` | 1,902,179 | 420 | No scripts, dependencies or peer dependencies in embedded metadata |
| `@bryntum/gantt-trial-lib@1.0.1` | 1,679 | 4 | `postinstall: node postinstall.js`; no dependencies |

Verified registry SHA-512 integrity values, in the same order:

```text
sha512-OHvlsCYDGzxdDcFF6JHjPDWiCOynJr8tP1RRteJSZ6c9NT0+DOtgwVyj8MABXmIY61rKABQ+t6csik5ZT1BMqA==
sha512-nKIQ8/BVPF7BqeZDRZSWMFP+ZvjqK8p/TNA6L1e/lH+RQO18SRw6fQeGctj118LHcZQ/CA3utebXv7ORiCRwWA==
sha512-VWtowNi9FBCC6EWz8zZjrnPALCsFrYt4HPwmsgqv3qediQPfyYM/5Bq3rFuEUa1/2C/1u7YXzW2q1HZykHnp+Q==
```

Read the actual archive hook files as text. Their behavior agrees with the earlier mirror-text review: the main hook starts the helper's `build.js` in its current working directory; helper postinstall prepares a UUID in its own build script; build recursively rewrites `.js` licence placeholders under its working directory. The helper is obfuscated. No direct network invocation was observed in these hook texts, but bundled runtime behavior has not been fully audited. Do not manually execute these scripts from the repository root. Future installation should use npm's ordinary package lifecycle in a disposable, credential-free directory first; do not bypass licence preparation or expiry with `--ignore-scripts` and then present the result as a working trial.

The initial restricted download failed with EACCES. An approved retry verified the main and wrapper archives, then timed out fetching the helper archive. A narrowly scoped retry verified that helper; its subsequent guide fetch received HTTP403. These are separate retrieval outcomes, not a fully successful combined script run. All network reads were public and contained no owner/provider credentials.

### Verified installation path and compatibility boundary

Read the owner-downloaded official ZIP's exact `docs/data/Gantt/guides/npm/repository/installation.md`, `docs/data/Gantt/guides/quick-start/nextjs.md` and React Next App Router example metadata without running the example. These confirm the public trial alias and matching React wrapper. No private npm login or `.npmrc` change is required for that public path. The reviewed future command is:

```powershell
npm.cmd install --save-exact --registry=https://registry.npmjs.org "@bryntum/gantt@npm:@bryntum/gantt-trial@7.3.7" "@bryntum/gantt-react@7.3.7"
```

This command was **not run**. First use it in a disposable minimal workspace without `.env`, database, other app dependencies or provider credentials, then inspect the resulting lockfile/install logs and test integration in Nudge. Verify npm actually uses the intended registry before executing; the flag is not evidence about a private scoped registry configuration. Do not copy the ZIP, entire example app, its demo-resource dependencies or obsolete `next export` / `next lint` scripts into Nudge.

The ZIP's example targets Next15.5.10/React18.2.0, whereas installed Nudge versions are Next16.3.8/React19.3.0/TypeScript5.9.3/Node24.12.0. The guide's broad minimum versions and absence of wrapper peer constraints do not establish compatibility with these versions. Actual dev/build/browser evidence is still required. Re-read installed Next lazy-loading and Turbopack guides: browser-only wrapper with `ssr:false` inside a Client Component; no automatic downgrade, bundler change or global stylesheet replacement.

Local inspection helper, selected hook texts, two ZIP guide text copies and helper retry summary are under ignored `data/bryntum-install-review*`. They are review artifacts, not required judge setup tools or redistribution assets. The downloaded ZIP was not fully extracted. Next B5a step: isolated normal trial installation and then a minimal local read-only Gantt compatibility check against the completed delivery API. Public/hosted distribution and December15 access remain unconfirmed; R6/H/E are still deferred.

October14,2026. Read-only public metadata/source/licence review. No package install, trial signup, lifecycle-script execution, registry configuration, application edit or licence activation. No private .npmrc/environment/licence/account inspected. This is a bounded review, not a security certification or tested integration.

## Exact candidates

Approved public-registry metadata reads returned:

| Published package | Version | Declared licence | Install hooks / dependency | Unpacked size |
| --- | --- | --- | --- | --- |
| @bryntum/gantt-trial |7.3.7|Commercial|postinstall: node postinstall.js; dependency @bryntum/gantt-trial-lib1.0.1|51,779,998bytes|
| @bryntum/gantt-react |7.3.7|Commercial|No scripts/peerDependencies returned by selected metadata query; dependencies empty|10,628,868bytes|
| @bryntum/gantt-trial-lib |1.0.1|Commercial|postinstall: node postinstall.js; dependencies empty|3,406bytes|

The intended future package alias is @bryntum/gantt pointing to npm:@bryntum/gantt-trial@7.3.7, with @bryntum/gantt-react7.3.7. These are matching stable candidates, not installed dependencies. Wrapper has no separate trial suffix. Before a later install, recheck release availability/integrity and pin versions exactly; do not select Scheduler or a nightly just because an example mentions it. Public trial access needs no private npm credentials; paid packages use separate licensed access. [Official npm installation guide](https://bryntum.com/products/gantt/docs-llm/guide/Gantt/npm/repository/installation.md).

Declared package engine node>=0.10.0 is too broad to establish actual supported runtime. Current [Gantt guide](https://bryntum.com/products/gantt/docs/) lists Node>=20, React>=16 and TypeScript>=3.6. Locally inspected installed versions: Node24.12.0, Next16.3.8, React/ReactDOM19.3.0, TypeScript5.9.3. Meeting version minima is not successful integration evidence. Unpacked size is not browser transfer size or runtime memory; these numbers do not establish suitability for a512MB Render service.

## Lifecycle hooks read, not executed

Published text inspected from versioned public mirrors:

- [Main postinstall](https://cdn.jsdelivr.net/npm/@bryntum/gantt-trial@7.3.7/postinstall.js) uses child_process.spawnSync to run @bryntum/gantt-trial-lib/build.js, passing the install process's working directory and inheriting output.
- [Dependency postinstall](https://unpkg.com/@bryntum/gantt-trial-lib@1.0.1/postinstall.js) uses filesystem/path/crypto, generates a random UUID and writes the local build-script text. It is obfuscated, so do not equate inspection with a complete package audit.
- [Dependency build script](https://cdn.jsdelivr.net/npm/@bryntum/gantt-trial-lib@1.0.1/build.js) contains recursive directory traversal, .js matching and read/write replacement of %LICENSE% placeholders using the prepared identifier. Working-directory scope matters. Never manually run it from the repository root, or use fetched code as an executable review script.

No direct external-network invocation was observed in these three hook texts. The runtime packages and all bundled contents were not downloaded/audited, so this is not a claim that the full library has no network behavior. Verify the actual registry archive matches these hooks before any later script execution. A staged --ignore-scripts unpack may help inspection, but must not be treated as a functioning trial or used to bypass licence preparation/expiry. No such unpack was done here.

Initial sandbox npm metadata fetch failed with EACCES; approved read-only retry succeeded. Public mirror text fetches failed for some URLs; approved text-only retrieval of the remaining hook from a second mirror succeeded. No scripts were executed to retrieve their behavior; no configuration/cache permission bypass or package downgrade.

## Next.js integration findings

Read installed Next docs: node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md and 01-app/01-getting-started/05-server-and-client-components.md. Client Components are still prerendered by default. The future browser-only Gantt wrapper needs dynamic loading with ssr:false inside a Client Component; declaring use client alone is insufficient. Do not pass server secrets through component props.

The [official Gantt Next.js guide](https://bryntum.com/products/gantt/docs-llm/guide/Gantt/quick-start/nextjs.md), retrieved as text, currently uses7.3.7 and describes Next15. It recommends no Turbopack during starter creation. It demonstrates browser-only dynamic imports, separate structural/theme CSS and project constraints to prevent default task movement. It does not prove compatibility with Nudge's Next16.3.8/Turbopack stack.

Integration criteria for B5/B6:

1. Use existing app, a dedicated client wrapper and exact candidates; no copied create-next-app, replacement global stylesheet, public/data.json containing owner records or arbitrary console logs.
2. Verify actual dev and production bundling with current scripts first. If vendor code fails under Turbopack, inspect installed Next's current bundler options and review a narrowly scoped alternative before changing app-wide scripts. No change made now.
3. Inspect actual package types/config for read-only rendering, explicit timezone/calendar, original/preview constraints and mounted/unmounted cleanup; do not invent API names from the quick start.
4. Disable autonomous persistence: no CrudManager autoSync/write URL to Nudge's existing workspace or client endpoints. B1b stage/apply/discard remains server-authoritative.
5. Check rendering does not move unknown dates/current tasks automatically. Scheduling propagation belongs only to an explicit preview and must match server calendar validation.
6. Review task-label escaping, CSS/FontAwesome third-party notices, bundle/memory/load/error behavior, browser transport destinations and keyboard/text fallback on the actual package. Existing AG checks do not cover Gantt.

## Trial and public-demo permission checkpoint

[Sponsor page](https://paypalaihackathon.devpost.com/details/bryntum) and [trial form](https://bryntum.com/download/) advertise45days. The general [EULA v40](https://bryntum.com/legal/Bryntum%20EULA.pdf), section13, instead describes internal evaluation and a30-day trial with a further30-day negotiation period. This is a terms/duration discrepancy to clarify, not permission to claim60days of functional access. Public npm availability and Nudge's MIT licence do not relicense the commercial library.

Ask sponsor support to confirm applicable hackathon terms, hosted evaluation, public application source versus restricted package redistribution, exact trial start/expiry and free judge access through December15. Do not publish vendor archives, licence/key or trial identifiers in Git or interpret a paid OEM licence as required for our evaluation without sponsor guidance. Ordinary45days from mid-October would end before judging. Existing Render/Elastic/AG allowances do not cover Bryntum.

**B2a complete within the declared read-only scope.** B2b/c owner signup/permission/coverage review is next; install/build/runtime security/compatibility remain unverified. B3's own date/validation/storage work can proceed separately without Bryntum binaries while support guidance is pending. No feature/demo/sponsor-use claim is earned by this review alone.
