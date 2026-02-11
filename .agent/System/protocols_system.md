# Protocols & Activities System

**Related docs:** [Storage Schema](./storage_schema.md), [Session System](./session_system.md), [SOP: Dexie Schema Updates](../SOP/dexie_schema_updates.md)

---

## Overview

Core domain: Protocols contain Activities organized in optional Groups. Activities have 4 types: warmup, exercise, supplement, habit.

---

## Data Model

```
Protocol
  ├── ActivityGroup (optional grouping)
  │   └── Activity (grouped)
  └── Activity (ungrouped)
```

- Protocol defines schedule (daily/weekly/monthly/yearly/custom + scheduleDays)
- Activities define what to do (type-specific fields)
- Groups organize activities into collapsible sections

---

## Composables

### useProtocols (`app/composables/useProtocols.ts`)

**State:** `protocols`, `loading`, `error` (all readonly)

**Methods:**
- `loadProtocols()` — Fetch all from DB
- `createProtocol(data)` — Validate with ProtocolFormSchema, add to DB
- `updateProtocol(id, updates)` — Partial update, sets updatedAt
- `deleteProtocol(id)` — Delete protocol + cascade activities/groups/logs/completions
- `archiveProtocol(id)` — Set status='completed'
- `pauseProtocol(id)` / `resumeProtocol(id)` — Toggle active/paused

### useActivities (`app/composables/useActivities.ts`)

**State:** `activities`, `loading`, `error` (all readonly)

**Methods:**
- `loadActivities(protocolId)` — Fetch activities for protocol
- `createActivity(data)` — Validate with ActivityFormSchema
- `updateActivity(id, updates)` — Partial update
- `deleteActivity(id)` — Remove activity + tracking logs
- `reorderActivities(ids)` — Update order field
- `persistOrder(items)` — Save new order to DB
- `moveToGroup(activityId, groupId)` — Move activity between groups

**Computed:**
- `ungroupedActivities` — Activities without groupId
- `activitiesForGroup(groupId)` — Activities in specific group

### useActivityGroups (`app/composables/useActivityGroups.ts`)

**State:** `groups`, `loading`, `error`

**Methods:**
- `loadGroups(protocolId)` — Fetch groups for protocol
- `createGroup(data)` — Create new group
- `updateGroup(id, updates)` — Rename group
- `deleteGroup(id)` — Delete group (ungroups activities)
- `reorderGroups(ids)` — Update order

---

## Components

### Protocols

| Component | Purpose |
|-----------|---------|
| `ProtocolCard.vue` | Expandable card: name, status badge, activity count, duration label |
| `ProtocolForm.vue` | Create/edit modal: name, description, duration, scheduleDays |
| `DeleteProtocolDialog.vue` | Confirmation dialog with cascade warning |

### Activities

| Component | Purpose |
|-----------|---------|
| `ActivityCard.vue` | Activity display with type-specific info |
| `ActivityForm.vue` | Multi-type form (discriminated by activityType) |
| `ActivityList.vue` | Sortable list with drag-and-drop (vue-draggable-plus) |
| `ActivityGroupForm.vue` | Group create/edit |
| `ActivityGroupSection.vue` | Collapsible section with group activities |
| `DeleteActivityDialog.vue` | Delete confirmation |

---

## Activity Types

| Type | Fields | UI |
|------|--------|-----|
| warmup | duration, restTime | Duration picker |
| exercise | sets, reps, weight, equipmentType, restTime | Set/rep/weight inputs |
| supplement | doses[] (dosage, unit, timeOfDay, timing) | Multi-dose form |
| habit | (base fields only) | Simple checkbox |

---

## Scheduling

Protocol `duration` + optional `scheduleDays`:

- **daily**: Show every day
- **weekly**: Show on Mondays (default)
- **monthly**: Show first Monday of month
- **yearly**: Show January 1st
- **custom** + scheduleDays: Show on specific days (e.g. `['mon', 'wed', 'fri']`)

Custom day-of-week label shown on ProtocolCard instead of duration.

---

## Drag-and-Drop

Uses `vue-draggable-plus` for:
- Reordering activities within a group
- Reordering activity groups
- Moving activities between groups (cross-group drag)

Order persisted to DB via `persistOrder()`.

---

_Last updated: 2026-02-11_
