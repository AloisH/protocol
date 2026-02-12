# Session Logging Implementation Plan

## Overview
Add session logging to daily view - log activities with actual values, notes, and session rating.

## Design Decisions
- **Rating scope**: Per-protocol session (1-5 stars) added to DailyCompletion
- **UI approach**: Modal from daily view instead of simple toggle
- **Data strategy**: Reuse TrackingLog for activity data, extend DailyCompletion for rating

## Schema Changes

### 1. DailyCompletion Extension

**File:** `shared/db/schema.ts`

```typescript
interface DailyCompletion {
  // existing...
  rating?: number;  // 1-5 session rating
}
```

**Migration:** Dexie v4 - no data migration needed (optional field)

### 2. Validation Schema

**File:** `shared/schemas/db.ts`

Add `DailyCompletionSchema` with rating field (1-5).

## Composables

### useSession (new)

**File:** `app/composables/useSession.ts`

```typescript
function useSession(protocolId: string) {
  // State
  activityLogs: Map<activityId, { completed, values }>
  sessionNotes: string
  sessionRating: number

  // Methods
  loadSession(date)      // Load existing logs for date
  toggleActivity(id)     // Mark activity done/undone
  updateActivityValues() // Update sets/reps/weight/duration
  saveSession()          // Save all TrackingLogs + DailyCompletion
}
```

### useDaily updates

- `completeProtocol()` accepts rating parameter
- `getSessionForToday(protocolId)` returns existing session data

## Components

### 1. SessionModal.vue

**File:** `app/components/session/SessionModal.vue`

**Props:** `protocolId`, `modelValue`

**Features:**
- Header: Protocol name + date
- Activity checklist with type-specific inputs
- Notes textarea
- 1-5 star rating
- Save/Cancel buttons

### 2. SessionActivityItem.vue

**File:** `app/components/session/SessionActivityItem.vue`

**Props:** `activity`, `log`, `modelValue`

**Features:**
- Checkbox for completion
- Dynamic fields based on activityType:
  - exercise: sets, reps, weight inputs
  - supplement: taken checkbox (binary)
  - warmup: duration input
  - habit: done checkbox (binary)
- Inline notes field

### 3. SessionRating.vue

**File:** `app/components/session/SessionRating.vue`

**Props:** `modelValue` (1-5)

**Features:**
- 5 star/emoji icons
- Click to rate
- Optional labels (Bad/OK/Good/Great/Perfect)

## Page Updates

### Daily View (pages/index.vue)

**Changes:**
- Replace `handleToggle` with `openSession(protocolId)`
- Add SessionModal to template
- Track `activeSession: string | null`

**New flow:**
1. Click protocol card → Open SessionModal
2. Fill in activity values
3. Add notes + rating
4. Save → Creates TrackingLogs + updates DailyCompletion

## Implementation Order

1. Schema + validation (DailyCompletion rating)
2. useSession composable
3. SessionActivityItem component
4. SessionRating component
5. SessionModal component
6. Daily view integration

## Files to Create
- `app/composables/useSession.ts`
- `app/components/session/SessionModal.vue`
- `app/components/session/SessionActivityItem.vue`
- `app/components/session/SessionRating.vue`

## Files to Modify
- `shared/db/schema.ts` - Add rating to DailyCompletion
- `shared/schemas/db.ts` - Add DailyCompletionSchema
- `app/composables/useDaily.ts` - Support rating
- `app/pages/index.vue` - Session modal integration
