---
name: ledsreact-devcontainer
description: Use when setting up a development container for a Ledsreact project, adding Claude Code devcontainer support to a repo, or when asked to add a devcontainer configuration
---

# Ledsreact Dev Container

Install a secure, batteries-included devcontainer into the current repository. Provides Claude Code, Node 20, zsh, and a network firewall that restricts outbound traffic to only approved domains.

## What Gets Installed

Copy the `.devcontainer/` directory from this skill into the repo root:

| File                | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `devcontainer.json` | Container config, VS Code extensions, mounts        |
| `Dockerfile`        | Node 20 image with Claude Code, zsh, git-delta, fzf |
| `init-firewall.sh`  | Locks outbound traffic to allowlisted domains only  |

## Installation

```bash
cp -r ${CLAUDE_SKILL_DIR}/.devcontainer/ ./.devcontainer/
```

If a `.devcontainer/` already exists in the target repo, confirm with the user before overwriting.

## What's Included

**Tools:** Node 20, Claude Code, gh CLI, fzf, git-delta, jq, nano, vim, zsh with Powerlevel10k

**VS Code extensions:** Claude Code, ESLint, Prettier, GitLens

**Persistent volumes:** bash history, `~/.claude` config

**Network firewall** (requires `--cap-add=NET_ADMIN,NET_RAW`):

- GitHub (web, API, git)
- npm registry
- Anthropic API + Sentry + Statsig
- VS Code marketplace + updates
- Ledsreact domains (main site, developer docs, EU/US Open API)

All other outbound traffic is blocked and verified on startup.

## Customization

To allow additional domains, edit `init-firewall.sh` and add entries to the domain resolution loop:

```bash
for domain in \
    "registry.npmjs.org" \
    ...
    "your-additional-domain.com"; do
```

To change the Node version, timezone, or tool versions, edit the `build.args` in `devcontainer.json`.
