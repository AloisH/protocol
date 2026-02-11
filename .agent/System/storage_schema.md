# Storage Schema (Dexie.js / IndexedDB)

**Related docs:** [Project Architecture](./project_architecture.md), [SOP: Dexie Schema Updates](../SOP/dexie_schema_updates.md)

---

## Overview

All data stored client-side in IndexedDB via Dexie.js. Database name: `ProtocolDB`. No backend, no server-side persistence.

**Source:** `shared/db/schema.ts`

---

## Entity Relationship

```
Protocol (1) ──→ (N) ActivityGroup
Protocol (1) ──→ (N) Activity
ActivityGroup (1) ──→ (N) Activity (via groupId)
Protocol (1) ──→ (N) DailyCompletion
Activity (1) ──→ (N) TrackingLog
Activity[supplement] ──→ SupplementDose[] (embedded)
Settings (singleton per userId)
```

---

## Tables

### Protocol

```typescript
interface Protocol {
  id: string;                    // nanoid
  name: string;                  // max 100
  description?: string;          // max 500
  category: string;              // default 'general'
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  scheduleDays?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[];
  status: 'active' | 'paused' | 'completed';
  targetMetric?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:** `++id, status, createdAt`

### Activity

```typescript
interface Activity {
  id: string;
  protocolId: string;
  groupId?: string;              // FK to ActivityGroup
  name: string;
  activityType: 'warmup' | 'exercise' | 'supplement' | 'habit';
  order: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  // Exercise fields
  sets?: number;
  reps?: number;
  weight?: number;
  equipmentType?: string;
  // Supplement fields
  doses?: SupplementDose[];      // Multi-dose array
  // Warmup fields
  duration?: number;             // seconds
  restTime?: number;             // seconds (exercise/warmup)
  notes?: string;
}
```

**Indexes:** `++id, protocolId, groupId, order`

### SupplementDose (embedded in Activity)

```typescript
interface SupplementDose {
  dosage?: number;
  dosageUnit?: string;           // mg, ml, etc.
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  timing?: string;               // e.g. "with food"
}
```

### ActivityGroup

```typescript
interface ActivityGroup {
  id: string;
  protocolId: string;
  name: string;
  order: number;
}
```

**Indexes:** `++id, protocolId, order`

### TrackingLog

```typescript
interface TrackingLog {
  id: string;
  activityId: string;
  date: Date;
  completed: boolean;
  setsDone?: number;
  repsDone?: number;
  weightUsed?: number;
  durationTaken?: number;
  energyLevel?: number;          // 1-10
  difficultyFelt?: number;       // 1-10
  dosesCompleted?: boolean[];    // per-dose completion for supplements
  notes?: string;
}
```

**Indexes:** `++id, activityId, [activityId+date]`

### DailyCompletion

```typescript
interface DailyCompletion {
  id: string;
  protocolId: string;
  date: string;                  // YYYY-MM-DD format
  completedAt: Date;
  notes?: string;
  rating?: number;               // 1-5 session rating
}
```

**Indexes:** `++id, protocolId, date, [protocolId+date]`

### Settings

```typescript
interface Settings {
  userId: string;                // singleton key
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  reminderTime?: string;         // HH:MM format
  reminderDays?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[];
  restDaySchedule?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[];
}
```

**Indexes:** `++userId`

---

## Legacy Tables (deprecated)

Kept for migration compatibility, not used in new code:

- **routines** — Migrated to activities (type='habit') in v3
- **exercises** — Migrated to activities (type='exercise') in v3

---

## Migration History

| Version | Changes |
|---------|---------|
| v1 | Initial: protocols, routines, exercises, trackingLogs, settings |
| v2 | Added dailyCompletions table |
| v3 | Added activities table; migrated routines→activities, exercises→activities; trackingLogs: exerciseId→activityId |
| v4 | Added activityGroups table; added groupId index to activities |
| v5 | Migrated flat dosage/dosageUnit/timing → doses[] array for supplements |

---

## Query Patterns

**Load by protocol:**
```typescript
await db.activities.where('protocolId').equals(protocolId).toArray()
```

**Compound index query:**
```typescript
await db.dailyCompletions.where('[protocolId+date]').equals([protocolId, dateStr]).first()
```

**Date range filter:**
```typescript
await db.dailyCompletions.where('date').aboveOrEqual(startStr).toArray()
```

**Filter with callback:**
```typescript
await db.trackingLogs.where('activityId').equals(id).filter(l => l.date >= start && l.date <= end).toArray()
```

---

## Zod Schemas

Validation schemas mirror DB interfaces. Located in `shared/schemas/`:

- `db.ts` — Entity schemas: `ProtocolSchema`, `ActivitySchema`, `TrackingLogSchema`, `DailyCompletionSchema`, `SettingsSchema`
- `protocols.ts` — Form schema: `ProtocolFormSchema`
- `activities.ts` — Form schema: `ActivityFormSchema` (discriminated union by activityType)
- `export.ts` — `ExportDataSchema` (full backup format, version 1)

---

## Export Format

```typescript
{
  version: 1,
  exportedAt: Date,
  data: {
    protocols: Protocol[],
    activities: Activity[],
    trackingLogs: TrackingLog[],
    settings: Settings[],
    dailyCompletions: DailyCompletion[],
  }
}
```

---

_Last updated: 2026-02-11_
