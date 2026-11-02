# Saved development-output comparison

October 29, 2026. Completed offline with the existing comparison tool. No new model request, prompt change, payment, environment file or workspace database was involved.

## Reproduce

```powershell
node --import tsx scripts/compare-scope-runs.ts evaluation/saved-development-comparison.json
```

The fixture contains only fictional outputs and numeric historical telemetry. Its Nudge rows are unchanged copies of four previously saved, accepted Elastic adapter results. Its lexical rows were computed using the existing version-1 algorithm on the exact matching requests and seven-clause agreement. Comparator, labels and citation requirements were not changed.

Matched cases are 18 (blog page), 19 (another revision round), 21 (booking button), 22 (broken form after launch). All four engineering labels are ambiguous. The remaining 21 cases are missing, not successful. There is no plain-LLM comparator or repeated-run series.

## Results

| Measure on these four cases | Lexical baseline | Saved Nudge outputs |
| --- | ---: | ---: |
| Expected classifications matched | 1/4 | 4/4 |
| All automated checks passed | 0/4 | 3/4 |
| Invalid schema or clause IDs | 0 | 0 |
| Ambiguous cases incorrectly given a definite decision | 3 | 0 |

Confusion matrix, expected rows and predicted columns:

| System / expected | Included | Additional | Ambiguous |
| --- | ---: | ---: | ---: |
| Lexical / ambiguous | 2 | 1 | 1 |
| Nudge / ambiguous | 0 | 0 | 4 |

No included or additional cases are present, so this subset cannot measure errors on either of those true classes. The Nudge booking-button response still fails the frozen S7 evidence requirement. Relevant S5 explanation and clarification do not erase that failure. AI_EVIDENCE_REVIEW.md contains the existing coding-agent semantic inspection; independent review remains pending.

Historical reported telemetry for these four Nudge responses totals 42,853 input and 1,528 output tokens. Recorded latency ranges 10,005–14,270 ms (mean 11,257.5 ms). These are earlier observations, not usage incurred today, provider-verified billing or current latency guarantees. Cost and remaining allowance are unknown.

## Provenance and limits

The ignored derivation receipt is data/saved-development-comparison/838daa6a-d85d-4da6-b526-7ec00c2d0db4/provenance.json. It retains source/instruction hashes; report.json retains the computed comparison. The public fixture contains no filesystem paths, credentials, private endpoint, conversation IDs or real client data.

- Revision count: historical run b1fe99f5-7b94-4b49-9afc-ccaef8318e6c, instruction hash 0fac87a39c66140072643474b9b621d5b64a9e30bc356284e667a539e2073e3d.
- Booking button: bcfbff11-c127-421f-b495-7b50bbc78723, instruction hash da332b875d15e821062c90807514c98add71f72a127a1036981dc6e0a160fa4f.
- Blog and broken form: 22e2e219-4236-4381-bfa8-76e94fd54e8c, the same da332b87 instruction revision.

Selection reuses the latest already-reviewed accepted outputs; cases were visible during development and span two instruction versions. The earlier incorrect revision answer remains in eb892c36-787c-4bba-8c09-7646c9b3fe89 and SCOPE_CHALLENGE_VERIFICATION.md. This corrected subset is not the success rate of all attempts. Earlier transport rejections and the mixed-checkout offline recovery are not relabelled as live successes. The mixed/unknown-revision challenge has no exact counterpart in the 25-case benchmark and is excluded rather than assigned a misleading ID.

This demonstrates a reproducible difference on four selected development cases. It does not establish general superiority, held-out accuracy, current-model stability, independent semantic review, user usefulness or injection resistance. Source labels do not authenticate provider execution. Human review and owner pricing remain required. E7/E8 stay open for independently reviewed and appropriately budgeted evaluation.
