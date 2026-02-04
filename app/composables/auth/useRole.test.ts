import type { Role } from '../../../prisma/generated/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);

// Mock user state
const mockUser = ref<{ role?: Role } | null>(null);

vi.stubGlobal('useAuth', vi.fn(() => ({
  user: mockUser,
})));

// Import after mocks
const { useRole } = await import('./useRole');

describe('useRole', () => {
  beforeEach(() => {
    mockUser.value = null;
  });

  describe('userRole', () => {
    it('returns undefined when no user', () => {
      const { userRole } = useRole();
      expect(userRole.value).toBeUndefined();
    });

    it('returns user role', () => {
      mockUser.value = { role: 'ADMIN' };
      const { userRole } = useRole();
      expect(userRole.value).toBe('ADMIN');
    });
  });

  describe('hasRole', () => {
    it('returns false when no user', () => {
      const { hasRole } = useRole();
      expect(hasRole(['USER', 'ADMIN'])).toBe(false);
    });

    it('returns true when user has matching role', () => {
      mockUser.value = { role: 'ADMIN' };
      const { hasRole } = useRole();
      expect(hasRole(['ADMIN'])).toBe(true);
      expect(hasRole(['USER', 'ADMIN'])).toBe(true);
    });

    it('returns false when user has different role', () => {
      mockUser.value = { role: 'USER' };
      const { hasRole } = useRole();
      expect(hasRole(['ADMIN', 'SUPER_ADMIN'])).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('returns true for SUPER_ADMIN', () => {
      mockUser.value = { role: 'SUPER_ADMIN' };
      const { isSuperAdmin } = useRole();
      expect(isSuperAdmin.value).toBe(true);
    });

    it('returns false for other roles', () => {
      mockUser.value = { role: 'ADMIN' };
      const { isSuperAdmin } = useRole();
      expect(isSuperAdmin.value).toBe(false);
    });

    it('returns false when no user', () => {
      const { isSuperAdmin } = useRole();
      expect(isSuperAdmin.value).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true for ADMIN', () => {
      mockUser.value = { role: 'ADMIN' };
      const { isAdmin } = useRole();
      expect(isAdmin.value).toBe(true);
    });

    it('returns true for SUPER_ADMIN', () => {
      mockUser.value = { role: 'SUPER_ADMIN' };
      const { isAdmin } = useRole();
      expect(isAdmin.value).toBe(true);
    });

    it('returns false for USER', () => {
      mockUser.value = { role: 'USER' };
      const { isAdmin } = useRole();
      expect(isAdmin.value).toBe(false);
    });
  });

  describe('isUser', () => {
    it('returns true for USER', () => {
      mockUser.value = { role: 'USER' };
      const { isUser } = useRole();
      expect(isUser.value).toBe(true);
    });

    it('returns false for ADMIN', () => {
      mockUser.value = { role: 'ADMIN' };
      const { isUser } = useRole();
      expect(isUser.value).toBe(false);
    });
  });
});
