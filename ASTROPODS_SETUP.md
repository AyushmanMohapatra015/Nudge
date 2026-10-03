# Astropods local setup for Nudge

## Checked on this laptop

- Windows x64, 16 GB RAM, hypervisor present.
- WSL 2.5.10.0 is installed (Docker documentation requires 2.1.5 or later).
- Docker Desktop was not found at the system or per-user install location; Docker and Astropods CLI were not found on PATH.
- User has reported USD 10 Astropods signup credit.
- No model calls, cloud deployment, or credit usage occurred during these checks.

## Next: install Docker Desktop

Use the [official Docker Windows instructions](https://docs.docker.com/desktop/setup/install/windows-install/) and the Windows x86_64 download. Docker Desktop is free for personal use and education under its published terms. Choose per-user installation and the WSL 2 backend where offered. This is a computer installation outside the project, and may need an installer approval or a reboot; save work first. Do not start a cloud plan or supply financial details for this setup.

Start Docker Desktop after installation. Wait for its engine to be ready, then open a new PowerShell terminal:

```powershell
docker --version
docker info --format '{{.ServerVersion}}'
```

The second command must return a server version, not just confirm the CLI exists.

## Astropods CLI: download currently blocked

The [official CLI guide](https://docs.astropods.com/install-cli) points to the installer at https://astropods.com/install.ps1. That installer was downloaded for inspection only to ignored `data/tools/astropods-install.ps1`; it was not executed. It downloads from `https://download.astropods.ai/latest`, checks SHA256, then installs in the user's profile and changes their PATH.

Both PowerShell and curl requests to the official checksum host failed with connection/TLS resets from this machine. The executable was not installed. Do not disable TLS verification, run an unverified binary, or execute a downloaded installer repeatedly. Retry the official host later or use the sponsor's documented support channel if the failure persists. No support message was sent by Codex.

When the host is reachable, verify the official checksum before running the CLI. Use a browser/device login controlled by the user; do not copy passwords or gateway keys into chat. The documented Windows local project runs inside Docker. Generate the agent harness in a separate subdirectory so it does not overwrite Nudge's Next.js AGENTS.md, package.json, or source.

## AI connection remains a separate step

Nudge's Astropods adapter and mocked tests pass. It uses the Anthropic passthrough endpoint, `x-bf-vk`, and a `bedrock/claude-*` model. Managed gateway variables are injected into agent containers, not automatically into the standalone Next.js server. Verify that container setup and legitimate gateway access before making a model request. Use one fictional scope comparison, monitor credit usage, and keep payment methods absent. Do not give the model direct PayPal credentials. Actual AI response and end-to-end scope evaluation remain unfinished.
