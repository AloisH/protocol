import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import {
  createTestOrg,
  createTestOrgMember,
  createTestSession,
  createTestUser,
} from '../../testing/testFixtures';
import { sessionRepository } from './session-repository';

describe('sessionRepository', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('findByUserId', () => {
    it('returns all sessions for user ordered by createdAt desc', async () => {
      const user = await createTestUser();
      const session1 = await createTestSession(user);
      const session2 = await createTestSession(user);

      const result = await sessionRepository.findByUserId(user.id);

      expect(result).toHaveLength(2);
      // Most recent first
      expect(result.at(0)?.id).toBe(session2.id);
      expect(result.at(1)?.id).toBe(session1.id);
    });

    it('returns empty array if no sessions', async () => {
      const user = await createTestUser();

      const result = await sessionRepository.findByUserId(user.id);

      expect(result).toHaveLength(0);
    });

    it('does not return other users sessions', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestSession(user1);
      await createTestSession(user2);

      const result = await sessionRepository.findByUserId(user1.id);

      expect(result).toHaveLength(1);
      expect(result.at(0)?.userId).toBe(user1.id);
    });
  });

  describe('findById', () => {
    it('returns session if owned by user', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const result = await sessionRepository.findById(session.id, user.id);

      expect(result?.id).toBe(session.id);
    });

    it('returns null if session not found', async () => {
      const user = await createTestUser();

      const result = await sessionRepository.findById('nonexistent', user.id);

      expect(result).toBeNull();
    });

    it('returns null if session owned by different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const session = await createTestSession(user1);

      const result = await sessionRepository.findById(session.id, user2.id);

      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('deletes session and returns true', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const result = await sessionRepository.deleteById(session.id, user.id);

      expect(result).toBe(true);
      const deleted = await db.session.findUnique({ where: { id: session.id } });
      expect(deleted).toBeNull();
    });

    it('returns false if session not found', async () => {
      const user = await createTestUser();

      const result = await sessionRepository.deleteById('nonexistent', user.id);

      expect(result).toBe(false);
    });

    it('returns false if session owned by different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const session = await createTestSession(user1);

      const result = await sessionRepository.deleteById(session.id, user2.id);

      expect(result).toBe(false);
      // Session still exists
      const existing = await db.session.findUnique({ where: { id: session.id } });
      expect(existing).not.toBeNull();
    });
  });

  describe('deleteAllExcept', () => {
    it('deletes all sessions except current', async () => {
      const user = await createTestUser();
      const current = await createTestSession(user);
      await createTestSession(user);
      await createTestSession(user);

      const count = await sessionRepository.deleteAllExcept(current.token, user.id);

      expect(count).toBe(2);
      const remaining = await db.session.findMany({ where: { userId: user.id } });
      expect(remaining).toHaveLength(1);
      expect(remaining.at(0)?.token).toBe(current.token);
    });

    it('returns 0 if only current session exists', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const count = await sessionRepository.deleteAllExcept(session.token, user.id);

      expect(count).toBe(0);
    });

    it('does not affect other users sessions', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const session1 = await createTestSession(user1);
      await createTestSession(user2);

      await sessionRepository.deleteAllExcept(session1.token, user1.id);

      const user2Sessions = await db.session.findMany({ where: { userId: user2.id } });
      expect(user2Sessions).toHaveLength(1);
    });
  });

  describe('updateCurrentOrganization', () => {
    it('updates current organization', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');

      const result = await sessionRepository.updateCurrentOrganization(
        session.token,
        user.id,
        org.id,
      );

      expect(result.currentOrganizationId).toBe(org.id);
    });

    it('clears current organization when null', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const session = await db.session.create({
        data: {
          token: `test-${Date.now()}`,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          currentOrganizationId: org.id,
        },
      });

      const result = await sessionRepository.updateCurrentOrganization(
        session.token,
        user.id,
        null,
      );

      expect(result.currentOrganizationId).toBeNull();
    });

    it('throws 404 if session not found', async () => {
      const user = await createTestUser();

      await expect(
        sessionRepository.updateCurrentOrganization('nonexistent', user.id, null),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
