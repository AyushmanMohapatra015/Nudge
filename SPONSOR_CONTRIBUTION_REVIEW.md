# Parallel contribution investigation: Studio accessibility

October 15, 2026. Side task requested by the owner, separate from Nudge's core action plan. No upstream issue, comment, fork or PR has been created. No private account, licence key, provider or actual workspace data was read. Nudge's selected next task remains B5a-2, the owner-only Bryntum screen.

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

Local original reproduction source: `data/oss-studio-a11y/main.jsx`. Original runner: `data/oss-studio-repro.mjs`. Original evidence: `data/oss-studio-a11y/evidence.json`; screenshot `standalone.png`. Public release/repository checks: `public-check.json` and `source-check.json` in the same folder. These are ignored local artifacts; review before sharing. Do not upload generated bundles, commercial source copies, node_modules, keys or private project files. The saved upstream TypeScript text is reference material, not our code to relicense.

To repeat the existing local check from `D:\Nudge`, run `node data/oss-studio-repro.mjs`. It uses the already-installed packages and bundled headless Edge setup, starts only an ephemeral loopback server and closes it after the check. It is an investigation artifact, not a committed general-purpose test tool. A separate repository should use its own original minimal app and permitted package installation, not Nudge's source or environment.

Suggested parallel-agent task:

> Investigate the standalone AG Studio3.0.0 data-panel nested-interactive reproduction documented in SPONSOR_CONTRIBUTION_REVIEW.md. Read its minimal source and evidence; reproduce independently without Nudge configuration or keys. Recheck latest releases, duplicates, package licensing and current PR restrictions. Ask me before publishing anything. First establish a maintainer-approved external contribution route; do not claim an OSS PR is possible merely because Enterprise source is visible. If patches are welcomed, propose a narrow semantic fix and regressions for disclosure/menu keyboard and focus behavior. Work separately from Nudge's delivery integration.

## Owner-sendable routing question

> Hello! I reproduced an accessibility finding in AG Studio3.0.0 using a small standalone React example with standard components. In edit mode, each data-source section's “Add computed column” button is nested inside a header with role="button"; axe-core reports nested-interactive for both sample sections. The shared AgGroupComponent header appears relevant. Could you confirm the correct channel for sharing the reproduction and whether an external patch or regression test would be welcome? I noticed the public Grid repository restricts PR creation to collaborators. I would be happy to help through your preferred process. Thank you!

No support message has been sent. This is a conventional accessibility finding, not a demonstrated security exploit. No code fix, contributor acceptance, legal permission or merged contribution is claimed.
