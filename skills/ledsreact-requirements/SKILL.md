---
name: ledsreact-requirements
description: Translate functional requirements and coach-level intent into Ledsreact-grounded specifications. Maps requests to real Ledsreact entities, metrics, and data structures without writing code. Use when planning features, translating research protocols, or converting non-technical requests into implementation specs.
metadata:
  author: ledsreact
  version: "1.0"
---

# Ledsreact Requirements Translator

This skill translates non-technical functional requests (coach-level intent) into Ledsreact-aligned implementation specifications. It produces high-level requirements that can be consumed by technical skills like `ledsreact-webapp`.

**IMPORTANT**: This skill does NOT implement code. It produces structured specification documents.

## The Job

1. Receive a free-form request (feature idea, research protocol, coach need)
2. Ask 3-5 critical clarifying questions (if needed)
3. Translate intent into Ledsreact-aligned requirements
4. Output a structured specification document

---

## Clarifying Questions

Before translating, ask clarifying questions to understand the request. Use numbered questions with lettered options for easy responses (e.g., "1A", "2C").

### Rules for Questions

- Ask 3-5 questions maximum
- Only ask questions when genuinely uncertain
- Skip questions if the request is already clear
- Let users type "Other" for custom answers

### Sample Questions

**1. Who is the primary user?**
- A) Coach (tactical decisions, lineup selection)
- B) Sports scientist (performance analysis, load monitoring)
- C) Rehab specialist (return-to-play tracking)
- D) Mixed (multiple roles)

**2. What is the main purpose?**
- A) Monitor individual performance over time
- B) Compare athletes against benchmarks or each other
- C) Validate a testing protocol or research study
- D) Generate reports for stakeholders

**3. What data level matters most?**
- A) Individual attempts (single-run analysis)
- B) Session summaries (per-workout view)
- C) Trends over time (progression charts)
- D) All of the above

**4. Which exercise types are relevant?**
- A) Sprint tests only
- B) Agility tests (COD, T-Test, 5-10-5)
- C) Custom checkpoint tests
- D) Multiple types

**5. What unit system should be used?**
- A) Metric (meters, m/s, km/h)
- B) Imperial (yards, ft/s, mph)

**6. For speed display, which unit is preferred?** (if metric selected)
- A) m/s (meters per second)
- B) km/h (kilometers per hour)

---

## Output Specification Template

Your output must follow this structure. All sections are required.

### 1. Overview

Brief summary of:
- The problem being solved
- What decisions this tool will support
- Who benefits and how

### 2. Users and Context

For each user role:
- Role name
- When they use it (training, match day, weekly review)
- What they need to accomplish
- Key decisions they make with this data

### 3. Screens and User Flows

For each screen or view:

```
Screen: [Name]
Purpose: [What decision it supports]
Inputs: [Required data to render this screen]
Filters: [Available filtering options]
Outputs: [What the user sees/gets]
Interactions: [Actions the user can take]
```

### 4. Mapping to Ledsreact Data Model

Explicitly map to real Ledsreact entities:

| Concept in Request | Ledsreact Entity | API Endpoint |
|-------------------|------------------|--------------|
| "athlete" | Player | `/players` |
| "squad" | Team | `/teams` |
| "test result" | Attempt | `/exercise-attempt` |
| "test session" | Session | `/exercise-session` |

**Core Entities:**
- **Club** - Organization that owns all data
- **Profile** - User membership within a club
- **Player** - An athlete with attributes (height, weight, birthDate, positions)
- **Team** - Group of players (has level: YOUTH, AMATEUR, PRO)
- **Exercise Template** - Blueprint for test type (Sprint, COD, etc.)
- **Exercise** - Configured instance of a template
- **Session** - A testing session with selected players
- **Attempt** - Single run by one player in a session
- **Attempt Metric** - Normalized metric value from an attempt
- **Timeseries** - High-resolution position/speed data

### 5. Metrics Mapping

For each insight or KPI mentioned in the request:

| Requested Insight | Ledsreact Metric | Unit | Level | Source |
|-------------------|------------------|------|-------|--------|
| "top speed" | `max_speed_ms` | m/s | attempt | `/metrics/attempt/{id}` |
| "reaction time" | `reactiontime_s` | s | attempt | `/metrics/attempt/{id}` |

**Level definitions:**
- **attempt** - Single run value
- **session** - Aggregated across session attempts
- **player trend** - Progression over time for one player
- **team aggregate** - Team average, min, max, etc.

**If a metric is NOT available**, mark it clearly and suggest alternatives:
> "Jump height is NOT measured by Ledsreact. Alternative: Use external jump mat data or remove this requirement."

### 6. Protocol/Paper Translation (if applicable)

When translating a research protocol or published study:

**Required Outcomes from Study:**
- List each outcome variable the study measures

**Matching Ledsreact Exercise Types:**
- Map study protocol to Ledsreact exercise templates

**Exercise Configuration:**
- Distance, direction, repetitions, rest intervals
- Any variables that must be standardized

**Limitations:**
- What the study measures that Ledsreact cannot capture
- Suggested workarounds or scope reductions

### 7. Functional Requirements

Numbered, testable requirements:

```
FR-1: The system SHALL display max speed for each sprint attempt.
FR-2: The system SHALL allow filtering attempts by date range.
FR-3: The system SHALL calculate team average for selected metrics.
```

Use SHALL for required features, SHOULD for recommended features.

### 8. Non-Goals

Explicit list of what the app will NOT do:

```
- Will NOT track jump height (not measurable by Ledsreact)
- Will NOT integrate with GPS systems
- Will NOT provide live streaming during tests
```

### 9. Acceptance Criteria

Concrete, verifiable statements:

```
AC-1: Given a player with 5 sprint attempts, when viewing their profile, I see all 5 results listed.
AC-2: Given a team filter, when selected, only players from that team appear.
AC-3: Given a date range of "last 30 days", only attempts within that range are included.
```

### 10. Assumptions and Open Questions

**Assumptions:**
- List assumptions made during translation

**Open Questions:**
- Questions that need stakeholder input before implementation

---

## Ledsreact Data Model Reference

### Supported Exercise Templates

| Template UID | Description | Max Distance | Notes |
|--------------|-------------|--------------|-------|
| `Sprint` | Linear sprint | 40m | Also covers curvilinear sprints |
| `COD` | Change of direction | 15m out + 15m back | 180° turn (e.g., 5-0-5 test) |
| `AgilityBox` | Box agility drill | 2m, 3m, or 4m sides | Square pattern |
| `TTest` | T-Test agility | Standard T | Direction: right, left, or random |
| `FiveTenFive` | 5-10-5 shuttle | 5yd + 10yd + 5yd | Pro agility test |
| `MasterCheckpointLong` | Custom checkpoint test | Variable | Y-Drill, Front-and-Back, etc. |

### Common Metrics

**Top-Level Metrics:**

| Metric Key | Description | Unit |
|------------|-------------|------|
| `total_time_s` | Total exercise duration | seconds |
| `totaltimereactiontime_s` | Net time (excluding reaction) | seconds |
| `reactiontime_s` | Reaction time | seconds |
| `max_speed_ms` | Maximum speed | m/s |
| `max_speed_kmh` | Maximum speed | km/h |
| `max_speed_fts` | Maximum speed | ft/s |
| `max_speed_mph` | Maximum speed | mph |
| `avg_speed_ms` | Average speed | m/s |
| `avg_acceleration_ms2` | Average acceleration | m/s² |
| `max_acceleration_ms2` | Maximum acceleration | m/s² |
| `avg_deceleration_ms2` | Average deceleration | m/s² |
| `max_deceleration_ms2` | Maximum deceleration | m/s² |

**Force-Velocity Profile (FVP) Metrics** (sprints >= 20m):

| Metric Key | Description | Unit |
|------------|-------------|------|
| `f0` | Theoretical max force | N/kg |
| `v0_ms` | Theoretical max velocity | m/s |
| `fv_slope` | Force-velocity slope | - |
| `p_max` | Maximum power | W/kg |
| `v_opt_ms` | Optimal velocity | m/s |
| `rf_max` | Maximum ratio of force | % |
| `drf` | Decrease in ratio of force | %/s |

**Zone Metrics:**

Pattern: `zone_{distance_range}_{metricType}_{unit}`

Examples:
- `zone_0-5_duration_s` - Time through 0-5m zone
- `zone_0-5_maxspeed_ms` - Max speed in 0-5m zone
- `zone_5-10_starttime_s` - Time to reach 5m mark
- `zone_10-15_avgacceleration_ms2` - Avg acceleration in 10-15m zone

**Phase Metrics:**

- `zone_acceleration_*` - Metrics during acceleration phase
- `zone_deceleration_*` - Metrics during deceleration phase
- `zone_reacceleration_*` - Metrics during re-acceleration (COD)
- `zone_left_*`, `zone_right_*`, `zone_middle_*` - Direction-specific (T-Test)
- `zone_start_*`, `zone_finish_*` - Start/finish phases

### Key API Endpoints

| Endpoint | Purpose | Key Filters |
|----------|---------|-------------|
| `/exercise-attempt` | List attempts | `playerIds`, `teamIds`, `exerciseIds`, `dateStart`, `dateEnd`, `exerciseTemplateUids` |
| `/metrics/summary/players` | Player metric summaries | `playerIds`, `teamIds`, `metricNames`, `dateStart`, `dateEnd` |
| `/metrics/summary/group` | Team/group aggregates | Same as above |
| `/metrics/attempt/{attemptId}` | Single attempt metrics | - |
| `/metrics/session/{sessionId}` | Session metrics | - |
| `/timeseries/attempt/{attemptId}` | High-res timeseries | - |
| `/players` | List players | `firstname`, `lastname`, `skip`, `take` |
| `/teams` | List teams | - |
| `/teams/{id}/players` | Team roster | - |

---

## Scope Boundaries

### What Ledsreact Measures (IN SCOPE)

Ledsreact uses radar technology to track athlete movement in 2D (x, y plane):

- **Position tracking** - x, y coordinates over time
- **Sprint performance** - speed, acceleration, deceleration profiles
- **Split times** - time to reach specific distance markers
- **Change of direction** - COD metrics, turn times
- **Reaction time** - time from signal to first movement
- **Force-velocity profile** - derived from sprint data (F0, V0, Pmax)
- **Zone-based metrics** - performance in specific distance zones

### What Ledsreact Does NOT Measure (OUT OF SCOPE)

- **Jump height or vertical displacement** - No vertical tracking
- **Heart rate or physiological data** - No biometric sensors
- **GPS/outdoor field tracking** - Indoor radar system only
- **Contact time or ground reaction forces** - No force plates
- **3D movement** - Only 2D (x, y) plane
- **Ball tracking** - Athlete tracking only
- **Video analysis** - Position data only (no computer vision)

**When a request includes out-of-scope measurements:**
1. Clearly state the limitation
2. Suggest alternatives using available data
3. Recommend external data sources if needed

---

## Mapping Rules

1. **Never invent metrics, fields, or endpoints** - Only use what exists in the Ledsreact API
2. **Stay within capability boundaries** - Be explicit about what cannot be measured
3. **Prefer stored metrics over derivations** - Use `max_speed_ms` rather than calculating from timeseries
4. **Distinguish stored vs derived** - Mark calculations clearly (e.g., "team average calculated from individual values")
5. **Be conservative with protocol translation** - When a study requires something Ledsreact can't measure, say so
6. **Clarify unit preferences early** - Metric vs imperial, m/s vs km/h
7. **Map to actual entity names** - Use "Player" not "athlete", "Attempt" not "rep"

---

## Writing Style Rules

- Use plain language, avoid jargon
- Be explicit over clever
- Assume the reader may be a junior developer or AI agent
- Prioritize clarity over brevity
- Use tables for structured information
- Use code blocks for metric names and endpoints

---

## Output Rules

- Produce a single structured document
- No code snippets (leave that for implementation skills)
- No UI mockups or wireframes
- No implementation details (database schemas, component structures)
- Always be implementation-ready (a developer or AI should be able to build from this spec)

---

## Example Output Structure

```markdown
# Requirements Specification: [Feature Name]

## 1. Overview
[Brief summary]

## 2. Users and Context
[Role descriptions]

## 3. Screens and User Flows
[Screen definitions]

## 4. Mapping to Ledsreact Data Model
[Entity mapping table]

## 5. Metrics Mapping
[Metrics table with sources]

## 6. Protocol/Paper Translation
[If applicable]

## 7. Functional Requirements
FR-1: ...
FR-2: ...

## 8. Non-Goals
- ...

## 9. Acceptance Criteria
AC-1: Given..., when..., then...

## 10. Assumptions and Open Questions
**Assumptions:**
- ...

**Open Questions:**
- ...
```
