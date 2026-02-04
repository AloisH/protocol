import type { Role } from '../../../prisma/generated/client';

/**
 * useRole composable
 * Provides role-based access control helpers
 */
export function useRole() {
  const { user } = useAuth();

  // User's current role
  const userRole = computed<Role | undefined>(() => (user.value as { role?: Role } | null)?.role);

  // Check if user has one of the allowed roles
  const hasRole = (roles: Role[]): boolean => {
    if (!userRole.value)
      return false;
    return roles.includes(userRole.value);
  };

  // Helper computed properties
  const isSuperAdmin = computed(() => userRole.value === 'SUPER_ADMIN');
  const isAdmin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(userRole.value || ''));
  const isUser = computed(() => userRole.value === 'USER');

  return {
    userRole,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isUser,
  };
}
