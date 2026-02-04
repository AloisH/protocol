import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestUser } from '../../testing/testFixtures';
import { impersonationRepository } from './impersonation-repository';

describe('impersonationRepository', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('createLog', () => {
    it('creates impersonation log', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      const log = await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
        reason: 'Testing',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });

      expect(log.adminId).toBe(admin.id);
      expect(log.targetUserId).toBe(target.id);
      expect(log.reason).toBe('Testing');
      expect(log.ipAddress).toBe('127.0.0.1');
      expect(log.endedAt).toBeNull();
    });

    it('creates log without optional fields', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      const log = await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      expect(log.reason).toBeNull();
      expect(log.ipAddress).toBeNull();
    });
  });

  describe('endLog', () => {
    it('ends active impersonation log', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      const ended = await impersonationRepository.endLog(admin.id);

      expect(ended?.endedAt).not.toBeNull();
    });

    it('returns null if no active session', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });

      const result = await impersonationRepository.endLog(admin.id);

      expect(result).toBeNull();
    });

    it('only ends most recent active session', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      // Create and end first session
      const log1 = await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });
      await db.impersonationLog.update({
        where: { id: log1.id },
        data: { endedAt: new Date() },
      });

      // Create second active session
      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      const ended = await impersonationRepository.endLog(admin.id);

      expect(ended?.endedAt).not.toBeNull();
      // First session unchanged
      const first = await db.impersonationLog.findUnique({ where: { id: log1.id } });
      expect(first?.endedAt).not.toBeNull();
    });
  });

  describe('getActiveSession', () => {
    it('returns active session with target user', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser({ name: 'Target User' });

      await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });

      const active = await impersonationRepository.getActiveSession(admin.id);

      expect(active).not.toBeNull();
      expect(active!.adminId).toBe(admin.id);
      expect(active!.endedAt).toBeNull();
      expect(active!.targetUser.name).toBe('Target User');
    });

    it('returns null if no active session', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });

      const result = await impersonationRepository.getActiveSession(admin.id);

      expect(result).toBeNull();
    });

    it('returns null if session ended', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      const log = await impersonationRepository.createLog({
        adminId: admin.id,
        targetUserId: target.id,
      });
      await db.impersonationLog.update({
        where: { id: log.id },
        data: { endedAt: new Date() },
      });

      const result = await impersonationRepository.getActiveSession(admin.id);

      expect(result).toBeNull();
    });
  });

  describe('getLogs', () => {
    it('returns logs ordered by startedAt desc', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });
      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });

      const logs = await impersonationRepository.getLogs();

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.at(0)?.startedAt.getTime()).toBeGreaterThanOrEqual(
        logs.at(1)?.startedAt.getTime() ?? 0,
      );
    });

    it('filters by adminId', async () => {
      const admin1 = await createTestUser({ role: 'SUPER_ADMIN' });
      const admin2 = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      await impersonationRepository.createLog({ adminId: admin1.id, targetUserId: target.id });
      await impersonationRepository.createLog({ adminId: admin2.id, targetUserId: target.id });

      const logs = await impersonationRepository.getLogs({ adminId: admin1.id });

      expect(logs).toHaveLength(1);
      expect(logs.at(0)?.adminId).toBe(admin1.id);
    });

    it('filters by targetUserId', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target1 = await createTestUser();
      const target2 = await createTestUser();

      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target1.id });
      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target2.id });

      const logs = await impersonationRepository.getLogs({ targetUserId: target1.id });

      expect(logs).toHaveLength(1);
      expect(logs.at(0)?.targetUserId).toBe(target1.id);
    });

    it('respects limit', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN' });
      const target = await createTestUser();

      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });
      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });
      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });

      const logs = await impersonationRepository.getLogs({ limit: 2 });

      expect(logs).toHaveLength(2);
    });

    it('includes admin and target user details', async () => {
      const admin = await createTestUser({ role: 'SUPER_ADMIN', name: 'Admin' });
      const target = await createTestUser({ name: 'Target' });

      await impersonationRepository.createLog({ adminId: admin.id, targetUserId: target.id });

      const logs = await impersonationRepository.getLogs({ adminId: admin.id });

      expect(logs).toHaveLength(1);
      const log = logs[0]!;
      expect(log.adminId).toBe(admin.id);
      expect(log.targetUserId).toBe(target.id);
      expect(log.admin.name).toBe('Admin');
    });
  });
});
