# Plan: Progress Tracking & Charts (#26)

## Overview
Analytics page with completion metrics, streaks, and progress charts.

## Lib Choice
**unovis** - Vue-native, lightweight, tree-shakeable. Or **Chart.js** + vue-chartjs if more features needed.

## Changes

### 1. Install chart lib
```bash
bun add @unovis/vue @unovis/ts
```

### 2. Create analytics page (`app/pages/analytics.vue`)
- Protocol selector dropdown
- Time range selector (7d/30d/90d)
- Completion rate card
- Current streak card
- Calendar heatmap (completion days)
- Line chart (completion trend)

### 3. Create components
- `analytics/CompletionCalendar.vue` - heatmap grid
- `analytics/CompletionChart.vue` - line chart
- `analytics/MetricCard.vue` - stat display card
- `analytics/ProtocolSelector.vue` - dropdown

### 4. Extend `useAnalytics.ts`
- `getCalendarData(protocolId, days)` - returns dates with completion status
- `getDailyCompletionTrend(protocolId, days)` - for line chart
- `getActivityProgress(activityId, days)` - weight/reps over time (exercise type)

## Implementation Order
1. Install deps
2. MetricCard component
3. Analytics page skeleton
4. Calendar heatmap
5. Line chart

## Files
```
app/pages/analytics.vue (new)
app/components/analytics/MetricCard.vue (new)
app/components/analytics/CompletionCalendar.vue (new)
app/components/analytics/CompletionChart.vue (new)
app/composables/useAnalytics.ts (edit)
```

## Questions
- Include activity-level progress charts (weight/reps)?
- Export analytics data?
