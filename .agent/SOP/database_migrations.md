# SOP: Database Schema Migrations

**Related docs:** ../System/database_schema.md, ../System/project_architecture.md

---

## Overview

How to safely create and apply database schema changes using Prisma.

---

## Prerequisites

- PostgreSQL running (`docker compose up -d`)
- `DATABASE_URL` set in `.env`
- No uncommitted changes (recommended)

---

## Step-by-Step

### 1. Edit Schema

Edit `prisma/schema.prisma`:

```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  name     String
  newField String? // ← Add new field
}
```

**Common changes:**

- Add field: `newField String?`
- Rename field: `@@map("new_name")`
- Add relation: `posts Post[]`
- Add enum: `enum Status { ACTIVE INACTIVE }`
- Add index: `@@index([email])`

---

### 2. Create Migration

```bash
bun db:migrate
```

**Prompts:**

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "bistro", schema "public" at "localhost:5432"

✔ Enter a name for the new migration: › add_user_new_field
```

**What happens:**

1. Prisma compares current schema to DB
2. Generates SQL migration file
3. Creates `prisma/migrations/<timestamp>_add_user_new_field/migration.sql`
4. Applies migration to DB
5. Regenerates Prisma Client

**Example migration.sql:**

```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "newField" TEXT;
```

---

### 3. Verify Types

```bash
bun typecheck
```

**Ensures:**

- Prisma Client regenerated
- TypeScript sees new field
- No type errors

---

### 4. Update Code

Use new field in code:

```typescript
// Before
const user = await db.user.create({
  data: { email, name },
});

// After
const user = await db.user.create({
  data: { email, name, newField: 'value' },
});
```

---

### 5. Test

```bash
bun test:run
bun lint
bun build
```

---

### 6. Commit

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add User.newField"
```

**IMPORTANT:** Always commit schema + migrations together.

---

## Common Scenarios

### Add Required Field (With Default)

**Schema:**

```prisma
model User {
  role Role @default(USER) // ← Required with default
}

enum Role {
  USER
  ADMIN
}
```

**Migration:**

```sql
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
```

---

### Add Required Field (Without Default)

**Problem:** Existing rows need value.

**Solution 1:** Add as optional first, backfill, then make required

```prisma
// Step 1: Add as optional
model User {
  role Role?
}
```

```bash
bun db:migrate  # Migration 1
```

```typescript
// Step 2: Backfill data
await db.user.updateMany({
  where: { role: null },
  data: { role: 'USER' },
});
```

```prisma
// Step 3: Make required
model User {
  role Role @default(USER)
}
```

```bash
bun db:migrate  # Migration 2
```

**Solution 2:** Add with default, then remove default

```prisma
// Step 1: Add with default
model User {
  role Role @default(USER)
}
```

```bash
bun db:migrate
```

```prisma
// Step 2: Remove default (optional)
model User {
  role Role
}
```

```bash
bun db:migrate
```

---

### Rename Field

**Schema:**

```prisma
model User {
  fullName String @map("name") // ← Rename name → fullName
}
```

**Migration:**

Prisma generates:

```sql
ALTER TABLE "users" RENAME COLUMN "name" TO "fullName";
```

**IMPORTANT:** Prisma may generate DROP + ADD instead. If so, manually edit migration:

```sql
-- Manual edit
ALTER TABLE "users" RENAME COLUMN "name" TO "fullName";
```

---

### Add Relation

**Schema:**

```prisma
model User {
  posts Post[]
}

model Post {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Migration:**

```sql
CREATE TABLE "posts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  PRIMARY KEY ("id")
);

ALTER TABLE "posts" ADD CONSTRAINT "posts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

---

### Add Index

**Schema:**

```prisma
model User {
  email String @unique // ← Unique index

  @@index([createdAt]) // ← Regular index
}
```

**Migration:**

```sql
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
```

---

### Remove Field

**Schema:**

```prisma
model User {
  // oldField removed
}
```

**Migration:**

```sql
ALTER TABLE "users" DROP COLUMN "oldField";
```

**WARNING:** Data loss! Ensure field not needed.

---

## Manual Migration Edits

**When to edit:**

- Complex data transformations
- Rename vs recreate detection
- Custom SQL (triggers, functions)

**How:**

1. Run `bun db:migrate`
2. Prisma generates migration
3. Edit `prisma/migrations/<timestamp>_name/migration.sql`
4. Run `bun db:migrate` again to apply

**Example:**

```sql
-- Generated (data loss)
ALTER TABLE "users" DROP COLUMN "name";
ALTER TABLE "users" ADD COLUMN "fullName" TEXT;

-- Manually edited (data preserved)
ALTER TABLE "users" RENAME COLUMN "name" TO "fullName";
```

---

## Rollback Migration

**Undo last migration:**

```bash
# Mark migration as rolled back
bunx prisma migrate resolve --rolled-back <migration_name>

# Manually revert DB changes
psql $DATABASE_URL
DROP TABLE ...;

# Or restore from backup
```

**IMPORTANT:** Prisma doesn't auto-rollback. Manual SQL required.

---

## Production Migrations

**Strategy 1: Automatic (CI/CD)**

```bash
# In deployment pipeline
bun db:migrate --skip-generate
```

**Strategy 2: Manual (Zero-downtime)**

1. Add new field as optional
2. Deploy code using new field
3. Backfill data
4. Make field required (new migration)

---

## Regenerate Prisma Client

**Auto-runs after migration, but if needed:**

```bash
bun db:generate
```

**When to run manually:**

- After git pull (new migrations)
- After manual schema edits
- Type errors after migration

---

## Prisma Studio (Visual DB Browser)

```bash
bun db:studio
# Opens http://localhost:5555
```

**Features:**

- Browse tables
- Edit records
- Create/delete records
- Export data

---

## Troubleshooting

### "Migration failed: column already exists"

**Fix:** DB out of sync. Reset DB (dev only):

```bash
bunx prisma migrate reset
```

### "Prisma Client not found"

**Fix:** Regenerate client:

```bash
bun db:generate
```

### "Type error after migration"

**Fix:** Restart TypeScript server in editor, or:

```bash
bun db:generate
bun typecheck
```

### "Cannot connect to database"

**Fix:** Ensure postgres running:

```bash
docker compose up -d
echo $DATABASE_URL
```

---

## Best Practices

1. **Small migrations**: One change per migration
2. **Descriptive names**: `add_user_role`, not `update_schema`
3. **Test first**: Run migration in dev before prod
4. **Commit together**: Schema + migrations in same commit
5. **No manual DB edits**: Always use Prisma migrations
6. **Backup prod**: Before running migrations
7. **Zero-downtime**: Add fields as optional first
8. **Data preservation**: Rename fields manually if needed

---

## Checklist

- [ ] PostgreSQL running
- [ ] Edit `prisma/schema.prisma`
- [ ] Run `bun db:migrate`
- [ ] Enter descriptive migration name
- [ ] Run `bun typecheck`
- [ ] Update code to use new field
- [ ] Run tests (`bun test:run`)
- [ ] Commit schema + migrations
- [ ] Apply to production
