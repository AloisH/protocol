import type {
  CreateOrganizationInput,
  InviteMemberInput,
  UpdateOrganizationInput,
} from '#shared/organization';
import type {
  Organization,
  OrganizationInvite,
  OrganizationMember,
  OrganizationRole,
} from '../../../prisma/generated/client';
import { randomBytes } from 'node:crypto';
import { db } from '../../utils/db';
import { organizationRepository } from './organization-repository';

/**
 * Generate random invite token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Organization service
 * Business logic for organization management
 */
export class OrganizationService {
  /**
   * Permission check helpers
   */

  /**
   * Check if user is member of organization
   */
  private async checkIsMember(userId: string, organizationId: string): Promise<OrganizationMember> {
    const membership = await organizationRepository.findMembership(userId, organizationId);

    if (!membership) {
      throw createError({
        statusCode: 403,
        message: 'You are not a member of this organization',
      });
    }

    return membership;
  }

  /**
   * Check if user is OWNER or ADMIN
   */
  private async checkIsOwnerOrAdmin(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember> {
    const membership = await this.checkIsMember(userId, organizationId);

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You must be an owner or admin to perform this action',
      });
    }

    return membership;
  }

  /**
   * Check if user is OWNER
   */
  private async checkIsOwner(userId: string, organizationId: string): Promise<OrganizationMember> {
    const membership = await this.checkIsMember(userId, organizationId);

    if (membership.role !== 'OWNER') {
      throw createError({
        statusCode: 403,
        message: 'You must be an owner to perform this action',
      });
    }

    return membership;
  }

  /**
   * Count owners in organization
   */
  private async countOwners(organizationId: string): Promise<number> {
    const members = await organizationRepository.findOrganizationMembers(organizationId);
    return members.filter(m => m.role === 'OWNER').length;
  }

  /**
   * Organization management
   */

  /**
   * Create new organization
   * Creator is added as OWNER
   */
  async createOrganization(userId: string, input: CreateOrganizationInput): Promise<Organization> {
    // Check slug uniqueness
    const existing = await organizationRepository.findBySlug(input.slug);
    if (existing) {
      throw createError({
        statusCode: 409,
        message: 'Organization with this slug already exists',
      });
    }

    // Create organization + add creator as OWNER in transaction
    const result = await db.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
        },
      });

      // Add creator as OWNER
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: 'OWNER',
        },
      });

      return organization;
    });

    return result;
  }

  /**
   * Get organization with members
   * User must be a member
   */
  async getOrganization(
    userId: string,
    organizationId: string,
  ): Promise<
    Organization & {
      members: Array<
        OrganizationMember & {
          user: { id: string; name: string; email: string; image: string | null };
        }
      >;
    }
  > {
    // Check membership
    await this.checkIsMember(userId, organizationId);

    // Get organization
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw createError({
        statusCode: 404,
        message: 'Organization not found',
      });
    }

    // Get members
    const members = await organizationRepository.findOrganizationMembers(organizationId);

    return {
      ...organization,
      members,
    };
  }

  /**
   * Update organization
   * User must be OWNER or ADMIN
   */
  async updateOrganization(
    userId: string,
    organizationId: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    // Check permissions
    await this.checkIsOwnerOrAdmin(userId, organizationId);

    // Check slug uniqueness if changing
    if (input.slug) {
      const existing = await organizationRepository.findBySlug(input.slug);
      if (existing && existing.id !== organizationId) {
        throw createError({
          statusCode: 409,
          message: 'Organization with this slug already exists',
        });
      }
    }

    return organizationRepository.update(organizationId, input);
  }

  /**
   * Delete organization
   * User must be OWNER
   */
  async deleteOrganization(userId: string, organizationId: string): Promise<void> {
    // Check permissions
    await this.checkIsOwner(userId, organizationId);

    await organizationRepository.delete(organizationId);
  }

  /**
   * Membership management
   */

  /**
   * Invite member to organization
   * User must be OWNER or ADMIN
   */
  async inviteMember(
    userId: string,
    organizationId: string,
    input: InviteMemberInput,
  ): Promise<OrganizationInvite> {
    // Check permissions
    await this.checkIsOwnerOrAdmin(userId, organizationId);

    // Check organization exists
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw createError({
        statusCode: 404,
        message: 'Organization not found',
      });
    }

    // Generate token and set expiry (7 days)
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return organizationRepository.createInvite(
      organizationId,
      input.email,
      input.role,
      userId,
      token,
      expiresAt,
    );
  }

  /**
   * Accept organization invite
   */
  async acceptInvite(userId: string, token: string): Promise<OrganizationMember> {
    // Find invite
    const invite = await organizationRepository.findInviteByToken(token);
    if (!invite) {
      throw createError({
        statusCode: 404,
        message: 'Invite not found',
      });
    }

    // Check not expired
    if (invite.expiresAt < new Date()) {
      throw createError({
        statusCode: 400,
        message: 'Invite has expired',
      });
    }

    // Check already accepted
    if (invite.acceptedAt) {
      throw createError({
        statusCode: 400,
        message: 'Invite has already been accepted',
      });
    }

    // Get user email
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    // Check email matches
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw createError({
        statusCode: 403,
        message: 'Invite email does not match your account',
      });
    }

    // Check not already a member
    const existingMembership = await organizationRepository.findMembership(
      userId,
      invite.organizationId,
    );
    if (existingMembership) {
      throw createError({
        statusCode: 409,
        message: 'You are already a member of this organization',
      });
    }

    // Add member + mark invite accepted in transaction
    const result = await db.$transaction(async (tx) => {
      // Add member
      const member = await tx.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
        },
      });

      // Mark invite accepted
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return member;
    });

    return result;
  }

  /**
   * Update member role
   * User must be OWNER
   * Cannot change own role
   */
  async updateMemberRole(
    userId: string,
    organizationId: string,
    targetUserId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMember> {
    // Check permissions
    await this.checkIsOwner(userId, organizationId);

    // Cannot change own role
    if (userId === targetUserId) {
      throw createError({
        statusCode: 400,
        message: 'You cannot change your own role',
      });
    }

    // Check target is member
    const targetMembership = await organizationRepository.findMembership(
      targetUserId,
      organizationId,
    );
    if (!targetMembership) {
      throw createError({
        statusCode: 404,
        message: 'Member not found',
      });
    }

    return organizationRepository.updateMemberRole(targetUserId, organizationId, role);
  }

  /**
   * Remove member from organization
   * User must be OWNER or ADMIN
   * Cannot remove last OWNER
   */
  async removeMember(userId: string, organizationId: string, targetUserId: string): Promise<void> {
    // Check permissions
    await this.checkIsOwnerOrAdmin(userId, organizationId);

    // Check target is member
    const targetMembership = await organizationRepository.findMembership(
      targetUserId,
      organizationId,
    );
    if (!targetMembership) {
      throw createError({
        statusCode: 404,
        message: 'Member not found',
      });
    }

    // If removing OWNER, check not last OWNER
    if (targetMembership.role === 'OWNER') {
      const ownerCount = await this.countOwners(organizationId);
      if (ownerCount <= 1) {
        throw createError({
          statusCode: 409,
          message: 'Cannot remove the last owner',
        });
      }
    }

    await organizationRepository.removeMember(targetUserId, organizationId);
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();
