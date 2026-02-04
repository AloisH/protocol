# Server Layer - API/DB Patterns

**Context:** API endpoints, database, validation, auth
**For:** Full server/ context when needed

> See [/CLAUDE.md](/CLAUDE.md) for project overview
> See [/app/CLAUDE.md](/app/CLAUDE.md) for Vue/Nuxt patterns

---

## Tech Stack

**Runtime:** H3 event handlers (Nitro)
**DB:** Prisma 7 + PostgreSQL (dev + prod)
**Auth:** Better Auth (email/password + OAuth: GitHub, Google)
**Validation:** Zod schemas in shared/schemas/
**Architecture:** API routes → Features (service + repository) → Prisma

---

## Core Principles

### User-Scoped Data

**ALL user data MUST be scoped by userId**

```typescript
// ✅ DO: User-scoped queries
const projects = await db.project.findMany({
  where: { userId: session.user.id },
});

// ❌ DON'T: Global queries - WILL LEAK DATA
const projects = await db.project.findMany();
```

### BANNED Syntax

**Type assertions (`as`) and non-null assertions (`!`) are BANNED**

```typescript
// ❌ BANNED: Type assertions and non-null assertions
const id = route.params.id as string;
const data = JSON.parse(json) as MyType;
const userId = session!.user.id; // Runtime not guaranteed!

// ✅ DO: Zod validation, type guards
const id = z.string().parse(route.params.id);
const data = myTypeSchema.parse(JSON.parse(json));

// ✅ DO: Proper session check
const session = await serverAuth().getSession({ headers: event.headers });
if (!session?.user) {
  throw createError({ statusCode: 401 });
}
const userId = session.user.id; // Safe!
```

### Import Patterns

**Server imports use relative paths + `#shared` alias**

```typescript
// ❌ WRONG: ~/  alias doesn't work in server/
import { db } from '~/server/utils/db';
import { createProjectSchema } from '~/shared/schemas/project';

// ✅ CORRECT: Relative for server/, #shared for shared/
// From server/api/projects/index.post.ts:
import { defineValidatedApiHandler } from '../../utils/api-handler';
import { projectService } from '../../features/project/project-service';
import { createProjectSchema } from '#shared/schemas/project';

// From server/features/project/project-service.ts:
import type { Project } from '../../../prisma/generated/client';
import type { CreateProjectInput } from '#shared/schemas/project';
import { projectRepository } from './project-repository';
```

**Import rules:**

- Server code: Use relative paths (`../../utils/db`)
- Shared code: Use `#shared` alias (`#shared/schemas/project`)
- Prisma: Use relative paths (`../../prisma/generated/client`)
- Auto-imported: `server/utils/*` exports (no import needed)

---

## Database (Prisma 7)

### Always Use Singleton

**CRITICAL:** Never create new PrismaClient instances

```typescript
import { db } from '~/server/utils/db';

// ✅ Correct
const users = await db.user.findMany();

// ❌ Wrong - creates new connection
const prisma = new PrismaClient();
```

**Why PrismaPg adapter?**

- Prisma 7 requires driver adapters for better performance
- PrismaPg manages connection pool internally via connectionString
- Global singleton prevents connection pool exhaustion

### User-Scoped Queries

**CRITICAL:** Never forget userId

```typescript
// ✅ DO: Always filter by user
async function findUserProjects(userId: string) {
  return db.project.findMany({
    where: { userId },
  });
}

// ❌ DON'T: Missing user filter
async function findProjects() {
  return db.project.findMany(); // DATA LEAK!
}
```

### Check Before Create

**Prevent duplicates:**

```typescript
// ✅ DO: Check existence first
const existing = await db.project.findFirst({
    where: { slug, userId }
});
if (existing) {
    throw createError({
        statusCode: 409,
        message: 'Project with this slug already exists'
    });
}

const project = await db.project.create({ data: { ... } });
```

### Transactions

**For:** Multiple operations that must succeed/fail together

```typescript
await db.$transaction(async (tx) => {
    // Create project
    const project = await tx.project.create({ data: { ... } });

    // Create initial AI job
    await tx.aIJob.create({
        data: { projectId: project.id, ... }
    });

    // Both succeed or both fail
});
```

### Query with Relations

```typescript
const projects = await db.project.findMany({
  where: { userId },
  include: { aiJobs: true },
  orderBy: { createdAt: 'desc' },
});
```

---

## API Handler Patterns

### defineApiHandler (Basic Endpoints)

**For endpoints without request body (GET, DELETE):**

```typescript
import { defineApiHandler } from '../../utils/api-handler';
import { projectService } from '../../services/project-service';

export default defineApiHandler(async (ctx) => {
  // ctx.userId is guaranteed to exist (session checked)
  const projects = await projectService.listProjects(ctx.userId);
  return { projects };
});
```

### defineValidatedApiHandler (With Body)

**For endpoints with request body (POST, PUT):**

```typescript
import { defineValidatedApiHandler } from '../../utils/api-handler';
import { createProjectSchema } from '#shared/schemas/project';
import { projectService } from '../../services/project-service';

export default defineValidatedApiHandler(createProjectSchema, async (ctx) => {
  // ctx.body is validated and typed!
  const project = await projectService.createProject(ctx.userId, ctx.body!);
  return { project };
});
```

### Route Params

```typescript
export default defineApiHandler(async (ctx) => {
  const id = getRouterParam(ctx.event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const project = await projectService.getProject(id, ctx.userId);
  return { project };
});
```

**Benefits:**

- ✅ Auto session check (401 if unauthorized)
- ✅ Auto Zod validation (400 with error details)
- ✅ Type-safe context (userId, body typed)
- ✅ No repetitive auth boilerplate

---

## Validation (Zod)

### Shared Schemas

**Location:** `shared/schemas/`

```typescript
// shared/schemas/common.ts
export const idSchema = z.string().cuid();
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/);

// shared/schemas/project.ts
export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  slug: slugSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### Usage in API Handlers

```typescript
import { defineValidatedApiHandler } from '../../utils/api-handler';
import { createProjectSchema } from '#shared/schemas/project';

export default defineValidatedApiHandler(
  createProjectSchema, // Auto-validates body
  async (ctx) => {
    // ctx.body is typed as CreateProjectInput!
    return await projectService.createProject(ctx.userId, ctx.body!);
  },
);
```

**Benefits:**

- ✅ Type inference (Zod → TypeScript)
- ✅ Shared client/server (future)
- ✅ Validation errors auto-formatted (400 response)

---

## Authentication (Better Auth)

### Server Setup (server/utils/auth.ts)

- Conditional OAuth providers (only if env vars present)
- Prisma adapter for DB integration
- Session cookie cache (5 min)
- Trusted origins for CORS

**Conditional OAuth pattern:**

```typescript
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  socialProviders, // Empty object if no env vars
});
```

### Session Helper (server/utils/serverAuth.ts)

```typescript
import { serverAuth } from '~/server/utils/serverAuth';

export default defineEventHandler(async (event) => {
  const session = await serverAuth().getSession({ headers: event.headers });
  if (!session) throw createError({ statusCode: 401 });
  return { userId: session.user.id };
});
```

### Protected Endpoint Pattern

```typescript
const session = await serverAuth().getSession({ headers: event.headers });
if (!session?.user) {
  throw createError({ statusCode: 401, message: 'Unauthorized' });
}
const userId = session.user.id;
```

---

## Organization Access Control

### requireOrgAccess Middleware

`server/utils/require-org-access.ts` - Validates org access + optional role enforcement

```typescript
const ctx = await requireOrgAccess(event, {
  allowedRoles: ['OWNER', 'ADMIN'], // Optional
});
// Returns: userId, organizationId, organizationSlug, userRole
```

**Usage patterns:**

1. **Direct middleware** (read ops):
   - GET /api/organizations/[slug]/members
   - Validates membership, enforces roles

2. **Service layer** (complex ops):
   - PUT /api/organizations/[slug] (checkIsOwnerOrAdmin)
   - DELETE /api/organizations/[slug] (checkIsOwner)
   - Service centralizes permission logic

3. **Public** (no check):
   - POST /api/organizations/invites/accept (token-based)

### Org-Scoped Data Queries

**Repository pattern** (`organization-repository.ts`):

```typescript
// ✅ Always filter by organizationId
findOrganizationMembers(organizationId);
findInvitesByOrganization(organizationId);

// ✅ Verify user membership
findMembership(userId, organizationId);
```

**Permission checks** (`organization-service.ts`):

- checkIsMember(userId, orgId)
- checkIsOwnerOrAdmin(userId, orgId)
- checkIsOwner(userId, orgId)
- countOwners(orgId) - prevents removing last owner

**Role hierarchy:** OWNER (full control) > ADMIN (manage settings/invites) > MEMBER (view only) > GUEST (restricted)

### Org-Related Endpoints

- GET /api/organizations - List user's orgs
- POST /api/organizations - Create org
- GET /api/organizations/[slug] - Get org details
- PUT /api/organizations/[slug] - Update org (OWNER/ADMIN)
- DELETE /api/organizations/[slug] - Delete org (OWNER)
- GET /api/organizations/[slug]/members - List members
- PUT /api/organizations/[slug]/members/[id]/role - Update role (OWNER)
- GET/POST /api/organizations/[slug]/invites - Manage invites (OWNER/ADMIN)
- POST /api/organizations/invites/accept - Accept invite (token-based)
- PUT /api/user/current-organization - Switch active org

---

## API Status

### ✅ Implemented Endpoints

```bash
# Auth
POST   /api/auth/[...all]        # Better Auth (sign-in, sign-up, OAuth)

# User Profile
GET    /api/user/profile         # Get user profile
PUT    /api/user/profile         # Update profile (name, image)
```

### 🚧 Planned Endpoints

```bash
# User Account
DELETE /api/user/account         # Delete account + all data
```

---

## Feature-Based Architecture

**Code organized by domain feature:**

```
API routes (api/)
    ↓
Features (service + repository)
    ↓
Core (utils/db)
```

**Benefits:**

- High cohesion: Related code stays together
- Clear boundaries: Feature dependencies explicit
- Easy navigation: All user code in features/user/
- Scalable: Add features without restructuring

**Features:**

- `features/auth/` - Authentication (Better Auth config, session)
- `features/user/` - User operations (profile, account deletion)
- `features/email/` - Email sending (Resend, templates)

**Cross-feature deps:** Document in feature.md, avoid cycles

### Repository Pattern

**Direct db import (no base class):**

```typescript
// server/features/project/project-repository.ts
import { db } from '../../utils/db';

export class ProjectRepository {
  protected readonly db = db;

  async findByUserId(userId: string): Promise<Project[]> {
    return this.db.project.findMany({
      where: { userId }, // Always scoped!
      include: { aiJobs: true },
    });
  }
}
```

### Service Layer

**Business logic + error handling:**

```typescript
// server/features/project/project-service.ts
export class ProjectService {
  async createProject(userId: string, input: CreateProjectInput): Promise<Project> {
    // Check duplicate slug
    const existing = await projectRepository.findBySlug(input.slug, userId);
    if (existing) {
      throw createError({ statusCode: 409, message: 'Slug exists' });
    }

    return projectRepository.create(userId, { ...input, status: 'draft' });
  }
}
```

---

## Project Structure

```
server/
├── features/                    # Domain features
│   ├── auth/
│   │   ├── auth-config.ts      # Better Auth setup
│   │   ├── auth-session.ts     # Session helper
│   │   └── auth.md
│   ├── user/
│   │   ├── user-service.ts
│   │   ├── user-service.test.ts
│   │   ├── user-repository.ts
│   │   └── user.md
│   ├── project/
│   │   ├── project-service.ts
│   │   ├── project-repository.ts
│   │   └── project.md
│   └── email/
│       ├── email-service.ts
│       ├── email-service.test.ts
│       ├── email-client.ts     # Resend singleton
│       ├── templates/          # Vue Email
│       └── email.md
├── api/                         # HTTP endpoints (Nitro auto-registration)
│   ├── auth/[...].ts           # Better Auth catch-all
│   ├── user/
│   │   ├── profile.get.ts      # GET /api/user/profile
│   │   └── profile.put.ts      # PUT /api/user/profile
│   └── projects/
│       ├── index.get.ts        # GET /api/projects
│       ├── index.post.ts       # POST /api/projects
│       └── [id]/
│           ├── index.get.ts    # GET /api/projects/:id
│           ├── index.put.ts    # PUT /api/projects/:id
│           └── index.delete.ts # DELETE /api/projects/:id
├── shared/
│   └── schemas/
│       ├── common.ts           # idSchema, slugSchema, paginationSchema
│       ├── user.ts             # updateProfileSchema
│       └── project.ts          # createProjectSchema, updateProjectSchema
└── utils/                       # Core utilities
    ├── api-handler.ts          # defineApiHandler, defineValidatedApiHandler
    └── db.ts                   # Prisma singleton
```

---

## Common Gotchas

### 1. Prisma Client Import

```typescript
// ❌ WRONG - don't import PrismaClient directly
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ CORRECT - use singleton
import { db } from '~/server/utils/db';
```

### 2. Missing User Scope

```typescript
// ❌ WRONG - no user filter
const projects = await db.project.findMany();

// ✅ CORRECT - user-scoped
const projects = await db.project.findMany({
  where: { userId },
});
```

### 3. Type Safety

```typescript
// ❌ WRONG - missing return type
async function getProject(id: string) {
  return db.project.findUnique({ where: { id } });
}

// ✅ CORRECT - explicit return type
async function getProject(id: string): Promise<Project | null> {
  return db.project.findUnique({ where: { id } });
}
```

### 4. Session Check Pattern

```typescript
// ❌ WRONG - using non-null assertion
const userId = session!.user.id;

// ✅ CORRECT - proper null check
if (!session?.user) {
  throw createError({ statusCode: 401 });
}
const userId = session.user.id;
```

---

## Development Workflow

### Database Changes

```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration
bun db:migrate

# 3. Regenerate client (auto runs, but manual if needed)
bun db:generate

# 4. View data
bun db:studio
```

### Adding API Endpoint

```bash
# 1. Create API handler
vim server/api/projects/index.post.ts

# 2. Add Zod schema (future)
vim shared/project.ts

# 3. Test endpoint
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{"title":"Test","slug":"test"}'
```

---

## Database Models

**Current schema:**

- `User` - Email, password, OAuth accounts
- `Account` - OAuth provider links
- `Session` - Auth sessions (token, expiry, user agent)
- `Verification` - Email verification tokens

**Relations:**

- User → Accounts (one-to-many, OAuth)
- User → Sessions (one-to-many)

---

## Response Patterns

### Current: Direct Return

```typescript
// Current pattern - return data directly
return { project };
return { projects: [] };
return { success: true };
```

### Future: Standard ApiResponse<T>

```typescript
// Future pattern - wrap in standard format
return successResponse(data); // { success: true, data: T }
return errorResponse(error); // { success: false, error: string }
```

---

## Troubleshooting

### "Prisma client errors after schema change"

**Fix:** Regenerate Prisma client:

```bash
bun db:generate
bun db:migrate
```

### "Runtime config not available"

**Fix:** Add vars to .env (copy from .env.example) and restart dev server

### "Cannot find module '~~/server/...'"

**Fix:** TypeScript path issue. Restart TypeScript server in editor.

### "Unauthorized on protected route"

**Fix:** Ensure session cookie sent. Check DevTools → Network → Cookies

### "Type error in API handler"

**Fix:** Add explicit return types to all async functions:

```typescript
async function getProject(id: string): Promise<Project | null> {
  // ...
}
```

### "Connection pool exhausted"

**Fix:** Using multiple PrismaClient instances. Always use `db` singleton:

```typescript
import { db } from '~/server/utils/db';
```

---

## API Route Naming

**Convention:**

- `user.get.ts` - GET /api/user
- `user.post.ts` - POST /api/user
- `user/[id].get.ts` - GET /api/user/:id
- `user/[id].delete.ts` - DELETE /api/user/:id
- `[...].ts` - Catch-all (Better Auth uses this)

---

## Testing Server Code

**Mock Prisma:**

```typescript
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(function () {
    return { $connect: vi.fn(), $disconnect: vi.fn() };
  }),
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn(function () {
    return { provider: 'postgres' };
  }),
}));

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(function () {
      return { connect: vi.fn(), end: vi.fn() };
    }),
  },
}));
```

**See:** `server/utils/db.test.ts` for example

---

## File Locations Reference

**Schema changes:** `prisma/schema.prisma` → run migrate
**API routes:** `server/api/**/*.ts` → auto-registered
**Shared types:** `shared/*.ts` → Zod schemas
**Features:** `server/features/*/` → Domain logic (service + repository)
**Auth:** `server/features/auth/` → Better Auth config
**Email:** `server/features/email/` → Resend + templates
**UI components:** See `app/CLAUDE.md` (Vue/Nuxt)
**Pages:** See `app/CLAUDE.md` (Vue/Nuxt)

---

_For Vue/Nuxt patterns, see [/app/CLAUDE.md](/app/CLAUDE.md)_
