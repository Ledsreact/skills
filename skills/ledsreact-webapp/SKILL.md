---
name: ledsreact-webapp
description: Build web applications that integrate with the Ledsreact Open API for sports performance data. Use when creating dashboards, analytics tools, or any web app that needs to fetch player metrics, exercise results, or timeseries data from Ledsreact.
compatibility: Designed for Next.js applications. Requires Node.js 18+.
metadata:
  author: ledsreact
  version: "2.0"
---

## Ledsreact Webapp Development

This skill helps you build web applications that integrate with the Ledsreact Open API using the **`@ledsreact/sdk`** TypeScript SDK.

**SDK Reference:** For complete SDK documentation (all services, methods, pagination, error handling), see [./references/ledsreact-sdk-typescript.md](./references/ledsreact-sdk-typescript.md).

**Type Reference:** For all DTOs, entities, parameter types, and response types, see [./references/types.md](./references/types.md).

**API Specification:** For the raw Open-API spec, see https://open-api.eu.ledsreact.com/docs-yaml

## About Ledsreact

Ledsreact is a sports performance and agility sensing platform built around a radar-based device (the Ledsreact Pro) that tracks athlete speed, agility, and performance metrics without requiring wearables. The Open API and SDK allow programmatic access to player data, exercise results, and detailed timeseries performance data.

## The Job

1. Receive feature description of the desired web app from the user
2. Ask the user if they are using the EU or US region (this determines the `Region` enum value)
3. Ask 3-5 essential clarifying questions (with lettered options)
4. Generate a Next.js application based on the answers and guidance below

## Architecture (Next.js)

IMPORTANT: Never expose the API key in client-side code. The SDK client must only be instantiated in server-side code (API routes, Server Actions, server components).

```text
# Project Structure
src/
├── app/
│   ├── api/
│   │   └── ledsreact/
│   │       ├── players/route.ts              # Proxy to SDK players service
│   │       ├── players/[id]/route.ts         # Proxy to SDK players.getById
│   │       ├── teams/route.ts                # Proxy to SDK teams service
│   │       ├── exercises/route.ts            # Proxy to SDK exercises service
│   │       ├── exercise-attempts/route.ts    # Proxy to SDK exerciseAttempts service
│   │       ├── metrics/
│   │       │   ├── analysis/route.ts         # Proxy to SDK metrics.getAnalysis
│   │       │   ├── attempt/[attemptId]/route.ts
│   │       │   └── session/[sessionId]/route.ts
│   │       └── timeseries/[attemptId]/route.ts
│   └── dashboard/
│       └── page.tsx                          # Client components fetch from /api/ledsreact/*
└── lib/
    └── ledsreact.ts                          # Shared SDK client instance
```

## Setup

### 1. Install the SDK

```bash
npm install @ledsreact/sdk
```

The package ships ESM + CommonJS + TypeScript declarations with zero runtime dependencies. All types are exported directly from `@ledsreact/sdk` — no separate types file needed.

### 2. Environment Variables

Required in `.env.local`:

```text
LEDSREACT_API_KEY=your_api_key_here
LEDSREACT_REGION=EU
```

Regional base URLs (handled automatically by the SDK):

| Region | Base URL |
|--------|----------|
| `Region.EU` | `https://open-api.eu.ledsreact.com` |
| `Region.US` | `https://open-api.us.ledsreact.com` |

### 3. Server-Side SDK Client

Create `src/lib/ledsreact.ts`:

```typescript
import { LedsreactClient, Region } from "@ledsreact/sdk";

export const ledsreact = new LedsreactClient({
  apiKey: process.env.LEDSREACT_API_KEY!,
  region: process.env.LEDSREACT_REGION === "US" ? Region.US : Region.EU,
});
```

The SDK handles rate limiting (429), server errors (5xx), and network failures automatically with exponential backoff (configurable via `maxRetries`, default: 3).

## API Route Example

Create `src/app/api/ledsreact/players/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { ledsreact } from "@/lib/ledsreact";
import { NotFoundError } from "@ledsreact/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const data = await ledsreact.players.list({
      firstname: searchParams.get("firstname") || undefined,
      lastname: searchParams.get("lastname") || undefined,
      exact: searchParams.get("exact") === "true" || undefined,
      skip: Number(searchParams.get("skip")) || undefined,
      take: Number(searchParams.get("take")) || 10,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Failed to fetch players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
```

## Available SDK Services

| Service | Key Methods |
|---------|-------------|
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

For full method signatures, parameters, and return types, see the [SDK reference](./references/ledsreact-sdk-typescript.md) and [type reference](./references/types.md).

## Exercise Template UIDs

| UID | Description |
|-----|-------------|
| `Sprint` | Linear sprint measuring acceleration and maximum speed |
| `COD` | Change of Direction — sprint with 180° turnaround |
| `TTest` | T-Test — multi-directional agility in a T-shaped pattern |
| `FiveTenFive` | 5-10-5 — lateral shuttle drill |
| `AgilityBox` | Agility Box — reactive agility within a square box |
| `MasterCheckpointLong` | Custom checkpoint-based reactive agility ("Custom Test" in the app) |

Use these UIDs in `exerciseTemplateUids` filters — comma-separate for multiple: `"Sprint,COD"`.

## Common Metric Keys

| Metric Key | Unit | Description |
|------------|------|-------------|
| `total_time_s` | s | Total exercise duration |
| `totaltimereactiontime_s` | s | Net time (excluding reaction time) |
| `reactiontime_s` | s | Reaction time |
| `max_speed_ms` | m/s | Maximum speed |
| `avg_speed_ms` | m/s | Average speed |
| `max_acceleration_ms2` | m/s² | Maximum acceleration |
| `max_deceleration_ms2` | m/s² | Maximum deceleration |

Zone metrics follow the pattern: `zone_{name}_{metric}_{unit}` (e.g. `zone_0-5_maxspeed_ms`).

Force-Velocity Profile (sprints >= 20m): `f0` (N/kg), `v0_ms` (m/s), `p_max` (W/kg).

## Pagination

The SDK uses two pagination styles depending on the endpoint:

**Skip/Take** — used by Players, Teams, Sessions:
```typescript
const result = await ledsreact.players.list({ skip: 0, take: 25 });
// result.data — PlayerEntity[], result.count — total
```

**Page/Limit** — used by Exercises, Attempts, Exercise Templates:
```typescript
const result = await ledsreact.exerciseAttempts.list({ page: 1, limit: 25 });
// result.data — AttemptResponseDto[], result.total, result.page, result.totalPages
```

See the [SDK reference pagination section](./references/ledsreact-sdk-typescript.md#pagination) for iteration examples.

## Error Handling

The SDK throws typed errors. Import them directly:

```typescript
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "@ledsreact/sdk";

try {
  const player = await ledsreact.players.getById(999);
} catch (error) {
  if (error instanceof NotFoundError) {
    // 404 — resource not found
  } else if (error instanceof AuthenticationError) {
    // 401 — invalid API key
  } else if (error instanceof RateLimitError) {
    // 429 — rate limited (auto-retried, this means retries exhausted)
    console.log(`Retry after: ${error.retryAfter}s`);
  }
}
```

All errors extend `LedsreactError` with a `statusCode` property. See the [SDK error reference](./references/ledsreact-sdk-typescript.md#error-handling) for the full list.

## Example: Player Dashboard Component

```tsx
"use client";

import { useEffect, useState } from "react";
import type { PlayerEntity, FindPlayersResponse } from "@ledsreact/sdk";

export function PlayerList() {
  const [players, setPlayers] = useState<PlayerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/ledsreact/players?take=50");
        if (!response.ok) throw new Error("Failed to fetch");
        const data: FindPlayersResponse = await response.json();
        setPlayers(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
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
      {players.map((player) => (
        <li key={player.id}>
          {player.firstname} {player.lastname}
        </li>
      ))}
    </ul>
  );
}
```

Note: Client components import SDK types for type safety, but never instantiate the client. All data flows through the `/api/ledsreact/*` proxy routes.

## Important: `withCharts` Warning

The `charts` field on attempts is very large. Keep `withCharts` set to `false` (the default) unless you specifically need chart data for a single session or attempt. Never use `withCharts: true` for bulk fetching. For performance data, use the metrics endpoints instead.

## Rate Limits

- General API: 100 requests/minute
- Datapoint exports: 10 requests/minute

The SDK handles rate limiting automatically with exponential backoff. If retries are exhausted, a `RateLimitError` is thrown.

## Security Checklist

- API key stored in environment variable, not in code
- SDK client only instantiated in server-side code (API routes, Server Actions)
- No API key in client components or browser
- `.env.local` added to `.gitignore`
- Error responses don't leak sensitive information
