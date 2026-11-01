# Contributing

Start with [README.md](README.md), [judge setup](JUDGE_SETUP.md) and the
[documentation index](docs/README.md). Use Node 24 for the tested setup. Complete
all three dependency-install commands in README; commercial trial dependencies
remain subject to their separate terms.

Use labelled local simulation and fictional records. Do not copy another person's
`.env.local`, database, client links or credentials. No model calls, financial
actions or paid hosting are required to propose a change.

Keep a change focused and explain the problem, implementation and actual checks.
Preserve exact-cent money, owner/client approvals, server-side access checks,
uncertainty markers and separate invoice create/send actions. Never clear an
uncertain external action merely to make a test pass.

Relevant checks, from the repository root:

```sh
npm run typecheck
npm test
npm run privacy:check
npm run privacy:history
npm audit --package-lock-only --ignore-scripts
```

History findings may describe existing publication blockers; report them accurately.
Use the Postman production/restart workflow for integration changes and relevant
browser checks for interactions. Mock providers unless a separate bounded live
test is explicitly approved. Report skipped tests and evidence limits.

Do not commit generated builds, commercial vendor files, agent exports, credentials
or personal interview notes. Stage explicit paths and inspect `git diff --cached`.
Dependency update pull requests require review; do not auto-merge them.

For security issues, follow [SECURITY.md](SECURITY.md), not a public issue.
