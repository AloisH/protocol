import { createAccessControl } from 'better-auth/plugins';

/**
 * Shared access control configuration for Better Auth admin plugin
 * Used by both server and client
 */

// Define admin permissions statement
export const statement = {
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  session: ['list', 'revoke'],
} as const;

export const ac = createAccessControl(statement);

// Define roles matching our Prisma schema
export const USER = ac.newRole({
  // No admin permissions
});

// ADMIN and SUPER_ADMIN have same Better Auth plugin permissions.
// Additional restrictions (role changes, impersonation) enforced
// at endpoint level via requireRole(['SUPER_ADMIN'])
export const ADMIN = ac.newRole({
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  session: ['list', 'revoke'],
});

export const SUPER_ADMIN = ac.newRole({
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  session: ['list', 'revoke'],
});

// Export roles object for plugin configuration
export const roles = { USER, ADMIN, SUPER_ADMIN };
