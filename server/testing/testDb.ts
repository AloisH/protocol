import { db } from '../utils/db';

/**
 * Start a PostgreSQL transaction for test isolation.
 *
 * Call in beforeEach() to wrap each test in a transaction. All database
 * operations within the test will be part of this transaction and will be
 * automatically rolled back by rollbackTransaction() in afterEach().
 *
 * **Lifecycle:**
 * 1. beforeEach: startTransaction() → BEGIN
 * 2. Test execution: database operations
 * 3. afterEach: rollbackTransaction() → ROLLBACK (cleanup)
 *
 * **Important:**
 * - Must be paired with rollbackTransaction() in afterEach()
 * - Nested transactions not supported
 * - Auto-increment IDs don't reset on rollback (use returned objects)
 * - Data created in beforeAll() persists (not rolled back)
 *
 * @throws {Error} If transaction fails to start (database connection issue)
 * @see {@link rollbackTransaction} for cleanup
 * @see CLAUDE.md Test Infrastructure section for usage examples
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await startTransaction()
 * })
 *
 * afterEach(async () => {
 *   await rollbackTransaction()
 * })
 * ```
 */
export async function startTransaction(): Promise<void> {
  try {
    await db.$executeRaw`BEGIN`;
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to start transaction: ${message}`);
  }
}

/**
 * Rollback the current PostgreSQL transaction.
 *
 * Call in afterEach() to automatically clean up test data. This ensures
 * complete test isolation - each test starts with a clean database state.
 *
 * **Error Handling:**
 * - Throws error on failure (fail-fast to prevent cascading test failures)
 * - Error indicates database connection issues or missing transaction
 * - Should never fail in normal operation when paired with startTransaction()
 *
 * **Important:**
 * - Must be paired with startTransaction() in beforeEach()
 * - Rolls back ALL changes made during the test
 * - Auto-increment IDs don't reset (design limitation, not a bug)
 *
 * @throws {Error} If rollback fails (connection issue or no active transaction)
 * @see {@link startTransaction} for transaction initialization
 * @see CLAUDE.md Test Infrastructure section for usage examples
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await rollbackTransaction()
 * })
 * ```
 */
export async function rollbackTransaction(): Promise<void> {
  try {
    await db.$executeRaw`ROLLBACK`;
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to rollback transaction: ${message}`);
  }
}

/**
 * Re-export db singleton for convenience.
 * Tests can import both transaction helpers and db from single module.
 */
export { db } from '../utils/db';
