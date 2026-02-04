import type { H3Event } from 'h3';
import type { Role } from '../../prisma/generated/client';
import { serverAuth } from '../features/auth/auth-session';
import { db } from './db';

/**
 * Admin API Handler Context - includes role information
 */
export interface AdminApiHandlerContext {
  event: H3Event;
  userId: string;
  userRole: Role;
}

/**
 * Require specific role(s) for API endpoint access
 * Checks session and queries user role from database
 * During impersonation, checks the ADMIN's role, not the impersonated user's role
 *
 * @param event - H3 event object
 * @param allowedRoles - Array of roles that can access the endpoint
 * @returns Context with userId and userRole
 * @throws 401 if not authenticated
 * @throws 403 if user doesn't have required role
 */
export async function requireRole(
  event: H3Event,
  allowedRoles: Role[],
): Promise<AdminApiHandlerContext> {
  // Check session exists
  const session = await serverAuth().getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // During impersonation: session.user.id = impersonated user, session.session.impersonatedBy = original admin
  // For role checks, use the admin's ID if impersonating
  const sessionData = session.session as { impersonatedBy?: string } | undefined;
  const userIdForRoleCheck = sessionData?.impersonatedBy || session.user.id;

  // Query user role from database
  const user = await db.user.findUnique({
    where: { id: userIdForRoleCheck },
    select: { id: true, role: true },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'User not found',
    });
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  return {
    event,
    userId: user.id,
    userRole: user.role,
  };
}
