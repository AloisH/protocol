---
title: Database
description: Work with Prisma and PostgreSQL in Bistro
navigation:
  title: Database
  order: 2
---

# Database

Bistro uses [Prisma 7](https://www.prisma.io/) as the ORM with PostgreSQL as the database.

## Database Schema

The current schema includes:

- **User** - User accounts with roles and onboarding data
- **Account** - OAuth provider accounts
- **Session** - Authentication sessions
- **Verification** - Email verification tokens
- **ImpersonationLog** - Audit trail for admin impersonation
- **Organization** - Multi-tenant organizations
- **OrganizationMember** - Organization membership with roles
- **OrganizationInvite** - Pending organization invitations

## Working with Prisma

### Database Singleton

Always use the database singleton from `server/utils/db.ts`:

```typescript
import { db } from '~/server/utils/db';

// ✅ Correct - use singleton
const users = await db.user.findMany();

// ❌ Wrong - creates new connection
const prisma = new PrismaClient();
```

### User-Scoped Queries

**CRITICAL:** Always scope queries by userId to prevent data leaks:

```typescript
// ✅ Correct - scoped to user
const projects = await db.project.findMany({
  where: { userId: session.user.id },
});

// ❌ Wrong - returns ALL projects
const projects = await db.project.findMany();
```

## Database Commands

### Run Migrations

Apply schema changes to database:

```bash
bun db:migrate
```

This creates a migration and applies it.

### Generate Prisma Client

Regenerate types after schema changes:

```bash
bun db:generate
```

Run this after pulling schema changes from git.

### Prisma Studio

Open visual database editor:

```bash
bun db:studio
```

Access at http://localhost:5555

### Create Migration

Create a new migration:

```bash
cd apps/web
bunx prisma migrate dev --name add-feature
```

## Schema Changes

1. Edit `apps/web/prisma/schema.prisma`
2. Run `bun db:migrate` to create and apply migration
3. Commit both schema.prisma and migration files

Example - adding a field:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  bio       String?  // ← New field
  createdAt DateTime @default(now())
}
```

Then run:

```bash
bun db:migrate
```

## Querying Data

### Find One

```typescript
const user = await db.user.findUnique({
  where: { id: userId },
});
```

### Find Many with Filters

```typescript
const users = await db.user.findMany({
  where: {
    role: 'ADMIN',
    emailVerified: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

### Create

```typescript
const user = await db.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    role: 'USER',
  },
});
```

### Update

```typescript
const user = await db.user.update({
  where: { id: userId },
  data: { name: 'Jane Doe' },
});
```

### Delete

```typescript
await db.user.delete({
  where: { id: userId },
});
```

## Relations

Include related data:

```typescript
const user = await db.user.findUnique({
  where: { id: userId },
  include: {
    accounts: true,
    sessions: true,
    organizationMembers: {
      include: {
        organization: true,
      },
    },
  },
});
```

## Transactions

Multiple operations that must succeed/fail together:

```typescript
await db.$transaction(async (tx) => {
  const org = await tx.organization.create({
    data: { name: 'Acme Corp', slug: 'acme' },
  });

  await tx.organizationMember.create({
    data: {
      userId,
      organizationId: org.id,
      role: 'OWNER',
    },
  });
});
```

## Connection Pooling

Bistro uses `@prisma/adapter-pg` with connection pooling for better performance.

The singleton pattern in `server/utils/db.ts` ensures only one connection pool is created.

## Testing with Prisma

Mock Prisma in tests:

```typescript
vi.mock('@prisma/client');
vi.mock('@prisma/adapter-pg');
vi.mock('pg');
```

See `server/utils/db.test.ts` for examples.

## Troubleshooting

### "Cannot find module '@prisma/client'"

Run `bun db:generate` to generate the Prisma client.

### "Connection pool exhausted"

You're creating multiple PrismaClient instances. Always use the `db` singleton.

### "Type errors after schema change"

Run `bun db:generate` to regenerate types, then `bun typecheck`.

## Next Steps

- [Testing](/docs/features/testing) - Write tests for your database code
- [Deployment](/docs/deployment) - Deploy with database migrations
