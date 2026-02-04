import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestOrg, createTestOrgMember, createTestUser } from '../../testing/testFixtures';
import { organizationRepository } from './organization-repository';

describe('organizationRepository', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('organization CRUD', () => {
    describe('findById', () => {
      it('returns organization if found', async () => {
        const org = await createTestOrg({ name: 'Test Org' });

        const result = await organizationRepository.findById(org.id);

        expect(result?.id).toBe(org.id);
        expect(result?.name).toBe('Test Org');
      });

      it('returns null if not found', async () => {
        const result = await organizationRepository.findById('nonexistent-id');

        expect(result).toBeNull();
      });
    });

    describe('findBySlug', () => {
      it('returns organization if found', async () => {
        const org = await createTestOrg({ slug: 'my-org' });

        const result = await organizationRepository.findBySlug('my-org');

        expect(result?.id).toBe(org.id);
      });

      it('returns null if not found', async () => {
        const result = await organizationRepository.findBySlug('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('create', () => {
      it('creates organization with required fields', async () => {
        const uniqueSlug = `new-org-${Date.now()}`;
        const result = await organizationRepository.create({
          name: 'New Org',
          slug: uniqueSlug,
        });

        expect(result.id).toBeDefined();
        expect(result.name).toBe('New Org');
        expect(result.slug).toBe(uniqueSlug);
      });

      it('creates organization with optional fields', async () => {
        const result = await organizationRepository.create({
          name: 'Full Org',
          slug: 'full-org',
          description: 'A description',
          image: 'https://example.com/image.png',
        });

        expect(result.description).toBe('A description');
        expect(result.image).toBe('https://example.com/image.png');
      });
    });

    describe('update', () => {
      it('updates organization name', async () => {
        const org = await createTestOrg({ name: 'Old Name' });

        const result = await organizationRepository.update(org.id, { name: 'New Name' });

        expect(result.name).toBe('New Name');
      });

      it('updates organization slug', async () => {
        const org = await createTestOrg({ slug: 'old-slug' });

        const result = await organizationRepository.update(org.id, { slug: 'new-slug' });

        expect(result.slug).toBe('new-slug');
      });

      it('updates multiple fields', async () => {
        const org = await createTestOrg();

        const result = await organizationRepository.update(org.id, {
          name: 'Updated Name',
          description: 'Updated description',
        });

        expect(result.name).toBe('Updated Name');
        expect(result.description).toBe('Updated description');
      });
    });

    describe('delete', () => {
      it('deletes organization and returns true', async () => {
        const org = await createTestOrg();

        const result = await organizationRepository.delete(org.id);

        expect(result).toBe(true);
        const deleted = await db.organization.findUnique({ where: { id: org.id } });
        expect(deleted).toBeNull();
      });
    });
  });

  describe('membership methods', () => {
    describe('findUserOrganizations', () => {
      it('returns organizations for user', async () => {
        const user = await createTestUser();
        const org1 = await createTestOrg({ name: 'Org 1' });
        const org2 = await createTestOrg({ name: 'Org 2' });
        await createTestOrgMember(user.id, org1.id, 'MEMBER');
        await createTestOrgMember(user.id, org2.id, 'OWNER');

        const result = await organizationRepository.findUserOrganizations(user.id);

        expect(result).toHaveLength(2);
        expect(result.map(o => o.name)).toContain('Org 1');
        expect(result.map(o => o.name)).toContain('Org 2');
      });

      it('returns empty array if user has no organizations', async () => {
        const user = await createTestUser();

        const result = await organizationRepository.findUserOrganizations(user.id);

        expect(result).toHaveLength(0);
      });

      it('includes organization members', async () => {
        const user1 = await createTestUser({ name: 'User One' });
        const user2 = await createTestUser({ name: 'User Two' });
        const org = await createTestOrg();
        await createTestOrgMember(user1.id, org.id, 'OWNER');
        await createTestOrgMember(user2.id, org.id, 'MEMBER');

        const result = await organizationRepository.findUserOrganizations(user1.id);

        expect(result).toHaveLength(1);
        expect(result.at(0)?.members).toHaveLength(2);
      });
    });

    describe('findOrganizationMembers', () => {
      it('returns all members with user details', async () => {
        const user1 = await createTestUser({ name: 'Owner' });
        const user2 = await createTestUser({ name: 'Member' });
        const org = await createTestOrg();
        await createTestOrgMember(user1.id, org.id, 'OWNER');
        await createTestOrgMember(user2.id, org.id, 'MEMBER');

        const result = await organizationRepository.findOrganizationMembers(org.id);

        expect(result).toHaveLength(2);
        expect(result.at(0)?.user.name).toBeDefined();
        expect(result.at(0)?.user.email).toBeDefined();
      });

      it('returns empty array if no members', async () => {
        const org = await createTestOrg();

        const result = await organizationRepository.findOrganizationMembers(org.id);

        expect(result).toHaveLength(0);
      });
    });

    describe('findMembership', () => {
      it('returns membership if exists', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();
        await createTestOrgMember(user.id, org.id, 'ADMIN');

        const result = await organizationRepository.findMembership(user.id, org.id);

        expect(result?.userId).toBe(user.id);
        expect(result?.organizationId).toBe(org.id);
        expect(result?.role).toBe('ADMIN');
      });

      it('returns null if no membership', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();

        const result = await organizationRepository.findMembership(user.id, org.id);

        expect(result).toBeNull();
      });
    });

    describe('addMember', () => {
      it('adds member with specified role', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();

        const result = await organizationRepository.addMember(org.id, user.id, 'ADMIN');

        expect(result.userId).toBe(user.id);
        expect(result.organizationId).toBe(org.id);
        expect(result.role).toBe('ADMIN');
      });
    });

    describe('updateMemberRole', () => {
      it('updates member role', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();
        await createTestOrgMember(user.id, org.id, 'MEMBER');

        const result = await organizationRepository.updateMemberRole(user.id, org.id, 'ADMIN');

        expect(result.role).toBe('ADMIN');
      });
    });

    describe('removeMember', () => {
      it('removes member and returns true', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();
        await createTestOrgMember(user.id, org.id, 'MEMBER');

        const result = await organizationRepository.removeMember(user.id, org.id);

        expect(result).toBe(true);
        const membership = await organizationRepository.findMembership(user.id, org.id);
        expect(membership).toBeNull();
      });
    });
  });

  describe('invite methods', () => {
    describe('createInvite', () => {
      it('creates invite with all fields', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const result = await organizationRepository.createInvite(
          org.id,
          'invite@example.com',
          'MEMBER',
          user.id,
          'unique-token',
          expiresAt,
        );

        expect(result.organizationId).toBe(org.id);
        expect(result.email).toBe('invite@example.com');
        expect(result.role).toBe('MEMBER');
        expect(result.invitedById).toBe(user.id);
        expect(result.token).toBe('unique-token');
      });
    });

    describe('findInviteByToken', () => {
      it('returns invite with organization', async () => {
        const user = await createTestUser();
        const org = await createTestOrg({ name: 'Invite Org' });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await organizationRepository.createInvite(
          org.id,
          'test@example.com',
          'MEMBER',
          user.id,
          'find-token',
          expiresAt,
        );

        const result = await organizationRepository.findInviteByToken('find-token');

        expect(result?.token).toBe('find-token');
        expect(result?.organization.name).toBe('Invite Org');
      });

      it('returns null if token not found', async () => {
        const result = await organizationRepository.findInviteByToken('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('markInviteAccepted', () => {
      it('sets acceptedAt timestamp', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invite = await organizationRepository.createInvite(
          org.id,
          'accept@example.com',
          'MEMBER',
          user.id,
          'accept-token',
          expiresAt,
        );

        const result = await organizationRepository.markInviteAccepted(invite.id);

        expect(result.acceptedAt).not.toBeNull();
      });
    });

    describe('findInvitesByOrganization', () => {
      it('returns all invites for organization', async () => {
        const user = await createTestUser();
        const org = await createTestOrg();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await organizationRepository.createInvite(
          org.id,
          'one@example.com',
          'MEMBER',
          user.id,
          'token-1',
          expiresAt,
        );
        await organizationRepository.createInvite(
          org.id,
          'two@example.com',
          'ADMIN',
          user.id,
          'token-2',
          expiresAt,
        );

        const result = await organizationRepository.findInvitesByOrganization(org.id);

        expect(result).toHaveLength(2);
      });

      it('returns empty array if no invites', async () => {
        const org = await createTestOrg();

        const result = await organizationRepository.findInvitesByOrganization(org.id);

        expect(result).toHaveLength(0);
      });
    });
  });
});
