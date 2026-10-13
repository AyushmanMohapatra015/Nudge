# D3: Render hosting budget and approval worksheet

Reviewed October 13, 2026. Planning only; no service, disk, subscription or deployment created.

## D3 public-source verification, owner requested

Render's [official comparison article](https://render.com/articles/best-railway-alternatives), checked October13, explicitly lists a Starter web service with 0.5 vCPU /512MB at USD7/month and Standard with 1 vCPU /2GB at USD25/month. Its [cost-model article](https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses) lists persistent disk at USD0.25/GB/month. The previously illustrative USD21.75 three-month base estimate is now supported by published first-party rates: 3 x (7 +0.25). It leaves USD28.25 before other charges, including the USD10 planning reserve. This is a public list-price estimate, not an account-specific quote or workload suitability test. Reconfirm displayed rates before activation.

The [general Render terms](https://render.com/terms), section4.7, require a valid payment method while using paid services. Credit redemption does not establish an exception. Section4.6 describes payment-method verification holds. Because the owner has not authorised adding a payment method, sponsor confirmation of a no-card exception is a prerequisite to provisioning this plan. Do not attempt to bypass the requirement or promise that exhausted credits remove payment obligations. Search indexing exposed the terms text; direct page extraction showed only the shell, so the owner can verify by opening the page and locating Paid Services / Payment Method Requirements.

[Build pipeline documentation](https://render.com/docs/build-pipeline) gives Hobby500 included monthly minutes and a configurable monthly limit on extra pipeline spending. Add a pre-activation check for an explicit zero additional pipeline-spend limit if the account permits it. This setting covers pipeline minutes only, not compute/disk/egress or total account spending. Setting it was not performed. Builds use separate compute, so a512MB runtime candidate does not imply512MB build memory.

**D3 public research complete; activation approval remains open.** Next independent preparation is D4 owner/client/judge access and sponsor-permission review in RENDER_DEPLOYMENT.md. Render's account-specific card exception/terms must be confirmed before D5, not guessed by the owner or agent.

## Confirmed evidence and remaining terms

The owner reports USD50 credits applied to the intended workspace and validity until October1,2027. These are owner-reported account observations, not an assistant account inspection. Confirm that the date describes redeemed-credit validity rather than only the original code's redemption deadline before provisioning.

The credit-claim authorization screenshot displayed read-only email access. It does not establish permission to connect a repository for deployment. No keys, promo code, account identifier or screenshot is copied here.

Default [Render credit terms](https://render.com/docs/credits) apply credits to workspace charges unless the promotion says otherwise. Credits apply at billing; the displayed balance does not track accrued usage continuously. An uncovered remainder can be charged to a payment method. Specific promotional exclusions, existing accrued charges, card requirement and behavior without a payment method remain unconfirmed. Do not promise automatic suspension or a hard USD50 cap.

## Proposed configuration

Keep the existing review-only `render-blueprint.example.yaml` unapplied:

- Hobby workspace, one Node web service in Singapore; exact tier identifier and account availability require confirmation.
- Initial candidate: 0.5 CPU / 512 MB. Its suitability is unverified until actual startup, memory and browser-workflow checks; do not silently upgrade if insufficient.
- One 1 GiB persistent disk at `/var/data`, SQLite at `/var/data/nudge.sqlite`.
- One instance, no automatic deploys, no workers, preview services, Workflows, managed database or autoscaling.
- Existing guarded startup, health route, private owner access, fictional initial records, sandbox PayPal only and AI disabled.

[Render disks](https://render.com/docs/disks) require a paid service, are available only at runtime, and are limited to one service instance. Only files under the mount persist. Deploys interrupt service; this is acceptable for a prototype only if observed and disclosed. Database-consistent backups and actual Linux restore verification are required; disk snapshots alone do not establish SQLite recovery. Local disk capacity has not been measured against real private data; no upload of the local database is proposed.

## Conservative budget

Use three full monthly equivalents for October through December15, even if later activation would be prorated. Credit expiry in2027 is not permission to leave a billable service running indefinitely. Review actual usage and continued access on December16; preserve reviewed backups before any separately authorised shutdown or deletion.

Reserve USD10 for unexpected eligible usage. Initial planned base budget: at most USD40 total. This reserve is a planning margin, not a configured platform spending limit.

Let C be the actual monthly compute quote and S the quoted monthly cost of the 1 GiB disk. Base estimate = 3 x (C + S + workspace monthly fee). Add existing accrued charges, extra bandwidth/build usage and any applicable tax or fees before approval.

The [official Render cost-model article](https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses), checked October13, lists Hobby at USD0/month and disks at USD0.25/GB/month. It describes bandwidth and build overages separately and directs readers to current pricing for compute. The dynamic [pricing page](https://render.com/pricing) did not expose numeric compute quotes in the research view. Confirm every rate/included allowance in the actual account; do not treat these public figures as a binding quote.

| Conditional worksheet | Amount |
| --- | --- |
| Owner-reported credits | USD50 |
| Planning reserve | USD10 |
| Maximum planned base cost, three months | USD40 |
| Illustrative disk cost if USD0.25/month is confirmed | USD0.75 total |
| Maximum compute rate with that disk, zero workspace fee and no other accrued costs | USD13.08/month |
| Example only: compute quote USD7/month | USD21.75 base total; USD28.25 credits left before other charges |
| Example only: compute quote USD25/month | USD75.75 base total; exceeds credits and is unacceptable without a new reviewed plan |

USD7 and USD25 were originally arithmetic scenarios; the public-source verification above now supports them as published list prices, still not verified account prices. Do not provision based on the estimate alone. Check included and accrued bandwidth/build usage as well as the balance. Avoid unnecessary repeated builds. Larger compute, longer uptime or extra services require a revised estimate before activation.

## Before provisioning

1. Finish D2b: confirm redeemed-credit validity, promotional exclusions, existing accrued usage, card requirement and exhaustion behavior. Use Billing/claim terms or ask Render support; do not add a card to discover the answer.
2. Obtain the actual compute and disk quotes through public pricing or a non-submitted configuration review. Do not click Create/Deploy, apply a Blueprint, upgrade the workspace or grant new repository access during price review.
3. Fill C/S and all other charges above, verify remaining credits and review the concrete total with the owner. D3 cost approval remains open until these values are confirmed.
4. Complete D4: AG Studio hosted-evaluation and December judging permission, Elastic judging coverage, owner/client access separation and repository permissions. Expiry of Render credits does not extend those licences.
5. Only after review and explicit activation approval, perform D5 provisioning and D6 actual Linux/HTTPS/mount/restart/backup checks; then D7 approved hosted webhook and Postman verification.

If a card, paid upgrade, uncovered cost or insufficient resources prevents the zero-out-of-pocket plan, keep the documented functional local setup available. Revisit hosting options with the owner; do not use an ephemeral SQLite disk or silently change databases/providers.

## Evidence boundary

Existing deployment template and guarded startup were read and compared with public disk/credit guidance. Arithmetic was checked locally. This task changes documentation only; no runtime, database, provider, account or billing operation was performed. No new app tests are needed for this worksheet. Exact cost, performance, deployed access and zero-out-of-pocket operation remain unverified.
