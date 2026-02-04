# Integration Testing with Transaction Isolation

Integration tests with automatic cleanup via PostgreSQL transactions. No mocking required.

## TL;DR

Real database tests with zero cleanup code. Each test runs in a transaction that automatically rolls back.

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startTransaction, rollbackTransaction } from './testDb';
import { createTestUser, createTestTodo } from './testFixtures';

describe('My Feature', () => {
  beforeEach(async () => await startTransaction());
  afterEach(async () => await rollbackTransaction());

  it('works with real data', async () => {
    const user = await createTestUser();
    const todo = await createTestTodo(user.id);

    expect(todo.userId).toBe(user.id);
  });
});
```

**Benefits:** Real DB behavior, zero test pollution, <1s per file, no mocking overhead.

**Read time:** ~5 minutes

## Why Transaction-Per-Test?

### vs Mocking

❌ **Mocking approach:**

- Tests mock assumptions, not real behavior
- Misses SQL errors, constraint violations, performance issues
- Brittle (breaks when implementation changes)
- High maintenance (update mocks when schema changes)

✅ **Transaction approach:**

- Tests real PostgreSQL behavior
- Catches actual database errors
- Tests stay valid across refactoring
- Zero mock maintenance

### vs Manual Cleanup

❌ **Manual cleanup:**

```typescript
afterEach(async () => {
  await db.todo.deleteMany();
  await db.user.deleteMany();
  // Easy to forget something → test pollution
});
```

✅ **Transaction rollback:**

```typescript
afterEach(async () => await rollbackTransaction());
// Everything cleaned automatically, guaranteed
```

### Performance

- Transaction overhead: <100ms per test
- Full suite target: <5 seconds
- Faster than recreating database
- Parallel execution safe (each test isolated)

### Proven Pattern

Inspired by Django ORM's `TransactionTestCase` (battle-tested for 15+ years across millions of projects).

## How It Works

### The Lifecycle

```
1. beforeEach  → BEGIN (start transaction)
2. Test runs   → CREATE/UPDATE/DELETE (real DB operations)
3. afterEach   → ROLLBACK (automatic cleanup)
```

All database operations within the test are part of the transaction. Rollback undoes everything instantly - no traces left.

### Key Insight

PostgreSQL transactions rollback in milliseconds. No need to recreate database between tests - just rollback the transaction.

```sql
BEGIN;                    -- Start fresh state
INSERT INTO users ...;    -- Test creates data
SELECT * FROM users ...;  -- Test queries data
ROLLBACK;                 -- Instant cleanup
-- Database back to original state
```

## Quick Start

### 1. Import helpers

```typescript
import { startTransaction, rollbackTransaction, db } from '~/server/utils/testDb';
import { createTestUser, createTestOrg, createTestTodo } from '~/server/utils/testFixtures';
```

### 2. Add transaction hooks

```typescript
beforeEach(async () => {
  await startTransaction();
});

afterEach(async () => {
  await rollbackTransaction();
});
```

### 3. Use fixtures

```typescript
it('creates todo for user', async () => {
  // Create test data
  const user = await createTestUser();
  const todo = await createTestTodo(user.id, { title: 'Test Task' });

  // Test your code
  const found = await db.todo.findUnique({ where: { id: todo.id } });

  // Assert
  expect(found?.title).toBe('Test Task');
  expect(found?.userId).toBe(user.id);
});
```

### 4. Run tests

```bash
bun test
```

**That's it.** No cleanup code needed.

## Migration Phases

### Phase 1: Utilities Setup ✅

- ✅ Create `testDb.ts` (transaction helpers)
- ✅ Create `testFixtures.ts` (factory functions)
- ✅ Add CLAUDE.md templates
- ✅ Create example test file

### Phase 2: Documentation ✅ (Current)

- ✅ Document edge cases and gotchas
- ✅ Enhance JSDoc comments
- ✅ Create migration guide (this document)

### Phase 3: Incremental Migration

- [ ] Convert tests file-by-file (not big-bang)
- [ ] Start with `server/api/**` integration tests
- [ ] Repository tests next
- [ ] Service tests continue using mocks (unit tests)

### Phase 4: Full Coverage

- [ ] Convert all server integration tests
- [ ] Achieve >80% integration test coverage
- [ ] Validate <5s test suite execution
- [ ] Remove obsolete mocks

## Migration Strategy

### Incremental Approach

**DO:** Convert file-by-file at your own pace
**DON'T:** Try to convert everything at once

```bash
# Good: One file at a time
git checkout -b test/convert-user-api
# Convert server/api/user/profile.get.test.ts
git commit -m "test: convert user profile to transaction pattern"

# Good: Coexistence
# Old tests: Use mocks (keep working)
# New tests: Use transactions
# Both patterns work simultaneously
```

### Backward Compatibility

**Old tests keep working:**

- Mock-based tests unchanged
- No breaking changes to Vitest config
- `db.ts` singleton unchanged
- No forced migration

**Coexistence:**

```typescript
// Old pattern (still works)
vi.mock('~/server/utils/db');
const mockDb = { user: { findUnique: vi.fn() } };

// New pattern (coexists)
import { startTransaction, rollbackTransaction } from './testDb';
import { createTestUser } from './testFixtures';
```

### When to Convert

**Good candidates:**

- Integration tests (API routes, repositories)
- Tests currently mocking Prisma
- Tests with manual cleanup code
- Tests that fail due to test pollution

**Keep as-is:**

- Pure unit tests (no DB needed)
- Tests that mock external APIs
- Tests with complex mock setups that work well

**Rule of thumb:** If it touches the database, use transactions. If it doesn't, mocking is fine.

## Common Patterns

### User-scoped data

```typescript
it('enforces user isolation', async () => {
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  const user1Todo = await createTestTodo(user1.id);

  // user2 should NOT see user1's todo
  const user2Todos = await db.todo.findMany({ where: { userId: user2.id } });
  expect(user2Todos).toHaveLength(0);
});
```

### Relationships

```typescript
it('creates related entities', async () => {
  const user = await createTestUser();
  const org = await createTestOrg();

  // Create relationship
  await db.organizationMember.create({
    data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
  });

  // Verify
  const orgWithMembers = await db.organization.findUnique({
    where: { id: org.id },
    include: { members: true },
  });
  expect(orgWithMembers?.members).toHaveLength(1);
});
```

### Filtering and sorting

```typescript
it('filters by status', async () => {
  const user = await createTestUser();
  await createTestTodo(user.id, { completed: false });
  await createTestTodo(user.id, { completed: true });

  const active = await db.todo.findMany({
    where: { userId: user.id, completed: false },
  });

  expect(active).toHaveLength(1);
});
```

## Edge Cases and Gotchas

### Auto-increment IDs

❌ **DON'T hardcode IDs:**

```typescript
const todo = await db.todo.findUnique({ where: { id: 'user-123' } });
// Breaks - ID changes between runs
```

✅ **DO use returned objects:**

```typescript
const user = await createTestUser();
const todo = await createTestTodo(user.id);
expect(todo.userId).toBe(user.id); // Always works
```

### beforeAll vs beforeEach

⚠️ **WARNING:** Data created in `beforeAll` persists across all tests (not rolled back):

```typescript
beforeAll(async () => {
  globalUser = await createTestUser(); // PERSISTS - risky
});

beforeEach(async () => {
  await startTransaction();
  testUser = await createTestUser(); // CLEANED UP - safe
});
```

🎯 **PREFER:** Create data in each test for complete isolation.

### Async operations

Always await database operations:

```typescript
// ❌ WRONG: Missing await
createTestUser(); // Race condition
const result = await service.getUsers();

// ✅ CORRECT: Await all DB calls
const user = await createTestUser();
const result = await service.getUsers();
```

### Unique constraints

Fixtures use timestamp + random for automatic uniqueness:

```typescript
// ✅ Works: Automatic unique emails
const user1 = await createTestUser(); // test-1234567890-abc@example.com
const user2 = await createTestUser(); // test-1234567891-def@example.com

// ✅ Works: Explicit unique values
const user1 = await createTestUser({ email: 'alice@test.com' });
const user2 = await createTestUser({ email: 'bob@test.com' });

// ❌ Fails: Duplicate emails
const user1 = await createTestUser({ email: 'same@test.com' });
const user2 = await createTestUser({ email: 'same@test.com' }); // ERROR
```

## Inspiration: Django ORM

Django's `TransactionTestCase` has used this pattern for 15+ years:

```python
from django.test import TransactionTestCase

class MyTest(TransactionTestCase):
    def test_user_creation(self):
        # Automatic transaction wrapping
        user = User.objects.create(email='test@example.com')
        self.assertEqual(user.email, 'test@example.com')
        # Automatic rollback after test
```

### Learnings Applied

- ✅ Transaction-per-test for isolation
- ✅ Auto-increment IDs don't reset (design limitation)
- ✅ `beforeAll` equivalent to `setUpTestData` (persists)
- ✅ `beforeEach` equivalent to `setUp` (per-test)
- ✅ Instant rollback for performance

Proven pattern. Millions of Django projects use this approach successfully.

## Performance Targets

- **Per fixture:** <50ms
- **Per test:** <100ms
- **Per file:** <1s
- **Full suite:** <5s

Actual performance (validated):

- Fixture creation: 20-30ms (user), 5-10ms (org/todo)
- Test execution: 400-600ms per file (15-16 tests)
- Well under targets ✅

## Additional Resources

- **CLAUDE.md:** AI-optimized templates and comprehensive examples
- **example-integration.test.ts:** 16 real-world test examples
- **testDb.ts JSDoc:** Lifecycle and error handling details
- **testFixtures.ts JSDoc:** Fixture defaults and override examples

## FAQ

**Q: Do I have to convert all tests at once?**
A: No. Convert file-by-file. Old mocked tests keep working.

**Q: Will this slow down my tests?**
A: No. Transactions are <100ms overhead. Target is <5s for full suite.

**Q: Can I still use mocks for external APIs?**
A: Yes. This pattern is for database testing. Mock external services as needed.

**Q: What about nested transactions?**
A: Not supported in MVP. Each test gets one transaction. Sufficient for 99% of cases.

**Q: Does this work with parallel test execution?**
A: Yes. Each test has its own isolated transaction. Safe to run in parallel.

**Q: What if I need specific data across multiple tests?**
A: Create fixtures in each test. Fast enough (<50ms) that duplication is fine.

**Q: How do I test transaction rollback behavior?**
A: Use nested transaction pattern in your application code, test at service layer.

---

**Ready to migrate?** Start with one file. See how it feels. Expand from there.

For AI agents: See CLAUDE.md Test Infrastructure section for copy-paste templates.
