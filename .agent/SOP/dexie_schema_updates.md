# SOP: Dexie.js Schema Updates

**Related docs:** [Storage Schema](../System/storage_schema.md), [Project Architecture](../System/project_architecture.md)

---

## Overview

How to safely modify the Dexie.js IndexedDB schema. Dexie uses version-based migrations — each schema change requires a new version number.

---

## Step-by-Step

### 1. Bump Version in schema.ts

Edit `shared/db/schema.ts`. Add a new `this.version(N)` call in the `ProtocolDB` constructor:

```typescript
// Existing
this.version(5).stores({ ... });

// New version
this.version(6).stores({
  protocols: '++id, status, createdAt',
  activities: '++id, protocolId, groupId, order',
  activityGroups: '++id, protocolId, order',
  trackingLogs: '++id, activityId, [activityId+date]',
  settings: '++userId',
  dailyCompletions: '++id, protocolId, date, [protocolId+date]',
  // Keep legacy tables for compat
  routines: '++id, protocolId, order',
  exercises: '++id, routineId',
  // Add new table or modify indexes here
  newTable: '++id, someField',
});
```

**IMPORTANT:** Every version must declare ALL tables, not just changed ones. Copy the full store definition from the previous version and modify.

### 2. Add Data Migration (if needed)

If you need to transform existing data:

```typescript
this.version(6).stores({ ... }).upgrade(async (tx) => {
  const items = await tx.table('activities').toArray();
  for (const item of items) {
    if (needsMigration(item)) {
      await tx.table('activities').update(item.id, {
        newField: computeValue(item),
      });
    }
  }
});
```

### 3. Update TypeScript Interface

Add/modify the interface in `shared/db/schema.ts`:

```typescript
export interface NewTable {
  id: string;
  someField: string;
  // ...
}
```

Add the table property to `ProtocolDB`:

```typescript
export class ProtocolDB extends Dexie {
  newTable!: Table<NewTable>;
  // ... existing tables
}
```

### 4. Add Zod Schema

Create/update schema in `shared/schemas/db.ts`:

```typescript
export const NewTableSchema = z.object({
  id: z.string().min(1),
  someField: z.string(),
});
```

### 5. Update Export Schema (if applicable)

If the new table should be included in data export, update `shared/schemas/export.ts`.

### 6. Test

```bash
bun run typecheck
bun run test:run
```

Test in browser: clear IndexedDB, reload, verify migration runs.

---

## Index Syntax Reference

| Syntax | Meaning |
|--------|---------|
| `++id` | Auto-increment primary key |
| `field` | Indexed field |
| `[a+b]` | Compound index |
| `*field` | Multi-entry index (array values) |
| `&field` | Unique index |

---

## Common Scenarios

### Add New Table

1. Add interface + Table property
2. Add store definition in new version
3. Add Zod schema

### Add Index to Existing Table

1. New version with updated store for that table
2. No upgrade function needed (Dexie handles index creation)

### Rename/Transform Field

1. New version with same store definition
2. Add `.upgrade()` to transform data
3. Update interface

### Remove Table

Don't remove — keep in stores for backward compat. Just stop using it in code.

---

## Gotchas

1. **Version numbers must be sequential** — Can't skip versions
2. **All tables in every version** — Omitting a table from a version definition deletes it
3. **Upgrade runs once** — Per browser, per version. Can't re-run.
4. **Test fresh + existing** — Test both clean install and upgrade from previous version
5. **Legacy tables** — Keep routines/exercises tables even though deprecated (existing user data)

---

_Last updated: 2026-02-11_
