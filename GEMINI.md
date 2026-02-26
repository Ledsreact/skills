# Ledsreact Development Context

This file provides context for Gemini CLI when working with Ledsreact projects.

## About Ledsreact

Ledsreact is a sports performance measurement platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables.

## API Reference

- **Swagger UI**: https://open-api.eu.ledsreact.com/docs
- **OpenAPI Spec (YAML)**: https://open-api.eu.ledsreact.com/docs-yaml
- **Developer Docs**: https://developer.ledsreact.com/api

## Available Skills

| Skill | Description |
| --- | --- |
| `ledsreact-openapi` | Raw REST API interaction for any language |
| `ledsreact-python` | Python SDK for scripts, pipelines, and analytics |
| `ledsreact-webapp` | TypeScript SDK for Next.js web applications |
| `ledsreact-requirements` | Translate coach-level intent into implementation specs |

## Data Model

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

## SDKs

| SDK | Package | Language |
| --- | --- | --- |
| TypeScript | `@ledsreact/sdk` | TypeScript / Next.js |
| Python | `ledsreact-sdk` | Python |

## Regions

Always ask the user which region to connect to:

- **EU** — `https://open-api.eu.ledsreact.com` (Europe, Africa)
- **US** — `https://open-api.us.ledsreact.com` (Americas, Asia, Oceania)

## Authentication

All API access requires an `x-api-key` header. Keys are scoped to a single club. Store keys in environment variables (`LEDSREACT_API_KEY`), never in source code.

## Common Metrics

| Metric | Unit | Description |
| --- | --- | --- |
| `total_time_s` | s | Total exercise duration |
| `totaltimereactiontime_s` | s | Net time (excl. reaction time) |
| `reactiontime_s` | s | Reaction time |
| `max_speed_ms` | m/s | Peak speed |
| `avg_speed_ms` | m/s | Average speed |
| `max_acceleration_ms2` | m/s² | Peak acceleration |
| `max_deceleration_ms2` | m/s² | Peak deceleration |

## Do NOT

- Hardcode API keys in source code
- Assume a region — always ask the user
- Ignore rate limits (100 req/min general, 10 req/min for exports)
- Skip pagination when fetching complete datasets
