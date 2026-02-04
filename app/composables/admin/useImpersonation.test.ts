import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readonly, ref } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('readonly', readonly);

// Mock state
const mockIsImpersonating = ref(false);
const mockImpersonatedUser = ref<{ id: string; name: string } | null>(null);
const mockFetchSession = vi.fn();

vi.stubGlobal('useState', vi.fn((key: string) => {
  if (key === 'impersonating')
    return mockIsImpersonating;
  if (key === 'impersonatedUser')
    return mockImpersonatedUser;
  return ref(null);
}));

vi.stubGlobal('useAuth', vi.fn(() => ({
  fetchSession: mockFetchSession,
})));

const mockFetch = vi.fn();
const mockNavigateTo = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('$fetch', mockFetch);
vi.stubGlobal('navigateTo', mockNavigateTo);

// Import after mocks
const { useImpersonation } = await import('./useImpersonation');

describe('useImpersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsImpersonating.value = false;
    mockImpersonatedUser.value = null;
  });

  describe('initial state', () => {
    it('starts not impersonating', () => {
      const { isImpersonating } = useImpersonation();
      expect(isImpersonating.value).toBe(false);
    });

    it('starts with no impersonated user', () => {
      const { impersonatedUser } = useImpersonation();
      expect(impersonatedUser.value).toBeNull();
    });
  });

  describe('startImpersonation', () => {
    it('calls API and updates state', async () => {
      mockFetch.mockResolvedValue({});
      mockFetchSession.mockResolvedValue({});

      const { startImpersonation } = useImpersonation();
      const result = await startImpersonation('user-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/impersonate', {
        method: 'POST',
        body: { userId: 'user-123', reason: undefined },
      });
      expect(mockFetchSession).toHaveBeenCalled();
      expect(mockIsImpersonating.value).toBe(true);
      expect(result).toEqual({ success: true });
    });

    it('includes reason when provided', async () => {
      mockFetch.mockResolvedValue({});
      mockFetchSession.mockResolvedValue({});

      const { startImpersonation } = useImpersonation();
      await startImpersonation('user-123', 'Support request');

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/impersonate', {
        method: 'POST',
        body: { userId: 'user-123', reason: 'Support request' },
      });
    });

    it('returns error on failure', async () => {
      mockFetch.mockRejectedValue({
        data: { message: 'User not found' },
      });

      const { startImpersonation } = useImpersonation();
      const result = await startImpersonation('invalid-user');

      expect(result).toEqual({
        success: false,
        error: 'User not found',
      });
      expect(mockIsImpersonating.value).toBe(false);
    });

    it('returns generic error on unknown failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network'));

      const { startImpersonation } = useImpersonation();
      const result = await startImpersonation('user-123');

      expect(result).toEqual({
        success: false,
        error: 'Failed to start impersonation',
      });
    });
  });

  describe('stopImpersonation', () => {
    it('calls API and clears state', async () => {
      mockIsImpersonating.value = true;
      mockImpersonatedUser.value = { id: 'u1', name: 'Test' };
      mockFetch.mockResolvedValue({});

      const { stopImpersonation } = useImpersonation();
      const result = await stopImpersonation();

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/impersonate/stop', {
        method: 'POST',
      });
      expect(mockIsImpersonating.value).toBe(false);
      expect(mockImpersonatedUser.value).toBeNull();
      expect(result).toEqual({ success: true });
    });

    it('redirects to admin users page', async () => {
      mockFetch.mockResolvedValue({});

      const { stopImpersonation } = useImpersonation();
      await stopImpersonation();

      expect(mockNavigateTo).toHaveBeenCalledWith(
        { name: 'admin-users' },
        { external: true },
      );
    });

    it('returns error on failure', async () => {
      mockFetch.mockRejectedValue({
        data: { message: 'Session expired' },
      });

      const { stopImpersonation } = useImpersonation();
      const result = await stopImpersonation();

      expect(result).toEqual({
        success: false,
        error: 'Session expired',
      });
    });
  });

  describe('checkImpersonation', () => {
    it('updates state when active', async () => {
      mockFetch.mockResolvedValue({
        active: true,
        session: { targetUser: { id: 'u1', name: 'Test User' } },
      });

      const { checkImpersonation } = useImpersonation();
      await checkImpersonation();

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/impersonate/active');
      expect(mockIsImpersonating.value).toBe(true);
      expect(mockImpersonatedUser.value).toEqual({ id: 'u1', name: 'Test User' });
    });

    it('updates state when not active', async () => {
      mockIsImpersonating.value = true;
      mockFetch.mockResolvedValue({
        active: false,
        session: null,
      });

      const { checkImpersonation } = useImpersonation();
      await checkImpersonation();

      expect(mockIsImpersonating.value).toBe(false);
    });

    it('clears state on error', async () => {
      mockIsImpersonating.value = true;
      mockImpersonatedUser.value = { id: 'u1', name: 'Test' };
      mockFetch.mockRejectedValue(new Error('Unauthorized'));

      const { checkImpersonation } = useImpersonation();
      await checkImpersonation();

      expect(mockIsImpersonating.value).toBe(false);
      expect(mockImpersonatedUser.value).toBeNull();
    });
  });

  describe('readonly state', () => {
    it('exposes readonly isImpersonating', () => {
      const { isImpersonating } = useImpersonation();
      expect(isImpersonating).toBeDefined();
    });

    it('exposes readonly impersonatedUser', () => {
      const { impersonatedUser } = useImpersonation();
      expect(impersonatedUser).toBeDefined();
    });
  });
});
