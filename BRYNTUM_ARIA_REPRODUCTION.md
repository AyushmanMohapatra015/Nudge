# B6c: isolated Gantt ARIA reproduction and support draft

Reviewed October 16, 2026. The two findings reproduce with plain JavaScript Gantt7.3.7, one fictional task and the ordinary theme/icon imports. There is no React, Next, Nudge, database, client data, custom renderer, payment connection or ARIA override in the fixture. This establishes independence from the application integration; it does not establish a new issue, every screen reader's behavior or a verified fix.

## Results

Run with the already-authorized locally installed trial and Edge:

```powershell
node scripts/check-bryntum-aria.mjs
```

The tracked original fixture is `tests/fixtures/bryntum-aria/index.html` plus `fixture.mjs`. The runner serves only these and an exact allowlist of installed vendor CSS/font/module assets on a temporary 127.0.0.1 port. It blocks external browser requests, filters the browser environment, opens no workspace/environment file, and closes its browser/server. Vendor files remain installed separately and are neither copied into the fixture nor committed. This is loopback isolation, not a VM/network security certification.

Final receipt: ignored `data/bryntum-aria/b0af07d8-1c13-4c1c-989f-8bf75a910592/results.json`; `cleanup.json` reports `closed: true` after an ECONNREFUSED probe. Browser Edge155.0.4283.45, axe-core4.14.0, Node24.12.0. Both read-only and editable configurations produce:

| Target | Role | Finding |
| --- | --- | --- |
| `.b-grid-panel-body` | treegrid | aria-required-children: disallowed button-role descendants |
| generated `normalSubgrid` | rowgroup | aria-required-children: disallowed button-role descendants |

Exactly these two targets are asserted in each mode; changed findings require review. There were zero external requests, page errors or failed local asset responses. The first successful exploratory receipt was `864f390e-3e02-4875-9056-ac8da8f0a516`; the final run adds explicit mode/target assertions and reads the actual axe version. An initial runner import incorrectly treated axe-core as ESM named exports; switching to its default CommonJS-compatible export fixed this before a browser/server was started. No vendor or application source was changed to obtain the result.

TypeScript passes. Existing 170 offline outcomes, eleven targeted browser regressions and production/Postman31/50/restart evidence remain the latest unchanged application baseline from B6b; those were not rerun for a standalone fixture/documentation change. The minimal reproduction's success means the expected failure is reproduced, not that the ARIA rule passes.

## Existing issue and supported-fix investigation

- [Bryntum support issue12114](https://github.com/bryntum/support/issues/12114) was open when checked. Its original reproduction uses Gantt's advanced example and the same aria-required-children rule. Our result is consistent with that existing issue; exact coverage of these two targets still merits maintainer confirmation. Do not file a duplicate or present it as a novel discovery.
- A [Bryntum team response about SchedulerPro](https://forum.bryntum.com/viewtopic.php?p=181388) says the earlier virtual-scroller tabindex problem was fixed in7.3.5, while this ARIA rule remained open for event wrappers and no supported configuration override was then available. That response is related evidence for another product/version, not a fresh guarantee about every Gantt option. The web opener failed on that page; indexed search returned the actual dated team response, which is the basis for this bounded observation.
- The [Gantt changelog](https://bryntum.com/products/gantt/changelog/) lists7.3.7 as the latest version when checked, and a bounded search found no12114 fix entry. It separately records issue13487 assigning button roles to task/event bars. Absence of a changelog entry does not prove there is no unreleased/private fix; no newer package was installed or assumed fixed.
- The [Widget role documentation](https://bryntum.com/products/gantt/docs-llm/api/Core/widget/Widget.md) and [SubGrid documentation](https://bryntum.com/products/grid/docs/api/Grid/view/SubGrid) describe general roles/subgrid configuration, not a validated repair for the task-bar/treegrid relationship. Altering root roles, removing button semantics, hiding chart descendants or disabling the rule would not establish correct accessible behavior. None was applied.

Keep Nudge's explicit native date/dependency reading and chart bypass. Actual spoken impact remains R6. A supported correction requires vendor guidance or an independently justified/tested release, including keyboard, dates, normal layout and screen-reader review; a manual DOM patch is not the selected solution.

## Ready-to-review follow-up draft — not sent

Suggested subject: **Gantt7.3.7 minimal reproduction for aria-required-children / issue12114**

> Hello Bryntum team,
>
> Thank you for maintaining the accessibility tracker. I reproduced two axe-core4.14.0 aria-required-children findings in a minimal plain-JavaScript Gantt7.3.7 trial fixture using Edge155.0.4283.45. The fixture has one task, the standard theme/icon CSS, no framework or custom renderer, and no ARIA overrides. The findings occur with both readOnly:true and readOnly:false.
>
> The targets are .b-grid-panel-body (treegrid) and the generated normal subgrid (rowgroup). Axe reports disallowed button-role descendants in each. This appears related to existing issue12114, so I would like to avoid opening a duplicate.
>
> Could you please confirm whether issue12114 covers these Gantt targets, whether a supported workaround exists for7.3.7, and whether a fix is available or planned for a specific release? I can provide the small original fixture and sanitized findings through your preferred support channel without including trial credentials or vendor package files.
>
> Thank you for your help.

Nothing has been submitted, messaged or published. Only original fixture code and sanitized fictional diagnostics should be considered for a future report; public trial hosting/source/judging permissions remain separate licensing questions.

## Next checkpoint

B6c investigation/report preparation is complete. The underlying vendor finding remains open as B6d: owner follow-up/maintainer confirmation and a supported correction when available. Independent work moves to B7a: prepare and rehearse the fictional original-to-accepted-extra impact scenario and measure the actual bundle/runtime contribution for the Render budget, without deployment or model calls. B7 human validation, R6 manual checks, provider usage/judging access and sponsor public/trial permissions remain pending.
