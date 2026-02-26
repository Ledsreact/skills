---
name: ledsreact-python
description: Build Python applications using the Ledsreact Python SDK for sports performance data. Use when creating scripts, data pipelines, analytics tools, dashboards, or any Python program that needs player metrics, exercise results, or timeseries data from Ledsreact.
metadata:
  author: ledsreact
  version: "1.0"
---

# Ledsreact Python SDK Development

This skill helps you build Python applications that use the `ledsreact-sdk` package to access sports performance data from the Ledsreact Open API.

> For **Next.js web applications**, use the `ledsreact-webapp` skill instead.
> For **raw REST API calls** (any language, no SDK), use the `ledsreact-openapi` skill instead.

**Full SDK reference:** See [references/ledsreact-sdk-python.md](references/ledsreact-sdk-python.md) for the complete API, all TypedDict parameters, response fields, metric keys, timeseries fields, and recipes.

## About Ledsreact

Ledsreact is a sports performance measurement platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables. The Python SDK provides typed access to all Open API endpoints for managing players, exercises, sessions, metrics, and timeseries data.

## The Job

1. Receive the feature description from the user
2. Ask the user which **region** they use: EU or US (determines the `Region` enum value)
3. Ask 3–5 essential clarifying questions (with lettered options) about their use case
4. Generate a Python application using the guidance below and the SDK reference

## Installation

```bash
pip install ledsreact-sdk
```

Requires **Python 3.10+**. Dependencies: `httpx >= 0.27`, `pydantic >= 2.0`.

## Environment Setup

Store the API key in an environment variable — never hardcode it:

```bash
export LEDSREACT_API_KEY=your-api-key
```

## Client Initialization

Always use the client as a **context manager** so connections are cleaned up automatically:

```python
import os
from ledsreact import LedsreactClient, Region

with LedsreactClient(
    api_key=os.environ["LEDSREACT_API_KEY"],
    region=Region.EU,       # Region.EU or Region.US
    timeout=30.0,           # seconds (default: 30)
    max_retries=3,          # retries on 429/5xx/network errors (default: 3)
) as client:
    club = client.club.get()
    print(f"Connected to {club.name}")
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `api_key` | Yes | Ledsreact API key |
| `region` | Yes | `Region.EU` or `Region.US` |
| `base_url` | No | Override the API base URL (e.g. for staging) |
| `timeout` | No | Request timeout in seconds (default: 30) |
| `max_retries` | No | Retries on 429/5xx/network (default: 3) |

The SDK automatically retries with exponential backoff (1s, 2s, 4s, … up to 30s) and respects `Retry-After` headers.

## Data Model

```
Club
 ├── Players
 ├── Teams (groups of players)
 └── Exercise Templates (Sprint, COD, TTest, FiveTenFive, AgilityBox, MasterCheckpointLong)
      └── Exercises (concrete configs, e.g. "Sprint 30m")
           └── Exercise Sessions (a test event on a date)
                └── Exercise Attempts (one rep by one player)
                     ├── Metrics (computed: max_speed_ms, total_time_s, …)
                     └── Timeseries (raw ~34 Hz datapoints: position, speed, accel)
```

**Typical workflow:** list attempts (filter by date/player/team/exercise) → fetch metrics per attempt → analyze.

## Services Quick Reference

All services are properties on `client`. Parameters are passed as `dict` matching `TypedDict` definitions.

| Service | Key methods | Pagination |
|---------|------------|------------|
| `client.health` | `check()`, `get_version()` | — |
| `client.club` | `get()`, `get_devices()` | — |
| `client.players` | `list(params)`, `get_by_id(id)`, `get_by_uid(uid)` | skip/take |
| `client.teams` | `list(params)`, `get_by_id(id)`, `get_players(id)` | skip/take |
| `client.exercises` | `list(params)` | page/limit |
| `client.exercise_templates` | `list(params)`, `get_exercises(id, params)` | page/limit |
| `client.exercise_sessions` | `list(params)`, `get_by_uuid(uuid, params)` | skip/take |
| `client.exercise_attempts` | `list(params)`, `get_by_id(id, params)` | page/limit |
| `client.metrics` | `get_analysis(params)`, `get_by_attempt_id(id, params)`, `get_by_session_id(id, params)` | — |
| `client.timeseries` | `get_by_attempt_id(id)` | — |

For full parameter/response details, see [references/ledsreact-sdk-python.md](references/ledsreact-sdk-python.md).

## Common Patterns

### List attempts with filters

```python
attempts = client.exercise_attempts.list({
    "exerciseTemplateUids": "Sprint",
    "playerIds": "42",
    "dateStart": "2025-01-01",
    "dateEnd": "2025-01-31",
    "page": 1,
    "limit": 50,
})
for a in attempts.data:
    print(f"{a.player_name} — {a.exercise_name} ({a.created_at})")
```

### Fetch metrics for an attempt

```python
metrics = client.metrics.get_by_attempt_id(attempt_id, {
    "metricNames": "max_speed_ms,total_time_s",
})
values = {m.metric_name: m.metric_value for m in metrics.metrics}
```

### Aggregated analysis (dashboards & reports)

```python
analysis = client.metrics.get_analysis({
    "exerciseTemplateUids": "Sprint",
    "playerIds": "42",
    "metricNames": "max_speed_ms,total_time_s",
    "dateStart": "2025-01-01",
    "dateEnd": "2025-06-30",
    "details": True,
})
for result in analysis.results:
    for player in result.player_results:
        for m in player.metrics:
            print(f"{m.metric_name}: best={m.best_value}, current={m.current_value}, trend={m.trend}")
```

### Paginate through all results

**skip/take** (players, teams, sessions):

```python
all_players = []
skip = 0
while True:
    result = client.players.list({"skip": skip, "take": 100})
    all_players.extend(result.data)
    if len(all_players) >= result.count:
        break
    skip += 100
```

**page/limit** (attempts, exercises):

```python
all_attempts = []
page = 1
while True:
    result = client.exercise_attempts.list({"page": page, "limit": 100})
    all_attempts.extend(result.data)
    if page >= result.total_pages:
        break
    page += 1
```

### Fetch timeseries data

```python
ts = client.timeseries.get_by_attempt_id(attempt_id)
for dp in ts.datapoints.series[:5]:
    print(f"t={dp.t:.3f}s  d={dp.d}m  speed={dp.s_s} m/s  accel={dp.a} m/s²")
```

## Error Handling

```python
from ledsreact import (
    LedsreactClient, Region,
    AuthenticationError, NotFoundError, RateLimitError, LedsreactError,
)

try:
    with LedsreactClient(api_key="...", region=Region.EU) as client:
        client.club.get()
except AuthenticationError:
    print("Invalid API key")
except NotFoundError:
    print("Resource not found")
except RateLimitError as e:
    print(f"Rate limited — retry after {e.retry_after}s")
except LedsreactError as e:
    print(f"API error (HTTP {e.status_code}): {e}")
```

| Exception | HTTP | When |
|-----------|------|------|
| `ValidationError` | 400 | Invalid parameters |
| `AuthenticationError` | 401 | Bad or missing API key |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `RateLimitError` | 429 | Too many requests (has `retry_after`) |
| `ServerError` | 5xx | Server-side error |
| `NetworkError` | — | Connection/timeout failures |

The SDK retries `RateLimitError`, `ServerError`, and `NetworkError` automatically up to `max_retries` times before raising.

## Common Metric Keys

| Metric | Description |
|--------|-------------|
| `total_time_s` | Total exercise duration |
| `totaltimereactiontime_s` | Net time (excl. reaction time) |
| `reactiontime_s` | Reaction time |
| `max_speed_ms` | Peak speed (m/s) |
| `avg_speed_ms` | Average speed (m/s) |
| `max_acceleration_ms2` | Peak acceleration (m/s²) |
| `max_deceleration_ms2` | Peak deceleration (m/s²) |

Zone metrics: `zone_{name}_{metric}_{unit}` (e.g. `zone_0-5_maxspeed_ms`)

FVP (sprints >= 20m): `f0` (N/kg), `v0_ms` (m/s), `p_max` (W/kg), `fv_slope`, `drf`

For the full metric key list and naming conventions, see the SDK reference.

## Exercise Template UIDs

| UID | Description |
|-----|-------------|
| `Sprint` | Linear sprint |
| `COD` | Change of Direction (180° turnaround) |
| `TTest` | T-Test agility |
| `FiveTenFive` | 5-10-5 lateral shuttle |
| `AgilityBox` | Reactive agility in a box |
| `MasterCheckpointLong` | Custom checkpoint-based drill ("Custom Test" in the app) |

Use these UIDs in `exerciseTemplateUids` filters — comma-separate for multiple: `"Sprint,COD"`.

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 req/min |
| Timeseries / exports | 10 req/min |

The SDK handles 429 responses automatically. When fetching many timeseries, add explicit delays:

```python
import time

for attempt in attempts:
    ts = client.timeseries.get_by_attempt_id(attempt.id)
    time.sleep(6)  # stay within 10 req/min
```

## Implementation Checklist

When building any Python application with the Ledsreact SDK:

1. Store the API key in `LEDSREACT_API_KEY` env var — never in source code
2. **Ask the user for their region** (EU / US) before writing any code
3. Use `LedsreactClient` as a context manager (`with` statement)
4. Handle `LedsreactError` exceptions for graceful failure
5. Paginate through all results when fetching complete datasets
6. Respect rate limits — add delays for bulk timeseries fetches
7. For full parameter types, response fields, and advanced recipes, consult [references/ledsreact-sdk-python.md](references/ledsreact-sdk-python.md)
