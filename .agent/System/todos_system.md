# Todo System (Example Feature)

**Purpose:** Reference implementation of full CRUD feature with filtering, sorting, and user-scoped queries. Use as template for your domain features.

---

## Overview

Todo feature demonstrates production patterns:

- Service + repository architecture
- User-scoped data queries
- Zod validation schemas
- Type-safe API handlers
- Filter/sort with URL persistence
- Optimistic UI updates
- Comprehensive testing

**Not a production feature** - Replace with your domain model, keep the patterns.

---

## Database Schema

**Model: Todo**

```prisma
model Todo {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  userId      String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([completed])
  @@map("todos")
}
```

**Key fields:**

- `id` - CUID primary key
- `title` - Required, max 200 chars
- `description` - Optional, max 1000 chars
- `completed` - Boolean flag
- `userId` - Foreign key to User (cascade delete)
- `createdAt` / `updatedAt` - Timestamps

**Indexes:**

- `userId` - Fast user-scoped queries
- `completed` - Fast filtering by status

**Relations:**

- `user` - Belongs to User (cascade delete)

---

## Backend Architecture

### Repository Layer (`server/features/todo/todo-repository.ts`)

**Purpose:** Data access with user-scoped queries

```typescript
export const todoRepository = {
  // List todos with filtering/sorting
  async findByUserId(userId: string, options?: {
    filter?: 'all' | 'active' | 'completed';
    sort?: 'date' | 'title';
  }): Promise<Todo[]>

  // Get single todo (ownership check)
  async findById(id: string, userId: string): Promise<Todo | null>

  // Create todo
  async create(userId: string, input: CreateTodoInput): Promise<Todo>

  // Update todo (ownership check)
  async update(id: string, userId: string, input: UpdateTodoInput): Promise<Todo>

  // Delete todo
  async delete(id: string): Promise<void>
}
```

**Critical patterns:**

- **Always** pass `userId` - Never query all todos
- Filter `where: { userId }` on all queries
- Use Prisma `orderBy` for sorting
- Apply business logic filters (completed status)

### Service Layer (`server/features/todo/todo-service.ts`)

**Purpose:** Business logic + authorization

```typescript
export class TodoService {
  async listTodos(userId: string, options?): Promise<Todo[]>;
  async getTodo(id: string, userId: string): Promise<Todo>;
  async createTodo(userId: string, input: CreateTodoInput): Promise<Todo>;
  async updateTodo(id: string, userId: string, input: UpdateTodoInput): Promise<Todo>;
  async deleteTodo(id: string, userId: string): Promise<void>;
  async toggleTodo(id: string, userId: string, completed: boolean): Promise<Todo>;
}
```

**Responsibilities:**

- Ownership verification (throws 404 if not found/unauthorized)
- Input validation (delegates to Zod schemas)
- Error handling (createError with proper status codes)
- Delegates data access to repository

**Export singleton:**

```typescript
export const todoService = new TodoService();
```

### Validation Schemas (`shared/schemas/todo.ts`)

**Purpose:** Type-safe input validation with Zod

```typescript
// Create todo
export const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

// Update todo
export const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
});

// Toggle completion
export const toggleTodoSchema = z.object({
  completed: z.boolean(),
});

// Query params (filter/sort)
export const todoQuerySchema = z.object({
  filter: z.enum(['all', 'active', 'completed']).default('all'),
  sort: z.enum(['date', 'title']).default('date'),
});
```

**Type exports:**

```typescript
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type ToggleTodoInput = z.infer<typeof toggleTodoSchema>;
export type TodoQueryInput = z.infer<typeof todoQuerySchema>;
```

---

## API Endpoints

All endpoints require authentication. Session user ID passed to service layer.

### `GET /api/todos`

**Purpose:** List user's todos with filtering/sorting

**Query params:**

- `filter` - 'all' | 'active' | 'completed' (default: 'all')
- `sort` - 'date' | 'title' (default: 'date')

**Response:**

```json
{
  "todos": [
    {
      "id": "abc123",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "userId": "user123",
      "createdAt": "2025-01-03T10:00:00Z",
      "updatedAt": "2025-01-03T10:00:00Z"
    }
  ]
}
```

**Implementation:**

```typescript
// server/api/todos/index.get.ts
const session = await requireSession(event);
const query = await getValidatedQuery(event, todoQuerySchema.parse);
const todos = await todoService.listTodos(session.user.id, query);
return { todos };
```

### `POST /api/todos`

**Purpose:** Create new todo

**Body:**

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Response:**

```json
{
  "todo": {
    /* todo object */
  }
}
```

**Implementation:**

```typescript
// server/api/todos/index.post.ts
const session = await requireSession(event);
const body = await readValidatedBody(event, createTodoSchema.parse);
const todo = await todoService.createTodo(session.user.id, body);
return { todo };
```

### `GET /api/todos/:id`

**Purpose:** Get single todo (ownership verified)

**Response:**

```json
{
  "todo": {
    /* todo object */
  }
}
```

### `PUT /api/todos/:id`

**Purpose:** Update todo (ownership verified)

**Body:**

```json
{
  "title": "Updated title",
  "completed": true
}
```

### `DELETE /api/todos/:id`

**Purpose:** Delete todo (ownership verified)

**Response:**

```json
{
  "success": true
}
```

### `POST /api/todos/:id/toggle`

**Purpose:** Toggle completion status

**Body:**

```json
{
  "completed": true
}
```

**Response:**

```json
{
  "todo": {
    /* updated todo */
  }
}
```

---

## Frontend Implementation

### Composable (`app/composables/useTodos.ts`)

**Purpose:** State management + API calls

**State:**

```typescript
const todos = useState<Todo[]>('todos:list', () => []);
const loading = useState('todos:loading', () => false);
const filter = ref<'all' | 'active' | 'completed'>('all');
const sort = ref<'date' | 'title'>('date');
```

**Methods:**

```typescript
fetchTodos(); // Fetch from API
setFilter(newFilter); // Update filter + URL + refetch
setSort(newSort); // Update sort + URL + refetch
createTodo(input); // Create + prepend to list
toggleTodo(id, completed); // Optimistic update
deleteTodo(id); // Optimistic delete
```

**URL Persistence:**

- Sync filter/sort to query params
- Watch route changes for back/forward nav
- Defaults: filter=all, sort=date

**Optimistic Updates:**

- Toggle: Update local state immediately, rollback on error
- Delete: Remove from list, restore on error
- Create: Prepend to list

### Components

**TodoList.vue:**

- Renders CreateTodoForm
- Filter/sort controls (UBadge clickable)
- Loading state (spinner)
- Empty state (icon + message)
- Todo items with checkbox + delete button
- Relative time formatting

**CreateTodoForm.vue:**

- UForm with Zod validation
- Title input (required)
- Description textarea (optional)
- Submit button with loading state
- Error alert on failure
- Clears form on success

### Page (`app/pages/org/[slug]/org/[slug]/dashboard.vue`)

**Purpose:** Organization dashboard with todos

```vue
<script setup>
const { fetchTodos } = useTodos();
onMounted(() => fetchTodos());
</script>

<template>
  <UDashboardPanel>
    <UCard>
      <template #header>
        <h1>My Todos</h1>
      </template>
      <TodoList />
    </UCard>
  </UDashboardPanel>
</template>
```

---

## Testing

### Repository Tests (`server/features/todo/todo-repository.test.ts`)

**Mocks:**

- `@prisma/client` - Mock PrismaClient
- `@prisma/adapter-pg` - Mock adapter
- `pg` - Mock Pool

**Tests:**

- findByUserId - filters by userId
- findByUserId with filter=active - excludes completed
- findByUserId with filter=completed - only completed
- findByUserId with sort=title - alphabetical order
- findById - returns todo or null
- create - calls prisma.todo.create
- update - calls prisma.todo.update
- delete - calls prisma.todo.delete

### Service Tests (`server/features/todo/todo-service.test.ts`)

**Mocks:**

- Repository methods

**Tests:**

- listTodos - delegates to repository
- getTodo - throws 404 if not found
- createTodo - delegates to repository
- updateTodo - verifies ownership, updates
- deleteTodo - verifies ownership, deletes
- toggleTodo - updates completed field

---

## Common Patterns to Copy

### Adding New CRUD Feature

1. **Create Prisma model** with userId foreign key + indexes
2. **Create Zod schemas** in `shared/schemas/your-feature.ts`
3. **Create repository** in `server/features/your-feature/your-feature-repository.ts`
   - Always user-scoped queries
   - Filter `where: { userId }`
4. **Create service** in `server/features/your-feature/your-feature-service.ts`
   - Ownership verification
   - Error handling
5. **Create API routes** in `server/api/your-features/`
   - index.get.ts (list)
   - index.post.ts (create)
   - [id].get.ts, [id].put.ts, [id].delete.ts
6. **Create composable** in `app/composables/useYourFeature.ts`
   - useState for list + loading
   - API methods with error handling
7. **Create components** for list + form
8. **Add to page** or create new page
9. **Write tests** for repository + service

### User-Scoped Queries (CRITICAL)

**Always filter by userId:**

```typescript
// ✅ Correct
await db.todo.findMany({
  where: { userId },
});

// ❌ Wrong - exposes all users' data
await db.todo.findMany();
```

### Filter/Sort Pattern

```typescript
// Repository
const where: Prisma.TodoWhereInput = { userId };
if (options?.filter === 'active') where.completed = false;
if (options?.filter === 'completed') where.completed = true;

const orderBy: Prisma.TodoOrderByWithRelationInput =
  options?.sort === 'title' ? { title: 'asc' } : { createdAt: 'desc' };

return db.todo.findMany({ where, orderBy });
```

### Optimistic UI Updates

```typescript
// Optimistic update
const todo = todos.value.find((t) => t.id === id);
if (todo) todo.completed = completed;

try {
  await $fetch(`/api/todos/${id}/toggle`, {
    method: 'POST',
    body: { completed },
  });
} catch {
  // Rollback on error
  if (todo) todo.completed = !completed;
  toast.add({ title: 'Error', color: 'error' });
}
```

### URL State Persistence

```typescript
// Sync to URL
function setFilter(newFilter: 'all' | 'active' | 'completed') {
  filter.value = newFilter;
  const query: Record<string, string> = {};
  if (newFilter !== 'all') query.filter = newFilter;
  if (sort.value !== 'date') query.sort = sort.value;
  router.push({ query });
  fetchTodos();
}

// Watch URL changes
watch(
  () => route.query,
  (newQuery) => {
    filter.value = (newQuery.filter as 'all' | 'active' | 'completed') || 'all';
    sort.value = (newQuery.sort as 'date' | 'title') || 'date';
    fetchTodos();
  },
);
```

---

## Key Files

**Backend:**

- `server/features/todo/todo-repository.ts` - Data access
- `server/features/todo/todo-service.ts` - Business logic
- `shared/schemas/todo.ts` - Validation schemas
- `server/api/todos/index.get.ts` - List endpoint
- `server/api/todos/index.post.ts` - Create endpoint
- `server/api/todos/[id].get.ts` - Get endpoint
- `server/api/todos/[id].put.ts` - Update endpoint
- `server/api/todos/[id].delete.ts` - Delete endpoint
- `server/api/todos/[id]/toggle.post.ts` - Toggle endpoint

**Frontend:**

- `app/composables/useTodos.ts` - State management
- `app/components/TodoList.vue` - List component
- `app/components/CreateTodoForm.vue` - Form component
- `app/pages/org/[slug]/org/[slug]/dashboard.vue` - Dashboard page

**Database:**

- `prisma/schema.prisma` - Todo model (line 124)

**Tests:**

- `server/features/todo/todo-service.test.ts` - Service tests

---

## Related Documentation

- [Database Schema](.agent/System/database_schema.md) - DB models and relations
- [Adding API Endpoints](.agent/SOP/adding_api_endpoints.md) - API endpoint patterns
- [Adding Pages](.agent/SOP/adding_pages.md) - Page creation patterns
- [Authentication System](.agent/System/authentication_system.md) - Session management
- [Organizations System](.agent/System/organizations_system.md) - Multi-tenancy patterns

---

_Last updated: 2025-01-03_
