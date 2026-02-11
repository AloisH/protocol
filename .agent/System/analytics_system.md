# Analytics System

**Related docs:** [Daily System](./daily_system.md), [Storage Schema](./storage_schema.md)

---

## Overview

Analytics page (`/analytics`) with completion trends, calendar heatmap, and per-protocol stats.

---

## Page: `/analytics`

**Features:**
- Protocol filter dropdown (specific or all)
- Time range selector (7/30/90 days)
- Metric cards: avg completion %, best streak, total completions
- Completion trend line chart (Chart.js)
- Calendar heatmap (last 90 days)
- Protocol breakdown table with progress bars

---

## Composable: useAnalytics

**File:** `app/composables/useAnalytics.ts`

**State:** `loading`, `error` (readonly)

**Methods:**

### getCalendarData(protocolId?, days=90) → CalendarDay[]

Returns array of `{ date, completed, count }` for heatmap. Groups DailyCompletions by date. If protocolId null, includes all protocols.

### getCompletionTrend(protocolId?, days=30) → TrendPoint[]

Returns `{ date, rate }` for line chart. Calculates daily completion rate = completions / expected (based on active daily protocols). Capped at 100%.

### getProtocolStats(days=30) → ProtocolStats[]

Per-protocol stats:
```typescript
interface ProtocolStats {
  protocolId: string;
  name: string;
  completionRate: number;  // % over period
  streak: number;          // consecutive completions
  totalCompletions: number;
}
```

Sorted by completionRate descending. Adjusts expected count by duration (daily=days, weekly=days/7, monthly=days/30).

### getOverallStats(days=30)

Aggregates: `{ totalCompletions, avgRate, bestStreak }` across all active protocols.

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| AnalyticsCompletionChart | `analytics/AnalyticsCompletionChart.vue` | Line chart (vue-chartjs) showing trend |
| AnalyticsCompletionCalendar | `analytics/AnalyticsCompletionCalendar.vue` | 90-day calendar heatmap |
| AnalyticsMetricCard | `analytics/AnalyticsMetricCard.vue` | KPI card (title, value, icon) |

---

_Last updated: 2026-02-11_
