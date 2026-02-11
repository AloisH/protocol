# Protocol Documentation Index

Central docs for Protocol — local-first PWA for personal routine tracking.

---

## Quick Start

1. **[Project Architecture](./System/project_architecture.md)** — Goals, tech stack, structure, patterns, gotchas
2. **[Storage Schema](./System/storage_schema.md)** — Dexie.js tables, indexes, migrations, query patterns
3. **[Protocols System](./System/protocols_system.md)** — Protocol/activity/group management
4. **[Session System](./System/session_system.md)** — Execution mode, timer, state machine
5. **[Daily System](./System/daily_system.md)** — Today's dashboard, scheduling, streaks
6. **[Analytics System](./System/analytics_system.md)** — Charts, metrics, calendar heatmap

Then refer to SOPs for specific tasks.

---

## System Documentation

### Core

- **[Project Architecture](./System/project_architecture.md)**
  - Tech stack (Nuxt 4, Dexie.js, Nuxt UI v4, Tailwind 4)
  - Directory structure
  - Local-first design, auto-imports, state management
  - Composable reference table
  - Key configuration (nuxt.config, PWA, security)
  - Gotchas

### Storage

- **[Storage Schema](./System/storage_schema.md)**
  - All 8 Dexie tables (Protocol, Activity, ActivityGroup, TrackingLog, DailyCompletion, Settings)
  - Entity relationships
  - Indexes and compound indexes
  - Migration history (v1-v5)
  - Query patterns
  - Zod schema reference
  - Export format

### Feature Systems

- **[Protocols System](./System/protocols_system.md)**
  - Protocol CRUD, status transitions
  - Activity types (warmup, exercise, supplement, habit)
  - Activity groups, drag-and-drop
  - Scheduling (daily/weekly/monthly/yearly/custom)
  - Composables: useProtocols, useActivities, useActivityGroups

- **[Session System](./System/session_system.md)**
  - Execution mode state machine (loading→active→rest→summary)
  - Timer, rest phases, audio feedback
  - Per-activity tracking (sets, reps, weight, doses)
  - Session save logic (upsert TrackingLogs + DailyCompletion)
  - Composables: useSession, useTimer, useBeep

- **[Daily System](./System/daily_system.md)**
  - Today's dashboard (progress ring, quick toggle)
  - Schedule filtering logic
  - Streak calculation (day-of-week aware)
  - Completion rate calculation
  - Notification reminders plugin
  - Composable: useDaily

- **[Analytics System](./System/analytics_system.md)**
  - Completion trend chart (Chart.js)
  - Calendar heatmap (90 days)
  - Protocol stats (rate, streak, total)
  - Time range filtering
  - Composable: useAnalytics

---

## SOPs (Standard Operating Procedures)

- **[Dexie Schema Updates](./SOP/dexie_schema_updates.md)**
  - Version bumping, index syntax
  - Data migration with .upgrade()
  - TypeScript interface + Zod schema updates
  - Common scenarios, gotchas

- **[Adding Pages](./SOP/adding_pages.md)**
  - File-based routing conventions
  - SSR guard pattern
  - Navigation, dynamic routes
  - Forms with Zod validation
  - Nuxt UI v4 notes

- **[Troubleshooting](./SOP/troubleshooting.md)**
  - IndexedDB/Dexie issues
  - Nuxt UI v4 API gotchas
  - Build & type errors
  - Development environment fixes
  - Quick fixes table

---

## Plans

Implementation plans for features:

- `plans/026-progress-tracking.md`
- `plans/027-data-export-import.md`
- `plans/session-logging.md`

---

## Component-Level Docs

- `app/CLAUDE.md` — App layer patterns (pages, components, composables, forms)
- `app/components/protocols/CLAUDE.md` — Protocol component patterns
- `app/components/shared/CLAUDE.md` — Shared component patterns

---

## Directory Tree

```
.agent/
├── README.md                          # This index
├── System/
│   ├── project_architecture.md        # Tech stack, structure, patterns
│   ├── storage_schema.md              # Dexie tables, migrations, queries
│   ├── protocols_system.md            # Protocol/activity/group management
│   ├── session_system.md              # Execution mode, timer
│   ├── daily_system.md                # Today's view, scheduling, streaks
│   └── analytics_system.md            # Charts, metrics, heatmap
├── SOP/
│   ├── dexie_schema_updates.md        # Schema change workflow
│   ├── adding_pages.md                # Page creation guide
│   └── troubleshooting.md             # Common issues and fixes
└── plans/                             # Feature implementation plans
```

---

_Last updated: 2026-02-11_
