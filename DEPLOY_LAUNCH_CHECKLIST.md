# Nudge: prepare now, launch later

Prepared November 2, 2026 from the current deployment template and startup code. No Render service has been created by this preparation. Hosted Linux startup, persistence and provider behavior remain unverified.

## What is already prepared

`render-blueprint.example.yaml` describes one Node service in Singapore, the 0.5c-512mb plan, one 1 GB disk at `/var/data`, manual application deploys, a health check, Node 24.12.0 and a generated owner token. The existing build command includes the Bryntum installation steps; use it unchanged. `scripts/start-render.mjs` refuses startup without the expected mounted disk and private owner configuration.

Keep the existing architecture and database path. The template intentionally starts with AI disabled. A successful first deployment with AI disabled is a hosting check, not proof of the complete AI product.

## Prepare in the dashboard without launching

1. Sign into the intended Render workspace. Confirm its displayed credit balance, accrued usage and service/disk quote. The owner previously reported $50 credits valid until October 1, 2027, and no payment method. Whether this account can provision the paid service without a card is still unverified. If a card is required, leave creation pending.
2. Choose **New > Blueprint**. If GitHub connection is needed, grant access only to the Nudge repository where available. Do not grant access to the other projects for this setup.
3. Select the intended branch and enter `render-blueprint.example.yaml` as the **Blueprint Path**. Render supports custom Blueprint filenames; no rename is necessary.
4. Review the proposed resources: exactly one service and one disk; no workspace upgrade, additional databases or workers. Check the dashboard's actual compute/disk prices and any pipeline spending settings.
5. Stop before **Deploy Blueprint**. Saving this checklist does not save a dashboard draft; if Render discards the form, repeat steps 2–4 later. No claim of a saved or validated remote configuration is made.

Reference: https://render.com/docs/infrastructure-as-code and https://render.com/docs/blueprint-spec

## Private values to have ready

Use a password manager or private local notes, never this document or a Git commit. Do not paste the complete `.env.local` into Render: it can contain local-only values.

- PayPal sandbox: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MERCHANT_EMAIL`. Confirm they belong to the sandbox application.
- AG Studio: `NUDGE_AG_STUDIO_LICENSE`, subject to its evaluation/hosting permission and expiry. Do not expose the key in documentation.
- Elastic, when separately enabling live AI: `ELASTIC_KIBANA_URL` (Kibana, not the Elasticsearch endpoint), `ELASTIC_API_KEY`, `ELASTIC_AGENT_ID`, `ELASTIC_SPACE_ID` when applicable, and `ELASTIC_INFERENCE_ID`. Trial and key validity must both cover the session. An extension application is not confirmation of an extension.
- The Blueprint generates `NUDGE_ADMIN_TOKEN`; retrieve it privately after creation for owner login. Do not replace it with a public demonstration password.
- `PAYPAL_WEBHOOK_ID` must come from the sandbox webhook registration for the actual hosted URL. It cannot be finalized before the service URL exists.

## First launch: some work necessarily remains

1. Reopen the reviewed Blueprint form, check its changes/quote and select **Deploy Blueprint** when ready to start hosting.
2. Allow installation and build to finish. Do not repeatedly redeploy or increase the tier automatically if it fails; inspect the specific build/start error first.
3. Add the required private provider/licence settings through Render's environment settings. Keep `NUDGE_AI_ENABLED=false` until ready for a bounded live verification. Environment changes can require a new deployment/build; follow Render's displayed action and batch settings where possible.
4. Open the assigned HTTPS URL. Check `/api/health`, owner login, rejection of unauthenticated workspace access and client/owner separation. Create only fictional records on the fresh hosted database.
5. Verify those records survive a restart and perform the documented mounted-database backup/recovery checks in `RENDER_DEPLOYMENT.md` and `DATABASE_RECOVERY.md`.
6. Register the PayPal **sandbox** webhook at `https://YOUR-HOST/api/paypal/webhook`, save its webhook ID privately in Render, and verify a new sandbox payment and signed event on this host. Local webhook success does not establish hosted success.
7. Verify live Elastic separately with a controlled fictional request and usage observation. AI success must pass the existing strict validation. Do not silently substitute a replay if it fails.
8. Record the actual service URL and completed checks privately where needed; record only non-sensitive evidence in project documentation.

The first deploy cannot honestly be reduced to one click: the final URL, webhook registration and hosted verification depend on resource creation. Reserve time for these before the interview/demo day.

## Later short sessions

Once the first launch is verified, retain the same service, disk and settings rather than creating a new service each time. Use Render's available suspend/resume controls and confirm the resulting state in its dashboard. Retained storage can continue accruing charges. Closing a browser or local PowerShell does not stop hosted billing.

Before the next session, resume the existing service, wait until healthy, sign in, check the fictional workflow and verify provider/trial validity. A changed commit or environment may require deployment and fresh checks. Do not delete the service/disk to stop a short session: deletion risks losing the hosted database and is a separate decision.

## Current evidence boundary

This preparation inspected Git status, the deployment documentation, Blueprint, package scripts, startup guard and environment-variable names. It did not read secret values, run builds/tests, create resources, connect GitHub, change billing, call providers or verify Linux behavior. Existing untracked `DEMO_VIDEO_SCRIPT.md` was left untouched. Remaining account permissions and sponsor access are tracked in the existing deployment/action-plan documents.
