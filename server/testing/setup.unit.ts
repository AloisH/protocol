import { vi } from 'vitest';
import { mockDb } from './mocks/db';

// Import existing setup for createError fallback
import './setup';

// Mock db singleton before any module imports it
vi.mock('../utils/db', () => ({ db: mockDb }));

// Mock testDb for tests that import it directly
vi.mock('./testDb', () => ({
  db: mockDb,
  startTransaction: vi.fn(),
  rollbackTransaction: vi.fn(),
}));
