import type { H3Event } from 'h3';
import type { OrganizationRole } from '../../prisma/generated/client';
import { serverAuth } from '../features/auth/auth-session';
import { organizationRepository } from '../features/organization/organization-repository';

/**
 * Organization Access Context - includes org and membership info
 */
export interface OrgAccessContext {
  event: H3Event;
  userId: string;
  organizationId: string;
  organizationSlug: string;
  userRole: OrganizationRole;
}

/**
 * Options for requireOrgAccess
 */
export interface RequireOrgAccessOptions {
  allowedRoles?: OrganizationRole[];
}

/**
 * Require organization access for API endpoint
 * Validates that user is authenticated and is a member of the organization
 *
 * @param event - H3 event
 * @param options - Optional role requirements
 * @returns Context with userId, organizationId, organizationSlug, and userRole
 * @throws 401 if not authenticated
 * @throws 400 if no org slug in params
 * @throws 404 if organization not found
 * @throws 404 if user is not a member
 * @throws 403 if user doesn't have required role
 */
export async function requireOrgAccess(
  event: H3Event,
  options: RequireOrgAccessOptions = {},
): Promise<OrgAccessContext> {
  // Check session exists
  const session = await serverAuth().getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const userId = session.user.id;

  // Extract org slug from route params
  // Try common param names: slug, organizationSlug
  const slug = getRouterParam(event, 'slug') || getRouterParam(event, 'organizationSlug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Organization slug is required',
    });
  }

  // Find organization by slug
  const organization = await organizationRepository.findBySlug(slug);

  if (!organization) {
    throw createError({
      statusCode: 404,
      message: 'Organization not found',
    });
  }

  // Check user is member
  const membership = await organizationRepository.findMembership(userId, organization.id);

  if (!membership) {
    throw createError({
      statusCode: 404,
      message: 'You are not a member of this organization',
    });
  }

  // Check role if specified
  if (options.allowedRoles && !options.allowedRoles.includes(membership.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  return {
    event,
    userId,
    organizationId: organization.id,
    organizationSlug: organization.slug,
    userRole: membership.role,
  };
}
