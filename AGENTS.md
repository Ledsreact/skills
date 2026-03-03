# Ledsreact Skills

Agent skills for building applications that integrate with the Ledsreact sports performance and agility sensing platform.

## About Ledsreact

Ledsreact is a sports performance and agility sensing platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables. The Open API provides access to clubs, players, teams, exercise templates, sessions, attempts, metrics, and raw timeseries data.

## Overview

This repository provides two complementary approaches for AI coding agents:

1. **Passive context (this file)**: Always-available Ledsreact knowledge and references
2. **Skills (on-demand)**: Task-specific workflows for explicit invocation

## Available Skills

| Skill | Description |
| --- | --- |
| [ledsreact-openapi](skills/ledsreact-openapi/SKILL.md) | Raw REST API interaction for any language |
| [ledsreact-webapp](skills/ledsreact-webapp/SKILL.md) | TypeScript SDK (`@ledsreact/sdk`) for Next.js web applications |
| [ledsreact-requirements](skills/ledsreact-requirements/SKILL.md) | Translate coach-level intent into Ledsreact-grounded specs |

## Skill Format

Each skill follows the Agent Skills specification with YAML frontmatter:

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

## Key Ledsreact Concepts

### Data Model

```
Club
 ├── Players
 ├── Teams (groups of players)
 └── Exercise Templates (Sprint, COD, FiveTenFive, TTest, AgilityBox, MasterCheckpointLong)
      └── Exercises (concrete instances, e.g. "10m Sprint")
           └── Exercise Sessions (a test session with one exercise)
                └── Exercise Attempts (individual runs per player)
                     ├── Metrics (aggregated: times, speeds, accelerations)
                     └── Timeseries (raw datapoints: position, velocity over time)
```

### Regions

Users must specify their region before any API interaction:

- **EU** — `https://open-api.eu.ledsreact.com` (Europe, Africa)
- **US** — `https://open-api.us.ledsreact.com` (Americas, Asia, Oceania)

### Authentication

All API access requires an `x-api-key` header. Keys are scoped to a single club. Store keys in environment variables (`LEDSREACT_API_KEY`), never in source code.

### Common Metrics

| Metric | Unit | Description |
| --- | --- | --- |
| `total_time_s` | s | Total exercise duration |
| `totaltimereactiontime_s` | s | Net time (excl. reaction time) |
| `reactiontime_s` | s | Reaction time |
| `max_speed_ms` | m/s | Peak speed |
| `avg_speed_ms` | m/s | Average speed |
| `max_acceleration_ms2` | m/s² | Peak acceleration |
| `max_deceleration_ms2` | m/s² | Peak deceleration |

### SDKs

| SDK | Package | Language |
| --- | --- | --- |
| TypeScript | `@ledsreact/sdk` | TypeScript / Next.js |
| Python | `ledsreact-sdk` | Python |

## DO NOT

- Hardcode API keys in source code
- Assume a region — always ask the user
- Ignore rate limits (100 req/min general, 10 req/min for exports)
- Skip pagination when fetching complete datasets

## References

- Ledsreact Developer Docs: https://developer.ledsreact.com/api
- Swagger UI: https://open-api.eu.ledsreact.com/docs
- OpenAPI Spec (YAML): https://open-api.eu.ledsreact.com/docs-yaml
- OpenAPI Spec (JSON): https://open-api.eu.ledsreact.com/docs-json

## License

Proprietary — Copyright (c) 2025-present Ledsreact. All rights reserved.
