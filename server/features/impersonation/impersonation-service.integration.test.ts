import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestUser } from '../../testing/testFixtures';
import { impersonationRepository } from './impersonation-repository';
import { impersonationService } from './impersonation-service';

// Partial mock for Better Auth API response - cast to expected type
const mockAuthResponse = {
  session: { id: 'mock-session', userId: 'mock-user', token: 'mock-token', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  user: { id: 'mock-user', email: 'mock@test.com', name: 'Mock', role: 'USER', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  headers: { getSetCookie: () => [] },
} as unknown as Awaited<ReturnType<typeof import('../auth/auth-config').auth.api.impersonateUser>>;

// Mock Better Auth
vi.mock('../auth/auth-config', () => ({
  auth: {
    api: {
      impersonateUser: vi.fn(),
      stopImpersonating: vi.fn(),
    },
  },
}));

// Mock H3 globals (Nuxt auto-imports these)
const mockGetHeader = vi.fn();
const mockAppendResponseHeader = vi.fn();

// Set up globals before tests
const g = globalThis as unknown as Record<string, unknown>;
g.getHeader = mockGetHeader;
g.appendResponseHeader = mockAppendResponseHeader;

describe('impersonationService', () => {
  beforeEach(async () => {
    await startTransaction();
    vi.clearAllMocks();
    mockGetHeader.mockReturnValue(undefined);
    mockAppendResponseHeader.mockImplementation(() => {});
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('startImpersonation', () => {
    it('throws 404 if target user not found', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.startImpersonation
      >[2];

      await expect(
        impersonationService.startImpersonation(
          admin.id,
          { userId: 'nonexistent-user-id' },
          mockEvent,
        ),
      ).rejects.toMatchObject({ statusCode: 404, message: 'Target user not found' });
    });

    it('throws 403 if trying to impersonate SUPER_ADMIN', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const superAdmin = await createTestUser({ role: 'SUPER_ADMIN' });
      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.startImpersonation
      >[2];

      await expect(
        impersonationService.startImpersonation(admin.id, { userId: superAdmin.id }, mockEvent),
      ).rejects.toMatchObject({ statusCode: 403, message: 'Cannot impersonate super admin' });
    });

    it('can impersonate USER role', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      // Mock successful Better Auth response
      const { auth } = await import('../auth/auth-config');
      vi.mocked(auth.api.impersonateUser).mockResolvedValue(mockAuthResponse);

      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.startImpersonation
      >[2];

      const log = await impersonationService.startImpersonation(
        admin.id,
        { userId: target.id },
        mockEvent,
      );

      expect(log.adminId).toBe(admin.id);
      expect(log.targetUserId).toBe(target.id);
    });

    it('can impersonate ADMIN role', async () => {
      const superAdmin = await createTestUser({ role: 'SUPER_ADMIN' });
      const admin = await createTestUser({ role: 'ADMIN' });

      const { auth } = await import('../auth/auth-config');

      vi.mocked(auth.api.impersonateUser).mockResolvedValue(mockAuthResponse);

      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.startImpersonation
      >[2];

      const log = await impersonationService.startImpersonation(
        superAdmin.id,
        { userId: admin.id },
        mockEvent,
      );

      expect(log.adminId).toBe(superAdmin.id);
      expect(log.targetUserId).toBe(admin.id);
    });

    it('ends existing impersonation before starting new one', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target1 = await createTestUser({ role: 'USER' });
      const target2 = await createTestUser({ role: 'USER' });

      // Create an active impersonation log
      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target1.id,
      });

      const { auth } = await import('../auth/auth-config');

      vi.mocked(auth.api.impersonateUser).mockResolvedValue(mockAuthResponse);

      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.startImpersonation
      >[2];

      await impersonationService.startImpersonation(admin.id, { userId: target2.id }, mockEvent);

      // First session should be ended
      const logs = await db.impersonationLog.findMany({
        where: { adminId: admin.id },
        orderBy: { startedAt: 'desc' },
      });

      expect(logs).toHaveLength(2);
      expect(logs.at(1)?.endedAt).not.toBeNull(); // Old log ended
      expect(logs.at(0)?.endedAt).toBeNull(); // New log active
    });

    it('stores reason when provided', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      const { auth } = await import('../auth/auth-config');

      vi.mocked(auth.api.impersonateUser).mockResolvedValue(mockAuthResponse);

      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.startImpersonation
      >[2];

      const log = await impersonationService.startImpersonation(
        admin.id,
        { userId: target.id, reason: 'Debugging user issue' },
        mockEvent,
      );

      expect(log.reason).toBe('Debugging user issue');
    });

    it('throws 500 and cleans up log if Better Auth fails', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      const { auth } = await import('../auth/auth-config');
      vi.mocked(auth.api.impersonateUser).mockRejectedValue(new Error('Better Auth error'));

      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.startImpersonation
      >[2];

      await expect(
        impersonationService.startImpersonation(admin.id, { userId: target.id }, mockEvent),
      ).rejects.toMatchObject({ statusCode: 500 });

      // Log should be ended
      const active = await impersonationRepository.getActiveSession(admin.id);
      expect(active).toBeNull();
    });
  });

  describe('stopImpersonation', () => {
    it('throws 400 if no active impersonation', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.stopImpersonation
      >[1];

      await expect(
        impersonationService.stopImpersonation(admin.id, mockEvent),
      ).rejects.toMatchObject({ statusCode: 400, message: 'No active impersonation session' });
    });

    it('ends active impersonation successfully', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      // Create active impersonation
      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      const { auth } = await import('../auth/auth-config');

      vi.mocked(auth.api.stopImpersonating).mockResolvedValue(mockAuthResponse);

      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.stopImpersonation
      >[1];

      await impersonationService.stopImpersonation(admin.id, mockEvent);

      const active = await impersonationRepository.getActiveSession(admin.id);
      expect(active).toBeNull();
    });

    it('ends log even if Better Auth call fails', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      const { auth } = await import('../auth/auth-config');
      vi.mocked(auth.api.stopImpersonating).mockRejectedValue(new Error('Session expired'));

      const mockEvent = { headers: new Headers() } as Parameters<
        typeof impersonationService.stopImpersonation
      >[1];

      // Should not throw
      await impersonationService.stopImpersonation(admin.id, mockEvent);

      const active = await impersonationRepository.getActiveSession(admin.id);
      expect(active).toBeNull();
    });
  });

  describe('getActiveImpersonation', () => {
    it('returns null when no active session', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });

      const result = await impersonationService.getActiveImpersonation(admin.id);

      expect(result).toBeNull();
    });

    it('returns active session', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      const result = await impersonationService.getActiveImpersonation(admin.id);

      expect(result?.adminId).toBe(admin.id);
      expect(result?.targetUserId).toBe(target.id);
    });
  });

  describe('getAuditLogs', () => {
    it('returns all logs without filters', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      const logs = await impersonationService.getAuditLogs();

      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('filters by adminId', async () => {
      const admin1 = await createTestUser({ role: 'SUPER_ADMIN' });
      const admin2 = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      await impersonationRepository.createLog({ adminId: admin1.id, targetUserId: target.id });
      await impersonationRepository.createLog({ adminId: admin2.id, targetUserId: target.id });

      const logs = await impersonationService.getAuditLogs({ adminId: admin1.id });

      expect(logs).toHaveLength(1);
      expect(logs.at(0)?.adminId).toBe(admin1.id);
    });

    it('filters by targetUserId', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target1 = await createTestUser({ role: 'USER' });
      const target2 = await createTestUser({ role: 'USER' });

      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target1.id });
      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target2.id });

      const logs = await impersonationService.getAuditLogs({ targetUserId: target1.id });

      expect(logs).toHaveLength(1);
      expect(logs.at(0)?.targetUserId).toBe(target1.id);
    });

    it('respects limit', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ role: 'USER' });

      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });
      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });
      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });

      const logs = await impersonationService.getAuditLogs({ adminId: admin.id, limit: 2 });

      expect(logs).toHaveLength(2);
    });
  });
});
