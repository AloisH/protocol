# Database Schema

**Related docs:** project_architecture.md, authentication_system.md

---

## Overview

**Database:** PostgreSQL (local dev + Docker prod)
**ORM:** Prisma 7 with @prisma/adapter-pg
**Driver:** pg with connection pooling
**Location:** `prisma/schema.prisma`

---

## Schema Models

### User

Primary user table with auth, profile, and onboarding data.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String?
  emailVerified Boolean   @default(false)
  image         String?
  role          Role      @default(USER)
  banned        Boolean   @default(false)

  // Onboarding
  onboardingCompleted Boolean @default(false)
  onboardingSteps     Json?
  bio                 String?
  company             String?
  useCase             String?
  emailNotifications  Boolean   @default(true)

  accounts                Account[]
  sessions                Session[]
  impersonationsPerformed ImpersonationLog[] @relation("ImpersonationsByAdmin")
  impersonationsReceived  ImpersonationLog[] @relation("ImpersonationsOfUser")

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}
```

**Fields:**

- `id`: CUID primary key
- `email`: Unique email address (used for login)
- `name`: Display name
- `password`: Hashed password (nullable for OAuth-only users)
- `emailVerified`: Email verification status
- `image`: Profile image URL (from OAuth or upload)
- `role`: USER | ADMIN | SUPER_ADMIN (enum)
- `banned`: Account ban status

**Onboarding fields:**

- `onboardingCompleted`: Whether user finished 5-step onboarding
- `onboardingSteps`: JSON object with step completion status
- `bio`: User bio (from onboarding)
- `company`: Company name (from onboarding)
- `useCase`: Use case description (from onboarding)
- `emailNotifications`: Email notification preference (from onboarding)

**Relations:**

- `accounts`: OAuth provider accounts (one-to-many)
- `sessions`: Active sessions (one-to-many)
- `impersonationsPerformed`: Impersonations performed by this admin (one-to-many)
- `impersonationsReceived`: Impersonations of this user by admins (one-to-many)
- `organizationMembers`: Organization memberships (one-to-many)
- `sentInvites`: Organization invites sent by this user (one-to-many)

---

### Role (Enum)

Role-based access control levels.

```prisma
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}
```

**Levels:**

- `USER`: Default role, access to own data
- `ADMIN`: Admin features (user management, analytics)
- `SUPER_ADMIN`: Full access (impersonation, role changes, system config)

**Permissions:**

| Feature        | USER | ADMIN | SUPER_ADMIN |
| -------------- | ---- | ----- | ----------- |
| Own profile    | ✅   | ✅    | ✅          |
| Own data       | ✅   | ✅    | ✅          |
| View all users | ❌   | ✅    | ✅          |
| Change roles   | ❌   | ❌    | ✅          |
| Impersonate    | ❌   | ❌    | ✅          |

---

### Account

OAuth provider accounts linked to users.

```prisma
model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accounts")
}
```

**Fields:**

- `id`: CUID primary key
- `accountId`: Provider's user ID
- `providerId`: OAuth provider (github, google, etc.)
- `userId`: Foreign key to User
- `accessToken`: OAuth access token
- `refreshToken`: OAuth refresh token
- `idToken`: OAuth ID token
- `accessTokenExpiresAt`: Access token expiry
- `refreshTokenExpiresAt`: Refresh token expiry
- `scope`: OAuth scopes granted
- `password`: Hashed password (for email/password provider)

**Relations:**

- `user`: User who owns this account (many-to-one, cascade delete)

**Usage:**

- Created by Better Auth during OAuth flow
- Multiple accounts per user (GitHub + Google)
- Email/password stored as Account with providerId='credential'

---

### Session

User sessions with device info.

```prisma
model Session {
  id             String   @id @default(cuid())
  expiresAt      DateTime
  token          String   @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ipAddress      String?
  userAgent      String?
  userId         String
  impersonatedBy String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

**Fields:**

- `id`: CUID primary key
- `expiresAt`: Session expiration timestamp
- `token`: Unique session token (stored in cookie)
- `ipAddress`: Client IP address
- `userAgent`: Client user agent string
- `userId`: Foreign key to User
- `impersonatedBy`: If impersonation session, admin user ID
- `currentOrganizationId`: Active organization for this session

**Relations:**

- `user`: User who owns this session (many-to-one, cascade delete)

**Usage:**

- Created by Better Auth on login
- Cookie name: `better-auth.session_token`
- Cache duration: 5 min (may see stale session)
- Auto-cleanup on expiry

---

### Verification

Email verification and password reset tokens.

```prisma
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verifications")
}
```

**Fields:**

- `id`: CUID primary key
- `identifier`: Email address or user ID
- `value`: Token value
- `expiresAt`: Token expiration timestamp

**Usage:**

- Email verification tokens
- Password reset tokens
- Magic link tokens
- Auto-cleanup on expiry

---

### ImpersonationLog

Audit trail for admin impersonation sessions.

```prisma
model ImpersonationLog {
  id           String    @id @default(cuid())
  adminId      String
  targetUserId String
  startedAt    DateTime  @default(now())
  endedAt      DateTime?
  reason       String?
  ipAddress    String?
  userAgent    String?

  admin      User @relation("ImpersonationsByAdmin", fields: [adminId], references: [id], onDelete: Cascade)
  targetUser User @relation("ImpersonationsOfUser", fields: [targetUserId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([targetUserId])
  @@index([startedAt])
  @@map("impersonation_logs")
}
```

**Fields:**

- `id`: CUID primary key
- `adminId`: SUPER_ADMIN who performed impersonation
- `targetUserId`: User being impersonated
- `startedAt`: Impersonation start timestamp
- `endedAt`: Impersonation end timestamp (null if active)
- `reason`: Optional reason for impersonation
- `ipAddress`: Admin's IP address
- `userAgent`: Admin's user agent

**Relations:**

- `admin`: SUPER_ADMIN who performed impersonation (many-to-one, cascade delete)
- `targetUser`: User being impersonated (many-to-one, cascade delete)

**Indexes:**

- `adminId`: Query impersonations by admin
- `targetUserId`: Query impersonations of user
- `startedAt`: Query recent impersonations

**Usage:**

- Created when SUPER_ADMIN starts impersonation
- Updated when impersonation ends (endedAt set)
- Audit trail for compliance
- Cannot impersonate other SUPER_ADMINs

---

### Organization

Multi-tenant organization workspace.

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  image       String?
  planType    String   @default("free")

  members OrganizationMember[]
  invites OrganizationInvite[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("organizations")
}
```

**Fields:**

- `id`: CUID primary key
- `name`: Organization display name
- `slug`: Unique URL-friendly identifier
- `description`: Optional description
- `image`: Organization logo/avatar
- `planType`: Subscription plan (free, pro, enterprise)

**Relations:**

- `members`: Organization members with roles (one-to-many)
- `invites`: Pending invitations (one-to-many)

---

### OrganizationRole (Enum)

Role levels within an organization.

```prisma
enum OrganizationRole {
  OWNER
  ADMIN
  MEMBER
  GUEST
}
```

**Levels:**

- `OWNER`: Full control, can delete organization
- `ADMIN`: Can manage members and settings
- `MEMBER`: Standard access
- `GUEST`: Limited read-only access

---

### OrganizationMember

User membership in an organization.

```prisma
model OrganizationMember {
  id             String           @id @default(cuid())
  userId         String
  organizationId String
  role           OrganizationRole @default(MEMBER)

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
  @@map("organization_members")
}
```

**Fields:**

- `id`: CUID primary key
- `userId`: Foreign key to User
- `organizationId`: Foreign key to Organization
- `role`: Member role (OWNER/ADMIN/MEMBER/GUEST)

**Relations:**

- `user`: User who is a member (many-to-one, cascade delete)
- `organization`: Organization being accessed (many-to-one, cascade delete)

**Constraints:**

- Unique `[userId, organizationId]`: User can only be member once per org
- Indexed on `userId` and `organizationId` for fast lookups

---

### OrganizationInvite

Pending organization invitation.

```prisma
model OrganizationInvite {
  id             String           @id @default(cuid())
  email          String
  organizationId String
  invitedById    String?
  role           OrganizationRole @default(MEMBER)
  token          String           @unique
  expiresAt      DateTime
  acceptedAt     DateTime?

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invitedBy    User?        @relation("SentInvites", fields: [invitedById], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([organizationId])
  @@index([token])
  @@index([invitedById])
  @@map("organization_invites")
}
```

**Fields:**

- `id`: CUID primary key
- `email`: Email address of invitee
- `organizationId`: Foreign key to Organization
- `invitedById`: User who sent invite (nullable)
- `role`: Role to assign upon acceptance
- `token`: Unique invite token (for URL)
- `expiresAt`: Invite expiration timestamp
- `acceptedAt`: When invite was accepted (null if pending)

**Relations:**

- `organization`: Organization being invited to (many-to-one, cascade delete)
- `invitedBy`: User who sent invite (many-to-one, set null on delete)

**Indexes:**

- `email`: Find invites by email
- `organizationId`: List org invites
- `token`: Validate invite tokens
- `invitedById`: Track who sent invites

---

## Database Connection

### Singleton Pattern

**CRITICAL:** Never create multiple PrismaClient instances.

```typescript
// server/utils/db.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not set');

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton | undefined };

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

**Why:**

- Prisma 7 requires driver adapters (@prisma/adapter-pg)
- PrismaPg manages connection pool internally via connectionString
- Global singleton prevents multiple instances
- Multiple instances → connection pool exhaustion

**Usage:**

```typescript
// ✅ CORRECT
import { db } from '~/server/utils/db';
const users = await db.user.findMany();

// ❌ WRONG - creates new connection
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

---

## Query Patterns

### User-Scoped Queries (CRITICAL)

**ALL user data MUST be scoped by userId.**

```typescript
// ✅ DO: User-scoped queries
const projects = await db.project.findMany({
  where: { userId: session.user.id },
});

// ❌ DON'T: Global queries - WILL LEAK DATA
const projects = await db.project.findMany();
```

### Check Before Create

Prevent duplicate entries:

```typescript
// ✅ DO: Check existence first
const existing = await db.user.findFirst({
  where: { email },
});
if (existing) {
  throw createError({
    statusCode: 409,
    message: 'User already exists',
  });
}

const user = await db.user.create({
  data: { email, name, password },
});
```

### Transactions

For operations that must succeed/fail together:

```typescript
await db.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: { email, name, password },
  });

  // Create initial profile
  await tx.profile.create({
    data: { userId: user.id, bio: '' },
  });

  // Both succeed or both fail
});
```

### Relations

Query with related data:

```typescript
const user = await db.user.findUnique({
  where: { id },
  include: {
    accounts: true,
    sessions: {
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

---

## Migrations

### Creating Migrations

```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration
bun db:migrate
# Prompts for migration name, generates SQL

# 3. Regenerate client (auto runs, but manual if needed)
bun db:generate

# 4. Verify types
bun typecheck
```

### Migration Files

**Location:** `prisma/migrations/`

**Format:**

```
migrations/
├── 20250101120000_init/
│   └── migration.sql
├── 20250102150000_add_role/
│   └── migration.sql
└── 20250103100000_add_onboarding/
    └── migration.sql
```

**Example migration.sql:**

```sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
```

### Prisma Studio

Visual DB browser:

```bash
bun db:studio
# Opens http://localhost:5555
```

**Features:**

- Browse all tables
- Edit records
- Create/delete records
- Export data

---

## Indexing Strategy

**Current indexes:**

- Primary keys: All models (automatic)
- Unique constraints: `User.email`, `Session.token`
- Foreign keys: All relations (automatic)
- Custom indexes:
  - `ImpersonationLog.adminId`
  - `ImpersonationLog.targetUserId`
  - `ImpersonationLog.startedAt`

**Future indexes (when needed):**

- `User.role` (for admin user list)
- `User.createdAt` (for user timeline)
- `Session.expiresAt` (for cleanup queries)

---

## Data Seeding (Planned)

**Seed script:** `prisma/seed.ts` (not yet implemented)

**Purpose:**

- Create initial SUPER_ADMIN user
- Add sample data for development
- Populate test data for demos

**Usage:**

```bash
bun db:seed
```

---

## Environment Configuration

### Local Development

```bash
DATABASE_URL=postgresql://bistro:bistro@localhost:5432/bistro
```

**Start database:**

```bash
docker compose up -d
```

### Production (Docker)

```bash
DATABASE_URL=postgresql://bistro:bistro@postgres:5432/bistro
# Note: postgres hostname (NOT localhost)
```

### Fallback Config

If `DATABASE_URL` not in env, fallback in `prisma.config.ts`:

```typescript
export default {
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://bistro:bistro@localhost:5432/bistro',
};
```

---

## Common Gotchas

1. **Singleton import**: Always `import { db } from '~/server/utils/db'`, NEVER `new PrismaClient()`
2. **User scoping**: ALWAYS filter by userId (data leak prevention)
3. **Regenerate after schema changes**: Run `bun db:generate` before typecheck
4. **Connection strings**: localhost for dev, postgres for Docker
5. **Type imports**: Use Prisma-generated types from `prisma/generated/client`
6. **Transactions**: Use for multi-step operations that must succeed/fail together
7. **Cascade deletes**: User deletion cascades to accounts, sessions, impersonation logs

---

## Schema Diagram

```
┌──────────────┐
│     User     │
├──────────────┤
│ id (PK)      │───┐
│ email        │   │
│ name         │   │
│ role         │   │
│ onboarding...│   │
└──────────────┘   │
                   │
      ┌────────────┼────────────┬───────────┬──────────────┐
      │            │            │           │              │
      ▼            ▼            ▼           ▼              ▼
┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Account  │ │ Session │ │Impersona │ │OrgMember │ │OrgInvite │
│          │ │         │ │tion Log  │ │          │ │          │
├──────────┤ ├─────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│userId(FK)│ │userId   │ │adminId   │ │userId(FK)│ │invitedBy │
│providerId│ │token    │ │targetId  │ │orgId(FK) │ │email     │
│...       │ │orgId    │ │...       │ │role      │ │orgId(FK) │
└──────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘
                                            │             │
                                            │             │
                                            ▼             ▼
                                       ┌──────────────────┐
                                       │  Organization    │
                                       ├──────────────────┤
                                       │ id (PK)          │
                                       │ slug (unique)    │
                                       │ name             │
                                       │ planType         │
                                       └──────────────────┘

                   ┌──────────────┐
                   │ Verification │
                   ├──────────────┤
                   │ identifier   │
                   │ value        │
                   │ expiresAt    │
                   └──────────────┘
```

---

## Troubleshooting

### "Prisma client errors after schema change"

**Fix:** Regenerate Prisma client:

```bash
bun db:generate
bun db:migrate
```

### "Connection pool exhausted"

**Fix:** Using multiple PrismaClient instances. Always use singleton:

```typescript
import { db } from '~/server/utils/db';
```

### "Database connection failed"

**Fix:** Check DATABASE_URL and ensure postgres is running:

```bash
docker compose up -d
echo $DATABASE_URL
```

### "Type errors after migration"

**Fix:** Regenerate types:

```bash
bun db:generate
bun typecheck
```

### "Migration failed"

**Fix:** Check migration SQL, rollback if needed:

```bash
# Rollback last migration
bunx prisma migrate resolve --rolled-back <migration_name>

# Fix schema, try again
bun db:migrate
```
