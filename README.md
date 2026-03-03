# Ledsreact Skills

Agent skills for building applications that integrate with the [Ledsreact](https://ledsreact.com) sports performance and agility sensing platform, following the [Agent Skills](https://github.com/anthropics/skills) open format.

## Overview

This repository contains skills that help AI assistants understand and implement Ledsreact integrations. Each skill provides structured guidance for a specific approach to working with the Ledsreact Open API and SDKs.

## Available Skills

| Skill | Description |
| --- | --- |
| [ledsreact-openapi](skills/ledsreact-openapi/SKILL.md) | Raw REST API interaction for any language — endpoints, auth, pagination, rate limiting |
| [ledsreact-webapp](skills/ledsreact-webapp/SKILL.md) | TypeScript SDK (`@ledsreact/sdk`) for Next.js dashboards and web apps |
| [ledsreact-requirements](skills/ledsreact-requirements/SKILL.md) | Translate coach-level intent into Ledsreact-grounded specifications |

## Installation

### Claude Code

Clone or add as a submodule, then point Claude Code to this directory. `CLAUDE.md` references `AGENTS.md` which provides full context.

```bash
git clone https://github.com/ledsreact/skills.git
```

### Claude Code Plugin

This repo includes a `.claude-plugin/plugin.json` for automatic skill discovery.

### Codex

Copy skills into your Codex skills directory:

```bash
cp -r skills/ledsreact-openapi "$CODEX_HOME/skills/"
cp -r skills/ledsreact-webapp "$CODEX_HOME/skills/"
cp -r skills/ledsreact-requirements "$CODEX_HOME/skills/"
```

Codex auto-discovers `SKILL.md` files in that directory. You can also symlink from `.codex/skills` at the repo root.

### Cursor

Skills are automatically available via the agent skills configuration in Cursor settings. Point to the `SKILL.md` files in each skill directory.

### Manual Installation

Copy the desired skill's `SKILL.md` (and its `references/` directory if present) to your project's skills directory.

## Repository Structure

```
ledsreact-skills/
├── skills/
│   ├── ledsreact-openapi/
│   │   ├── SKILL.md                    # REST API skill
│   │   ├── assets/                     # OpenAPI spec files (YAML, JSON)
│   │   └── scripts/                    # Spec update scripts
│   ├── ledsreact-webapp/
│   │   ├── SKILL.md                    # TypeScript SDK skill
│   │   └── references/                 # SDK reference docs
│   └── ledsreact-requirements/
│       └── SKILL.md                    # Requirements translation skill
├── docs/                               # Documentation
├── .claude-plugin/                     # Claude plugin config
├── AGENTS.md                           # Agent-facing documentation
├── CLAUDE.md                           # Claude Code pointer
├── GEMINI.md                           # Gemini CLI context
├── CONTRIBUTING.md                     # Contribution guidelines
├── README.md                           # This file
├── package.json                        # Package metadata
└── LICENSE                             # Proprietary license
```

## Skill Format

Each skill uses the Agent Skills specification with YAML frontmatter:

```markdown
---
name: skill-name
description: What the skill does and when to use it
metadata:
  author: ledsreact
  version: "1.0"
---

# Skill Name

## Instructions

Step-by-step guidance

## Examples

Code examples

## Best Practices

Guidelines and patterns

## References

Additional resources
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**

```
Translate this coach's request into Ledsreact requirements
```

```
Build a Next.js dashboard showing sprint times for my team
```

## Updating the OpenAPI Spec

The `ledsreact-openapi` skill includes scripts to fetch the latest spec:

```bash
node skills/ledsreact-openapi/scripts/get_latest_ledsreact_openapi_spec.js
python skills/ledsreact-openapi/scripts/get_latest_ledsreact_openapi_spec.py
```

## AI Integration Files

- `AGENTS.md` — Agent-facing documentation (data model, concepts, references)
- `CLAUDE.md` — Claude Code configuration (points to AGENTS.md)
- `GEMINI.md` — Gemini CLI context for Ledsreact projects

## License

Proprietary — Copyright (c) 2025-2026 Ledsreact. All rights reserved. See [LICENSE](LICENSE) for details.
