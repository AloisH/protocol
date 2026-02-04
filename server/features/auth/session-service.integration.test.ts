import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import {
  createTestOrg,
  createTestOrgMember,
  createTestSession,
  createTestUser,
} from '../../testing/testFixtures';
import { sessionService } from './session-service';

describe('sessionService', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('listSessions', () => {
    it('returns sessions with metadata', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const result = await sessionService.listSessions(user.id, session.token);

      expect(result).toHaveLength(1);
      expect(result.at(0)?.id).toBe(session.id);
      expect(result.at(0)?.isCurrent).toBe(true);
      expect(result.at(0)?.browser).toBeDefined();
      expect(result.at(0)?.os).toBeDefined();
      expect(result.at(0)?.device).toBeDefined();
    });

    it('marks current session correctly', async () => {
      const user = await createTestUser();
      const session1 = await createTestSession(user);
      const session2 = await createTestSession(user);

      const result = await sessionService.listSessions(user.id, session1.token);

      expect(result).toHaveLength(2);
      const current = result.find(s => s.id === session1.id);
      const other = result.find(s => s.id === session2.id);
      expect(current?.isCurrent).toBe(true);
      expect(other?.isCurrent).toBe(false);
    });

    it('returns empty array if no sessions', async () => {
      const user = await createTestUser();

      const result = await sessionService.listSessions(user.id, 'nonexistent-token');

      expect(result).toHaveLength(0);
    });
  });

  describe('revokeSession', () => {
    it('revokes session successfully', async () => {
      const user = await createTestUser();
      const currentSession = await createTestSession(user);
      const otherSession = await createTestSession(user);

      await sessionService.revokeSession(otherSession.id, user.id, currentSession.token);

      const remaining = await db.session.findMany({ where: { userId: user.id } });
      expect(remaining).toHaveLength(1);
      expect(remaining.at(0)?.id).toBe(currentSession.id);
    });

    it('throws 404 if session not found', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      await expect(
        sessionService.revokeSession('nonexistent-id', user.id, session.token),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 if trying to revoke current session', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      await expect(
        sessionService.revokeSession(session.id, user.id, session.token),
      ).rejects.toMatchObject({ statusCode: 400, message: 'Cannot revoke current session' });
    });

    it('prevents revoking another users session', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const session1 = await createTestSession(user1);
      const session2 = await createTestSession(user2);

      await expect(
        sessionService.revokeSession(session2.id, user1.id, session1.token),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('revokeOtherSessions', () => {
    it('revokes all sessions except current', async () => {
      const user = await createTestUser();
      const currentSession = await createTestSession(user);
      await createTestSession(user);
      await createTestSession(user);

      const count = await sessionService.revokeOtherSessions(currentSession.token, user.id);

      expect(count).toBe(2);
      const remaining = await db.session.findMany({ where: { userId: user.id } });
      expect(remaining).toHaveLength(1);
      expect(remaining.at(0)?.id).toBe(currentSession.id);
    });

    it('returns 0 if only current session exists', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const count = await sessionService.revokeOtherSessions(session.token, user.id);

      expect(count).toBe(0);
    });
  });

  describe('setCurrentOrganization', () => {
    it('sets organization if user is member', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');

      await sessionService.setCurrentOrganization(session.token, user.id, org.id);

      const updated = await db.session.findUnique({ where: { id: session.id } });
      expect(updated?.currentOrganizationId).toBe(org.id);
    });

    it('clears organization when null', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');

      // Create session with org set
      const session = await db.session.create({
        data: {
          token: `test-${Date.now()}`,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          currentOrganizationId: org.id,
        },
      });

      await sessionService.setCurrentOrganization(session.token, user.id, null);

      const updated = await db.session.findUnique({ where: { id: session.id } });
      expect(updated?.currentOrganizationId).toBeNull();
    });

    it('throws 403 if user is not member of organization', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);
      const org = await createTestOrg();

      await expect(
        sessionService.setCurrentOrganization(session.token, user.id, org.id),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
