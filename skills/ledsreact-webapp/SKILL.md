---
name: ledsreact-webapp
description: Build web applications that integrate with the Ledsreact Open API for sports performance data. Use when creating dashboards, analytics tools, or any web app that needs to fetch player metrics, exercise results, or timeseries data from Ledsreact.
compatibility: Designed for Next.js applications. Requires Node.js 18+.
metadata:
  author: ledsreact
  version: "1.1"
---

## Ledsreact Webapp Development

This skill helps you build web applications that integrate with the Ledsreact Open API.

**API Reference:** For the most recent and complete Ledsreact Open-API specification, see https://open-api.eu.ledsreact.com/docs-yaml

## About Ledsreact

Ledsreact is a sports performance and agility sensing platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables. The Open API allows programmatic access to player data, exercise results, and detailed timeseries performance data.

## The Job

1. Receive feature description of the desired web app from the user
2. Ask the user if they using the EU or US region (this determines the exact LEDSREACT_BASE_URL to use in .env.local)
3. Ask 3-5 essential clarifying questions (with lettered options)
4. Generate a Next.js application based on the answers and guidance below

## Architecture (Next.js)

IMPORTANT: Never expose the API key in client-side code. Use Next.js API routes or Server Actions.

```text
# Project Structure
src/
├── app/
│   ├── api/
│   │   └── ledsreact/
│   │       ├── players/route.ts              # Proxy to /players
│   │       ├── players/[id]/route.ts         # Proxy to /players/{id}
│   │       ├── teams/route.ts                # Proxy to /teams
│   │       ├── exercises/route.ts            # Proxy to /exercises
│   │       ├── exercise-attempts/route.ts    # Proxy to /exercise-attempt
│   │       ├── metrics/
│   │       │   ├── analysis/route.ts         # Proxy to /metrics/analysis
│   │       │   ├── attempt/[attemptId]/route.ts
│   │       │   └── session/[sessionId]/route.ts
│   │       └── timeseries/[attemptId]/route.ts
│   └── dashboard/
│       └── page.tsx                          # Client components fetch from /api/ledsreact/*
├── lib/
│   └── ledsreact.ts                          # Server-side API client
└── types/
    └── ledsreact.ts                          # TypeScript types
```

## Environment Variables

Required in `.env.local`:

```typescript
const API_KEY = process.env.LEDSREACT_API_KEY!;
const BASE_URL = process.env.LEDSREACT_BASE_URL!;

interface LedsreactRequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class RateLimitError extends Error {
  constructor(public retryAfter?: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    return response;
  }
  throw new RateLimitError();
}

```text
LEDSREACT_API_KEY=your_api_key_here
LEDSREACT_BASE_URL=https://open-api.eu.ledsreact.com
```

Regional base URLs:
- EU Region: `https://open-api.eu.ledsreact.com`
- US Region: `https://open-api.us.ledsreact.com`

## Server-Side API Client

Create `src/lib/ledsreact.ts`:

export async function ledsreactFetch<T>({
  endpoint,
  method = 'GET',
  params,
  body
}: LedsreactRequestOptions): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetchWithRetry(url.toString(), {
    method,
    headers: {
      'x-api-key': API_KEY,
      'Accept': 'application/json',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new Error(`Ledsreact API error: ${response.status} ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
```

## API Route Example

Create `src/app/api/ledsreact/players/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ledsreactFetch } from '@/lib/ledsreact';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const data = await ledsreactFetch({
      endpoint: '/players',
      params: {
        firstname: searchParams.get('firstname') || undefined,
        lastname: searchParams.get('lastname') || undefined,
        exact: searchParams.get('exact') || undefined,
        skip: searchParams.get('skip') || undefined,
        take: searchParams.get('take') || '10',
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
```

## Available Endpoints

### Club
- `GET /club` - Get club info (id, name, unitSystem)
- `GET /club/devices` - List devices (hardwareId, firmware versions)

### Players
- `GET /players` - List players with pagination
  - `firstname`, `lastname` - Search filters
  - `exact` - Exact match (default: false)
  - `skip`, `take` - Pagination (defaults: 0, 10)
- `POST /players` - Create a player
- `GET /players/{id}` - Get player by ID
- `PUT /players/{id}` - Update a player
- `GET /players/uid/{uid}` - Get player by UID
- `POST /players/import` - Import players from CSV (multipart form-data)

### Teams
- `GET /teams` - List teams
- `POST /teams` - Create a team
- `GET /teams/{id}` - Get team by ID
- `PUT /teams/{id}` - Update a team
- `DELETE /teams/{id}` - Delete a team
- `GET /teams/{id}/players` - Get team players
- `PUT /teams/{id}/players` - Manage team players

### Exercise Templates
- `GET /exercise-templates` - List templates
  - `withVariables` - Include configuration
  - `withDrills` - Include drill templates
  - `page`, `limit` - Pagination
- `GET /exercise-templates/{id}/exercises` - Get exercises by template

Template UIDs: `Sprint`, `COD`, `FiveTenFive`, `TTest`, `AgilityBox`, `MasterCheckpointLong`

### Exercises
- `GET /exercises` - List exercises
  - `customOnly` - Only custom exercises (default: false)
  - `withVariables` - Include configuration
  - `page`, `limit` - Pagination (defaults: 1, 50)

### Exercise Sessions
- `GET /exercise-session` - List sessions
  - `skip`, `take` - Pagination (defaults: 0, 10)
- `POST /exercise-session` - Create session (returns uploadUrl)
- `GET /exercise-session/{uuid}` - Get session by UUID
  - `withCharts` - Include chart data in attempt responses
- `POST /exercise-session/{uuid}/attempt/{attemptIndex}/upload` - Upload attempt data

### Exercise Attempts
- `GET /exercise-attempt` - List attempts with filters
  - `page`, `limit` - Pagination (defaults: 1, 50)
  - `dateStart`, `dateEnd` - Date range (ISO 8601)
  - `playerIds`, `teamIds`, `exerciseIds` - Comma-separated IDs
  - `exerciseTemplateUids`, `sessionIds` - Additional filters
- `GET /exercise-attempt/{attemptId}` - Get attempt by ID
- `DELETE /exercise-attempt/{attemptId}` - Soft delete attempt
- `PATCH /exercise-attempt/{attemptId}` - Update remark

### Metrics
- `GET /metrics/analysis` - Metrics analysis (player results + group results per exercise)
  - `playerIds`, `teamIds`, `exerciseIds` - Comma-separated filters
  - `exerciseTemplateUids`, `metricNames` - Additional filters
  - `dateStart`, `dateEnd` - Date range
  - `details` - Include per-attempt detail data (default: false)
  - `hideFalseStarts` - Exclude false-start attempts (default: false)
- `GET /metrics/attempt/{attemptId}` - Metrics for a specific attempt
  - `metricNames` - Comma-separated metric keys to return
- `GET /metrics/session/{sessionId}` - Metrics for all attempts in a session
  - `metricNames` - Comma-separated metric keys to return

### Timeseries
- `GET /timeseries/attempt/{attemptId}` - Get detailed timeseries data
  - Returns datapoints (t, d, speed, acceleration, x, y, etc.)
  - Includes zones, events, and exercise configuration

### Export
- `GET /export/datapoints` - Export datapoints as ZIP (rate limit: 10/min)
  - Required: `playerId`, `fromDate`, `toDate`

## Common Metric Keys

Top-level metrics:
- `total_time_s` - Total exercise duration in seconds
- `totaltimereactiontime_s` - Net time without reaction time
- `reactiontime_s` - Reaction time in seconds
- `max_speed_ms` - Maximum speed in m/s
- `avg_speed_ms` - Average speed in m/s
- `max_acceleration_ms2` - Maximum acceleration in m/s²
- `avg_acceleration_ms2` - Average acceleration in m/s²
- `max_deceleration_ms2` - Maximum deceleration in m/s²
- `avg_deceleration_ms2` - Average deceleration in m/s²

Zone metrics follow pattern: `zone_{name}_{metric}_{unit}`
Example: `zone_0-5_maxspeed_ms`

Force-Velocity Profile (sprints >= 20m):
- `f0` - Theoretical max force (N/kg)
- `v0_ms` - Theoretical max velocity (m/s)
- `p_max` - Maximum power (W/kg)

## Rate Limits

- General API: 100 requests/minute
- Datapoint exports: 10 requests/minute
- HTTP 429 response when exceeded

Always implement exponential backoff as shown in the API client above.

## TypeScript Types

Create `src/types/ledsreact.ts`:

```typescript
// Club
export interface Club {
  id: number;
  name: string;
  unitSystem: 'metric' | 'imperial';
}

export interface Device {
  hardwareId: string;
  firmwareVersionMajor?: number;
  firmwareVersionMinor?: number;
  firmwareVersionRevision?: number;
}

// Players
export interface Player {
  id: number;
  uid: string | null;
  firstname: string;
  lastname: string;
  displayname: string | null;
  birthDate: string | null;
  gender: string | null;
  number: number | null;
  height: number | null;
  weight: number | null;
  positions?: string[];
  color?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt: string | null;
}

export interface CreatePlayerDto {
  firstname: string;
  lastname: string;
  uid?: string;
  birthDate?: string;
  gender?: string;
  number?: number;
  height?: number;
  weight?: number;
  color?: string;
}

export interface PlayersResponse {
  data: Player[];
  count: number;
}

// Teams
export interface Team {
  id: number;
  name: string;
  level: string;
  sport_deprecated: string | null;
  sport: Record<string, unknown>;
  weeklyTrainingHours: string;
}

export interface TeamsResponse {
  data: Team[];
  count: number;
}

export interface TeamPlayerResponse {
  player: Player;
  order?: number;
}

// Exercises
export interface ExerciseTemplate {
  id: number;
  uid: string;
  type: string;
  variables?: Record<string, unknown>;
  drillId?: number | null;
}

export interface Exercise {
  id: number;
  name: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExercisesResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Sessions
export interface SessionExercise {
  id: number;
  name: string;
}

export interface SessionPlayer {
  id: number;
  firstname: string;
  lastname: string;
}

export interface Session {
  id: number;
  uuid: string;
  createdAt: string;
  remark?: string;
  exercise: SessionExercise;
  players: SessionPlayer[];
}

export interface SessionsResponse {
  data: Session[];
  count: number;
}

// Attempts
export interface Attempt {
  id: number;
  sessionId: number;
  sessionUuid?: string;
  attemptID: number;
  playerIndex?: number;
  remark?: string;
  duration?: number;
  timestamp_ms?: number;
  playerId?: number;
  playerName?: string;
  exerciseName?: string;
  exerciseId?: number;
  exerciseTemplateUid?: string;
  charts?: Record<string, unknown>;
  liveResults?: Record<string, unknown>;
  failedProcessingReason?: string;
  warning?: string;
  processingFlags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptsResponse {
  data: Attempt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Metrics — Analysis (GET /metrics/analysis)
export interface MetricsAttemptDetail {
  sessionId: number;
  attemptId: number;
  value: number;
  ts: string;
}

export interface MetricValue {
  metricName: string;
  unit: string;
  bestValue: number | null;
  currentValue: number | null;
  previousValue: number | null;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  totalAttempts: number;
  averageValues: Record<string, unknown>;
  ts: string | null;
  attempts?: MetricsAttemptDetail[];
}

export interface MetricsPlayerResult {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  teams: string[];
  positions: string[];
  metrics: MetricValue[];
  isSelected: boolean;
  lastTestDate: string;
  playerId?: number;
  color?: string;
}

export interface MetricsResult {
  exerciseId: string;
  exerciseTemplateUid: string;
  lastTestDate: string;
  playerResults: MetricsPlayerResult[];
  groupResults: MetricValue[];
}

export interface MetricsResponse {
  results: MetricsResult[];
}

// Metrics — Per-attempt (GET /metrics/attempt/{attemptId})
export interface AttemptMetric {
  id: number;
  attemptId: number;
  metricName: string;
  metricValue: number;
  timestamp: string;
}

export interface AttemptMetrics {
  attemptId: number;
  metrics: AttemptMetric[];
}

// Metrics — Per-session (GET /metrics/session/{sessionId})
export interface SessionMetrics {
  sessionId: number;
  attempts: AttemptMetrics[];
}

// Timeseries
export interface TimeseriesDatapoint {
  t: number;    // timestamp in ms (required)
  d?: number;   // distance in m
  di?: number;  // distance in yd
  sS?: number;  // speed in m/s
  sH?: number;  // speed in km/h
  sSi?: number; // speed in ft/s
  sHi?: number; // speed in mph
  a?: number;   // vectorial acceleration (m/s²)
  ai?: number;  // vectorial acceleration (ft/s²)
  sa?: number;  // scalar acceleration (m/s²)
  sai?: number; // scalar acceleration (ft/s²)
  x?: number;   // x position in m
  y?: number;   // y position in m
  xyd?: number; // x position in yd
  yyd?: number; // y position in yd
  m?: boolean;  // movement state
  p?: string;   // phase name
  z?: string;   // zone id
}

export interface Zone {
  id: string; // zone identifier (e.g., "0-5m")
  s: number;  // start ms (required)
  e?: number; // end ms (optional)
  sv: number; // start value (required)
  ev?: number; // end value
  u?: string;  // unit
  o?: number;  // order
}

export interface ZoneSystem {
  key: string;
  name?: string;
  type?: string;
  unit?: string;
  zones: Zone[];
}

export interface EventDatapoint {
  t: number;                 // timestamp in ms
  e: number;                 // event type: 1=signal, 2=checkpoint, 3=finish
  v: string | number | null; // event value (signal ID, checkpoint ID, finish status)
}

export interface TimeseriesResponse {
  attemptId: number;
  name?: string;
  processingVersion?: string;
  datapoints: { series: TimeseriesDatapoint[]; reactionTimeMs?: number };
  zones?: { zones: ZoneSystem[] };
  events?: { series: EventDatapoint[] };
  exerciseConfig?: Record<string, unknown>;
  dataQualityMetrics?: Record<string, unknown>;
  intervalMetrics?: Record<string, unknown>;
  description?: string;
}
```

## Example: Player Dashboard Component

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { Player, PlayersResponse } from '@/types/ledsreact';

export function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch('/api/ledsreact/players?take=50');
        if (!response.ok) throw new Error('Failed to fetch');
        const data: PlayersResponse = await response.json();
        setPlayers(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  if (loading) return <div>Loading players...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {players.map(player => (
        <li key={player.id}>
          {player.firstname} {player.lastname}
        </li>
      ))}
    </ul>
  );
}
```

## Security Checklist

- API key stored in environment variable, not in code
- API key only accessed in server-side code (API routes, Server Actions)
- No API key in client components or browser
- `.env.local` added to `.gitignore`
- Rate limiting handled with exponential backoff
- Error responses don't leak sensitive information
