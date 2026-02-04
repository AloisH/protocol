import { describe, expect, it } from 'vitest';
import { impersonationLogSchema, startImpersonationSchema } from './schemas';

describe('impersonation Schemas', () => {
  describe('startImpersonationSchema', () => {
    it('accepts valid userId', () => {
      const result = startImpersonationSchema.parse({ userId: 'user-123' });
      expect(result.userId).toBe('user-123');
    });

    it('accepts userId with optional reason', () => {
      const result = startImpersonationSchema.parse({
        userId: 'user-123',
        reason: 'Debugging user issue',
      });
      expect(result.userId).toBe('user-123');
      expect(result.reason).toBe('Debugging user issue');
    });

    it('rejects empty userId', () => {
      expect(() => startImpersonationSchema.parse({ userId: '' })).toThrow();
    });

    it('rejects empty reason when provided', () => {
      expect(() =>
        startImpersonationSchema.parse({
          userId: 'user-123',
          reason: '',
        }),
      ).toThrow();
    });

    it('rejects reason over 500 chars', () => {
      expect(() =>
        startImpersonationSchema.parse({
          userId: 'user-123',
          reason: 'a'.repeat(501),
        }),
      ).toThrow();
    });

    it('accepts reason at max length', () => {
      const result = startImpersonationSchema.parse({
        userId: 'user-123',
        reason: 'a'.repeat(500),
      });
      expect(result.reason).toHaveLength(500);
    });
  });

  describe('impersonationLogSchema', () => {
    it('accepts valid log data', () => {
      const result = impersonationLogSchema.parse({
        id: 'log-123',
        adminId: 'admin-123',
        targetUserId: 'user-456',
        startedAt: new Date(),
        endedAt: null,
        reason: null,
        ipAddress: null,
        userAgent: null,
      });
      expect(result.id).toBe('log-123');
      expect(result.adminId).toBe('admin-123');
      expect(result.targetUserId).toBe('user-456');
    });

    it('accepts log with all optional fields', () => {
      const now = new Date();
      const result = impersonationLogSchema.parse({
        id: 'log-123',
        adminId: 'admin-123',
        targetUserId: 'user-456',
        startedAt: now,
        endedAt: now,
        reason: 'Test reason',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(result.reason).toBe('Test reason');
      expect(result.ipAddress).toBe('127.0.0.1');
      expect(result.userAgent).toBe('Mozilla/5.0');
    });

    it('requires all required fields', () => {
      expect(() =>
        impersonationLogSchema.parse({
          id: 'log-123',
          // missing other required fields
        }),
      ).toThrow();
    });
  });
});
