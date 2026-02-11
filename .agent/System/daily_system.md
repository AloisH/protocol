# Daily Dashboard System

**Related docs:** [Protocols System](./protocols_system.md), [Session System](./session_system.md), [Analytics System](./analytics_system.md)

---

## Overview

Home page (`/`) shows today's scheduled protocols with progress tracking, streaks, and quick-complete actions.

---

## Page: `/` (index.vue)

**Features:**
- Progress ring showing completed/total protocols
- Protocol cards with quick toggle (mark complete)
- Streak badges per protocol
- "Start Session" button → `/execute/[protocolId]`
- Quick action links (All Protocols, Analytics)

---

## Composable: useDaily

**File:** `app/composables/useDaily.ts`

**State (SSR-safe via `useState()`):**
- `todaysProtocols` — Active protocols scheduled for today
- `completions` — Today's DailyCompletion records
- `loading`, `error`
- `today` — Computed YYYY-MM-DD string
- `progress` — Computed `{ total, completed, percentage }`

**Methods:**
- `loadToday()` — Fetch active protocols, filter by schedule, load completions
- `isCompletedToday(protocolId)` — Check if protocol has DailyCompletion for today
- `completeProtocol(protocolId, notes?)` — Add DailyCompletion
- `uncompleteProtocol(protocolId)` — Remove DailyCompletion
- `toggleCompletion(protocolId)` — Toggle complete/uncomplete
- `getStreak(protocolId)` — Calculate consecutive completion streak
- `getCompletionRate(protocolId, days=30)` — Completion % over period

### Schedule Filtering Logic

`isScheduledToday(protocol)`:
- If `scheduleDays` set → check current day against list
- `daily` → always true
- `weekly` → Monday only
- `monthly` → First Monday of month
- `yearly` → January 1st
- `custom` without scheduleDays → false

### Streak Calculation

For daily/custom-day protocols:
- Walk backwards through calendar days
- Only count scheduled days (skip non-scheduled days)
- Break on first missed scheduled day
- Max lookback: 365 days

For weekly/monthly:
- Total completion count (consecutive not applicable)

### Completion Rate

Adjusts denominator based on schedule:
- `daily` → completions / days
- `weekly` → completions / weeks
- `custom` → completions / scheduled days in period

---

## Notifications Plugin

**File:** `app/plugins/notifications.client.ts`

Client-only plugin that checks daily:
1. Notifications enabled in settings?
2. Permission granted?
3. Today is a reminder day?
4. Past reminder time?
5. Incomplete protocols exist?

Uses `localStorage` to track last reminder date (avoid duplicates).

---

_Last updated: 2026-02-11_
