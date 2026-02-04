import type {
  Organization,
  OrganizationInvite,
  OrganizationMember,
  OrganizationRole,
} from '../../../prisma/generated/client';
import { db } from '../../utils/db';

/**
 * Organization repository
 * Handles organization, membership, and invite database queries
 */
export class OrganizationRepository {
  protected readonly db = db;

  /**
   * Organization CRUD
   */

  /**
   * Find organization by ID
   */
  async findById(id: string): Promise<Organization | null> {
    return this.db.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Find organization by slug
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    return this.db.organization.findUnique({
      where: { slug },
    });
  }

  /**
   * Create new organization
   */
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
  }): Promise<Organization> {
    return this.db.organization.create({
      data,
    });
  }

  /**
   * Update organization
   */
  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      image?: string;
    },
  ): Promise<Organization> {
    return this.db.organization.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete organization
   * Cascades to members and invites
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.organization.delete({
      where: { id },
    });
    return !!result;
  }

  /**
   * Membership methods
   */

  /**
   * Find all organizations for a user
   */
  async findUserOrganizations(userId: string): Promise<
    Array<
      Organization & {
        members: Array<OrganizationMember & { user: { id: string; name: string; email: string } }>;
      }
    >
  > {
    const memberships = await this.db.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map(m => m.organization);
  }

  /**
   * Find all members of an organization
   */
  async findOrganizationMembers(organizationId: string): Promise<
    Array<
      OrganizationMember & {
        user: { id: string; name: string; email: string; image: string | null };
      }
    >
  > {
    return this.db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find specific membership
   */
  async findMembership(userId: string, organizationId: string): Promise<OrganizationMember | null> {
    return this.db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  /**
   * Add member to organization
   */
  async addMember(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMember> {
    return this.db.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
    });
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    userId: string,
    organizationId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMember> {
    return this.db.organizationMember.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      data: { role },
    });
  }

  /**
   * Remove member from organization
   */
  async removeMember(userId: string, organizationId: string): Promise<boolean> {
    const result = await this.db.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
    return !!result;
  }

  /**
   * Invite methods
   */

  /**
   * Create organization invite
   */
  async createInvite(
    organizationId: string,
    email: string,
    role: OrganizationRole,
    invitedById: string,
    token: string,
    expiresAt: Date,
  ): Promise<OrganizationInvite> {
    return this.db.organizationInvite.create({
      data: {
        organizationId,
        email,
        role,
        invitedById,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Find invite by token
   */
  async findInviteByToken(token: string): Promise<
    | (OrganizationInvite & {
      organization: Organization;
    })
    | null
  > {
    return this.db.organizationInvite.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });
  }

  /**
   * Mark invite as accepted
   */
  async markInviteAccepted(id: string): Promise<OrganizationInvite> {
    return this.db.organizationInvite.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  }

  /**
   * Find all invites for organization
   */
  async findInvitesByOrganization(organizationId: string): Promise<OrganizationInvite[]> {
    return this.db.organizationInvite.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// Export singleton instance
export const organizationRepository = new OrganizationRepository();
