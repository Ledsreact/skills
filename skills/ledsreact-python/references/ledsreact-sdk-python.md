# ledsreact-sdk

Python SDK for the [Ledsreact Open API](https://developer.ledsreact.com). Ledsreact is a sports performance measurement platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables. This SDK provides typed access to all Open API endpoints for managing players, exercises, sessions, metrics, and timeseries data.

![Python >=3.10](https://img.shields.io/badge/python-%3E%3D3.10-blue)

## Table of Contents

- [What is Ledsreact?](#what-is-ledsreact)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Key and Region](#api-key-and-region)
- [Client Configuration](#client-configuration)
- [Understanding the Data Model](#understanding-the-data-model)
- [Service Reference](#service-reference)
  - [Health](#health)
  - [Club](#club)
  - [Players](#players)
  - [Teams](#teams)
  - [Exercises](#exercises)
  - [Exercise Templates](#exercise-templates)
  - [Exercise Sessions](#exercise-sessions)
  - [Exercise Attempts](#exercise-attempts)
  - [Metrics](#metrics)
  - [Timeseries](#timeseries)
- [Pagination](#pagination)
- [Error Handling](#error-handling)
- [Metric Keys Primer](#metric-keys-primer)
- [Timeseries Field Reference](#timeseries-field-reference)
- [Recipes](#recipes)
  - [Get all sprint results for a player this month](#recipe-1-get-all-sprint-results-for-a-player-this-month)
  - [Export metrics to CSV with pandas](#recipe-2-export-metrics-to-csv-with-pandas)
  - [Compare team sprint performance](#recipe-3-compare-team-sprint-performance)
  - [Track max speed over time](#recipe-4-track-max-speed-over-time)
  - [Fetch timeseries and inspect speed data](#recipe-5-fetch-timeseries-and-inspect-speed-data)
- [Using These Docs with an LLM](#using-these-docs-with-an-llm)
- [Rate Limits](#rate-limits)
- [Requirements](#requirements)
- [Support](#support)

## What is Ledsreact?

[Ledsreact](https://ledsreact.com) is a sports performance measurement platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables.

This SDK gives you programmatic access to the data collected by the Ledsreact platform — players, teams, exercises, session results, computed metrics, and raw timeseries datapoints. Common use cases include:

- **Reporting** — generate weekly or monthly performance summaries for coaching staff
- **Dashboards** — build live or historical dashboards with charts and tables
- **CSV/Excel export** — pull data into spreadsheets or statistical tools
- **Integration** — feed results into an Athlete Management System (AMS), data warehouse, or custom app

## Installation

```bash
pip install ledsreact-sdk
```

Requires Python 3.10 or later.

## Quick Start

```python
import os
from ledsreact import LedsreactClient, Region

with LedsreactClient(api_key=os.environ["LEDSREACT_API_KEY"], region=Region.EU) as client:
    # Club info
    club = client.club.get()
    print(f"Club: {club.name} ({club.unit_system})")

    # List first 10 players
    players = client.players.list({"take": 10})
    for p in players.data:
        print(f"  {p.firstname} {p.lastname}")

    # Get sprint attempts from January 2025
    attempts = client.exercise_attempts.list({
        "exerciseTemplateUids": "Sprint",
        "dateStart": "2025-01-01",
        "dateEnd": "2025-01-31",
        "page": 1,
        "limit": 5,
    })

    # Fetch metrics for the first attempt
    if attempts.data:
        attempt = attempts.data[0]
        metrics = client.metrics.get_by_attempt_id(attempt.id)
        for m in metrics.metrics:
            print(f"  {m.metric_name}: {m.metric_value}")
```

## API Key and Region

Every request requires an API key passed in the `x-api-key` header. The SDK handles this automatically — you just provide the key when creating a client.

To request an API key, contact [support@ledsreact.com](mailto:support@ledsreact.com).

Ledsreact operates in two regions:

| Region | Base URL | `Region` enum |
|--------|----------|---------------|
| Europe | `https://open-api.eu.ledsreact.com` | `Region.EU` |
| United States | `https://open-api.us.ledsreact.com` | `Region.US` |

Use the region that matches where your club's data is stored.

**Best practice** — store the key in an environment variable:

```bash
export LEDSREACT_API_KEY=your-api-key
```

```python
import os
from ledsreact import LedsreactClient, Region

client = LedsreactClient(api_key=os.environ["LEDSREACT_API_KEY"], region=Region.EU)
```

## Client Configuration

```python
client = LedsreactClient(
    api_key="your-api-key",   # Required — your Ledsreact API key
    region=Region.EU,          # Required — Region.EU or Region.US
    base_url=None,             # Optional — override the API base URL (e.g. for staging)
    timeout=30.0,              # Optional — request timeout in seconds (default: 30)
    max_retries=3,             # Optional — retries on 429/5xx/network errors (default: 3)
)
```

Use the client as a **context manager** (recommended) to automatically close the underlying connection pool:

```python
with LedsreactClient(api_key="...", region=Region.EU) as client:
    ...  # connections are cleaned up when the block exits
```

Or close manually:

```python
client = LedsreactClient(api_key="...", region=Region.EU)
# ... use client ...
client.close()
```

The SDK automatically retries on HTTP 429 (rate limit), 5xx (server error), and network/timeout errors using exponential backoff (1s, 2s, 4s, ..., up to 30s per wait). When a `Retry-After` header is present on a 429 response, the SDK respects it.

## Understanding the Data Model
+*-
```
Club
 +-- Teams
 |    +-- Players
 +-- Exercise Templates        (types of exercises, e.g. "Sprint")
 |    +-- Exercises            (specific configurations, e.g. "Sprint 30m")
 +-- Exercise Sessions         (a testing event on a given date)
      +-- Exercise Attempts    (one rep by one player in a session)
           +-- Metrics         (computed values: max_speed_ms, total_time_s, ...)
           +-- Timeseries      (raw datapoints every ~29ms: position, speed, accel)
```

- **Club** — your organization. Has a name and unit system (metric/imperial).
- **Teams** — groups of players (e.g. "U18 Boys", "First Team").
- **Players** — individual athletes. Belong to one or more teams.
- **Exercise Templates** — the type of drill (Sprint, COD, T-Test, etc.). Identified by a `uid` string.
- **Exercises** — a specific configuration of a template (e.g. Sprint 30m with 5m zones).
- **Exercise Sessions** — a testing event: one exercise performed by one or more players at a point in time.
- **Exercise Attempts** — a single rep by a single player within a session.
- **Metrics** — computed results for an attempt (speed, time, acceleration, FVP metrics, zone splits, etc.).
- **Timeseries** — the raw radar datapoints (~34 Hz) for an attempt, including position, speed, and acceleration at each sample.

**Typical workflow:** list attempts (filtered by date, player, team, or exercise) → fetch metrics for each attempt → analyze the results.

## Service Reference

All services are accessed as properties on the client instance. Methods that accept filtering or pagination parameters take a `dict` matching the corresponding `TypedDict`.

> **Types:** For complete definitions of all models, DTOs, entities, and enums used below, see [./types.md](./types.md).

### Health

Check API status and version.

```python
result = client.health.check()
print(result.status)  # "ok"

version = client.health.get_version()
print(version)  # e.g. "1.2.3"
```

| Method | Return type | Description |
|--------|-------------|-------------|
| `check()` | `HealthCheckResult` | API health status. Fields: `status`, `info`, `error`, `details`. |
| `get_version()` | `str` | API version string. |

### Club

Get information about your club and its devices.

```python
club = client.club.get()
print(club.name, club.unit_system)

devices = client.club.get_devices()
for d in devices:
    print(d.hardware_id)
```

| Method | Return type | Description |
|--------|-------------|-------------|
| `get()` | `ClubDto` | Club info. Fields: `id`, `name`, `unit_system` (`"metric"` or `"imperial"`). |
| `get_devices()` | `list[DeviceDto]` | Registered devices. Fields: `hardware_id`, `firmware_version_major`, `firmware_version_minor`, `firmware_version_revision`. |

### Players

List, search, and retrieve player profiles.

```python
# List all players (paginated)
result = client.players.list({"skip": 0, "take": 50})
print(f"{result.count} total players")
for p in result.data:
    print(f"  {p.id}: {p.firstname} {p.lastname}")

# Search by name
result = client.players.list({"firstname": "John", "exact": True})

# Get by internal ID
player = client.players.get_by_id(42)

# Get by external UID
player = client.players.get_by_uid("ext-12345")
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `list(params?)` | `FindPlayersParams` | `FindPlayersResponse` | Paginated player list. |
| `get_by_id(id)` | `int` | `PlayerEntity` | Single player by ID. |
| `get_by_uid(uid)` | `str` | `PlayerEntity` | Single player by external UID. |

**`FindPlayersParams`** keys:

| Key | Type | Description |
|-----|------|-------------|
| `firstname` | `str` | Filter by first name. |
| `lastname` | `str` | Filter by last name. |
| `exact` | `bool` | Exact name match (default: partial/fuzzy). |
| `skip` | `int` | Number of records to skip. |
| `take` | `int` | Number of records to return. |

**`PlayerEntity`** fields: `id`, `created_at`, `updated_at`, `archived_at`, `uid`, `firstname`, `lastname`, `displayname`, `birth_date`, `gender`, `number`, `height`, `weight`, `positions`, `color`.

### Teams

List teams, get team details, and list team members.

```python
# List all teams
result = client.teams.list({"skip": 0, "take": 20})
for t in result.data:
    print(f"  {t.id}: {t.name} (level: {t.level})")

# Get a specific team
team = client.teams.get_by_id(5)
print(team.name)

# Get players in a team
roster = client.teams.get_players(5)
for entry in roster:
    p = entry.player
    print(f"  {p.firstname} {p.lastname} (order: {entry.order})")
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `list(params?)` | `FindTeamsParams` | `FindTeamsResponse` | Paginated team list. |
| `get_by_id(id)` | `int` | `TeamEntity` | Single team by ID. |
| `get_players(id)` | `int` | `list[TeamPlayerResponseDto]` | Players in a team. |

**`FindTeamsParams`** keys: `skip` (`int`), `take` (`int`).

**`TeamEntity`** fields: `id`, `name`, `level`, `sport_deprecated`, `sport`, `weekly_training_hours`.

**`TeamPlayerResponseDto`** fields: `player` (`PlayerEntity`), `order` (`int | None`).

### Exercises

List exercise configurations.

```python
result = client.exercises.list({"page": 1, "limit": 20})
print(f"{result.total} exercises ({result.total_pages} pages)")
for ex in result.exercises:
    print(f"  {ex.id}: {ex.name}")
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `list(params?)` | `ListExercisesParams` | `ExerciseListResponseDto` | Paginated exercise list. |

**`ListExercisesParams`** keys:

| Key | Type | Description |
|-----|------|-------------|
| `customOnly` | `bool` | Only return custom exercises. |
| `withVariables` | `bool` | Include exercise configuration variables. |
| `page` | `int` | Page number (1-based). |
| `limit` | `int` | Items per page. |

**`ExerciseListResponseDto`** fields: `exercises` (`list[ExerciseDto]`), `total`, `page`, `limit`, `total_pages`.

**`ExerciseDto`** fields: `id`, `name`, `public`, `created_at`, `updated_at`, `reps`, `delay`, `s`, `x`, `y`, `r`, `r0`, `r1`, `w`, `a`, `b`, `rep_check_amount`, `unit_system`, `is_main_template`, `use_raw_variables_for_exercise_instead_of_template_variables`, `raw_variables`.

### Exercise Templates

List exercise template types and their exercise configurations.

An **exercise template** represents a type of drill (e.g. "Sprint", "COD", "T-Test"). Each template can have many **exercises** — specific configurations of that template (e.g. "Sprint 30m", "Sprint 40m").

**Supported template UIDs:**

| UID | Description |
|-----|-------------|
| `Sprint` | Linear sprint measuring acceleration and maximum speed |
| `COD` | Change of Direction — sprint with 180° turnaround |
| `TTest` | T-Test — multi-directional agility in a T-shaped pattern |
| `FiveTenFive` | 5-10-5 — lateral shuttle drill |
| `AgilityBox` | Agility Box — reactive agility within a square box |
| `MasterCheckpointLong` | Custom checkpoint-based reactive agility (e.g. Y-Drill, Front and Back) (known as "Custom Test" in the app) |
| `Basic` | Center-in/center-out drill (training only, no data capture) |
| `BasicRepeat` | Signal-only directional exercise (training only, no data capture) |

These UIDs are used when filtering attempts or metrics by template — e.g., `"exerciseTemplateUids": "Sprint"` or `"exerciseTemplateUids": "Sprint,COD"`.

```python
# List all templates
templates = client.exercise_templates.list({"withVariables": True})
for t in templates.templates:
    print(f"  {t.id}: {t.uid} ({t.type})")

# Get exercises for a template
exercises = client.exercise_templates.get_exercises(1, {"page": 1, "limit": 10})
for ex in exercises.exercises:
    print(f"  {ex.id}: {ex.name}")
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `list(params?)` | `ListExerciseTemplatesParams` | `ExerciseTemplateListResponseDto` | All templates. |
| `get_exercises(id, params?)` | `int`, `ListTemplateExercisesParams` | `ExerciseListResponseDto` | Exercises for a template. |

**`ListExerciseTemplatesParams`** keys: `withVariables` (`bool`), `withDrills` (`bool`).

**`ListTemplateExercisesParams`** keys: `page` (`int`), `limit` (`int`), `withVariables` (`bool`).

**`ExerciseTemplateResponseDto`** fields: `id`, `uid`, `type`, `variables`, `drill_id`.

### Exercise Sessions

List testing sessions and get session details.

A **session** represents a testing event — one exercise performed by one or more players.

```python
# List recent sessions
result = client.exercise_sessions.list({"skip": 0, "take": 10})
for s in result.data:
    print(f"  {s.uuid}: {s.exercise.name} ({s.created_at})")
    for p in s.players:
        print(f"    - {p.firstname} {p.lastname}")

# Get full session details
session = client.exercise_sessions.get_by_uuid("abc-123-def")
print(f"Session {session.uuid}, {len(session.attempts or [])} attempts")
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `list(params?)` | `FindSessionsParams` | `FindSessionsResponseDto` | Paginated session list. |
| `get_by_uuid(uuid, params?)` | `str`, `GetSessionParams` | `GetSessionResponseDto` | Full session details. |

**`FindSessionsParams`** keys: `skip` (`int`), `take` (`int`).

**`GetSessionParams`** keys: `withCharts` (`bool`) — include chart data in each attempt.

> **Warning:** The `charts` field on attempts is very large. Keep `withCharts` set to `False` (the default) unless you specifically need chart data for a single session. Never use `withCharts=True` for bulk fetching. For performance data, use the [Metrics](#metrics) endpoints instead.

**`SessionListItemDto`** fields: `id`, `uuid`, `created_at`, `remark`, `exercise` (`SessionExerciseDto`), `players` (`list[SessionPlayerDto]`).

**`GetSessionResponseDto`** fields: `id`, `uuid`, `created_at`, `remark`, `exercise`, `players`, `attempts` (`list[GetSessionAttemptResponseDto] | None`).

### Exercise Attempts

List and retrieve individual test attempts. This is the most commonly used service — it's the primary way to find results filtered by date, player, team, exercise, or session.

```python
# List sprint attempts for a player in January 2025
attempts = client.exercise_attempts.list({
    "exerciseTemplateUids": "Sprint",
    "playerIds": "42",
    "dateStart": "2025-01-01",
    "dateEnd": "2025-01-31",
    "page": 1,
    "limit": 50,
})
print(f"{attempts.total} total attempts ({attempts.total_pages} pages)")
for a in attempts.data:
    print(f"  Attempt {a.id}: {a.player_name} - {a.exercise_name} ({a.created_at})")

# Filter by team
team_attempts = client.exercise_attempts.list({
    "teamIds": "5,8",
    "dateStart": "2025-01-01",
    "dateEnd": "2025-01-31",
    "page": 1,
    "limit": 50,
})

# Get a single attempt
attempt = client.exercise_attempts.get_by_id(12345)
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `list(params?)` | `ListAttemptsParams` | `PaginatedAttemptsResponseDto` | Paginated attempt list. |
| `get_by_id(attempt_id, params?)` | `int`, `GetAttemptParams` | `AttemptResponseDto` | Single attempt. |

**`ListAttemptsParams`** keys:

| Key | Type | Description |
|-----|------|-------------|
| `page` | `int` | Page number (1-based). |
| `limit` | `int` | Items per page. |
| `dateStart` | `str` | Start date filter (`YYYY-MM-DD`). |
| `dateEnd` | `str` | End date filter (`YYYY-MM-DD`). |
| `playerIds` | `str` | Comma-separated player IDs (e.g. `"42,43"`). |
| `teamIds` | `str` | Comma-separated team IDs. |
| `exerciseIds` | `str` | Comma-separated exercise IDs. |
| `exerciseTemplateUids` | `str` | Comma-separated template UIDs (e.g. `"Sprint,COD"`). |
| `sessionIds` | `str` | Comma-separated session IDs. |

**`GetAttemptParams`** keys: `withCharts` (`bool`).

> **Warning:** The `charts` field is very large. Keep `withCharts` set to `False` (the default) unless you specifically need chart data for a single attempt. Never use `withCharts=True` when listing or iterating over attempts. For performance data, use the [Metrics](#metrics) endpoints instead.

**`PaginatedAttemptsResponseDto`** fields: `data` (`list[AttemptResponseDto]`), `total`, `page`, `limit`, `total_pages`.

**`AttemptResponseDto`** fields: `id`, `session_id`, `session_uuid`, `attempt_id`, `player_index`, `remark`, `duration`, `timestamp_ms`, `player_id`, `player_name`, `exercise_name`, `exercise_id`, `exercise_template_uid`, `charts`, `live_results`, `failed_processing_reason`, `warning`, `processing_flags`, `created_at`, `updated_at`.

### Metrics

Retrieve computed performance metrics. Three methods cover different use cases:

- **`get_analysis()`** — aggregated metrics across players and exercises (trends, best/current/previous values). The primary endpoint for dashboards and reports.
- **`get_by_attempt_id()`** — flat list of metric name/value pairs for a single attempt.
- **`get_by_session_id()`** — metrics for all attempts in a session.

```python
# Aggregated analysis for a player's sprint results
analysis = client.metrics.get_analysis({
    "exerciseTemplateUids": "Sprint",
    "playerIds": "42",
    "dateStart": "2025-01-01",
    "dateEnd": "2025-06-30",
    "metricNames": "max_speed_ms,total_time_s",
    "details": True,
})
for result in analysis.results:
    for player in result.player_results:
        print(f"{player.name}:")
        for m in player.metrics:
            print(f"  {m.metric_name}: best={m.best_value}, current={m.current_value}, trend={m.trend}")

# Metrics for a single attempt
attempt_metrics = client.metrics.get_by_attempt_id(12345)
print(f"Attempt {attempt_metrics.attempt_id}:")
for m in attempt_metrics.metrics:
    print(f"  {m.metric_name}: {m.metric_value}")

# Filter for specific metrics
attempt_metrics = client.metrics.get_by_attempt_id(12345, {"metricNames": "max_speed_ms,total_time_s"})

# All metrics for a session
session_metrics = client.metrics.get_by_session_id(100)
for attempt in session_metrics.attempts:
    print(f"  Attempt {attempt.attempt_id}: {len(attempt.metrics)} metrics")
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `get_analysis(params?)` | `MetricsAnalysisParams` | `MetricsResponseDto` | Aggregated analysis. |
| `get_by_attempt_id(attempt_id, params?)` | `int`, `MetricsByIdParams` | `AttemptMetricsResponseDto` | Metrics for one attempt. |
| `get_by_session_id(session_id, params?)` | `int`, `MetricsByIdParams` | `SessionMetricsResponseDto` | Metrics for all attempts in a session. |

**`MetricsAnalysisParams`** keys:

| Key | Type | Description |
|-----|------|-------------|
| `playerIds` | `str` | Comma-separated player IDs. |
| `teamIds` | `str` | Comma-separated team IDs. |
| `exerciseIds` | `str` | Comma-separated exercise IDs. |
| `exerciseTemplateUids` | `str` | Comma-separated template UIDs. |
| `metricNames` | `str` | Comma-separated metric keys to return. |
| `dateStart` | `str` | Start date (`YYYY-MM-DD`). |
| `dateEnd` | `str` | End date (`YYYY-MM-DD`). |
| `details` | `bool` | Include per-attempt details in group results. |
| `hideFalseStarts` | `bool` | Exclude false-start attempts. |

**`MetricsByIdParams`** keys: `metricNames` (`str`) — comma-separated metric keys to return (omit for all).

**`MetricsResponseDto`** structure:

```
MetricsResponseDto
  results: list[MetricsResultDto]
    exercise_id: str
    exercise_template_uid: str
    last_test_date: str
    player_results: list[MetricsPlayerResultDto]
      id, name, firstname, lastname, age, teams, positions
      is_selected, last_test_date, player_id, color
      metrics: list[MetricsGroupResultDto]
        metric_name, unit, best_value, current_value, previous_value
        trend ("up"/"down"/"stable"), percentage_change, total_attempts
        average_values: dict, ts, attempts: list[MetricsAttemptDto] | None
    group_results: list[MetricsGroupResultDto]
      (same structure — aggregated across all players)
```

**`AttemptMetricsResponseDto`** fields: `attempt_id` (`int`), `metrics` (`list[AttemptMetricDto]`).

**`AttemptMetricDto`** fields: `id`, `attempt_id`, `metric_name`, `metric_value`, `timestamp`.

**`SessionMetricsResponseDto`** fields: `session_id` (`int`), `attempts` (`list[AttemptMetricsResponseDto]`).

### Timeseries

Fetch raw radar datapoints for an attempt. Each datapoint is sampled at ~34 Hz (~29ms intervals) and contains position, speed, acceleration, and zone information.

```python
ts = client.timeseries.get_by_attempt_id(12345)
print(f"Attempt {ts.attempt_id}: {len(ts.datapoints.series)} datapoints")

if ts.datapoints.reaction_time_ms is not None:
    print(f"Reaction time: {ts.datapoints.reaction_time_ms} ms")

for dp in ts.datapoints.series[:5]:
    print(f"  t={dp.t:.3f}s  d={dp.d}m  speed={dp.s_s} m/s  accel={dp.a} m/s2")
```

| Method | Parameters | Return type | Description |
|--------|-----------|-------------|-------------|
| `get_by_attempt_id(attempt_id)` | `int` | `TimeseriesResponseDto` | Raw datapoints for an attempt. |

**`TimeseriesResponseDto`** fields: `attempt_id`, `name`, `processing_version`, `datapoints` (`TimeseriesDataDto`), `zones` (`ZoneDataDto | None`), `events` (`EventDataDto | None`), `exercise_config`, `data_quality_metrics`, `interval_metrics`, `description`.

**`TimeseriesDataDto`** fields: `series` (`list[TimeseriesDatapointDto]`), `reaction_time_ms` (`float | None`).

> **Rate limit warning:** Timeseries requests are limited to **10 requests per minute** (vs 100/min for other endpoints). Batch your requests or add delays when fetching many attempts.

## Pagination

The SDK uses two pagination styles depending on the endpoint:

### Skip/Take pagination

Used by: `players.list()`, `teams.list()`, `exercise_sessions.list()`.

```python
all_players = []
skip = 0
take = 100

while True:
    result = client.players.list({"skip": skip, "take": take})
    all_players.extend(result.data)
    if len(all_players) >= result.count:
        break
    skip += take

print(f"Fetched {len(all_players)} players")
```

Response fields: `data` (list of items), `count` (total number of items).

### Page/Limit pagination

Used by: `exercises.list()`, `exercise_templates.get_exercises()`, `exercise_attempts.list()`.

```python
all_attempts = []
page = 1
limit = 100

while True:
    result = client.exercise_attempts.list({
        "exerciseTemplateUids": "Sprint",
        "page": page,
        "limit": limit,
    })
    all_attempts.extend(result.data)
    if page >= result.total_pages:
        break
    page += 1

print(f"Fetched {len(all_attempts)} attempts")
```

Response fields: `data` (list of items), `total`, `page`, `limit`, `total_pages`.

## Error Handling

The SDK raises typed exceptions for API errors. All exceptions inherit from `LedsreactError`.

```python
from ledsreact import (
    LedsreactClient, Region,
    AuthenticationError, NotFoundError, RateLimitError, LedsreactError,
)

try:
    with LedsreactClient(api_key="bad-key", region=Region.EU) as client:
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

| Exception | HTTP Status | When |
|-----------|-------------|------|
| `ValidationError` | 400 | Invalid request parameters. |
| `AuthenticationError` | 401 | Missing or invalid API key. |
| `ForbiddenError` | 403 | Valid key but insufficient permissions. |
| `NotFoundError` | 404 | Resource does not exist. |
| `RateLimitError` | 429 | Too many requests. Has `retry_after` attribute (`float | None`). |
| `ServerError` | 5xx | Server-side error. |
| `NetworkError` | — | Connection failures or timeouts. |

The SDK automatically retries on `RateLimitError`, `ServerError`, and `NetworkError` up to `max_retries` times (default: 3) before raising. You typically only need to handle errors that persist after retries.

## Metric Keys Primer

Metrics use a structured naming convention. Understanding the pattern lets you request exactly the data you need.

### Naming convention

| Type | Pattern | Example |
|------|---------|---------|
| Whole-exercise metric | `{key}_{unit}` | `max_speed_ms` |
| Zone/split metric | `zone_{name}_{key}_{unit}` | `zone_0-5_duration_s` |
| FVP metric | plain key | `f0`, `p_max`, `v0_ms` |
| Player detail | plain key | `player_weight`, `player_height` |

### Unit suffixes

| Suffix | Meaning | Example |
|--------|---------|---------|
| `_s` | seconds | `total_time_s` |
| `_ms` | m/s (speed) | `max_speed_ms` |
| `_kmh` | km/h | `max_speed_kmh` |
| `_ms2` | m/s² (acceleration) | `max_acceleration_ms2` |
| `_m` | meters | `zone_0-5_distance_m` |
| `_fts` | ft/s (imperial) | `max_speed_fts` |
| `_mph` | mph (imperial) | `max_speed_mph` |
| `_fts2` | ft/s² (imperial) | `max_acceleration_fts2` |
| `_ft` | feet (imperial) | `zone_0-5_distance_ft` |

### Most common metrics — quick reference

| Metric key | Description |
|-----------|-------------|
| `total_time_s` | Total exercise duration |
| `totaltimereactiontime_s` | Total time minus reaction time |
| `reactiontime_s` | Reaction time |
| `max_speed_ms` | Maximum speed (m/s) |
| `avg_speed_ms` | Average speed (m/s) |
| `max_acceleration_ms2` | Maximum acceleration (m/s²) |
| `max_deceleration_ms2` | Maximum deceleration (m/s²) |
| `zone_0-5_duration_s` | Time in the 0–5m zone |
| `zone_0-5_maxspeed_ms` | Max speed in the 0–5m zone |
| `f0` | FVP: theoretical max force (N/kg) |
| `v0_ms` | FVP: theoretical max velocity (m/s) |
| `p_max` | FVP: max power output (W/kg) |
| `fv_slope` | FVP: force-velocity slope |
| `drf` | FVP: decrease in ratio of forces |

FVP metrics are only available for sprints of 20m/20yd or longer.

For the full metric key reference, see the [Metric Keys documentation](../../docs/ledsreact-metric-keys.md).

## Timeseries Field Reference

Each `TimeseriesDatapointDto` has abbreviated field names. Here is what they mean:

| Field | Description | Unit |
|-------|-------------|------|
| `t` | Time since start | seconds |
| `d` | Distance from device | meters |
| `di` | Interpolated distance | meters |
| `s_s` | Speed (m/s) | m/s |
| `s_h` | Speed (km/h) | km/h |
| `s_si` | Interpolated speed (m/s) | m/s |
| `s_hi` | Interpolated speed (km/h) | km/h |
| `a` | Acceleration | m/s² |
| `ai` | Interpolated acceleration | m/s² |
| `sa` | Smoothed acceleration | m/s² |
| `sai` | Smoothed interpolated acceleration | m/s² |
| `x` | X position | meters |
| `y` | Y position | meters |
| `xyd` | XY distance | meters |
| `yyd` | YY distance | meters |
| `m` | Moving flag | boolean |
| `p` | Phase | string |
| `z` | Zone | string |

Not all fields are present on every datapoint — it depends on the exercise type and processing version.

> **Rate limit:** Timeseries requests are limited to **10 requests per minute**. Add delays between calls when fetching many attempts.

## Recipes

### Recipe 1: Get all sprint results for a player this month

```python
import os
from ledsreact import LedsreactClient, Region

with LedsreactClient(api_key=os.environ["LEDSREACT_API_KEY"], region=Region.EU) as client:
    # Fetch sprint attempts for player 42 in February 2025
    attempts = client.exercise_attempts.list({
        "exerciseTemplateUids": "Sprint",
        "playerIds": "42",
        "dateStart": "2025-02-01",
        "dateEnd": "2025-02-28",
        "page": 1,
        "limit": 100,
    })

    for attempt in attempts.data:
        metrics = client.metrics.get_by_attempt_id(
            attempt.id,
            {"metricNames": "max_speed_ms,total_time_s"},
        )

        # Build a dict for easy lookup
        values = {m.metric_name: m.metric_value for m in metrics.metrics}
        max_speed = values.get("max_speed_ms")
        total_time = values.get("total_time_s")

        print(f"{attempt.created_at}  {attempt.exercise_name}")
        print(f"  Max speed: {max_speed} m/s  |  Total time: {total_time} s")
```

### Recipe 2: Export metrics to CSV with pandas

```python
import os
import pandas as pd
from ledsreact import LedsreactClient, Region

with LedsreactClient(api_key=os.environ["LEDSREACT_API_KEY"], region=Region.EU) as client:
    attempts = client.exercise_attempts.list({
        "exerciseTemplateUids": "Sprint",
        "dateStart": "2025-01-01",
        "dateEnd": "2025-01-31",
        "page": 1,
        "limit": 100,
    })

    rows = []
    for attempt in attempts.data:
        metrics = client.metrics.get_by_attempt_id(attempt.id)
        values = {m.metric_name: m.metric_value for m in metrics.metrics}
        rows.append({
            "attempt_id": attempt.id,
            "player_name": attempt.player_name,
            "exercise": attempt.exercise_name,
            "date": attempt.created_at,
            **values,
        })

    df = pd.DataFrame(rows)
    df.to_csv("sprint_results.csv", index=False)
    print(f"Exported {len(df)} attempts to sprint_results.csv")
```

### Recipe 3: Compare team sprint performance

```python
import os
from ledsreact import LedsreactClient, Region

with LedsreactClient(api_key=os.environ["LEDSREACT_API_KEY"], region=Region.EU) as client:
    # Get all players in a team
    roster = client.teams.get_players(5)
    player_ids = ",".join(str(entry.player.id) for entry in roster)

    # Get aggregated analysis
    analysis = client.metrics.get_analysis({
        "exerciseTemplateUids": "Sprint",
        "playerIds": player_ids,
        "metricNames": "max_speed_ms,total_time_s",
        "dateStart": "2025-01-01",
        "dateEnd": "2025-06-30",
    })

    for result in analysis.results:
        print(f"Exercise: {result.exercise_template_uid}")
        for player in result.player_results:
            for m in player.metrics:
                if m.metric_name == "max_speed_ms":
                    print(f"  {player.name}: best={m.best_value} m/s, "
                          f"current={m.current_value} m/s, trend={m.trend}")
```

### Recipe 4: Track max speed over time

```python
import os
from ledsreact import LedsreactClient, Region

with LedsreactClient(api_key=os.environ["LEDSREACT_API_KEY"], region=Region.EU) as client:
    analysis = client.metrics.get_analysis({
        "exerciseTemplateUids": "Sprint",
        "playerIds": "42",
        "metricNames": "max_speed_ms",
        "dateStart": "2025-01-01",
        "dateEnd": "2025-12-31",
        "details": True,
    })

    for result in analysis.results:
        for player in result.player_results:
            for m in player.metrics:
                if m.metric_name == "max_speed_ms" and m.attempts:
                    print(f"{player.name} — max speed over time:")
                    for a in m.attempts:
                        print(f"  {a.ts}: {a.value} m/s")
                    print(f"  Best: {m.best_value} m/s | "
                          f"Current: {m.current_value} m/s | "
                          f"Trend: {m.trend} ({m.percentage_change:+.1f}%)")
```

### Recipe 5: Fetch timeseries and inspect speed data

```python
import os
from ledsreact import LedsreactClient, Region

with LedsreactClient(api_key=os.environ["LEDSREACT_API_KEY"], region=Region.EU) as client:
    ts = client.timeseries.get_by_attempt_id(12345)

    print(f"Attempt {ts.attempt_id}: {len(ts.datapoints.series)} datapoints")
    if ts.datapoints.reaction_time_ms is not None:
        print(f"Reaction time: {ts.datapoints.reaction_time_ms:.0f} ms")

    # Find peak speed
    peak = max(
        (dp for dp in ts.datapoints.series if dp.s_s is not None),
        key=lambda dp: dp.s_s,
    )
    print(f"Peak speed: {peak.s_s:.2f} m/s at t={peak.t:.3f}s, d={peak.d:.2f}m")

    # Print first 10 datapoints
    print("\nt(s)      d(m)     speed(m/s)  accel(m/s2)")
    for dp in ts.datapoints.series[:10]:
        print(f"{dp.t:8.3f}  {dp.d or 0:7.2f}  {dp.s_s or 0:10.2f}  {dp.a or 0:10.2f}")
```

## Using These Docs with an LLM

This README is designed to be self-contained. Paste it into your LLM prompt for full SDK context.

**Example prompt:**

```
<attached: README.md from ledsreact-sdk>

Using the Ledsreact Python SDK, write a script that fetches all sprint
attempts for player ID 42 in the last 30 days, gets the max_speed_ms
metric for each, and prints a summary table sorted by date.

My API key is in the LEDSREACT_API_KEY env var. I'm in the EU region.
```

**Tips for better results:**

- Be specific about which metrics you need (use the metric key names from the reference above).
- Mention the region and how you store your API key.

## Rate Limits

| Endpoint type | Limit |
|---------------|-------|
| General API requests | 100 requests/minute |
| Timeseries / datapoint exports | 10 requests/minute |

The API returns HTTP 429 when limits are exceeded. The SDK handles this automatically with retries and exponential backoff. If you still hit limits after retries, a `RateLimitError` is raised.

## Requirements

- Python >= 3.10
- [httpx](https://www.python-httpx.org/) >= 0.27
- [pydantic](https://docs.pydantic.dev/) >= 2.0

## Support

Read the developer docs first at [developer.ledsreact.com](https://developer.ledsreact.com).

If you need further help, reach out to us via [ledsreact.com/en/support](https://www.ledsreact.com/en/support).
