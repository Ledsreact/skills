# @ledsreact/sdk

TypeScript SDK for the [Ledsreact Open API](https://developer.ledsreact.com). Ledsreact is a sports performance measurement platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables. This SDK provides typed access to all Open API endpoints for managing players, exercises, sessions, metrics, and timeseries data.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Available Services](#available-services)
- [Services Reference](#services-reference)
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
- [Practical Examples](#practical-examples)
- [Requirements](#requirements)
- [Support](#support)

## Installation

```bash
# npm
npm install @ledsreact/sdk

# pnpm
pnpm install @ledsreact/sdk

# yarn
yarn add @ledsreact/sdk
```

The package ships ESM + CommonJS + TypeScript declarations. Zero runtime dependencies.

## Quick Start

```ts
import { LedsreactClient, Region } from "@ledsreact/sdk";

const client = new LedsreactClient({
  apiKey: process.env.LEDSREACT_API_KEY!,
  region: Region.EU,
});

// Get club info
const club = await client.club.get();
console.log(club.name, club.unitSystem);

// List first 10 players
const players = await client.players.list({ take: 10 });
for (const player of players.data) {
  console.log(`${player.firstname} ${player.lastname}`);
}
```

## Configuration

```ts
import { LedsreactClient, Region } from "@ledsreact/sdk";

const client = new LedsreactClient({
  apiKey: "your-api-key",   // Required — your Ledsreact Open API key
  region: Region.EU,        // Required — Region.EU or Region.US
  baseUrl: undefined,       // Optional — override the API base URL
  timeout: 30_000,          // Optional — request timeout in ms (default: 30000)
  maxRetries: 3,            // Optional — retries on 429/5xx/network errors (default: 3)
});
```

### Region Base URLs

| Region | Base URL |
|--------|----------|
| `Region.EU` | `https://open-api.eu.ledsreact.com` |
| `Region.US` | `https://open-api.us.ledsreact.com` |

Store your API key in an environment variable rather than hardcoding it:

```bash
export LEDSREACT_API_KEY=your-api-key
```

## Available Services

| Service | Methods |
|---------|---------|
| `client.health` | `check()`, `getVersion()` |
| `client.club` | `get()`, `getDevices()` |
| `client.players` | `list(params?)`, `getById(id)`, `getByUid(uid)` |
| `client.teams` | `list(params?)`, `getById(id)`, `getPlayers(id)` |
| `client.exercises` | `list(params?)` |
| `client.exerciseTemplates` | `list(params?)`, `getExercises(id, params?)` |
| `client.exerciseSessions` | `list(params?)`, `getByUuid(uuid, params?)` |
| `client.exerciseAttempts` | `list(params?)`, `getById(attemptId, params?)` |
| `client.metrics` | `getAnalysis(params?)`, `getByAttemptId(attemptId, params?)`, `getBySessionId(sessionId, params?)` |
| `client.timeseries` | `getByAttemptId(attemptId)` |

## Services Reference

> **Types:** For complete definitions of all models, DTOs, entities, and enums used below, see [./types.md](./types.md).

### Health

Check API connectivity and version.

```ts
const health = await client.health.check();
// { status: "ok", info: { ... }, error: { ... }, details: { ... } }

const version = await client.health.getVersion();
// "0.1.0"
```

| Method | Return Type |
|--------|-------------|
| `check()` | `Promise<HealthCheckResult>` |
| `getVersion()` | `Promise<string>` |

### Club

Retrieve your club profile and registered devices.

```ts
const club = await client.club.get();
console.log(club.name, club.unitSystem); // "My Club" "metric"

const devices = await client.club.getDevices();
for (const device of devices) {
  console.log(device.hardwareId);
}
```

| Method | Return Type |
|--------|-------------|
| `get()` | `Promise<ClubDto>` |
| `getDevices()` | `Promise<DeviceDto[]>` |

**`ClubDto`** fields: `id`, `name`, `unitSystem` (`"metric"` or `"imperial"`)

**`DeviceDto`** fields: `hardwareId`, `firmwareVersionMajor?`, `firmwareVersionMinor?`, `firmwareVersionRevision?`

### Players

Players represent athletes registered in your club.

```ts
// List with search
const result = await client.players.list({
  firstname: "John",
  take: 20,
});
console.log(`Found ${result.count} players`);

// Get by database ID
const player = await client.players.getById(42);

// Get by external UID
const player = await client.players.getByUid("ext-abc-123");
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `list(params?)` | `FindPlayersParams` | `Promise<FindPlayersResponse>` |
| `getById(id)` | `id: number` | `Promise<PlayerEntity>` |
| `getByUid(uid)` | `uid: string` | `Promise<PlayerEntity>` |

**`FindPlayersParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `firstname` | `string` | Filter by first name |
| `lastname` | `string` | Filter by last name |
| `exact` | `boolean` | Exact name match (default: partial) |
| `skip` | `number` | Number of records to skip |
| `take` | `number` | Number of records to return |

**`FindPlayersResponse`**: `{ data: PlayerEntity[], count: number }`

### Teams

Teams are groups of players. A player can belong to multiple teams.

```ts
const teams = await client.teams.list({ take: 10 });
for (const team of teams.data) {
  console.log(team.name);
}

// Get players in a team
const teamPlayers = await client.teams.getPlayers(5);
for (const { player, order } of teamPlayers) {
  console.log(`${player.firstname} ${player.lastname} (#${order})`);
}
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `list(params?)` | `FindTeamsParams` | `Promise<FindTeamsResponse>` |
| `getById(id)` | `id: number` | `Promise<TeamEntity>` |
| `getPlayers(id)` | `id: number` | `Promise<TeamPlayerResponseDto[]>` |

**`FindTeamsParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | `number` | Number of records to skip |
| `take` | `number` | Number of records to return |

### Exercises

Exercises are measurement activities (sprint, COD, T-test, etc.). Each exercise is a specific instance of an exercise template with configured parameters.

```ts
const result = await client.exercises.list({
  customOnly: true,
  withVariables: true,
  page: 1,
  limit: 25,
});

console.log(`${result.total} exercises (page ${result.page}/${result.totalPages})`);
for (const exercise of result.exercises) {
  console.log(exercise.name);
}
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `list(params?)` | `ListExercisesParams` | `Promise<ExerciseListResponseDto>` |

**`ListExercisesParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `customOnly` | `boolean` | Only return custom (non-default) exercises |
| `withVariables` | `boolean` | Include exercise configuration variables |
| `page` | `number` | Page number (1-based) |
| `limit` | `number` | Items per page |

**`ExerciseListResponseDto`**: `{ exercises, total, page, limit, totalPages }`

### Exercise Templates

Templates define exercise types (e.g., "Sprint", "5-10-5"). Each template can have many exercises with different configurations.

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

These UIDs are used when filtering attempts or metrics by template — e.g., `exerciseTemplateUids: "Sprint"` or `exerciseTemplateUids: "Sprint,COD"`.

```ts
// List all templates
const result = await client.exerciseTemplates.list({
  withVariables: true,
  withDrills: true,
});
for (const template of result.templates) {
  console.log(`${template.type} (${template.uid})`);
}

// Get exercises for a specific template
const exercises = await client.exerciseTemplates.getExercises(1, {
  page: 1,
  limit: 10,
  withVariables: true,
});
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `list(params?)` | `ListExerciseTemplatesParams` | `Promise<ExerciseTemplateListResponseDto>` |
| `getExercises(id, params?)` | `id: number`, `ListTemplateExercisesParams` | `Promise<ExerciseListResponseDto>` |

**`ListExerciseTemplatesParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `withVariables` | `boolean` | Include template variables |
| `withDrills` | `boolean` | Include drill information |

**`ListTemplateExercisesParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number (1-based) |
| `limit` | `number` | Items per page |
| `withVariables` | `boolean` | Include exercise configuration variables |

### Exercise Sessions

A session is a single measurement event — one exercise performed by one or more players at a specific time.

```ts
// List recent sessions
const sessions = await client.exerciseSessions.list({ take: 5 });
for (const session of sessions.data) {
  console.log(`${session.exercise.name} — ${session.createdAt}`);
  console.log(`  Players: ${session.players.map(p => p.lastname).join(", ")}`);
}

// Get full session details by UUID
const session = await client.exerciseSessions.getByUuid("abc-def-123");
console.log(`${session.attempts?.length ?? 0} attempts`);
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `list(params?)` | `FindSessionsParams` | `Promise<FindSessionsResponseDto>` |
| `getByUuid(uuid, params?)` | `uuid: string`, `GetSessionParams` | `Promise<GetSessionResponseDto>` |

**`FindSessionsParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | `number` | Number of records to skip |
| `take` | `number` | Number of records to return |

**`GetSessionParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `withCharts` | `boolean` | Include chart data in attempt responses |

> **Warning:** The `charts` field on attempts is very large. Keep `withCharts` set to `false` (the default) unless you specifically need chart data for a single session. Never use `withCharts: true` for bulk fetching. For performance data, use the [Metrics](#metrics) endpoints instead.

### Exercise Attempts

An attempt is a single repetition by a single player within a session. For example, if 3 players each do 2 sprint reps, the session contains 6 attempts.

```ts
// List attempts with filters
const attempts = await client.exerciseAttempts.list({
  page: 1,
  limit: 50,
  dateStart: "2025-01-01",
  dateEnd: "2025-06-30",
  exerciseIds: "10,11,12",
});

console.log(`${attempts.total} attempts (page ${attempts.page}/${attempts.totalPages})`);

// Get a specific attempt
const attempt = await client.exerciseAttempts.getById(999);
console.log(`${attempt.playerName} — ${attempt.exerciseName}`);
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `list(params?)` | `ListAttemptsParams` | `Promise<PaginatedAttemptsResponseDto>` |
| `getById(attemptId, params?)` | `attemptId: number`, `GetAttemptParams` | `Promise<AttemptResponseDto>` |

**`ListAttemptsParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number (1-based) |
| `limit` | `number` | Items per page |
| `dateStart` | `string` | Filter from date (ISO format, e.g. `"2025-01-01"`) |
| `dateEnd` | `string` | Filter to date (ISO format) |
| `playerIds` | `string` | Comma-separated player IDs |
| `teamIds` | `string` | Comma-separated team IDs |
| `exerciseIds` | `string` | Comma-separated exercise IDs |
| `exerciseTemplateUids` | `string` | Comma-separated template UIDs |
| `sessionIds` | `string` | Comma-separated session IDs |

**`GetAttemptParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `withCharts` | `boolean` | Include chart data |

> **Warning:** The `charts` field is very large. Keep `withCharts` set to `false` (the default) unless you specifically need chart data for a single attempt. Never use `withCharts: true` when listing or iterating over attempts. For performance data, use the [Metrics](#metrics) endpoints instead.

**`PaginatedAttemptsResponseDto`**: `{ data, total, page, limit, totalPages }`

### Metrics

Metrics provide computed performance values for attempts and sessions. Metric keys follow a structured naming convention — see the [metric key documentation](../../docs/ledsreact-metric-keys.md) for the full list.

Common metric key examples: `max_speed_ms`, `total_time_s`, `zone_1_time_s`, `f0`, `v0_ms`.

```ts
// Analyze metrics across players, exercises, and dates
const analysis = await client.metrics.getAnalysis({
  playerIds: "1,2,3",
  exerciseTemplateUids: "sprint",
  metricNames: "max_speed_ms,total_time_s",
  dateStart: "2025-01-01",
  details: true,
});

for (const result of analysis.results) {
  for (const player of result.playerResults) {
    console.log(`${player.name}:`);
    for (const metric of player.metrics) {
      console.log(`  ${metric.metricName}: ${metric.currentValue} ${metric.unit} (${metric.trend})`);
    }
  }
}

// Get metrics for a specific attempt
const attemptMetrics = await client.metrics.getByAttemptId(999, {
  metricNames: "max_speed_ms,total_time_s",
});

// Get metrics for all attempts in a session
const sessionMetrics = await client.metrics.getBySessionId(100);
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `getAnalysis(params?)` | `MetricsAnalysisParams` | `Promise<MetricsResponseDto>` |
| `getByAttemptId(attemptId, params?)` | `attemptId: number`, `MetricsByIdParams` | `Promise<AttemptMetricsResponseDto>` |
| `getBySessionId(sessionId, params?)` | `sessionId: number`, `MetricsByIdParams` | `Promise<SessionMetricsResponseDto>` |

**`MetricsAnalysisParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `playerIds` | `string` | Comma-separated player IDs |
| `teamIds` | `string` | Comma-separated team IDs |
| `exerciseIds` | `string` | Comma-separated exercise IDs |
| `exerciseTemplateUids` | `string` | Comma-separated template UIDs |
| `metricNames` | `string` | Comma-separated metric keys |
| `dateStart` | `string` | Filter from date (ISO format) |
| `dateEnd` | `string` | Filter to date (ISO format) |
| `details` | `boolean` | Include per-attempt detail data |
| `hideFalseStarts` | `boolean` | Exclude false-start attempts |

**`MetricsByIdParams`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `metricNames` | `string` | Comma-separated metric keys to return |

### Timeseries

Timeseries data contains raw datapoints recorded during an attempt — position, speed, acceleration sampled at high frequency. This is the most granular data available.

Key datapoint fields: `t` (time ms), `d` (distance m), `sS` (speed m/s), `sH` (speed km/h), `a` (acceleration m/s²), `x`/`y` (position).

```ts
const timeseries = await client.timeseries.getByAttemptId(999);

console.log(`${timeseries.datapoints.series.length} datapoints`);
if (timeseries.datapoints.reactionTimeMs) {
  console.log(`Reaction time: ${timeseries.datapoints.reactionTimeMs}ms`);
}

// Find peak speed
const peakSpeed = Math.max(
  ...timeseries.datapoints.series
    .map(dp => dp.sS ?? 0)
);
console.log(`Peak speed: ${peakSpeed.toFixed(2)} m/s`);
```

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `getByAttemptId(attemptId)` | `attemptId: number` | `Promise<TimeseriesResponseDto>` |

**`TimeseriesResponseDto`** includes:
- `datapoints.series` — array of `TimeseriesDatapointDto` (the raw measurements)
- `datapoints.reactionTimeMs` — reaction time if applicable
- `zones` — zone definitions used during the exercise
- `events` — discrete events (e.g., zone transitions)
- `exerciseConfig`, `dataQualityMetrics`, `intervalMetrics` — additional metadata

## Pagination

The API uses two pagination styles depending on the endpoint:

### Skip/Take Pagination

Used by: **Players**, **Teams**, **Exercise Sessions**

```ts
const result = await client.players.list({ skip: 0, take: 25 });
// result.data — array of items
// result.count — total number of records
```

| Parameter | Description |
|-----------|-------------|
| `skip` | Number of records to skip (offset) |
| `take` | Number of records to return (page size) |

Response shape: `{ data: T[], count: number }`

### Page/Limit Pagination

Used by: **Exercises**, **Exercise Attempts**, **Exercise Templates** (`getExercises`)

```ts
const result = await client.exerciseAttempts.list({ page: 1, limit: 25 });
// result.data — array of items
// result.total — total number of records
// result.page — current page number
// result.limit — items per page
// result.totalPages — total number of pages
```

| Parameter | Description |
|-----------|-------------|
| `page` | Page number (1-based) |
| `limit` | Items per page |

Response shape: `{ data: T[], total, page, limit, totalPages }`

### Iterating All Pages

The SDK does not include a built-in auto-paginator. Here's how to iterate through all records:

**Skip/Take example:**

```ts
async function getAllPlayers(client: LedsreactClient): Promise<PlayerEntity[]> {
  const all: PlayerEntity[] = [];
  const pageSize = 100;
  let skip = 0;

  while (true) {
    const result = await client.players.list({ skip, take: pageSize });
    all.push(...result.data);
    if (all.length >= result.count) break;
    skip += pageSize;
  }

  return all;
}
```

**Page/Limit example:**

```ts
async function getAllAttempts(
  client: LedsreactClient,
  params: Omit<ListAttemptsParams, "page" | "limit">,
): Promise<AttemptResponseDto[]> {
  const all: AttemptResponseDto[] = [];
  let page = 1;

  while (true) {
    const result = await client.exerciseAttempts.list({ ...params, page, limit: 100 });
    all.push(...result.data);
    if (page >= result.totalPages) break;
    page++;
  }

  return all;
}
```

## Error Handling

The SDK throws typed errors for all API failures. Retries are automatic for rate limits (429), server errors (5xx), and network failures.

```ts
import {
  LedsreactClient,
  Region,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from "@ledsreact/sdk";

try {
  const player = await client.players.getById(999);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("Player not found");
  } else if (error instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after: ${error.retryAfter}s`);
  }
}
```

### Error Classes

| Error Class | HTTP Status | Description |
|-------------|-------------|-------------|
| `ValidationError` | 400 | Invalid request parameters |
| `AuthenticationError` | 401 | Invalid or missing API key |
| `ForbiddenError` | 403 | Access denied |
| `NotFoundError` | 404 | Resource not found |
| `RateLimitError` | 429 | Rate limit exceeded (100 req/min general, 10 req/min exports) |
| `ServerError` | 5xx | Server-side error |
| `NetworkError` | — | Connection failure or timeout |

All error classes extend `LedsreactError`, which has a `statusCode` property. `RateLimitError` additionally has a `retryAfter` property (seconds).

### Automatic Retries

The SDK automatically retries on:
- **429 (Rate Limit)** — uses `retry-after` header when available, otherwise exponential backoff
- **5xx (Server Error)** — exponential backoff
- **Network errors** — connection failures, timeouts

Retries use exponential backoff (1s, 2s, 4s, …) capped at 30 seconds. Configure the maximum number of retries with `maxRetries` (default: 3).

## Practical Examples

### Sprint Performance Summary for a Team

```ts
import { LedsreactClient, Region } from "@ledsreact/sdk";

const client = new LedsreactClient({
  apiKey: process.env.LEDSREACT_API_KEY!,
  region: Region.EU,
});

// Get sprint metrics for a team
const analysis = await client.metrics.getAnalysis({
  teamIds: "5",
  exerciseTemplateUids: "sprint",
  metricNames: "max_speed_ms,total_time_s",
  dateStart: "2025-01-01",
  dateEnd: "2025-06-30",
});

for (const result of analysis.results) {
  console.log(`\nExercise template: ${result.exerciseTemplateUid}`);
  console.log(`Last test: ${result.lastTestDate}\n`);

  for (const player of result.playerResults) {
    const speed = player.metrics.find(m => m.metricName === "max_speed_ms");
    const time = player.metrics.find(m => m.metricName === "total_time_s");
    console.log(
      `${player.name}: ${speed?.currentValue?.toFixed(2)} m/s, ${time?.currentValue?.toFixed(2)}s ` +
      `(trend: ${speed?.trend})`
    );
  }
}
```

### Filter Attempts by Date Range

```ts
// Get all sprint attempts in January 2025
const attempts = await client.exerciseAttempts.list({
  dateStart: "2025-01-01",
  dateEnd: "2025-01-31",
  exerciseTemplateUids: "sprint",
  page: 1,
  limit: 100,
});

for (const attempt of attempts.data) {
  const metrics = await client.metrics.getByAttemptId(attempt.id, {
    metricNames: "max_speed_ms,total_time_s",
  });

  const maxSpeed = metrics.metrics.find(m => m.metricName === "max_speed_ms");
  console.log(
    `${attempt.playerName} — ${attempt.createdAt}: ` +
    `${maxSpeed?.metricValue?.toFixed(2)} m/s`
  );
}
```

### Peak Speed from Timeseries Data

```ts
// Get an attempt's raw timeseries and extract peak speed
const timeseries = await client.timeseries.getByAttemptId(999);
const series = timeseries.datapoints.series;

let peakSpeed = 0;
let peakTimeMs = 0;

for (const dp of series) {
  if (dp.sS !== undefined && dp.sS > peakSpeed) {
    peakSpeed = dp.sS;
    peakTimeMs = dp.t;
  }
}

console.log(`Peak speed: ${peakSpeed.toFixed(2)} m/s at t=${peakTimeMs}ms`);

if (timeseries.datapoints.reactionTimeMs) {
  console.log(`Reaction time: ${timeseries.datapoints.reactionTimeMs}ms`);
}

// Compute average speed over the full series
const speedPoints = series.filter(dp => dp.sS !== undefined);
const avgSpeed = speedPoints.reduce((sum, dp) => sum + dp.sS!, 0) / speedPoints.length;
console.log(`Average speed: ${avgSpeed.toFixed(2)} m/s`);
```

## Requirements

- **Node.js >= 18** (uses native `fetch` and `AbortController`)
- **Zero runtime dependencies** — only `devDependencies` for build/test tooling
- Ships **ESM + CommonJS + TypeScript declarations**

## Support

Read the developer docs first at [developer.ledsreact.com](https://developer.ledsreact.com).

If you need further help, reach out to us via [ledsreact.com/en/support](https://www.ledsreact.com/en/support).
