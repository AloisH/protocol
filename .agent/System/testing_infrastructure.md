# Testing Infrastructure

Transaction-per-test pattern with fixture factories for integration tests.

---

## Quick Start Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startTransaction, rollbackTransaction, db } from './testDb';
import { createTestUser, createTestOrg, createTestTodo } from './testFixtures';

describe('Feature Name', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  it('describes specific behavior', async () => {
    // Arrange: Create test data
    const user = await createTestUser();

    // Act: Execute behavior under test
    const result = await yourService.method(user.id);

    // Assert: Verify outcome
    expect(result.id).toBeDefined();
    expect(result.userId).toBe(user.id);
  });
});
```

---

## Import Structure

**For server tests (features/, utils/, api/):**

```typescript
// Test framework
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Test infrastructure (relative imports)
import { startTransaction, rollbackTransaction, db } from '../../utils/testDb';
import { createTestUser, createTestOrg, createTestTodo } from '../../utils/testFixtures';

// Module under test (relative import)
import { todoRepository } from './todo-repository';
```

**Key points:**

- Use relative imports for server-side test files
- `testDb` exports: `startTransaction`, `rollbackTransaction`, `db`
- `testFixtures` exports: `createTestUser`, `createTestOrg`, `createTestTodo`
- Adjust `../` depth based on file location

---

## Transaction Lifecycle

**Every integration test MUST use transaction hooks:**

```typescript
describe('Your Feature', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  // Tests here automatically roll back
});
```

**Why transactions:**

- Complete isolation between tests
- Automatic cleanup (no manual teardown)
- Tests can run in any order
- No test pollution

---

## Fixture Factories

**Basic usage:**

```typescript
// Create with defaults
const user = await createTestUser();
const org = await createTestOrg();
const todo = await createTestTodo(user.id);
```

**Override defaults:**

```typescript
// User overrides
const admin = await createTestUser({
  role: 'ADMIN',
  email: 'admin@test.com',
  name: 'Admin User',
  emailVerified: true,
});

// Organization overrides
const premiumOrg = await createTestOrg({
  planType: 'premium',
  name: 'Premium Organization',
});

// Todo overrides
const completedTodo = await createTestTodo(user.id, {
  title: 'Completed Task',
  description: 'This is done',
  completed: true,
});
```

**Building relationships:**

```typescript
// Create user, org, and link them
const user = await createTestUser();
const org = await createTestOrg();
await db.organizationMember.create({
  data: {
    userId: user.id,
    organizationId: org.id,
    role: 'OWNER',
  },
});
```

**Always use returned IDs:**

```typescript
// ✅ CORRECT: Use actual generated IDs
const user = await createTestUser();
const todo = await createTestTodo(user.id);
expect(todo.userId).toBe(user.id);

// ❌ WRONG: Never hardcode IDs
const todo = await createTestTodo('user-123'); // Fails - user doesn't exist
```

---

## Repository Testing Pattern

**Complete example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startTransaction, rollbackTransaction } from '../../utils/testDb';
import { createTestUser, createTestTodo } from '../../utils/testFixtures';
import { todoRepository } from './todo-repository';

describe('TodoRepository', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('findByUserId', () => {
    it('returns todos for specific user', async () => {
      const user = await createTestUser();
      const todo1 = await createTestTodo(user.id, { title: 'Task 1' });
      const todo2 = await createTestTodo(user.id, { title: 'Task 2' });

      const result = await todoRepository.findByUserId(user.id);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toContain(todo1.id);
      expect(result.map((t) => t.id)).toContain(todo2.id);
    });

    it('does not return other users todos', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestTodo(user1.id);
      await createTestTodo(user2.id);

      const result = await todoRepository.findByUserId(user1.id);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(user1.id);
    });
  });

  describe('create', () => {
    it('creates todo with required fields', async () => {
      const user = await createTestUser();

      const result = await todoRepository.create(user.id, {
        title: 'New task',
        description: 'Details here',
      });

      expect(result.id).toBeDefined();
      expect(result.title).toBe('New task');
      expect(result.userId).toBe(user.id);
    });
  });
});
```

---

## Common Test Patterns

**Testing CRUD operations:**

```typescript
// CREATE
it('creates entity', async () => {
  const user = await createTestUser();
  const entity = await repository.create(user.id, data);
  expect(entity.id).toBeDefined();
});

// READ
it('finds entity by id', async () => {
  const user = await createTestUser();
  const entity = await createEntity(user.id);
  const found = await repository.findById(entity.id, user.id);
  expect(found?.id).toBe(entity.id);
});

// UPDATE
it('updates entity', async () => {
  const user = await createTestUser();
  const entity = await createEntity(user.id);
  const updated = await repository.update(entity.id, user.id, { title: 'New' });
  expect(updated.title).toBe('New');
});

// DELETE
it('deletes entity', async () => {
  const user = await createTestUser();
  const entity = await createEntity(user.id);
  await repository.delete(entity.id);
  const found = await repository.findById(entity.id, user.id);
  expect(found).toBeNull();
});
```

**Testing user isolation (CRITICAL):**

```typescript
it('enforces user data isolation', async () => {
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  const user1Entity = await createEntity(user1.id);

  // user2 should NOT see user1's entity
  const result = await repository.findById(user1Entity.id, user2.id);
  expect(result).toBeNull();
});
```

**Testing with filters:**

```typescript
it('filters by status', async () => {
  const user = await createTestUser();
  await createTestTodo(user.id, { completed: false });
  await createTestTodo(user.id, { completed: true });

  const active = await todoRepository.findByUserId(user.id, { filter: 'active' });
  const completed = await todoRepository.findByUserId(user.id, { filter: 'completed' });

  expect(active).toHaveLength(1);
  expect(completed).toHaveLength(1);
});
```

**Testing error cases:**

```typescript
it('throws error when entity not found', async () => {
  const user = await createTestUser();
  await expect(service.getEntity('nonexistent-id', user.id)).rejects.toThrow();
});

it('returns null for missing entities', async () => {
  const user = await createTestUser();
  const result = await repository.findById('nonexistent-id', user.id);
  expect(result).toBeNull();
});
```

---

## Running Tests

```bash
# Single file
bun test server/features/todo/todo-repository.test.ts

# With database
DATABASE_URL="postgresql://bistro:bistro@localhost:5432/bistro" bun test

# Watch mode
bun test

# All tests
bun test:run

# With shuffle (verify order independence)
bun test --sequence.shuffle
```

---

## Edge Cases and Gotchas

### Auto-increment IDs

IDs don't reset on rollback - sequences advance even when transactions roll back.

```typescript
// ❌ DON'T: Hardcode IDs
expect(todo.userId).toBe('user-1'); // FRAGILE

// ✅ DO: Use returned objects
const user = await createTestUser();
const todo = await createTestTodo(user.id);
expect(todo.userId).toBe(user.id); // RELIABLE
```

### beforeAll vs beforeEach

Data created in `beforeAll` commits BEFORE transaction hooks run - it persists.

```typescript
// ⚠️ beforeAll data persists across tests
beforeAll(async () => {
  globalUser = await createTestUser(); // PERSISTS
});

// ✅ PREFER: Create data in each test
it('uses test data', async () => {
  const user = await createTestUser(); // Isolated
});
```

### Async Operations

All database operations must be awaited.

```typescript
// ❌ DON'T
createTestUser(); // NOT AWAITED

// ✅ DO
const user = await createTestUser();
```

### Unique Constraints

Fixtures use timestamp + random for automatic uniqueness.

```typescript
// ❌ DON'T: Duplicate unique values
const user1 = await createTestUser({ email: 'test@example.com' });
const user2 = await createTestUser({ email: 'test@example.com' }); // FAILS

// ✅ DO: Use fixture defaults
const user1 = await createTestUser(); // Auto-unique email
const user2 = await createTestUser(); // Different auto-unique email
```

### Transaction Lifecycle

Always pair `beforeEach` with `afterEach`.

```typescript
// ❌ Missing afterEach leaves transactions open
beforeEach(async () => await startTransaction());

// ✅ Always pair
beforeEach(async () => await startTransaction());
afterEach(async () => await rollbackTransaction());
```

### Relationship Handling

Foreign keys require parent entities first.

```typescript
// ❌ DON'T
const todo = await createTestTodo('nonexistent-user-id'); // FAILS

// ✅ DO
const user = await createTestUser();
const todo = await createTestTodo(user.id);
```

---

## H3 Event Mocking

**Use h3's `createEvent` for proper H3Event instances:**

```typescript
import { createEvent } from 'h3';
import type { IncomingMessage, ServerResponse } from 'node:http';

const mockReq = { headers: {}, method: 'GET', url: '/' } as unknown as IncomingMessage;
const mockRes = { statusCode: 200 } as unknown as ServerResponse;
const event = createEvent(mockReq, mockRes);

event.context.params = { id: 'todo-123' };
```

**Test helpers location:** `server/testing/testHelpers.ts`

- `createMockEvent(options)` - unauthenticated requests
- `createAuthEvent(user, options)` - authenticated requests with session

---

## Nuxt Auto-imports in Tests

Don't re-declare globals that Nuxt provides:

```typescript
// ❌ DON'T: Conflicts with Nuxt's auto-imports
declare global {
  var createError: (input: string) => Error;
}

// ✅ DO: Just provide runtime fallback
const g = globalThis as Record<string, unknown>;
if (typeof g.createError === 'undefined') {
  g.createError = (input) => new Error(input);
}
```

---

## Troubleshooting Tests

**"Cannot find module" errors:**

- Use relative imports (`./testDb`, not `~/server/utils/testDb`)
- Check import depth (`../../utils/testDb` vs `../utils/testDb`)

**"Unique constraint failed":**

- Fixtures use timestamp + random for uniqueness
- Ensure transaction hooks are in place

**Tests fail in specific order:**

- Not using transactions properly
- Data created in `beforeAll` persists

**Slow tests:**

- Target: <50ms per fixture, <1s per test file
- Check database connection (should use existing pool)

---

_See also: [Adding API Endpoints](../SOP/adding_api_endpoints.md) for testing endpoints_
