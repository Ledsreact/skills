# Ledsreact SDK Type Reference

Complete type documentation for all DTOs, entities, parameter types, and response types used by the Ledsreact SDK (`@ledsreact/sdk` for TypeScript, `ledsreact-sdk` for Python).

These types are shared across both SDKs — the TypeScript SDK uses `camelCase` property names directly; the Python SDK uses `snake_case` equivalents.

## Pagination Conventions

The API uses two pagination styles:

**Skip/Take** — used by Players, Teams, Sessions:
- Params: `skip` (offset), `take` (page size)
- Response: `{ data: T[], count: number }`

**Page/Limit** — used by Exercises, Attempts, Exercise Templates (`getExercises`):
- Params: `page` (1-based), `limit` (page size)
- Response: `{ data: T[], total, page, limit, totalPages }`

---

## Common

### Region

Enum selecting the API region.

| Value | Base URL |
|-------|----------|
| `EU` | `https://open-api.eu.ledsreact.com` |
| `US` | `https://open-api.us.ledsreact.com` |

TypeScript: `Region.EU`, `Region.US`
Python: `Region.EU`, `Region.US`

### HealthCheckResult

Returned by `client.health.check()`.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Overall health status (e.g. `"ok"`) |
| `info` | `Record<string, { status: string; [key: string]: string }> \| null` | Healthy component details |
| `error` | `Record<string, { status: string; [key: string]: string }> \| null` | Unhealthy component details |
| `details` | `Record<string, { status: string; [key: string]: string }>` | Combined component details |

---

## Club

### ClubDto

Returned by `client.club.get()`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Club ID |
| `name` | `string` | Club name |
| `unitSystem` | `"metric" \| "imperial"` | Unit system used by the club |

### DeviceDto

Returned by `client.club.getDevices()` (array).

| Field | Type | Description |
|-------|------|-------------|
| `hardwareId` | `string` | Unique hardware identifier |
| `firmwareVersionMajor` | `number?` | Major firmware version |
| `firmwareVersionMinor` | `number?` | Minor firmware version |
| `firmwareVersionRevision` | `number?` | Firmware revision number |

---

## Player

### PlayerEntity

Represents an athlete registered in the club.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Player ID |
| `uid` | `string \| null` | External UID (for integrations) |
| `firstname` | `string` | First name |
| `lastname` | `string` | Last name |
| `displayname` | `string \| null` | Display name |
| `birthDate` | `string \| null` | Birth date (ISO 8601) |
| `gender` | `string \| null` | Gender |
| `number` | `number \| null` | Jersey/squad number |
| `height` | `number \| null` | Height (in club's unit system) |
| `weight` | `number \| null` | Weight (in club's unit system) |
| `positions` | `string[]?` | Playing positions |
| `color` | `string?` | Assigned color (hex) |
| `createdAt` | `string?` | Creation timestamp (ISO 8601) |
| `updatedAt` | `string?` | Last update timestamp (ISO 8601) |
| `archivedAt` | `string \| null` | Archive timestamp, `null` if active |

### FindPlayersParams

Parameters for `client.players.list()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `firstname` | `string?` | — | Filter by first name (partial match) |
| `lastname` | `string?` | — | Filter by last name (partial match) |
| `exact` | `boolean?` | `false` | Use exact name matching |
| `skip` | `number?` | `0` | Number of records to skip |
| `take` | `number?` | `10` | Number of records to return |

### FindPlayersResponse

Response from `client.players.list()`.

| Field | Type | Description |
|-------|------|-------------|
| `data` | `PlayerEntity[]` | Array of players |
| `count` | `number` | Total number of matching players |

---

## Team

### TeamEntity

Represents a team (group of players). A player can belong to multiple teams.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Team ID |
| `name` | `string` | Team name |
| `level` | `string` | Team level (e.g. `"YOUTH"`, `"AMATEUR"`, `"PRO"`) |
| `sport_deprecated` | `string \| null` | Deprecated sport field |
| `sport` | `Record<string, unknown>` | Sport configuration object |
| `weeklyTrainingHours` | `string` | Training hours range (e.g. `"ONE_TO_FIVE"`, `"FIVE_TO_TEN"`, `"TEN_TO_FIFTEEN"`, `"FIFTEEN_AND_MORE"`) |

### FindTeamsParams

Parameters for `client.teams.list()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | `number?` | `0` | Number of records to skip |
| `take` | `number?` | `10` | Number of records to return |

### FindTeamsResponse

Response from `client.teams.list()`.

| Field | Type | Description |
|-------|------|-------------|
| `data` | `TeamEntity[]` | Array of teams |
| `count` | `number` | Total number of teams |

### TeamPlayerResponseDto

Returned by `client.teams.getPlayers(id)` (array).

| Field | Type | Description |
|-------|------|-------------|
| `player` | `PlayerEntity` | The player entity |
| `order` | `number?` | Player's order/position within the team |

---

## Exercise

Exercises are measurement activities (sprint, COD, T-test, etc.). Each exercise is a specific instance of an exercise template with configured parameters.

### ExerciseBaseDto

Base exercise representation (returned when `withVariables` is `false`).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Exercise ID |
| `name` | `string` | Exercise name (e.g. "Sprint 30m") |
| `public` | `boolean` | Whether this is a built-in (public) exercise |
| `createdAt` | `string` | Creation timestamp (ISO 8601) |
| `updatedAt` | `string` | Last update timestamp (ISO 8601) |

### ExerciseWithVariablesDto

Extended exercise representation (returned when `withVariables` is `true`). Includes all `ExerciseBaseDto` fields plus configuration variables.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Exercise ID |
| `name` | `string` | Exercise name |
| `public` | `boolean` | Whether this is a built-in exercise |
| `createdAt` | `string` | Creation timestamp |
| `updatedAt` | `string` | Last update timestamp |
| `reps` | `number \| null?` | Number of repetitions |
| `delay` | `number \| null?` | Delay between reps (seconds) |
| `s` | `number \| null?` | Distance parameter (meters) |
| `x` | `number \| null?` | X dimension parameter |
| `y` | `number \| null?` | Y dimension parameter |
| `r` | `number \| null?` | Radius parameter |
| `r0` | `number \| null?` | Inner radius parameter |
| `r1` | `number \| null?` | Outer radius parameter |
| `w` | `number \| null?` | Width parameter |
| `a` | `number \| null?` | Angle A parameter |
| `b` | `number \| null?` | Angle B parameter |
| `rep_check_amount` | `number \| null?` | Rep check amount |
| `unitSystem` | `"metric" \| "imperial"` | Unit system for the variables |
| `isMainTemplate` | `boolean` | Whether this is the main template exercise |
| `useRawVariablesForExerciseInsteadOfTemplateVariables` | `boolean` | Use raw variables override |
| `rawVariables` | `Record<string, unknown> \| null?` | Raw variable overrides |

### ExerciseListItemDto

Compact exercise representation used in some list responses.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Exercise ID |
| `name` | `string` | Exercise name |
| `public` | `boolean` | Whether this is a built-in exercise |
| `createdAt` | `string` | Creation timestamp |

### ExerciseListResponseDto

Response from `client.exercises.list()` and `client.exerciseTemplates.getExercises()`.

| Field | Type | Description |
|-------|------|-------------|
| `exercises` | `(ExerciseBaseDto \| ExerciseWithVariablesDto \| ExerciseListItemDto)[]` | Array of exercises (shape depends on `withVariables`) |
| `total` | `number` | Total number of exercises |
| `page` | `number` | Current page number |
| `limit` | `number` | Items per page |
| `totalPages` | `number` | Total number of pages |

### ListExercisesParams

Parameters for `client.exercises.list()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `customOnly` | `boolean?` | `false` | Only return custom (non-public) exercises |
| `withVariables` | `boolean?` | `false` | Include exercise configuration variables |
| `page` | `number?` | `1` | Page number (1-based) |
| `limit` | `number?` | `50` | Items per page |

---

## Exercise Template

Templates define exercise types (e.g., "Sprint", "5-10-5"). Each template can have many exercises with different configurations.

### Supported Template UIDs

| UID | Description |
|-----|-------------|
| `Sprint` | Linear sprint measuring acceleration and maximum speed |
| `COD` | Change of Direction — sprint with 180° turnaround |
| `TTest` | T-Test — multi-directional agility in a T-shaped pattern |
| `FiveTenFive` | 5-10-5 — lateral shuttle drill |
| `AgilityBox` | Agility Box — reactive agility within a square box |
| `MasterCheckpointLong` | Custom checkpoint-based reactive agility ("Custom Test" in the app) |
| `Basic` | Center-in/center-out drill (training only, no data capture) |
| `BasicRepeat` | Signal-only directional exercise (training only, no data capture) |

Use these UIDs in `exerciseTemplateUids` filters — comma-separate for multiple: `"Sprint,COD"`.

### ExerciseTemplateResponseDto

Represents a single exercise template.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Template ID |
| `uid` | `string` | Template UID (e.g. `"Sprint"`, `"COD"`) |
| `type` | `string` | Template type descriptor |
| `variables` | `Record<string, unknown>?` | Template configuration variables (when `withVariables` is `true`) |
| `drillId` | `number \| null?` | Associated drill ID (when `withDrills` is `true`) |

### ExerciseTemplateListResponseDto

Response from `client.exerciseTemplates.list()`.

| Field | Type | Description |
|-------|------|-------------|
| `templates` | `ExerciseTemplateResponseDto[]` | Array of exercise templates |

### ListExerciseTemplatesParams

Parameters for `client.exerciseTemplates.list()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `withVariables` | `boolean?` | `false` | Include template configuration variables |
| `withDrills` | `boolean?` | `false` | Include drill information |

### ListTemplateExercisesParams

Parameters for `client.exerciseTemplates.getExercises(id, params)`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number?` | `1` | Page number (1-based) |
| `limit` | `number?` | `50` | Items per page |
| `withVariables` | `boolean?` | `false` | Include exercise configuration variables |

---

## Exercise Session

A session is a single measurement event — one exercise performed by one or more players at a specific time.

### SessionExerciseDto

Embedded exercise info within a session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Exercise ID |
| `name` | `string` | Exercise name |

### SessionPlayerDto

Embedded player info within a session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Player ID |
| `firstname` | `string` | Player first name |
| `lastname` | `string` | Player last name |

### SessionListItemDto

Represents a session in list responses from `client.exerciseSessions.list()`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Session ID |
| `uuid` | `string` | Session UUID |
| `createdAt` | `string` | Creation timestamp (ISO 8601) |
| `remark` | `string?` | Optional session remark/note |
| `exercise` | `SessionExerciseDto` | Exercise that was performed |
| `players` | `SessionPlayerDto[]` | Players who participated |

### FindSessionsResponseDto

Response from `client.exerciseSessions.list()`.

| Field | Type | Description |
|-------|------|-------------|
| `data` | `SessionListItemDto[]` | Array of sessions |
| `count` | `number` | Total number of sessions |

### FindSessionsParams

Parameters for `client.exerciseSessions.list()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | `number?` | `0` | Number of records to skip |
| `take` | `number?` | `10` | Number of records to return |

### GetSessionAttemptResponseDto

Attempt data embedded in a detailed session response.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Attempt ID |
| `playerIndex` | `number` | Player index within the session |
| `remark` | `string \| null` | Optional attempt remark |
| `createdAt` | `string` | Creation timestamp |
| `charts` | `Record<string, unknown>?` | Chart data (when `withCharts` is `true`) |

### GetSessionResponseDto

Response from `client.exerciseSessions.getByUuid()`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Session ID |
| `uuid` | `string` | Session UUID |
| `createdAt` | `string` | Creation timestamp |
| `remark` | `string \| null` | Optional session remark |
| `exercise` | `Record<string, unknown>` | Full exercise details |
| `players` | `Record<string, unknown>[]` | Full player details |
| `attempts` | `GetSessionAttemptResponseDto[] \| null` | Attempts in this session (null if not loaded) |

### GetSessionParams

Parameters for `client.exerciseSessions.getByUuid(uuid, params)`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `withCharts` | `boolean?` | `false` | Include chart data in attempt responses |

---

## Exercise Attempt

An attempt is a single repetition by a single player within a session. For example, if 3 players each do 2 sprint reps, the session contains 6 attempts.

### AttemptResponseDto

Represents a single exercise attempt.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Attempt ID |
| `sessionId` | `number` | Parent session ID |
| `sessionUuid` | `string?` | Parent session UUID |
| `attemptID` | `number` | Attempt index within the session |
| `playerIndex` | `number?` | Player index within the session |
| `remark` | `string?` | Optional remark/note |
| `duration` | `number?` | Duration in milliseconds |
| `timestamp_ms` | `number?` | Timestamp in milliseconds |
| `playerId` | `number?` | Player ID |
| `playerName` | `string?` | Player display name |
| `exerciseName` | `string?` | Exercise name |
| `exerciseId` | `number?` | Exercise ID |
| `exerciseTemplateUid` | `string?` | Template UID (e.g. `"Sprint"`) |
| `charts` | `Record<string, unknown>?` | Chart data (when `withCharts` is `true`) |
| `liveResults` | `Record<string, unknown>?` | Live result data |
| `failedProcessingReason` | `string?` | Reason if processing failed |
| `warning` | `string?` | Processing warning message |
| `processingFlags` | `string?` | Processing flags |
| `createdAt` | `string` | Creation timestamp (ISO 8601) |
| `updatedAt` | `string` | Last update timestamp (ISO 8601) |

### PaginatedAttemptsResponseDto

Response from `client.exerciseAttempts.list()`.

| Field | Type | Description |
|-------|------|-------------|
| `data` | `AttemptResponseDto[]` | Array of attempts |
| `total` | `number` | Total number of matching attempts |
| `page` | `number` | Current page number |
| `limit` | `number` | Items per page |
| `totalPages` | `number` | Total number of pages |

### ListAttemptsParams

Parameters for `client.exerciseAttempts.list()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number?` | `1` | Page number (1-based) |
| `limit` | `number?` | `50` | Items per page |
| `dateStart` | `string?` | — | Filter from date (ISO format, e.g. `"2025-01-01"`) |
| `dateEnd` | `string?` | — | Filter to date (ISO format) |
| `playerIds` | `string?` | — | Comma-separated player IDs |
| `teamIds` | `string?` | — | Comma-separated team IDs |
| `exerciseIds` | `string?` | — | Comma-separated exercise IDs |
| `exerciseTemplateUids` | `string?` | — | Comma-separated template UIDs (e.g. `"Sprint,COD"`) |
| `sessionIds` | `string?` | — | Comma-separated session IDs |

### GetAttemptParams

Parameters for `client.exerciseAttempts.getById(attemptId, params)`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `withCharts` | `boolean?` | `false` | Include chart data |

---

## Metrics

Metrics provide computed performance values for attempts and sessions.

### MetricsResponseDto

Top-level response from `client.metrics.getAnalysis()`.

| Field | Type | Description |
|-------|------|-------------|
| `results` | `MetricsResultDto[]` | Array of results grouped by exercise |

### MetricsResultDto

A single exercise group within the analysis response.

| Field | Type | Description |
|-------|------|-------------|
| `exerciseId` | `string` | Exercise ID |
| `exerciseTemplateUid` | `string` | Template UID (e.g. `"Sprint"`) |
| `lastTestDate` | `string` | Date of the most recent test |
| `playerResults` | `MetricsPlayerResultDto[]` | Per-player metric results |
| `groupResults` | `MetricsGroupResultDto[]` | Aggregated group-level metrics |

### MetricsPlayerResultDto

Per-player results within an analysis.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Result ID |
| `name` | `string` | Player display name |
| `firstname` | `string` | Player first name |
| `lastname` | `string` | Player last name |
| `age` | `number` | Player age |
| `teams` | `string[]` | Team names the player belongs to |
| `positions` | `string[]` | Player positions |
| `metrics` | `MetricsGroupResultDto[]` | Metric values for this player |
| `isSelected` | `boolean` | Selection state |
| `lastTestDate` | `string` | Date of the player's most recent test |
| `playerId` | `number?` | Player ID |
| `color` | `string?` | Player color (hex) |

### MetricsGroupResultDto

A single metric value with trend information.

| Field | Type | Description |
|-------|------|-------------|
| `metricName` | `string` | Metric key (e.g. `"max_speed_ms"`) |
| `unit` | `string` | Unit of measurement (e.g. `"m/s"`) |
| `bestValue` | `number \| null` | All-time best value |
| `currentValue` | `number \| null` | Most recent value |
| `previousValue` | `number \| null` | Previous test value |
| `trend` | `"up" \| "down" \| "stable"` | Trend direction (current vs previous) |
| `percentageChange` | `number` | Percentage change from previous to current |
| `totalAttempts` | `number` | Total number of attempts with this metric |
| `averageValues` | `Record<string, unknown>` | Average value breakdowns |
| `ts` | `string \| null` | Timestamp of the current value |
| `attempts` | `MetricsAttemptDto[]?` | Per-attempt details (when `details` is `true`) |

### MetricsAttemptDto

Individual attempt data within a metric (available when `details: true`).

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | `number` | Session ID |
| `attemptId` | `number` | Attempt ID |
| `value` | `number` | Metric value for this attempt |
| `ts` | `string` | Timestamp of the attempt |

### MetricsAnalysisParams

Parameters for `client.metrics.getAnalysis()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `playerIds` | `string?` | — | Comma-separated player IDs |
| `teamIds` | `string?` | — | Comma-separated team IDs |
| `exerciseIds` | `string?` | — | Comma-separated exercise IDs |
| `exerciseTemplateUids` | `string?` | — | Comma-separated template UIDs |
| `metricNames` | `string?` | — | Comma-separated metric keys (e.g. `"max_speed_ms,total_time_s"`) |
| `dateStart` | `string?` | — | Filter from date (ISO format) |
| `dateEnd` | `string?` | — | Filter to date (ISO format) |
| `details` | `boolean?` | `false` | Include per-attempt detail data |
| `hideFalseStarts` | `boolean?` | `false` | Exclude false-start attempts |

### MetricsByIdParams

Parameters for `client.metrics.getByAttemptId()` and `client.metrics.getBySessionId()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `metricNames` | `string?` | — | Comma-separated metric keys to return |

### AttemptMetricDto

A single metric measurement for an attempt.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Metric record ID |
| `attemptId` | `number` | Attempt ID |
| `metricName` | `string` | Metric key (e.g. `"max_speed_ms"`) |
| `metricValue` | `number` | Metric value |
| `timestamp` | `string` | Timestamp (ISO 8601) |

### AttemptMetricsResponseDto

Response from `client.metrics.getByAttemptId()`.

| Field | Type | Description |
|-------|------|-------------|
| `attemptId` | `number` | Attempt ID |
| `metrics` | `AttemptMetricDto[]` | Array of metrics for this attempt |

### SessionMetricsResponseDto

Response from `client.metrics.getBySessionId()`.

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | `number` | Session ID |
| `attempts` | `AttemptMetricsResponseDto[]` | Metrics grouped by attempt |

### Common Metric Keys

| Metric Key | Unit | Description |
|------------|------|-------------|
| `total_time_s` | s | Total exercise duration |
| `totaltimereactiontime_s` | s | Net time (excluding reaction time) |
| `reactiontime_s` | s | Reaction time |
| `max_speed_ms` | m/s | Maximum speed |
| `avg_speed_ms` | m/s | Average speed |
| `max_acceleration_ms2` | m/s² | Maximum acceleration |
| `avg_acceleration_ms2` | m/s² | Average acceleration |
| `max_deceleration_ms2` | m/s² | Maximum deceleration |
| `avg_deceleration_ms2` | m/s² | Average deceleration |

**Zone metrics** follow the pattern: `zone_{name}_{metric}_{unit}` (e.g. `zone_0-5_maxspeed_ms`).

**Force-Velocity Profile** (sprints >= 20m):

| Metric Key | Unit | Description |
|------------|------|-------------|
| `f0` | N/kg | Theoretical max force |
| `v0_ms` | m/s | Theoretical max velocity |
| `p_max` | W/kg | Maximum power |
| `fv_slope` | — | Force-velocity slope |
| `drf` | — | Decrease in ratio of force |

---

## Timeseries

Timeseries data contains raw datapoints recorded during an attempt — position, speed, acceleration sampled at high frequency (~34 Hz). This is the most granular data available.

### TimeseriesResponseDto

Response from `client.timeseries.getByAttemptId()`.

| Field | Type | Description |
|-------|------|-------------|
| `attemptId` | `number` | Attempt ID |
| `name` | `string?` | Exercise name |
| `processingVersion` | `string?` | Data processing version |
| `datapoints` | `TimeseriesDataDto` | Timeseries data containing the series array |
| `zones` | `ZoneDataDto?` | Zone definitions used during the exercise |
| `events` | `EventDataDto?` | Discrete events (signals, checkpoints, finish) |
| `exerciseConfig` | `Record<string, unknown>?` | Exercise configuration |
| `dataQualityMetrics` | `Record<string, unknown>?` | Data quality metrics |
| `intervalMetrics` | `Record<string, unknown>?` | Interval-level metrics |
| `description` | `string?` | Exercise description |

### TimeseriesDataDto

Container for the timeseries data array.

| Field | Type | Description |
|-------|------|-------------|
| `series` | `TimeseriesDatapointDto[]` | Array of measurement datapoints |
| `reactionTimeMs` | `number?` | Reaction time in milliseconds (if applicable) |

### TimeseriesDatapointDto

A single measurement sample. All fields except `t` are optional — available fields depend on the exercise type and unit system.

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `t` | `number` | ms | Timestamp in milliseconds (required) |
| `d` | `number?` | m | Distance (metric) |
| `di` | `number?` | yd | Distance (imperial) |
| `sS` | `number?` | m/s | Speed (metric, m/s) |
| `sH` | `number?` | km/h | Speed (metric, km/h) |
| `sSi` | `number?` | ft/s | Speed (imperial, ft/s) |
| `sHi` | `number?` | mph | Speed (imperial, mph) |
| `a` | `number?` | m/s² | Vectorial acceleration (metric) |
| `ai` | `number?` | ft/s² | Vectorial acceleration (imperial) |
| `sa` | `number?` | m/s² | Scalar acceleration (metric) |
| `sai` | `number?` | ft/s² | Scalar acceleration (imperial) |
| `x` | `number?` | m | X position (metric) |
| `y` | `number?` | m | Y position (metric) |
| `xyd` | `number?` | yd | X position (imperial) |
| `yyd` | `number?` | yd | Y position (imperial) |
| `m` | `boolean?` | — | Movement state (`true` = moving) |
| `p` | `string?` | — | Phase name |
| `z` | `string?` | — | Zone identifier |

### ZoneDataDto

Container for zone system definitions.

| Field | Type | Description |
|-------|------|-------------|
| `zones` | `ZoneSystemDto[]` | Array of zone systems |

### ZoneSystemDto

Defines a zone system (e.g., distance zones, speed zones).

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Zone system key identifier |
| `name` | `string?` | Human-readable name |
| `type` | `string?` | Zone system type |
| `unit` | `string?` | Unit of measurement |
| `zones` | `ZoneDto[]` | Individual zone definitions |

### ZoneDto

A single zone within a zone system.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Zone identifier (e.g. `"0-5m"`) |
| `s` | `number` | Start time in milliseconds |
| `e` | `number?` | End time in milliseconds |
| `sv` | `number` | Start value |
| `ev` | `number?` | End value |
| `u` | `string?` | Unit |
| `o` | `number?` | Display order |

### EventDataDto

Container for event data.

| Field | Type | Description |
|-------|------|-------------|
| `series` | `EventDatapointDto[]` | Array of discrete events |

### EventDatapointDto

A single discrete event during an attempt.

| Field | Type | Description |
|-------|------|-------------|
| `t` | `number` | Timestamp in milliseconds |
| `e` | `number` | Event type: `1` = signal, `2` = checkpoint, `3` = finish |
| `v` | `string \| number \| null` | Event value (signal ID, checkpoint ID, or finish status) |
