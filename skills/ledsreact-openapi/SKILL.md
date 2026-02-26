---
name: ledsreact-openapi
description: Interact with the Ledsreact Open API for sports performance data. Use when writing scripts, API clients, integrations, or any code that directly calls the Ledsreact REST API for player metrics, exercise results, timeseries data, or club management.
metadata:
  author: ledsreact
  version: "1.0"
---

# Ledsreact Open API

This skill helps you write code that directly calls the Ledsreact Open API -- scripts, API clients, data pipelines, integrations, or backend services in any language.

> For **web applications**, use the `ledsreact-webapp` skill instead.

## Quick Reference

| Item | Value |
|------|-------|
| **Spec (YAML)** | `https://open-api.eu.ledsreact.com/docs-yaml` |
| **Spec (JSON)** | `https://open-api.eu.ledsreact.com/docs-json` |
| **Swagger UI** | `https://open-api.eu.ledsreact.com/docs` |
| **Dev docs** | `https://developer.ledsreact.com/api` |
| **Local spec** | [assets/ledsreact_openapi.yaml](assets/ledsreact_openapi.yaml) |
| **Auth** | `x-api-key` header |
| **Rate limit** | 100 req/min (exports: 10 req/min) |

To fetch the latest spec into `assets/`, run one of:
```
node  scripts/get_latest_ledsreact_openapi_spec.js [--format yaml|json]
python scripts/get_latest_ledsreact_openapi_spec.py [--format yaml|json]
```

## Authentication

Every request requires the `x-api-key` header. Keys are scoped to a single club.

```
curl -H "x-api-key: $LEDSREACT_API_KEY" https://open-api.eu.ledsreact.com/club
```

Store the key in an environment variable (`LEDSREACT_API_KEY`). Never hardcode it.

## Region (REQUIRED -- ask before writing any code)

Before writing any code, **ask the user which region to connect to**:

- **EU** -- `https://open-api.eu.ledsreact.com` (Europe, Africa)
- **US** -- `https://open-api.us.ledsreact.com` (Americas, Asia, Oceania)
- **Custom** -- a self-hosted or non-standard base URL provided by the user

The chosen base URL must be used for all API calls. Store it alongside the API key (e.g. in an env var `LEDSREACT_BASE_URL`) so it is easy to change. Do not hardcode a region.

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

## Endpoints Overview

### Club
- `GET /club` -- club info (id, name, unitSystem)
- `GET /club/devices` -- Ledsreact Pro devices

### Players
- `GET /players` -- list (query: `firstname`, `lastname`, `exact`, `skip`, `take`, `orderBy`, `orderDirection`)
- `POST /players` -- create
- `GET /players/{id}` -- get by ID
- `PUT /players/{id}` -- update
- `GET /players/uid/{uid}` -- get by UID
- `POST /players/import` -- CSV import (multipart/form-data)

### Teams
- `GET /teams` -- list
- `POST /teams` -- create
- `GET /teams/{id}` -- get by ID
- `PUT /teams/{id}` -- update
- `DELETE /teams/{id}` -- delete
- `GET /teams/{id}/players` -- team roster
- `PUT /teams/{id}/players` -- set team roster

### Exercise Templates
- `GET /exercise-templates` -- list (query: `withVariables`, `withDrills`, `page`, `limit`)
- `GET /exercise-templates/{id}/exercises` -- exercises for template

Template UIDs: `Sprint`, `COD`, `FiveTenFive`, `TTest`, `AgilityBox`, `MasterCheckpointLong`

### Exercises
- `GET /exercises` -- list (query: `customOnly`, `withVariables`, `page`, `limit`)

### Exercise Sessions
- `GET /exercise-session` -- list (query: `skip`, `take`, `withCharts`)
- `POST /exercise-session` -- create (advanced, used with BLE SDK)
- `GET /exercise-session/{uuid}` -- get by UUID

> **Warning:** The `charts` field on attempts is very large. Keep `withCharts` off (the default) unless you specifically need chart data for a single session. Never use `withCharts` for bulk fetching. For performance data, use the `/metrics/*` endpoints instead.

### Exercise Attempts
- `GET /exercise-attempt` -- list with filters:
  - `page`, `limit` (defaults: 1, 50)
  - `dateStart`, `dateEnd` (ISO 8601)
  - `playerIds`, `teamIds`, `exerciseIds` (comma-separated)
  - `exerciseTemplateUids`, `sessionIds`
  - `withCharts` -- **avoid in bulk requests** (see warning below)
- `GET /exercise-attempt/{attemptId}` -- single attempt (supports `withCharts`)
- `DELETE /exercise-attempt/{attemptId}` -- soft delete
- `PATCH /exercise-attempt/{attemptId}` -- update remark

> **Warning:** The `charts` field is very large. Only use `withCharts` when fetching a single attempt, never when listing. For performance data, use the `/metrics/*` endpoints instead.

### Metrics
- `GET /metrics/analysis` -- player metrics analysis (preferred)
  - Filters: `playerIds`, `teamIds`, `exerciseIds`, `exerciseTemplateUids`, `metricNames`, `dateStart`, `dateEnd`, `page`, `limit`, `details`
- `GET /metrics/attempt/{attemptId}` -- metrics for one attempt
- `GET /metrics/session/{sessionId}` -- metrics for a session
- `GET /metrics/summary/players` -- (deprecated, use `/metrics/analysis`)
- `GET /metrics/summary/group` -- group summary

### Timeseries
- `GET /timeseries/attempt/{attemptId}` -- full timeseries for an attempt
  - Returns: `datapoints.series[]` (t, d, speed, acceleration, x, y, ...), `zones`, `events`, `exerciseConfig`

### Export
- `GET /export/datapoints` -- CSV in ZIP (rate limit: 10/min)
  - Required: `playerId`, `fromDate`, `toDate`

## Common Metric Names

| Metric | Unit | Description |
|--------|------|-------------|
| `total_time_s` | s | Total exercise duration |
| `totaltimereactiontime_s` | s | Net time (excl. reaction time) |
| `reactiontime_s` | s | Reaction time |
| `max_speed_ms` | m/s | Peak speed |
| `avg_speed_ms` | m/s | Average speed |
| `max_acceleration_ms2` | m/s² | Peak acceleration |
| `max_deceleration_ms2` | m/s² | Peak deceleration |

Zone metrics follow the pattern: `zone_{name}_{metric}_{unit}` (e.g. `zone_0-5_maxspeed_ms`)

Force-Velocity Profile (sprints >= 20m): `f0` (N/kg), `v0_ms` (m/s), `p_max` (W/kg)

## Rate Limiting & Error Handling

- **429 Too Many Requests** -- back off using the `Retry-After` header, or exponential backoff
- **401** -- invalid/missing API key
- **403** -- key lacks access
- **404** -- resource not found (or soft-deleted)

Always implement retry logic for 429 responses. Example pattern:

```python
import time

def api_get(session, url, params=None, max_retries=3):
    for attempt in range(max_retries):
        resp = session.get(url, params=params)
        if resp.status_code == 429:
            delay = int(resp.headers.get("Retry-After", 2 ** attempt))
            time.sleep(delay)
            continue
        resp.raise_for_status()
        return resp.json()
    raise Exception("Rate limit exceeded after retries")
```

## Pagination

List endpoints use one of two pagination styles:

1. **skip/take** (players, sessions): `?skip=0&take=10` -- returns `{ data: [...], count: N }`
2. **page/limit** (attempts, exercises, metrics): `?page=1&limit=50` -- returns `{ data: [...], total, page, limit, totalPages }`

Always paginate through all results when fetching complete datasets.

## Implementation Checklist

When building any Ledsreact API integration:

1. Store the API key in an env var (`LEDSREACT_API_KEY`), never in source code
2. **Ask the user for their region (EU / US / custom)** and store the base URL in `LEDSREACT_BASE_URL`
3. Set headers: `x-api-key` and `Accept: application/json`
4. Implement retry with backoff for HTTP 429
5. Handle pagination to retrieve complete result sets
6. For full endpoint details, schemas, and response types, consult `assets/ledsreact_openapi.yaml`
