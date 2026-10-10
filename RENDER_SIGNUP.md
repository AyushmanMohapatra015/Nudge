# Render signup and sponsor-credit checkpoint

## Current checkpoint — October 10

The [official hackathon Render page](https://paypalaihackathon.devpost.com/details/render) is now directly accessible and advertises USD50 through its linked credits portal. This supersedes the previous direct-page/rate-limit note below. The portal loads no readable form content in the research tool, so its account-specific fields, card requirement and actual award remain unverified. No form was submitted.

[Render's current redemption instructions](https://render.com/docs/credits): if the sponsor gives a promo code, select the intended workspace, open Billing, use Credit Balance and Apply. Credits are workspace-specific. Redemption itself does not change workspace/service plans. Exact expiry depends on the promotion and needs confirmation with the provider. Do not publish a promo code or account identifier.

**Check accrued charges, not only credit balance.** Render documents that credits are applied at the end of a billing period; the balance does not decrease incrementally with usage. If credits are insufficient, the remainder is charged to the workspace payment method. A USD50 balance is not a hard cap. Confirm billing behavior before any billable service or disk is created. Public pricing did not expose numeric compute/disk rates in this research view, so no new price estimate is asserted; collect the actual dashboard quote first.

Immediate owner steps: account signup → official sponsor claim → Billing/credit/expiry/usage/card/exhaustion check → share only non-sensitive terms. Do not create a web service or enter a payment method to make an unverified claim flow work. If an offered card or plan requirement prevents completion, leave the flow there and report its non-sensitive wording. SPONSOR_CHECKPOINTS.md retains this and the other sponsor reminders.

Owner status on October 7: not signed up, no credits claimed. Local deployment and recovery preparation does not create a Render account or service. Start with account/credit checks; deployment is a separate step.

## Steps for the owner

1. Open [Render signup](https://dashboard.render.com/register). Choose an available signup method. GitHub is convenient for later deployment; review its authorization screen. If repository access is requested, restrict it to Nudge where that option is available. Do not share passwords, one-time codes or tokens with the coding agent.
2. Complete any email/account verification. If prompted for a workspace plan, choose **Hobby**, not a paid workspace upgrade. Hobby has no monthly workspace fee; compute/storage and other usage can still cost money. [Render pricing](https://render.com/pricing).
3. Open [the official hackathon Render resource](https://paypalaihackathon.devpost.com/details/render) and follow **Start building with $50 of Render credits**. Use the sponsor-linked claim process with the same account identity where required; follow the actual form rather than an unrelated promotion. The offer is advertised on the sponsor page, not proof that this account is eligible or already credited.
4. If the page requests a payment method, workspace upgrade or service creation, pause there and review the displayed requirement before proceeding. The current task authorizes preparation and signup guidance, not activating billing. No card details should be entered into chat or the repository.
5. In the Render workspace dashboard, open **Billing** from the left panel. Check whether credits were applied, their expiry, what costs they cover and what happens after exhaustion. Record the balance and any visible terms without publishing account identifiers. [Dashboard billing guidance](https://render.com/docs/render-dashboard).
6. Share only the credit amount, expiry and non-sensitive billing guidance with the coding agent. If terms are missing, ask the sponsor team through the official hackathon support channels; do not assume a credit balance is a hard spending cap. Then review the concrete service/storage estimate and RENDER_DEPLOYMENT.md before any deployment.

Suggested question for the owner to send manually if needed:

> Hello! I'm participating in the PayPal AI Hackathon and would like to use the Render sponsor credits. Could you confirm how to redeem them, their expiry, whether they cover a Node web service with persistent disk and Workflows, and what happens when the credits are exhausted? I would like to stay within the sponsor allowance without starting out-of-pocket spending. Thank you!

No message has been sent by the coding agent. The official sponsor page was available through search indexing during this check, but direct Devpost requests were rate-limited and the claim form could not be inspected. Its exact fields, card requirements, eligibility and expiry remain unverified. Report the current screen if it differs from these steps; don't guess a coupon or create a service to make redemption work.

## Hosting and Workflows are separate

The prepared Node web service hosts Nudge's pages, owner/client APIs and webhook endpoint. Render Workflows is a separate distributed-task product; task runs do not expose incoming ports, and it bills for compute and retained task state. It is not a substitute for hosting the website. [Render Workflows](https://render.com/docs/workflows).

A future read-only background reconciliation or advisory task may fit Workflows, after verifying allowances and access architecture. Disk-backed SQLite is not shared automatically with workflow instances. Any task needing workspace changes must use a reviewed, authenticated boundary to the web service or an appropriate datastore design. Configure retries deliberately; never let default orchestration retries blindly resend invoices, reminders or payouts. No workflow has been deployed or executed.
