# Sponsor contribution handoff: findings and remaining verification

October 16 R5b installation observation: fresh locked installs of Gantt7.3.7/helper1.0.1 can exit successfully with an unprocessed UUID marker in the bundle. Foreground lifecycle output showed the parent hook before the helper hook; rebuilding the parent afterward did not repair the already-transformed bundle. CLEAN_CHECKOUT_VERIFICATION.md records failures and the fresh-unpack/helper-first/all-normal-lifecycles/check sequence; no vendor code/expiry patch. Treat this as a local lifecycle-order observation requiring a permitted minimal reproduction and duplicate/current-version review before proposing any upstream issue. No report, outreach or public artifact upload is authorized or performed; do not expose generated trial identifiers. Existing ARIA finding12114 remains separate.

October16 B6c update: the Gantt finding is now independently reproduced in a plain-JavaScript one-task7.3.7 fixture, both readonly/editable, without Nudge/React/API/data. Original source and the exact loopback runner are tracked; no vendor files or trial identifiers are copied. BRYNTUM_ARIA_REPRODUCTION.md contains receipts, limits and a polite unsent follow-up. Existing open https://github.com/bryntum/support/issues/12114 already covers the same rule in Gantt; related vendor guidance says wrapper ARIA remains open. Do not claim a novel issue, file a duplicate, assume exact target coverage or patch proprietary code. The useful contribution is a minimized confirmation/follow-up after owner review, not an unsupported OSS PR. No outreach/publication performed. Current main task is B7a; B6d vendor correction and R6 manual impact remain open.

October 16 addition: Nudge's B6b review of the actual Gantt7.3.7 view found two axe `aria-required-children` results, on `.b-grid-panel-body` and the generated normal subgrid. This is an integration observation, not yet an independent minimal reproduction or confirmed upstream defect. See DELIVERY_ACCESSIBILITY_REVIEW.md and tests/browser/delivery-accessibility.spec.ts. The regression keeps the rule enabled, attaches fictional DOM diagnostics and records the findings explicitly; native date/dependency reading provides a separate path. Before reporting, independently reproduce in a small permitted trial fixture, check supported ARIA configuration, keyboard/screen-reader impact, current versions/duplicates and the vendor's contribution/report route. Do not copy vendor program source or credentials. No outreach/publication is authorized or performed. Consult REVIEW_ACTION_PLAN.md for the current main-project task; the older B5a-2 note below is historical.

October 15, 2026. Side task requested by the owner, separate from Nudge's core action plan. No upstream issue, comment, fork or PR has been created. No private account, licence key, provider or actual workspace data was read. Nudge's selected next task remains B5a-2, the owner-only Bryntum screen.

## Read first: instructions for another agent

This document can be handed to another agent as context. It contains original minimal reproduction code, findings, source references, limitations and a per-resource inventory. Local paths refer to `D:\Nudge`; ignored evidence files exist on this laptop but are not in a Git clone. An agent without filesystem access can recreate the embedded sample instead of assuming those artifacts are available.

Keep this side task in a separate project/checkout so concurrent work does not edit Nudge's files, dependencies, configuration, database or Git state. Begin with independent verification. Do not copy `.env` files, licences, API keys, client records, generated bundles or vendor source into a reproduction repository. Re-read current upstream AGENTS/contribution instructions before preparing changes in an upstream checkout.

No paid or live-AI work is authorised by this handoff. Use fictional fixtures and public read-only research. Do not install tools globally, connect sponsor accounts, activate services, send messages or publish issues/PRs automatically. Prepare a concrete draft for the owner. Do not call a vendor defect confirmed merely because an earlier integration failed; preserve the distinctions below. Recheck versions, duplicates and repository restrictions because these observations are dated.

## Inventory across all sponsor resources

This is **all currently recorded sponsor-related findings and material gaps relevant to this project**, not an exhaustive audit of every vendor or all their bugs. “Pending” does not mean “vendor bug.” No candidate except Studio has a newly independent upstream reproduction from this side task.

| Resource | Recorded finding or missing verification | Classification and contribution follow-up |
| --- | --- | --- |
| AG Grid / AG Studio | Studio3.0.0 edit-mode data headers reproduce two nested interactive controls without Nudge code. Shared Enterprise header source identified. | Independently reproduced accessibility finding; strongest reporting candidate. External PR creation is currently restricted and the relevant code is commercially licensed. Confirm maintainer route first. Full screen-reader behavior, keyboard impact and cross-browser evidence still need independent review. |
| Elastic | Earlier conversation404 was resolved using explicit authenticated local execution. Other observed failures involved model selection, interactive/structured responses, a Markdown JSON wrapper and wrong scope interpretations. | No underlying platform defect established. Configuration fixes and model/prompt variability are not automatically SDK bugs. Further calls/evaluation are owner-deferred; do not consume trial tokens to pursue this side task. Check `ELASTIC_VERIFICATION.md`, `AI_EVIDENCE_REVIEW.md` and `ISSUE_CHECKPOINTS.md` locally for bounded historical evidence. |
| Elastic access/usage | Fair-use managed-LLM allowance/exhaustion and free judging access beyond the November3 owner-reported expiry remain unresolved. | Account/support questions, not a code bug. No paid subscription or allowance extension may be assumed. |
| Bryntum | Gantt7.3.7 normal installation and a disposable current Next/React/browser fixture pass. Resolved project-versus-inline-data conflict and bundled icon setup; date-only projection required understanding timezone-adjusted model Dates. | Configuration/serialization findings, not confirmed upstream bugs. Automatic icon-CDN fallback can be useful documentation feedback, but the guide already recommends local icon CSS. Do not report these as regressions without a documented-contract mismatch. See `BRYNTUM_LOCAL_EVALUATION.md`. |
| Bryntum Gantt ARIA | Two axe `aria-required-children` findings independently reproduce in plain-JavaScript Gantt7.3.7, readonly/editable, one task. Keyboard Tab exit passes in Nudge's bounded check; actual Narrator impact is unknown. | Existing open12114 is a matching-rule Gantt report; exact target coverage should be confirmed. Original reproduction and unsent follow-up are ready in BRYNTUM_ARIA_REPRODUCTION.md. Vendor correction remains open; no novel issue, supported patch or public-code PR is established. |
| Bryntum permissions | Trial email says45days; exact start/expiry, public hosted evaluation, source/package distribution and access through December15 remain open. Published trial and general EULA conditions differ. | Licence/support clarification, not an established code defect or permission to assume public deployment. Local evaluation is authorised; no licence identifiers may be published. |
| Astropods | Official CLI checksum/download host previously failed with connection/TLS resets on this machine. Managed gateway access remained unresolved and no useful live integration was established. | Historical connectivity/setup blocker; vendor ownership and present reproducibility unknown. A fresh no-credential reproduction, network comparison, supported Windows path and existing support reply are needed before proposing a documentation/CLI issue. Do not disable TLS or run unverified installers. Credit-consuming gateway troubleshooting is deferred. See `ASTROPODS_SETUP.md`. |
| Postman | Local Newman verification works without a connected Postman account. The existing31-request/50-assertion collection does not cover the newer delivery endpoint, which has separate HTTP evidence. | Missing collection coverage is our project backlog, not a Postman bug. No confirmed upstream defect. A hosted workspace is optional and must not contain credentials/private identifiers. |
| Render | No deployment performed. Actual eligible charges, payment-method requirement, credit-exhaustion behavior, quote, persistent storage and hosted/Linux/HTTPS checks remain open despite owner-reported USD50 credits valid through October1,2027. | Deployment/account verification gaps, not observed platform defects. Do not create resources or activate billing for a reproduction. See `RENDER_DEPLOYMENT.md` and `RENDER_COST_PLAN.md`. |
| Zapier | Research only; no connected workflow. Premium connector entitlement, sandbox configuration, MCP permission model and task accounting need actual account review if adopted. | No tested integration and no reported vendor defect. Do not start a trial, connect financial tools or send notifications just to find a PR. See `ZAPIER_RESEARCH.md`. |
| Kernel | Not adopted; no concrete remote-browser need established. | No issue found because no integration was evaluated. Do not represent this as a passed security/quality review or activate browser credits for this handoff. |
| Channel3 | Not adopted; no catalog/procurement feature in current scope. | No issue investigated. New scope/account/query usage is not authorised by this side task. |
| APIMatic | Owner explicitly cancelled this integration and requested skipping it. | Excluded, not a vendor failure. Do not restore or investigate as part of this handoff unless the owner changes that decision. |
| PayPal, the central platform | Signed event redelivery/deduplication is verified; the separate fresh-payment-triggered automatic PAID transition remains unverified. Fallback owner reconciliation is working evidence of a different path. | Integration-verification gap, not proof of a PayPal webhook defect. Do not create new invoices, retry payment or alter webhooks for the side investigation. See `WEBHOOK_VERIFICATION.md` and `FRESH_PAYMENT_WEBHOOK_TEST.md`. |

Project-wide remaining work such as human validation, actual Narrator/zoom/touch checks, historical privacy decisions and publication permissions belongs to Nudge's existing action plan. Those are not upstream sponsor bugs or tasks for this parallel agent to silently complete.

## Verdict

**A real standalone accessibility finding is reproduced on the current public Studio release. This is a strong bug-report candidate, but not yet an accessible open-source code-PR opportunity.** AG Grid's public PR page currently says only collaborators can create PRs. The suspected shared-header implementation is public in the commercially licensed Enterprise package, not MIT `ag-stack`. Ask maintainers where to report this and whether an external patch is welcome before investing in a full fix.

## Fresh evidence

Built a minimal plain React page using the existing installed packages, without Next.js, Nudge components, custom widgets, API routes, private configuration or a licence key. Two synthetic tables supply three total fields. Standard `AgStudioProvider` and `AgStudio` render in edit mode with the data panel open. Bundle remained in memory, not committed or published.

Headless Edge with a new profile and filtered environment reproduced two `nested-interactive` findings using axe-core4.14.0. Each corresponding native button has the accessible name `Add computed column` and tabindex -1, nested inside a collapsible header DIV with role button and tabindex0. Both controls are supplied by Studio. The page had zero external request attempts and zero JavaScript exceptions; its owned loopback server closed normally. No actual screen-reader announcement is claimed.

Installed versions: `ag-studio`3.0.0, `ag-studio-react`3.0.0, `ag-grid-enterprise`36.2.0, `ag-stack`36.2.0, React19.3.0. Read-only npm registry lookup confirmed that the public `ag-studio/latest` version is3.0.0 at review time. No upgrade or new package installation was performed.

Simplified observed structure (illustrative IDs omitted):

```html
<div role="button" tabindex="0" aria-expanded="true" aria-controls="section">
  <span>First sample</span>
  <button tabindex="-1" aria-label="Add computed column" aria-haspopup="menu">
    <!-- menu icon -->
  </button>
</div>
```

[Deque's rule explanation](https://dequeuniversity.com/rules/axe/4.10/nested-interactive) describes the accessibility risk from interactive descendants. Our scan is evidence about markup; it does not establish exact JAWS, NVDA or Narrator behavior. [Studio's accessibility documentation](https://www.ag-grid.com/studio/javascript/accessibility/) states its intended keyboard/screen-reader support.

## Source ownership and likely cause

Installed Studio's `DataPanelSectionComponent` creates the menu button and passes it to `addTitleBarWidget`. Its panel class extends the shared Enterprise `AgGroupComponent`.

Public source: [packages/ag-grid-enterprise/src/agStack/agGroupComponent.ts](https://github.com/ag-grid/ag-grid/blob/latest/packages/ag-grid-enterprise/src/agStack/agGroupComponent.ts). GitHub API returned HTTP200; reviewed blob SHA `93aec933b40a91c2335097a9dc41fd36f97cf10a`.

- `addTitleBarWidget`, around line332, forwards the menu element to the title bar.
- `getDefaultTitleBarTemplate`, around line479, assigns interactive semantics to the wrapper.
- `DefaultTitleBar.refreshAriaState`, around line598, gives collapsible interactive headers role button, tab focus and expanded/controls attributes.
- `DefaultTitleBar.addWidget`, around line664, appends the supplied element inside that same header.

This explains the observed nesting. It is a source-based diagnosis, not a validated patch or proof that every consumer is affected. Shared-component changes need review across Grid, Charts and Studio consumers. Do not simply remove ARIA, suppress axe, disable the menu or edit installed bundles as a proposed upstream fix.

An appropriate design to discuss is a noninteractive header wrapper containing separate disclosure and menu controls. Preserve labelled disclosure state, keyboard navigation, menu focus/return, event behavior and layout. A real patch needs regression tests and maintainer agreement on the component boundary.

## Duplicate and contribution checks

Public GitHub API searches for `repo:ag-grid/ag-grid "nested-interactive"` and `repo:ag-grid/ag-grid "Add computed column"` completed without truncated search results. They did not identify the exact Studio data-panel case. This is a bounded search, not proof of novelty or absence from private support/internal backlog.

Related, not established duplicates:

- [Issue14236](https://github.com/ag-grid/ag-grid/issues/14236): open Set Filter checkbox nesting report on Grid35, a different component.
- [Issue14235](https://github.com/ag-grid/ag-grid/issues/14235): closed matching Set Filter report.
- [Issue6350](https://github.com/ag-grid/ag-grid/issues/6350): older filter accessibility report for Grid28.2.1.
- Exact control-name search also returned an unrelated tooltip PR14303; do not treat that as a fix for this finding.

[The current PR listing](https://github.com/ag-grid/ag-grid/pulls) explicitly says only collaborators can create PRs; creation is restricted. The root and `.github` listings inspected did not expose a CONTRIBUTING file. The [README's contribution section](https://github.com/ag-grid/ag-grid#contributing) is not an external submission policy. Public code visibility does not override the Enterprise commercial licence. A public `ag-grid/ag-studio` repository was not accessible to an unauthenticated API request (404), which does not distinguish nonexistent from private.

The published package's bug contact is [AG support](https://ag-grid.zendesk.com/). Use that or the sponsor's designated channel to ask for the correct reporting and contribution route. Do not bypass GitHub restrictions or submit the same report to multiple channels without checking for an existing ticket.

## Handoff for a separate agent

### Self-contained minimal React sample

The following original source is the standalone sample actually tested. It uses no key, Nudge module, custom widget or payment data. Use the pinned versions above; a fresh reproduction will also need `react-dom`19.3.0, a JSX-capable build tool, an HTML root element and an explicitly sized container. It was bundled with installed esbuild0.28.2, served on loopback and checked with headless Edge/axe-core4.14.0. Creating a clean standalone package/lockfile and testing other supported React/browser versions remain for the parallel agent; this is not a ready-to-publish repository.

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';

const data = { sources: [
  {
    id: 'first', name: 'First sample',
    fields: [
      { id: 'label', name: 'Label', format: 'textFormat' },
      { id: 'value', name: 'Value', format: 'numberFormat' }
    ],
    data: [{ label: 'Alpha', value: 1 }]
  },
  {
    id: 'second', name: 'Second sample',
    fields: [{ id: 'label', name: 'Label', format: 'textFormat' }],
    data: [{ label: 'Beta' }]
  }
] };

const initialState = {
  selectedPageId: 'sample',
  panels: { data: { collapsed: false }, filters: { collapsed: true } },
  pages: [{
    id: 'sample',
    widgets: {
      grid: {
        type: 'grid',
        dataMapping: { cols: [{ id: 'first.label' }, { id: 'first.value' }] }
      }
    },
    widgetLayout: { grid: { xTrack: 0, yTrack: 0, xSpan: 16, ySpan: 16 } }
  }]
};

createRoot(document.getElementById('root')).render(
  <AgStudioProvider>
    <AgStudio mode="edit" data={data} initialState={initialState}
      style={{ height: '800px', width: '100%' }} />
  </AgStudioProvider>
);
```

Reproduction checks: run axe's `nested-interactive` rule after the two `Add computed column` buttons appear; inspect each button's nearest interactive ancestor. Expected observed result is two affected headers with role button and tabindex0, each containing the native menu button with tabindex-1. Preserve the unmodified baseline before testing any semantic fix. No licence warning suppression, DOM patch or disabled control was used to obtain the finding.

### Prioritised verification checklist

1. Recheck latest public release and contribution restrictions; confirm a maintainer-approved path before coding a patch.
2. Independently reproduce the embedded sample in a separate clean project and retain exact package/browser/axe versions and a lockfile.
3. Recheck related issues and ask whether a private/internal ticket already tracks this specific Studio component. Do not assert novelty.
4. Verify disclosure and menu keyboard interactions, names/states and actual screen-reader announcements; axe alone cannot establish those results.
5. Decide the narrow source boundary with maintainers: shared Enterprise header versus Studio caller. Preserve all other header consumers.
6. If a patch is welcome, demonstrate a failing regression first, then the fix, relevant upstream tests and no new keyboard/focus/layout regressions. Resolve licence/CLA requirements for that repository.
7. Prepare the issue or PR text for owner review. No posting, outreach, fork creation or account access has been authorised by this document.

### Local artifacts and continuation

Local original reproduction source: `data/oss-studio-a11y/main.jsx`. Original runner: `data/oss-studio-repro.mjs`. Original evidence: `data/oss-studio-a11y/evidence.json`; screenshot `standalone.png`. Public release/repository checks: `public-check.json` and `source-check.json` in the same folder. These are ignored local artifacts; review before sharing. Do not upload generated bundles, commercial source copies, node_modules, keys or private project files. The saved upstream TypeScript text is reference material, not our code to relicense.

To repeat the existing local check from `D:\Nudge`, run `node data/oss-studio-repro.mjs`. It uses the already-installed packages and bundled headless Edge setup, starts only an ephemeral loopback server and closes it after the check. It is an investigation artifact, not a committed general-purpose test tool. A separate repository should use its own original minimal app and permitted package installation, not Nudge's source or environment.

Suggested parallel-agent task:

> Investigate the standalone AG Studio3.0.0 data-panel nested-interactive reproduction documented in SPONSOR_CONTRIBUTION_REVIEW.md. Read its minimal source and evidence; reproduce independently without Nudge configuration or keys. Recheck latest releases, duplicates, package licensing and current PR restrictions. Ask me before publishing anything. First establish a maintainer-approved external contribution route; do not claim an OSS PR is possible merely because Enterprise source is visible. If patches are welcomed, propose a narrow semantic fix and regressions for disclosure/menu keyboard and focus behavior. Work separately from Nudge's delivery integration.

## Owner-sendable routing question

> Hello! I reproduced an accessibility finding in AG Studio3.0.0 using a small standalone React example with standard components. In edit mode, each data-source section's “Add computed column” button is nested inside a header with role="button"; axe-core reports nested-interactive for both sample sections. The shared AgGroupComponent header appears relevant. Could you confirm the correct channel for sharing the reproduction and whether an external patch or regression test would be welcome? I noticed the public Grid repository restricts PR creation to collaborators. I would be happy to help through your preferred process. Thank you!

No support message has been sent. This is a conventional accessibility finding, not a demonstrated security exploit. No code fix, contributor acceptance, legal permission or merged contribution is claimed.
