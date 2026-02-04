import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, readonly, ref, watch } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('readonly', readonly);
vi.stubGlobal('watch', watch);

// Mock Better Auth client
const mockClient = {
  getSession: vi.fn(),
  signIn: { email: vi.fn(), social: vi.fn() },
  signUp: { email: vi.fn() },
  signOut: vi.fn(),
  $store: { listen: vi.fn() },
};

vi.mock('better-auth/client', () => ({
  createAuthClient: vi.fn(() => mockClient),
}));

vi.mock('better-auth/client/plugins', () => ({
  adminClient: vi.fn(() => ({})),
  magicLinkClient: vi.fn(() => ({})),
}));

// Mock Nuxt composables
const mockSession = ref<{ id: string } | null>(null);
const mockUser = ref<{ id: string; name: string } | null>(null);
const mockSessionFetching = ref(false);

vi.stubGlobal('useState', vi.fn((key: string, init?: () => unknown) => {
  if (key === 'auth:session')
    return mockSession;
  if (key === 'auth:user')
    return mockUser;
  if (key === 'auth:sessionFetching')
    return mockSessionFetching;
  return ref(init?.());
}));

vi.stubGlobal('useRequestURL', vi.fn(() => ({ origin: 'http://localhost:3000' })));
vi.stubGlobal('useRequestHeaders', vi.fn(() => ({})));

const mockNavigateTo = vi.fn();
const mockFetch = vi.fn();
vi.stubGlobal('navigateTo', mockNavigateTo);
vi.stubGlobal('$fetch', mockFetch);

// Import after mocks
const { useAuth } = await import('./useAuth');

// Test fixtures matching Zod schemas
const mockSessionData = {
  id: 'session-1',
  userId: 'user-1',
  expiresAt: new Date(),
  token: 'token-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ipAddress: null,
  userAgent: null,
  impersonatedBy: null,
  currentOrganizationId: null,
};

const mockUserData = {
  id: 'user-1',
  email: 'test@example.com',
  emailVerified: true,
  name: 'Test',
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: 'USER' as const,
  onboardingCompleted: true,
  bio: null,
  company: null,
  useCase: null,
  emailNotifications: true,
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.value = null;
    mockUser.value = null;
    mockSessionFetching.value = false;
  });

  describe('loggedIn', () => {
    it('returns false when session is null', () => {
      const { loggedIn } = useAuth();
      expect(loggedIn.value).toBe(false);
    });

    it('returns true when session exists', () => {
      mockSession.value = { id: 'session-1' };
      const { loggedIn } = useAuth();
      expect(loggedIn.value).toBe(true);
    });
  });

  describe('session/user state', () => {
    it('exposes readonly session', () => {
      mockSession.value = { id: 'session-1' };
      const { session } = useAuth();
      expect(session.value).toEqual({ id: 'session-1' });
    });

    it('exposes readonly user', () => {
      mockUser.value = { id: 'user-1', name: 'Test' };
      const { user } = useAuth();
      expect(user.value).toEqual({ id: 'user-1', name: 'Test' });
    });
  });

  describe('fetchSession', () => {
    it('skips fetch when already fetching', async () => {
      mockSessionFetching.value = true;
      const { fetchSession } = useAuth();
      await fetchSession();
      expect(mockClient.getSession).not.toHaveBeenCalled();
    });

    it('fetches and updates session/user', async () => {
      mockClient.getSession.mockResolvedValue({
        data: {
          session: mockSessionData,
          user: mockUserData,
        },
      });

      const { fetchSession } = useAuth();
      await fetchSession();

      expect(mockSession.value).toEqual(mockSessionData);
      expect(mockUser.value).toEqual(mockUserData);
    });

    it('clears session/user when fetch returns null', async () => {
      mockSession.value = { id: 'old' };
      mockUser.value = { id: 'old', name: 'Old' };
      mockClient.getSession.mockResolvedValue({ data: null });

      const { fetchSession } = useAuth();
      await fetchSession();

      expect(mockSession.value).toBeNull();
      expect(mockUser.value).toBeNull();
    });
  });

  describe('signOut', () => {
    it('clears session and user', async () => {
      mockSession.value = { id: 'session-1' };
      mockUser.value = { id: 'user-1', name: 'Test' };
      mockClient.signOut.mockResolvedValue({ data: null });

      const auth = useAuth();
      await auth.signOut({});

      expect(mockSession.value).toBeNull();
      expect(mockUser.value).toBeNull();
    });

    it('calls client.signOut with credentials', async () => {
      mockClient.signOut.mockResolvedValue({ data: null });

      const auth = useAuth();
      await auth.signOut({});

      expect(mockClient.signOut).toHaveBeenCalledWith({
        fetchOptions: { credentials: 'include' },
      });
    });
  });

  describe('redirectToUserDashboard', () => {
    it('redirects to first org dashboard when orgs exist', async () => {
      mockFetch.mockResolvedValue({
        organizations: [{ slug: 'my-org' }],
      });

      const { redirectToUserDashboard } = useAuth();
      await redirectToUserDashboard();

      expect(mockNavigateTo).toHaveBeenCalledWith({
        name: 'org-slug-dashboard',
        params: { slug: 'my-org' },
      });
    });

    it('redirects to create org when no orgs', async () => {
      mockFetch.mockResolvedValue({ organizations: [] });

      const { redirectToUserDashboard } = useAuth();
      await redirectToUserDashboard();

      expect(mockNavigateTo).toHaveBeenCalledWith({
        name: 'organizations-create',
      });
    });

    it('redirects to create org on error', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));

      const { redirectToUserDashboard } = useAuth();
      await redirectToUserDashboard();

      expect(mockNavigateTo).toHaveBeenCalledWith({
        name: 'organizations-create',
      });
    });
  });
});
