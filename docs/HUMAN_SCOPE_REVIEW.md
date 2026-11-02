# Offline human review of scope analysis

Prepared October 7, 2026. This is a review kit, not completed validation or a claim of accuracy. It uses fictional material and previously saved responses only. Opening these Markdown documents does not run Nudge, contact an AI provider, create an invoice, or consume Elastic tokens.

## Purpose

October 10 readiness check: independent reviews and findings remain pending. A separate coding-agent desk inspection is recorded in [AI_EVIDENCE_REVIEW.md](AI_EVIDENCE_REVIEW.md). Keep it with owner preparation; do not send it to reviewers before their first-pass decisions are saved. It does not replace their judgments or change either public packet.

Check whether a person independently agrees with the scope decision, whether each citation actually supports the explanation, and whether the proposed extra work excludes included or unresolved work. Passing software tests and valid clause IDs cannot establish these facts.

This complements [FREELANCER_VALIDATION.md](FREELANCER_VALIDATION.md), which examines real workflow usefulness. A desk review is not a user interview, measured time saving, legal assessment, or held-out model evaluation. These cases have influenced prompt development; some saved outputs use earlier prompt revisions. Review provenance is in [SCOPE_CHALLENGE_VERIFICATION.md](SCOPE_CHALLENGE_VERIFICATION.md).

## Ready-to-run owner checklist

Three blank private worksheets now exist at `data/human-review/R01.md`, `R02.md` and `R03.md`, plus a pending `SUMMARY.md`. Each worksheet has all six case IDs, with the entire first pass before the second pass. They contain no findings and are excluded from Git through `data/`. Use two or three independent reviewers familiar with fixed-price web projects; availability is a target, not a claim that anyone participated.

1. Invite people yourself using the message below. Allow roughly 20–30 minutes initially, and let them take longer or skip cases; this is a scheduling estimate, not a measured review duration.
2. Ask permission for private notes and anonymized findings. Assign a reviewer ID and record prior exposure. Send only `evaluation/HUMAN_SCOPE_CASES.md` and a blank worksheet initially; don't send the entire repository or this owner guide, which links to the model answers.
3. Have the reviewer complete and save **all six first-pass decisions** before showing `evaluation/HUMAN_SCOPE_OUTPUTS.md`. A saved copy of their first-pass notes should remain unchanged when they complete the second pass.
4. Collect their second-pass assessments. Store returned notes privately under `data/human-review/`; leave names, contacts and real client material out. Preserve disagreement and skipped cases.
5. Only after actual reviews, fill `SUMMARY.md` with counts and concerns from consenting reviewers. The coding agent can help interpret redacted notes and prioritize fixes once the owner supplies them. Do not substitute another AI's review for independent human findings.

Suggested invitation for the owner to send manually:

> Hi! Would you be willing to review six fictional website change requests against a short project agreement? First, I'd ask for your own scope decisions; afterward, I'd show saved AI responses for you to assess. It should take about 20–30 minutes, with no account, payment or real client information needed. With your permission, I'll keep private notes and summarize anonymous findings for a hackathon project. You can skip questions or decline. Thank you!

No invitation has been sent by the coding agent. No reviewers or responses have been invented. This review can proceed while Elastic usage is paused; Postman workflow evidence remains separate from semantic human assessment.

## Review protocol

The owner can invite a freelance designer or another person familiar with fixed-price project scope to review the packet. The coding agent has not contacted anyone. A reviewer who helped develop the prompts should be recorded as a collaborator rather than independent. Participation and written notes are optional; record no names, contact details or real client documents.

1. Give the reviewer only [the agreement and requests](../evaluation/HUMAN_SCOPE_CASES.md). Before showing any model answers, ask them to record included, additional, ambiguous, or unable to decide; supporting clause IDs; missing facts; and which requested parts could be proposed as extras. Empty extras are a valid answer. A mixed request may have a known extra and an unresolved part. Do not coach them toward the development labels.
2. After their first-pass notes are saved, give them [the recorded AI outputs](../evaluation/HUMAN_SCOPE_OUTPUTS.md). Ask whether they would keep, edit or reject each answer, why, and what they would need before discussing a price. Let them disagree with the engineering label, including the interpretation of the agreement itself.

If they have already seen the model answers, expected labels or verification report, record prior exposure. Do not call the first pass blinded. If an explanation or control is supplied during the review, note it; do not count an assisted judgement as independent.

Keep the original model output and first-pass human decision unchanged. Record any corrected draft separately. No pricing, acceptance, invoice creation or external action belongs in this review.

## Assessment checklist

For each item record pass, concern, fail, or not assessed, with a short reason. A reference existing is different from it supporting the particular claim. A missing reference demanded by the frozen scorer is different from an unsupported explanation; preserve both observations.

| Check | Review question |
| --- | --- |
| Decision | Is the classification supported by the agreement and supplied facts, without assuming a used revision count or implementation? |
| Evidence | Do all cited clauses exist and support the explanation? Is important evidence missing? |
| Uncertainty | Does the answer identify missing facts and ask only questions needed to resolve scope? |
| Mixed work | Does the summary distinguish included, additional and unresolved parts? |
| Extra deliverables | For an additional classification, are only established extras listed, with no included or unresolved work? For other classifications, are descriptions neutral? |
| Authority | Does the output avoid invented prices, deadlines, approvals, warranties or completed actions? |
| Client understanding | Is the explanation clear enough to edit into a respectful client conversation? |

An unsafe extra deliverable, unsupported definite classification, fabricated citation, or invented financial/approval term requires correction before that draft can be proposed. Keep it as a regression concern; do not replace the original output to improve a score. A reviewer may identify an agreement wording problem instead of a model error, or leave a judgement unresolved. Human pricing and client approval remain separate application gates.

## Blank private worksheet

Use the prepared private worksheets, or copy this block into a new file under ignored `data/human-review/`. Do not overwrite the original model receipts or publish raw reviewer notes. Use a non-identifying reviewer ID such as R01. The folder and blank worksheets exist; no completed review has been collected.

```text
Reviewer ID:
Date:
Broad relevant experience (optional):
Permission for private written notes: yes / no
Permission for anonymized findings: yes / no
Helped develop prompts: yes / no / unknown
Prior exposure to model answers, expected labels or report: yes / no / unknown

Case ID:
FIRST PASS — record before showing model output
Decision: included / additional / ambiguous / unable to decide
Supporting clause IDs and explanation:
Missing facts and questions:
Known extra parts, or none:
Included / unresolved parts:
Assistance or interruptions:

SECOND PASS — after reading the saved model output
Disposition: keep / edit / reject / unable to assess
Decision: pass / concern / fail / not assessed; reason:
Evidence: pass / concern / fail / not assessed; reason:
Uncertainty: pass / concern / fail / not assessed; reason:
Mixed work: pass / concern / fail / not assessed; reason:
Extra deliverables: pass / concern / fail / not assessed; reason:
Authority: pass / concern / fail / not assessed; reason:
Client understanding: pass / concern / fail / not assessed; reason:
Suggested correction (separate from original):
Agreement wording concern:
Unresolved judgement / follow-up:
```

Repeat the case block for all six cases, or record which were skipped. Agree the retention period with the reviewer and remove notes if permission is withdrawn. Public quotations need separate permission; this kit collects none.

## Report only after someone actually reviews

Report the number of participating reviewers, completed cases, relevant prior exposure and assistance. Keep missing and unresolved judgements out of a success count. Separate classification disagreement, citation concerns, unsafe extra descriptions and merely preferred wording. If people disagree, preserve both views and investigate the agreement or request; do not silently choose the answer closest to the model.

An independent review of these known development cases can identify defects but cannot establish unseen-case accuracy. It does not close repeated-run stability, prompt injection, real-user value, the website AI journey, trial quota reconciliation or judging access. Until allowance review is complete, continue with saved-output inspection, mock tests and ordinary offline development.
