# Nudge validation session kit

Status: ready-to-use preparation, not collected research. No participant results, quotes or impact claims exist. Use with [FREELANCER_VALIDATION.md](FREELANCER_VALIDATION.md); it contains the invitation, consent guidance and incident interview. Start with three independent participants, then extend to five to eight where practical.

## Before the session

- Recruit freelance web designers or small agency owners with a recent fixed-price project. Prefer different workflows; do not recruit only friends who already know the intended answer.
- Allow 25 minutes: 15-minute incident interview first, then a separate 10-minute prototype walkthrough. Interview-only participation is valid.
- Ask permission for written notes and anonymized themes. Public quotation requires separate permission; default no recording and no public quotes. Explain that participation is optional and questions can be skipped.
- Prepare an isolated simulation with fictional data, not the owner's ordinary sandbox workspace. Do not show private operational URLs, account dashboards or credentials.
- Say: "This prototype uses simulated AI and payments today. I am testing whether the workflow makes sense, not measuring real AI accuracy. Nothing you do here charges anyone."
- Ask for a paraphrased incident, not documents or identifying details. Do not send participant material to an AI provider. Do not put raw notes in Git.

Use the existing local judge walkthrough for the product sequence. If an isolated environment is not ready, conduct the interview only; do not reset an existing workspace just to run research.

## Moderator task cards

Give one task at a time without naming the button to click. Read the task, then let the participant think aloud. They can decline to continue.

| Task | Participant prompt | What to observe |
| --- | --- | --- |
| 1: Scope evidence | "Your client asks to add appointment booking to this website. Find what was agreed and explain what you would need before deciding whether this is extra work." | Finds booking exclusion; notices approved scope; explains uncertainty without treating the AI as authority. |
| 2: Reviewed change | "Review this proposed booking addition. Decide what you would change before offering it to your client. Use a fictional extra price of USD 300 if you choose to proceed." | Finds rationale/deliverables/price; understands owner review; catches unwanted assumptions. A decision not to proceed is useful feedback. |
| 3: Client understanding | "Now review the client view. Explain what accepting this change does and what happens next." | Distinguishes agreement/change acceptance from payment; identifies exact work and price. Do not accept on their behalf. |
| 4: Invoice and follow-up | "Find whether this invoice still needs payment, and explain why the shown reminder is blocked." | Reads authoritative displayed balance/status and protection rule; distinguishes simulated payment from actual money. |

Use prepared fictional states for tasks 3 and 4 if earlier tasks are not completed; record that the moderator supplied a state. Never count a supplied state as successful participant completion of the earlier task.

## Observation rules

For each task record **independent**, **assisted**, **not completed**, or **declined**. Independent means the participant reaches the intended outcome without moderator directions. General "please keep thinking aloud" is not assistance; pointing to a control or explaining its meaning is. Record the exact misunderstanding and any assistance.

Timing is optional: start after reading the prompt, stop at completion or intervention, and record interruptions/loading separately. A timed simulation task is not evidence of time saved against the participant's usual workflow. Do not combine incomplete and completed times into an average. An override in simulation is a usability observation, not measured live-model error.

After the walkthrough ask: "Which step, if any, would help in the incident you described? What would still stop you using this?" Then ask about managing multiple clients: "How do you currently find unpaid work and decide what to follow up? Can you describe the last time that was difficult?" Avoid introducing AG Grid or suggesting a dashboard is needed.

## Copyable private worksheet

Keep a local copy under ignored `data/validation/` using participant IDs only. This document is an empty template, not a dataset. No folder or participant file is created by this task.

```text
Participant ID: F01
Date:
Written notes/anonymized themes permission: yes / no
Public quote permission: no / yes, exact approved wording separately
Broad role and recent fixed-price project: 
Recent change incident / no incident:
Hardest step, described in participant's own words:
Actual sequence and existing tools:
Outcome: paid / absorbed / declined / unresolved / other
PayPal fit: existing use / plausible / unsuitable / unknown; reason:
Scope-to-payment fit / reason it does not fit:
Task 1: independent / assisted / not completed / declined
Task 2: independent / assisted / not completed / declined
Task 3: independent / assisted / not completed / declined
Task 4: independent / assisted / not completed / declined
Misunderstandings, supplied states and assistance per task:
Optional time per task, interventions/loading separately:
Multi-client receivables incident / no incident:
Participant statements (paraphrased):
Researcher interpretation (separate):
Potential change and contrary evidence:
Permission to retain notes until submission review: yes / no
```

Keep notes only for the agreed purpose; remove accidental identifying details. Agree a retention point with the participant, and delete raw notes when that purpose ends or consent is withdrawn. These are research-handling instructions, not an implemented application deletion feature. Do not collect contact details in the worksheet.

## Synthesize after the first three sessions

Create a private evidence table with one row per participant: incident, difficult step, workaround, outcome, product fit, PayPal fit and observed usability issue. Preserve no-incident and negative findings. Use counts with denominators, not population claims; participants who skipped a task are not failures or successes.

Create a short anonymized decision record only after reviewing the notes:

```text
Decision date and participants included:
Finding, with observed count / eligible sample:
Supporting anonymized incidents:
Contrary evidence / unknowns:
Proposed change:
Why it addresses the observed step:
Acceptance check for the change:
Sponsor fit, cost/access/license implications:
Decision: implement / investigate / defer
```

Choose the next change by evidence, not praise:

- If explaining extra work is the recurring difficulty, prioritize an editable clause-supported client explanation.
- If people struggle to find unpaid approved changes across clients, evaluate AG Grid for filtering/sorting and record-to-invoice navigation. Keep exact-cent math and permissions server-side. Sponsor eligibility and license/judging access still need verification.
- If acceptance versus payment causes confusion, improve that wording and confirm understanding in another session before adding dashboards.
- If PayPal-only invoicing does not fit, record that limitation honestly; do not promise an unbuilt payment provider.
- If the problem does not recur, reassess audience/workflow before expanding features.

Render addresses delivery questions; interviews do not prove their technical eligibility. Elastic live allowance and model evaluation remain separate checkpoints. Research does not authorize provider calls, deployment or paid services.

## Owner's immediate action

Arrange the first three conversations using the existing invitation. Conduct the first session before changing the script; record any script change for later sessions. Share only a non-identifying summary with the coding agent, such as the difficult step, observed confusion and existing workaround. Do not share raw contracts, names or messages. Until sessions occur, research status remains **pending**.
