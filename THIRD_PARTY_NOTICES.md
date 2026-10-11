# Third-party assets, licences and release checkpoints

R4 source review, October 10, 2026. Nudge's original application code is covered by the root [MIT licence](LICENSE). That licence does not change the licences of dependencies, fonts, icons, vendor services or trademarks. This inventory is release preparation, not a statement that all distribution permissions are cleared.

## Reviewed dependencies

Versions below come from the current lockfile, not the version ranges in package.json. [DEPENDENCY_LICENSE_INVENTORY.json](DEPENDENCY_LICENSE_INVENTORY.json) records all 111 non-root lockfile entries and the lockfile SHA-256. Platform-specific optional packages may not be installed; package metadata alone does not inventory everything bundled inside a dependency.

| Direct runtime package | Locked version | Declared licence |
| --- | --- | --- |
| ag-studio | 3.0.0 | Commercial |
| ag-studio-react | 3.0.0 | Commercial |
| lucide-react | 0.468.0 | ISC; installed notice acknowledges Feather MIT portions |
| next | 16.3.8 | MIT |
| react / react-dom | 19.3.0 | MIT |
| zod | 3.25.76 | MIT |

Unmodified notices from the five permissive direct runtime packages are retained in [THIRD_PARTY_LICENSE_TEXTS.txt](THIRD_PARTY_LICENSE_TEXTS.txt), including Lucide's Feather attribution. Keep this file with redistributed application bundles that contain their code. It is a partial collection: it does not replace the additional notices supplied by transitive or bundled packages.

Direct development dependencies: @playwright/test 1.63.0 (Apache-2.0), @types/node 22.20.5, @types/react 19.3.0, @types/react-dom 19.3.0 (MIT), axe-core 4.14.0 (MPL-2.0), esbuild 0.28.2 and tsx 4.23.15 (MIT), typescript 5.9.3 (Apache-2.0). The separately installed, ignored Newman runner is outside this lockfile inventory; review its pinned runner dependencies if distributing a runner or container image.

The lockfile also includes ISC, BSD-3-Clause, 0BSD, CC-BY-4.0, LGPL-3.0-or-later and combined Apache/LGPL/MIT declarations. Important distribution checkpoints:

- Preserve the vendor-supplied notices inside Next's `dist/compiled` packages; Next's top-level MIT text alone does not describe all its bundled code.
- Preserve axe-core's MPL licence and `LICENSE-3RD-PARTY.txt` if distributing the test tooling. Review any modifications separately under the [MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/); this review made none.
- Retain caniuse-lite's CC-BY-4.0 attribution/licence information if copying its data into a distributable artifact.
- Sharp and platform binaries include libvips/LGPL components. Before sharing a prebuilt deployment image or binary archive, inspect the actual target-platform package notices and applicable source/relinking requirements. Installing from npm in judge setup differs from repackaging binaries. The Windows inventory does not clear a future Linux image. See [Sharp installation documentation](https://sharp.pixelplumbing.com/install/) and the installed platform package's LICENSE.

Do not commit node_modules, vendor commercial source, generated bundles or private credentials to satisfy an attribution requirement. Judge setup installs locked dependencies; a later prebuilt artifact needs its own notice review.

## Assets and external fonts

The reviewed source asset search found no standalone PNG/JPEG/SVG, font, audio or video files outside ignored/vendor directories. This is a bounded file inventory, not proof of provenance for every line of code or future recording.

`app/globals.css` currently loads DM Sans and Manrope through Google Fonts. Their upstream licences are [DM Sans OFL](https://github.com/google/fonts/blob/main/ofl/dmsans/OFL.txt) and [Manrope OFL](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt). No font binaries are vendored in this repository. Browser requests to Google remain an external dependency and privacy/reliability consideration for R8 and judge setup. If self-hosting fonts later, retain each font's copyright/OFL text alongside the files and check the downloaded version before redistribution.

Lucide supplies interface icons. Sponsor names used to describe integrations do not grant permission to reuse logos, music or promotional artwork in the demo video. F6 retains a separate review of the final recording and any newly added assets. Reviewing the sponsor boilerplate as a reference is not permission to copy unattributed assets or third-party code; inspect and preserve its actual licence if code is copied later.

## AG Studio permissions remain pending

Installed ag-studio and ag-studio-react contain commercial `LICENSE.html` files. Keep these vendor terms intact. Do not include the owner's actual evaluation key in this inventory, source, support messages or a public environment export. The key is deliberately available to the authorised browser at runtime; it is not a payment secret or a general right to redistribute the vendor library.

The [AG Studio enterprise documentation](https://www.ag-grid.com/studio/react/enterprise-licence/) says the Studio licence covers built-in grid/chart use. Standalone Enterprise Grid/Charts use, including within custom widgets, needs separate licences. No standalone Enterprise Grid/Charts imports were found in app/components/lib in this review. Recheck before adding such widgets; do not infer permission merely because transitive packages are installed.

The owner-reported evaluation key expires November 21, 2026 and contains evaluation-only/production-not-permitted wording. Generic trial documentation does not resolve those account-specific terms. Before public hosting or final judge packaging, obtain confirmation for:

1. A publicly accessible hackathon evaluation demo.
2. A public MIT application repository referencing npm-installed commercial packages, with a reproducible judge licence setup that does not publish the owner's key.
3. Authorised judge access through December 15, 2026 and an extension if necessary.

Prepared owner-sent questions are in [SPONSOR_SUPPORT_REQUESTS.md](SPONSOR_SUPPORT_REQUESTS.md). No request was sent and no permission or extension is assumed. Keep A3/D4/R9 open until resolved; a public source-only application does not itself give judges a vendor trial entitlement.

## Submission and judging continuity

The [official rules](https://paypalaihackathon.devpost.com/rules), checked October 10, state submission closes November 12, 2026 at noon Pacific Time; judging is December 1–15. Working access must remain available to judges through the end of judging. A hosted URL or complete local setup can satisfy access, but a recording/static replay alone cannot replace a functioning build.

Elastic's reported November 3 expiry precedes submission; AG Studio's November 21 expiry precedes judging. Obtain free extensions or another authorised, functional access arrangement before relying on either for final delivery. An extension request is not confirmation. Live AI remains deferred; this review consumes no credits and activates no subscription.

## Remaining release checks

- R4a completed: bounded assets/lockfile/direct-notice inventory and commercial boundary documentation.
- R4b pending: account-specific AG public-demo/public-source/judge permissions and access continuity. Record only non-sensitive confirmed terms.
- R4c pending: if distributing a prebuilt image/archive, collect the actual target-platform transitive/bundled notices and resolve relevant binary obligations. Recheck after dependency or asset changes.
- R5 next: current clean-source setup/build/workflow/persistence verification. R2b/R2c historical disclosure decisions remain open; this review is not publication approval.

Only documentation and notice files changed. No package update, actual environment/licence/database read, provider call, account activation, deployment or payment was performed. Existing 129-test evidence is unchanged, not rerun as new licence proof.
