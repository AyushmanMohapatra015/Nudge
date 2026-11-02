# Bryntum: separate dependency acquisition for local evaluation

October 17, 2026. This is B2c's documented acquisition/setup path, not a new installation result. Nudge's original source is MIT; Bryntum remains proprietary and is acquired separately from its publisher. No vendor distribution, licence credential or private correspondence is supplied by the repository.

## Permission and access boundaries

The owner-supplied sponsor reply permits this project's free evaluation and publicly hosted, non-commercial judge demo through **December 15, 2026**, and permits publishing Nudge's own MIT source with Bryntum files/credentials excluded. It confirms no automatic paid conversion or payment obligation for that evaluation. All other applicable terms remain. See [permission summary](BRYNTUM_EVALUATION_PERMISSION.md); the original email is retained privately.

That project-specific permission is not a transferable personal licence for every reader or permission to redistribute the library. Local evaluators must obtain Bryntum separately under applicable evaluation terms. If your intended local use or access period is unclear, ask the project owner to coordinate clarification with Bryntum; do not buy access or use someone else's credentials to complete this walkthrough. A hosted judge demo is preferred by the sponsor, but Nudge has no verified hosted URL yet. AG Studio and AI-provider access are separate checkpoints.

## 1. Obtain the dependency from Bryntum

Use the [official Bryntum Gantt page](https://bryntum.com/products/gantt/) and its Free Trial/Download Trial link if you need to review or arrange evaluation access. Choose **Gantt**, not Scheduler or another product. The current form was not completed or audited for this guide; do not assume the project permission changes terms shown for another evaluation.

Bryntum's official product page also advertises public trial npm installation without login or authorization credentials. The [official installation guide](https://bryntum.com/products/gantt/docs-llm/guide/Gantt/npm/repository/installation.md) was inspected in earlier package review; the product page's public-npm statement was rechecked October 17. The web reader could not fetch the markdown guide in this documentation pass because of its content type, and the download form could not be inspected. See [package review](BRYNTUM_PACKAGE_REVIEW.md) for the earlier archive/guide evidence. Public package availability does not remove applicable evaluation terms.

For this locked application, acquiring packages means npm downloads your own dependency copies from the public registry during setup below. A manual ZIP download is not needed by that npm path. Do not copy the owner's downloaded ZIP, node_modules, generated build, licence, private .npmrc, .env.local or database. No private Bryntum registry login or owner API key is part of this public-trial setup. Do not replace the pinned dependencies with files from a newer ZIP or run a fresh npm install that rewrites the lockfile.

Required versions already recorded in package.json/package-lock.json:

| Application dependency | Resolved trial dependency | Version |
| --- | --- | --- |
| @bryntum/gantt | npm alias for @bryntum/gantt-trial | 7.3.7 |
| @bryntum/gantt-react | Matching React wrapper | 7.3.7 |
| @bryntum/gantt-trial-lib | Transitive normal trial-preparation helper | 1.0.1 |

## 2. Install in a fresh local source folder

Use a fresh clone/download of Nudge with its committed lockfile, not an existing configured owner's folder. Do not run npm ci in the active working project merely to read this guide: it replaces that folder's installed dependencies. Node.js 22.16 or later is required; recorded verification used Node24.12.0/npm11.6.2 on Windows.

From the fresh folder, the Windows PowerShell sequence is:

```powershell
node --version
npm.cmd --version
npm.cmd ci --ignore-scripts
npm.cmd rebuild @bryntum/gantt-trial-lib --foreground-scripts --ignore-scripts=false
npm.cmd rebuild --foreground-scripts --ignore-scripts=false
npm.cmd ls @bryntum/gantt @bryntum/gantt-react @bryntum/gantt-trial-lib --depth=1
npm.cmd run dev
```

On macOS/Linux, use npm instead of npm.cmd. Run each command only after the previous one succeeds. Installation downloads packages and runs dependency lifecycle code; the source is not dependency-free. The initial ci command only unpacks locked packages. The helper's normal lifecycle runs next, followed by all normal dependency lifecycles. Complete all three stages; scripts-disabled unpacking is not a functioning trial.

This sequence addresses the observed parent-before-helper preparation failure described in [clean-source verification](CLEAN_CHECKOUT_VERIFICATION.md). It does not patch vendor files, reset a trial or extend evaluation rights. Do not manually run vendor build scripts from the repository root, reinstall to evade expiry, edit generated identifiers, remove watermarks or change the dependency versions to conceal a failure.

If registry access fails or your machine routes the Bryntum scope to a private registry, stop and inspect the local npm configuration privately. Do not paste authentication configuration or change the system registry blindly. If trial preparation fails despite npm reporting success, retain a sanitized description and consult the existing verification record; a successful npm exit alone was insufficient in earlier attempts. Do not repeatedly rebuild an expired or partially transformed bundle as an expiry workaround.

## 3. Review the fictional delivery flow

1. Open http://127.0.0.1:3000 and confirm **simulation mode**. This fresh walkthrough needs no PayPal/Elastic key and makes no model or real-payment calls. Do not copy an existing environment file. If the shell defines NUDGE_MODE, use demo for this fresh session as explained in [judge setup](JUDGE_SETUP.md).
2. Follow the agreement acceptance steps in [JUDGE_SETUP.md](JUDGE_SETUP.md), then open Delivery. An empty plan is expected on a fresh workspace.
3. Enter a fictional base task with supporting clauses, an owner estimate/calendar and a start date. Save a preview, review it and explicitly apply the internal plan. Dates do not become client commitments or payment conditions.
4. Read the native date table. Choose **Show Gantt timeline** when a task has a start date. Confirm that the read-only chart loads and reflects the selected saved plan; compare Original plan, Current plan and Proposed preview when available. Applying previews requires the existing acceptance/version checks.
5. If the chart fails, keep using the native table for the local walkthrough and record the failure. The table fallback does not prove the Bryntum integration or judging-access checkpoint passed. A reload retry may recover a download error; it cannot repair licence expiry. No new licence key or payment should be entered just to continue.
6. Stop the server with Ctrl+C. The fresh simulation creates its own ignored local SQLite records; do not share raw data, exports, logs containing private links, or generated dependency files.

Two known vendor ARIA findings and remaining hands-on checks are recorded in [delivery accessibility review](DELIVERY_ACCESSIBILITY_REVIEW.md). Successful rendering is not accessibility clearance. Native tables are retained intentionally.

## Evidence and remaining B2c checks

| Check | Current state |
| --- | --- |
| Separate acquisition instructions, fixed versions, proprietary boundary | Documented here; no packages installed by this task |
| Same-machine fresh-source lifecycle/build/browser verification | Existing passing R5b evidence in CLEAN_CHECKOUT_VERIFICATION.md; not rerun here |
| Independent evaluator acquisition under applicable terms and actual local walkthrough | Pending; no new evaluator or clean-machine result claimed |
| Exact first-open date and effective installed trial expiry | Unknown; written permission through December15 is confirmed, technical extension is not |
| Hosted Gantt and authorised judge access through December15 | Pending; no hosted build provisioned or verified |

Before submission and before judging, record non-sensitive observations: tested source revision, dependency versions, date/platform, acquisition/permission status, chart/table result and any expiry warning. Keep personal/account details and the sponsor email private. If software expires before the approved date, use the owner's existing Bryntum correspondence for the promised assistance; no message has been sent by this task. After December15, continued use needs a licence or an agreed extension. B2c stays open until its independent setup and technical/hosted checks are actually satisfied.
