# Security policy

Nudge is a single-owner, sandbox-only hackathon prototype. It is not a production
payment service, verified electronic-signature system or multi-tenant platform.
The current main branch receives best-effort fixes; older snapshots are unsupported.

## Report privately

Use this repository's **Security → Report a vulnerability** option when private
reporting is enabled. Include the affected version, reproduction steps and potential
impact using fictional data. Do not include working credentials, owner cookies,
client links, private databases or actual payment information.

If the option is unavailable, arrange a private channel with the maintainer before
sharing sensitive details. Do not post an exploit or secret in a public issue.
No dedicated security email or response-time commitment is advertised. The maintainer
must enable and verify private reporting before public release; this file alone
does not activate GitHub security features.

## Safe evaluation and maintenance

- Use fictional records and PayPal sandbox accounts, never live credentials.
- Keep environment files, databases, backups and provider receipts out of Git.
- A client link grants its holder limited authority; it is not verified identity.
- AI suggestions require human review and owner pricing. Keys and enable flags
  are not billing caps or permission for unlimited inference.
- Do not create/pay invoices or test another person's account without approval.
- The unauthenticated simulation is for local evaluation, not shared public hosting.
- Run source/history checks and dependency audits before release. Review findings;
  a clean scan is not a complete security guarantee.
- If a real credential is exposed, revoke/rotate it first. Removing a latest file
  does not remove historical commits, existing clones or cached artifacts.

See [current publication review](docs/PUBLICATION_SECURITY_REVIEW.md),
[publication gates](docs/PUBLICATION_READINESS.md), [client access](docs/CLIENT_ACCESS.md)
and [AI data handling](docs/AI_DATA_HANDLING.md).
