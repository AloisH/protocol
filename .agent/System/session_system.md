# Session Execution System

**Related docs:** [Protocols System](./protocols_system.md), [Daily System](./daily_system.md), [Storage Schema](./storage_schema.md)

---

## Overview

Full-screen protocol execution mode at `/execute/[protocolId]`. Guides user through activities sequentially with timer, rest phases, and session summary.

---

## Page: `/execute/[protocolId]`

**File:** `app/pages/execute/[protocolId].vue`

### State Machine

```
loading → active → rest → summary
```

- **loading**: Fetch protocol + activities, init session
- **active**: User works through current activity (toggle sets, mark done)
- **rest**: Rest timer between sets/activities (auto-advance)
- **summary**: Session complete — show completion %, rating, notes

### Features

- Timer with visual ring progress (useTimer composable)
- Auto-advance after warmup duration or set completion
- Rest timer between sets (configurable restTime per activity)
- Pause/play capability
- Skip activity button
- Audio beep on timer completion (useBeep composable)
- Summary screen with:
  - Completion percentage
  - 1-5 star rating (SessionRating component)
  - Session notes
  - Save to DB

---

## Composable: useSession

**File:** `app/composables/useSession.ts`

**State:**
- `protocolId` — Current protocol
- `sessionDate` — Date string (YYYY-MM-DD)
- `activityLogs` — `Map<activityId, ActivityLog>` tracking per-activity state
- `sessionNotes`, `sessionRating` — Summary fields
- `loading`, `error`
- `completedCount`, `totalCount` — Computed from activityLogs

**ActivityLog interface:**
```typescript
interface ActivityLog {
  activityId: string;
  completed: boolean;
  setsDone?: number;
  repsDone?: number;
  weightUsed?: number;
  durationTaken?: number;
  dosesCompleted?: boolean[];  // per-dose for supplements
  notes?: string;
}
```

**Methods:**
- `initSession(protocolId, date?)` — Load activities + existing logs for today
- `updateActivityLog(activityId, updates)` — Partial update to activity log
- `toggleActivity(activityId)` — Toggle completion (also toggles all doses)
- `toggleDose(activityId, doseIndex)` — Toggle individual dose; auto-completes activity when all doses done
- `saveSession()` — Persist all TrackingLogs + DailyCompletion to DB

### Save Logic

1. For each activity: upsert TrackingLog (check existing by activityId+date range)
2. Upsert DailyCompletion (check existing by [protocolId+date] compound index)
3. Uses `nanoid()` for new IDs, reuses existing IDs for updates

---

## Supporting Composables

### useTimer (`app/composables/useTimer.ts`)

State machine for countdown timers:
- `start(seconds)`, `pause()`, `resume()`, `reset()`
- `remaining` — Seconds left
- `isRunning` — Active state

### useBeep (`app/composables/useBeep.ts`)

Audio feedback via Web Audio API:
- `playBeep(frequency, duration)` — Tone on timer completion

---

## Components

| Component | Purpose |
|-----------|---------|
| `SessionActivityItem.vue` | Activity item in session with type-specific controls |
| `SessionModal.vue` | Summary modal: notes textarea, rating, save button |
| `SessionRating.vue` | 5-star rating component (1-5 scale) |

---

_Last updated: 2026-02-11_
