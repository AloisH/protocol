# SOP: Adding API Endpoints

**Related docs:** ../System/project_architecture.md, ../System/authentication_system.md

---

## Overview

How to add new API endpoints following the feature-based architecture pattern.

---

## Architecture

**Layers:**

```
API routes (server/api/)
    ↓
Features (service + repository)
    ↓
Core (utils/db)
```

**Pattern:**

1. API handler validates input, calls service
2. Service contains business logic, calls repository
3. Repository queries database

---

## Step-by-Step

### 1. Define Zod Schema (If Input Required)

**Location:** `shared/schemas/<feature>.ts`

```typescript
// shared/schemas/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

**Common schemas:**

- `idSchema`: CUID validation
- `slugSchema`: Kebab-case validation
- `paginationSchema`: Limit/offset validation

---

### 2. Create Repository (If New Feature)

**Location:** `server/features/<feature>/<feature>-repository.ts`

```typescript
// server/features/project/project-repository.ts
import { db } from '../../utils/db';
import type { Project } from '../../../prisma/generated/client';
import type { CreateProjectInput } from '#shared/schemas/project';

export class ProjectRepository {
  protected readonly db = db;

  async findByUserId(userId: string): Promise<Project[]> {
    return this.db.project.findMany({
      where: { userId }, // CRITICAL: User-scoped
      include: { aiJobs: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string, userId: string): Promise<Project | null> {
    return this.db.project.findFirst({
      where: { slug, userId }, // CRITICAL: User-scoped
    });
  }

  async create(userId: string, data: CreateProjectInput): Promise<Project> {
    return this.db.project.create({
      data: { ...data, userId }, // CRITICAL: Add userId
    });
  }
}

export const projectRepository = new ProjectRepository();
```

**CRITICAL:** ALWAYS filter by userId (data leak prevention).

---

### 3. Create Service (If New Feature)

**Location:** `server/features/<feature>/<feature>-service.ts`

```typescript
// server/features/project/project-service.ts
import { projectRepository } from './project-repository';
import type { CreateProjectInput } from '#shared/schemas/project';

export class ProjectService {
  async listProjects(userId: string) {
    return projectRepository.findByUserId(userId);
  }

  async createProject(userId: string, input: CreateProjectInput) {
    // Check duplicate slug
    const existing = await projectRepository.findBySlug(input.slug, userId);
    if (existing) {
      throw createError({
        statusCode: 409,
        message: 'Project with this slug already exists',
      });
    }

    return projectRepository.create(userId, input);
  }
}

export const projectService = new ProjectService();
```

**Business logic here:**

- Validation beyond schema (unique checks, complex rules)
- Error handling
- Orchestrate multiple repository calls
- Transactions if needed

---

### 4. Create API Handler

**Location:** `server/api/<feature>/<endpoint>.<method>.ts`

**Naming convention:**

- `index.get.ts` → GET /api/feature
- `index.post.ts` → POST /api/feature
- `[id].get.ts` → GET /api/feature/:id
- `[id].put.ts` → PUT /api/feature/:id
- `[id].delete.ts` → DELETE /api/feature/:id

**GET endpoint (no body):**

```typescript
// server/api/projects/index.get.ts
import { defineApiHandler } from '../../utils/api-handler';
import { projectService } from '../../features/project/project-service';

export default defineApiHandler(async (ctx) => {
  // ctx.userId is guaranteed (session checked)
  const projects = await projectService.listProjects(ctx.userId);
  return { projects };
});
```

**POST endpoint (with body):**

```typescript
// server/api/projects/index.post.ts
import { defineValidatedApiHandler } from '../../utils/api-handler';
import { createProjectSchema } from '#shared/schemas/project';
import { projectService } from '../../features/project/project-service';

export default defineValidatedApiHandler(createProjectSchema, async (ctx) => {
  // ctx.body is validated and typed!
  const project = await projectService.createProject(ctx.userId, ctx.body!);
  return { project };
});
```

**PUT/DELETE endpoint (with route param):**

```typescript
// server/api/projects/[id].delete.ts
import { defineApiHandler } from '../../utils/api-handler';
import { projectService } from '../../features/project/project-service';

export default defineApiHandler(async (ctx) => {
  const id = getRouterParam(ctx.event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  await projectService.deleteProject(id, ctx.userId);
  return { success: true };
});
```

---

### 5. Add Role-Based Access Control (If Admin Endpoint)

**For ADMIN/SUPER_ADMIN only endpoints:**

```typescript
// server/api/admin/users/index.get.ts
import { requireRole } from '../../../middleware/role-guard';

export default defineEventHandler(async (event) => {
  const user = await requireRole(['ADMIN', 'SUPER_ADMIN'])(event);

  // User has required role
  const users = await db.user.findMany();
  return { users };
});
```

---

### 6. Test Endpoint

**Manual test (curl):**

```bash
# Get session token from browser DevTools → Application → Cookies
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<token>" \
  -d '{"title":"Test","description":"Test project","slug":"test"}'
```

**Unit test (Vitest):**

```typescript
// server/features/project/project-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService } from './project-service';
import { projectRepository } from './project-repository';

vi.mock('./project-repository');

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates project', async () => {
    const input = { title: 'Test', slug: 'test' };
    const userId = 'user-1';

    vi.mocked(projectRepository.findBySlug).mockResolvedValue(null);
    vi.mocked(projectRepository.create).mockResolvedValue({
      id: 'proj-1',
      ...input,
      userId,
    });

    const project = await projectService.createProject(userId, input);

    expect(project.title).toBe('Test');
    expect(projectRepository.create).toHaveBeenCalledWith(userId, input);
  });

  it('throws on duplicate slug', async () => {
    const input = { title: 'Test', slug: 'test' };
    const userId = 'user-1';

    vi.mocked(projectRepository.findBySlug).mockResolvedValue({
      id: 'proj-1',
      ...input,
      userId,
    });

    await expect(projectService.createProject(userId, input)).rejects.toThrow('already exists');
  });
});
```

---

### 7. Update Client Code (If Needed)

**Using $fetch:**

```vue
<script setup lang="ts">
const projects = ref([]);

async function loadProjects() {
  const { projects: data } = await $fetch('/api/projects');
  projects.value = data;
}

async function createProject(input) {
  const { project } = await $fetch('/api/projects', {
    method: 'POST',
    body: input,
  });
  projects.value.push(project);
}

onMounted(() => loadProjects());
</script>
```

**Using composable (if complex):**

```typescript
// app/composables/useProjects.ts
export const useProjects = () => {
  const projects = useState('projects', () => []);
  const loading = ref(false);

  const loadProjects = async () => {
    loading.value = true;
    try {
      const { projects: data } = await $fetch('/api/projects');
      projects.value = data;
    } finally {
      loading.value = false;
    }
  };

  const createProject = async (input) => {
    const { project } = await $fetch('/api/projects', {
      method: 'POST',
      body: input,
    });
    projects.value.push(project);
    return project;
  };

  return {
    projects,
    loading,
    loadProjects,
    createProject,
  };
};
```

---

## Import Conventions

**Server code:**

```typescript
// ✅ CORRECT: Relative paths for server code
import { defineApiHandler } from '../../utils/api-handler';
import { projectService } from '../../features/project/project-service';

// ✅ CORRECT: #shared alias for shared schemas
import { createProjectSchema } from '#shared/schemas/project';

// ✅ CORRECT: Relative for Prisma types
import type { Project } from '../../../prisma/generated/client';

// ❌ WRONG: ~ alias doesn't work in server/
import { db } from '~/server/utils/db';
```

---

## API Handler Helpers

### defineApiHandler

**For:** GET, DELETE (no request body)

**Features:**

- Auto session check (401 if unauthorized)
- ctx.userId guaranteed
- ctx.event for H3 event access

**Usage:**

```typescript
export default defineApiHandler(async (ctx) => {
  // ctx.userId is string
  return { data: 'value' };
});
```

---

### defineValidatedApiHandler

**For:** POST, PUT (with request body)

**Features:**

- Auto session check (401 if unauthorized)
- Auto Zod validation (400 with error details)
- ctx.userId guaranteed
- ctx.body typed from schema

**Usage:**

```typescript
export default defineValidatedApiHandler(mySchema, async (ctx) => {
  // ctx.body is typed and validated!
  return { data: ctx.body };
});
```

---

## Response Patterns

**Current:** Direct return

```typescript
return { project };
return { projects: [] };
return { success: true };
```

**Future:** Standard ApiResponse<T> wrapper

```typescript
return successResponse(data); // { success: true, data: T }
return errorResponse(error); // { success: false, error: string }
```

---

## Common Scenarios

### Pagination

**Schema:**

```typescript
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
```

**API handler:**

```typescript
export default defineApiHandler(async (ctx) => {
  const query = getQuery(ctx.event);
  const { limit, offset } = paginationSchema.parse(query);

  const projects = await db.project.findMany({
    where: { userId: ctx.userId },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
  });

  const total = await db.project.count({
    where: { userId: ctx.userId },
  });

  return { projects, total, limit, offset };
});
```

---

### Filtering

**Schema:**

```typescript
export const projectFilterSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  search: z.string().optional(),
});
```

**API handler:**

```typescript
export default defineApiHandler(async (ctx) => {
  const query = getQuery(ctx.event);
  const { status, search } = projectFilterSchema.parse(query);

  const projects = await db.project.findMany({
    where: {
      userId: ctx.userId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
  });

  return { projects };
});
```

---

### File Upload (Planned)

**Using Vercel Blob:**

```typescript
import { put } from '@vercel/blob';

export default defineEventHandler(async (event) => {
  const session = await serverAuth().getSession({ headers: event.headers });
  if (!session?.user) throw createError({ statusCode: 401 });

  const formData = await readFormData(event);
  const file = formData.get('file') as File;

  const blob = await put(file.name, file, { access: 'public' });

  await db.user.update({
    where: { id: session.user.id },
    data: { image: blob.url },
  });

  return { url: blob.url };
});
```

---

## Troubleshooting

### "Unauthorized on protected endpoint"

**Fix:** Ensure session cookie sent. Check DevTools → Network → Cookies

### "Type error in API handler"

**Fix:** Add explicit return types:

```typescript
async function getProject(id: string): Promise<Project | null> {
  return db.project.findUnique({ where: { id } });
}
```

### "Validation error: expected string, received number"

**Fix:** Check Zod schema vs input type. Query params are strings:

```typescript
// ❌ WRONG
const limit = query.limit; // string "20"

// ✅ CORRECT
const limit = Number(query.limit); // number 20
// Or use Zod coercion:
z.number().int(); // auto-converts string to number
```

### "Cannot find module '#shared/...'"

**Fix:** Ensure `#shared` alias configured in `nuxt.config.ts`:

```typescript
alias: {
  '#shared': resolve(__dirname, './shared'),
}
```

---

## Checklist

- [ ] Define Zod schema in `shared/schemas/`
- [ ] Create repository with user-scoped queries
- [ ] Create service with business logic
- [ ] Create API handler in `server/api/`
- [ ] Add RBAC if admin endpoint
- [ ] Test endpoint manually (curl)
- [ ] Write unit tests for service
- [ ] Update client code if needed
- [ ] Run linter (`bun lint`)
- [ ] Run typecheck (`bun typecheck`)
- [ ] Run tests (`bun test:run`)
- [ ] Commit changes
