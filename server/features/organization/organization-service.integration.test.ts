import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestOrg, createTestOrgMember, createTestUser } from '../../testing/testFixtures';
import { organizationService } from './organization-service';

describe('organizationService', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('createOrganization', () => {
    it('creates org and adds creator as OWNER', async () => {
      const user = await createTestUser();
      const slug = `new-org-${Date.now()}`;
      const input = { name: 'New Org', slug };

      const result = await organizationService.createOrganization(user.id, input);

      expect(result.name).toBe('New Org');
      expect(result.slug).toBe(slug);

      // Verify creator is OWNER
      const membership = await db.organizationMember.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId: result.id } },
      });
      expect(membership?.role).toBe('OWNER');
    });

    it('throws 409 if slug exists', async () => {
      const user = await createTestUser();
      await createTestOrg({ slug: 'taken-slug' });

      await expect(
        organizationService.createOrganization(user.id, { name: 'Test', slug: 'taken-slug' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('getOrganization', () => {
    it('returns org with members if user is member', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');

      const result = await organizationService.getOrganization(user.id, org.id);

      expect(result.id).toBe(org.id);
      expect(result.members).toBeDefined();
      expect(result.members.length).toBeGreaterThan(0);
    });

    it('throws 403 if user not member', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();

      await expect(organizationService.getOrganization(user.id, org.id)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('updateOrganization', () => {
    it('updates org if user is OWNER', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'OWNER');

      const result = await organizationService.updateOrganization(user.id, org.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('updates org if user is ADMIN', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'ADMIN');

      const result = await organizationService.updateOrganization(user.id, org.id, {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });

    it('throws 403 if user is MEMBER', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');

      await expect(
        organizationService.updateOrganization(user.id, org.id, { name: 'test' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 409 if new slug already exists', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrg({ slug: 'taken-slug' });
      await createTestOrgMember(user.id, org.id, 'OWNER');

      await expect(
        organizationService.updateOrganization(user.id, org.id, { slug: 'taken-slug' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('deleteOrganization', () => {
    it('deletes org if user is OWNER', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'OWNER');

      await organizationService.deleteOrganization(user.id, org.id);

      const deleted = await db.organization.findUnique({ where: { id: org.id } });
      expect(deleted).toBeNull();
    });

    it('throws 403 if user is ADMIN', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'ADMIN');

      await expect(organizationService.deleteOrganization(user.id, org.id)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('inviteMember', () => {
    it('creates invite if user is OWNER', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'OWNER');

      const result = await organizationService.inviteMember(user.id, org.id, {
        email: 'invite@test.com',
        role: 'MEMBER',
      });

      expect(result.email).toBe('invite@test.com');
      expect(result.role).toBe('MEMBER');
      expect(result.token).toBeDefined();
    });

    it('creates invite if user is ADMIN', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'ADMIN');

      const result = await organizationService.inviteMember(user.id, org.id, {
        email: 'invite@test.com',
        role: 'MEMBER',
      });

      expect(result.email).toBe('invite@test.com');
    });

    it('throws 403 if user is MEMBER', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');

      await expect(
        organizationService.inviteMember(user.id, org.id, {
          email: 'invite@test.com',
          role: 'MEMBER',
        }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('acceptInvite', () => {
    it('accepts invite and adds member', async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');

      const invite = await organizationService.inviteMember(owner.id, org.id, {
        email: invitee.email,
        role: 'MEMBER',
      });

      const result = await organizationService.acceptInvite(invitee.id, invite.token);

      expect(result.userId).toBe(invitee.id);
      expect(result.organizationId).toBe(org.id);
      expect(result.role).toBe('MEMBER');
    });

    it('throws 404 if invite not found', async () => {
      const user = await createTestUser();

      await expect(
        organizationService.acceptInvite(user.id, 'invalid-token'),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 if invite expired', async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');

      // Create expired invite directly
      const invite = await db.organizationInvite.create({
        data: {
          organizationId: org.id,
          email: invitee.email,
          role: 'MEMBER',
          token: `expired-token-${Date.now()}`,
          invitedById: owner.id,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      await expect(
        organizationService.acceptInvite(invitee.id, invite.token),
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invite has expired' });
    });

    it('throws 403 if email does not match', async () => {
      const owner = await createTestUser();
      const wrongUser = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');

      const invite = await organizationService.inviteMember(owner.id, org.id, {
        email: 'different-email@test.com',
        role: 'MEMBER',
      });

      await expect(
        organizationService.acceptInvite(wrongUser.id, invite.token),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 409 if already a member', async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');
      await createTestOrgMember(invitee.id, org.id, 'MEMBER');

      const invite = await organizationService.inviteMember(owner.id, org.id, {
        email: invitee.email,
        role: 'MEMBER',
      });

      await expect(
        organizationService.acceptInvite(invitee.id, invite.token),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('updateMemberRole', () => {
    it('updates role if user is OWNER', async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');
      await createTestOrgMember(member.id, org.id, 'MEMBER');

      const result = await organizationService.updateMemberRole(
        owner.id,
        org.id,
        member.id,
        'ADMIN',
      );

      expect(result.role).toBe('ADMIN');
    });

    it('throws 400 if trying to change own role', async () => {
      const owner = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');

      await expect(
        organizationService.updateMemberRole(owner.id, org.id, owner.id, 'ADMIN'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 403 if user is not OWNER', async () => {
      const admin = await createTestUser();
      const member = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(admin.id, org.id, 'ADMIN');
      await createTestOrgMember(member.id, org.id, 'MEMBER');

      await expect(
        organizationService.updateMemberRole(admin.id, org.id, member.id, 'ADMIN'),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('removeMember', () => {
    it('removes member if user is OWNER', async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');
      await createTestOrgMember(member.id, org.id, 'MEMBER');

      await organizationService.removeMember(owner.id, org.id, member.id);

      const removed = await db.organizationMember.findUnique({
        where: { userId_organizationId: { userId: member.id, organizationId: org.id } },
      });
      expect(removed).toBeNull();
    });

    it('removes member if user is ADMIN', async () => {
      const admin = await createTestUser();
      const member = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(admin.id, org.id, 'ADMIN');
      await createTestOrgMember(member.id, org.id, 'MEMBER');

      await organizationService.removeMember(admin.id, org.id, member.id);

      const removed = await db.organizationMember.findUnique({
        where: { userId_organizationId: { userId: member.id, organizationId: org.id } },
      });
      expect(removed).toBeNull();
    });

    it('throws 403 if user is MEMBER', async () => {
      const member1 = await createTestUser();
      const member2 = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(member1.id, org.id, 'MEMBER');
      await createTestOrgMember(member2.id, org.id, 'MEMBER');

      await expect(
        organizationService.removeMember(member1.id, org.id, member2.id),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 409 if removing last OWNER', async () => {
      const owner = await createTestUser();
      const admin = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner.id, org.id, 'OWNER');
      await createTestOrgMember(admin.id, org.id, 'ADMIN');

      // Owner tries to remove themselves (last owner)
      await expect(
        organizationService.removeMember(owner.id, org.id, owner.id),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('allows removing OWNER if multiple OWNERs exist', async () => {
      const owner1 = await createTestUser();
      const owner2 = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(owner1.id, org.id, 'OWNER');
      await createTestOrgMember(owner2.id, org.id, 'OWNER');

      await organizationService.removeMember(owner1.id, org.id, owner2.id);

      const removed = await db.organizationMember.findUnique({
        where: { userId_organizationId: { userId: owner2.id, organizationId: org.id } },
      });
      expect(removed).toBeNull();
    });
  });
});
