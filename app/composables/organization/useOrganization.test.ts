import type { Organization, OrganizationRole } from '../../../prisma/generated/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive, readonly, ref, watch } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('readonly', readonly);
vi.stubGlobal('watch', watch);

// Mock state
const mockOrganizations = ref<Organization[]>([]);
const mockMembers = ref<{ userId: string }[]>([]);
const mockCurrentUserRole = ref<OrganizationRole | null>(null);
const mockFetching = ref(false);
const mockSwitching = ref(false);
const mockLastOrgSlug = ref<string | null>(null);
const mockRouteParams = reactive<{ slug?: string }>({});
const mockRouterPush = vi.fn();

vi.stubGlobal('useState', vi.fn((key: string, init?: () => unknown) => {
  if (key === 'org:list')
    return mockOrganizations;
  if (key === 'org:members')
    return mockMembers;
  if (key === 'org:currentUserRole')
    return mockCurrentUserRole;
  if (key === 'org:fetching')
    return mockFetching;
  if (key === 'org:switching')
    return mockSwitching;
  if (key === 'org:lastSlug')
    return mockLastOrgSlug;
  return ref(init?.());
}));

vi.stubGlobal('useRoute', vi.fn(() => ({
  params: mockRouteParams,
})));

vi.stubGlobal('useRouter', vi.fn(() => ({
  push: mockRouterPush,
})));

vi.stubGlobal('$fetch', vi.fn());

// Import after mocks
const { useOrganization } = await import('./useOrganization');

function createOrg(slug: string, id = `id-${slug}`): Organization {
  return {
    id,
    slug,
    name: slug.toUpperCase(),
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    description: null,
    planType: 'FREE',
  };
}

describe('useOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizations.value = [];
    mockMembers.value = [];
    mockCurrentUserRole.value = null;
    mockFetching.value = false;
    mockSwitching.value = false;
    mockLastOrgSlug.value = null;
    mockRouteParams.slug = undefined;
  });

  describe('activeOrganization', () => {
    it('returns org matching URL slug', () => {
      mockOrganizations.value = [createOrg('org-a'), createOrg('org-b')];
      mockRouteParams.slug = 'org-b';

      const { activeOrganization } = useOrganization();
      expect(activeOrganization.value?.slug).toBe('org-b');
    });

    it('falls back to lastOrgSlug when no URL slug', () => {
      mockOrganizations.value = [createOrg('org-a'), createOrg('org-b')];
      mockLastOrgSlug.value = 'org-b';

      const { activeOrganization } = useOrganization();
      expect(activeOrganization.value?.slug).toBe('org-b');
    });

    it('falls back to first org when no slug', () => {
      mockOrganizations.value = [createOrg('org-a'), createOrg('org-b')];

      const { activeOrganization } = useOrganization();
      expect(activeOrganization.value?.slug).toBe('org-a');
    });

    it('returns null when no orgs', () => {
      const { activeOrganization } = useOrganization();
      expect(activeOrganization.value).toBeNull();
    });
  });

  describe('currentOrgSlug', () => {
    it('prefers URL slug over active org', () => {
      mockOrganizations.value = [createOrg('org-a')];
      mockRouteParams.slug = 'org-from-url';

      const { currentOrgSlug } = useOrganization();
      expect(currentOrgSlug.value).toBe('org-from-url');
    });

    it('uses active org slug when no URL slug', () => {
      mockOrganizations.value = [createOrg('org-a')];

      const { currentOrgSlug } = useOrganization();
      expect(currentOrgSlug.value).toBe('org-a');
    });
  });

  describe('currentOrgId', () => {
    it('returns id of active org', () => {
      mockOrganizations.value = [createOrg('org-a', 'test-id')];

      const { currentOrgId } = useOrganization();
      expect(currentOrgId.value).toBe('test-id');
    });

    it('returns null when no active org', () => {
      const { currentOrgId } = useOrganization();
      expect(currentOrgId.value).toBeNull();
    });
  });

  describe('canManageMembers', () => {
    it('returns true for OWNER', () => {
      mockCurrentUserRole.value = 'OWNER';
      const { canManageMembers } = useOrganization();
      expect(canManageMembers.value).toBe(true);
    });

    it('returns true for ADMIN', () => {
      mockCurrentUserRole.value = 'ADMIN';
      const { canManageMembers } = useOrganization();
      expect(canManageMembers.value).toBe(true);
    });

    it('returns false for MEMBER', () => {
      mockCurrentUserRole.value = 'MEMBER';
      const { canManageMembers } = useOrganization();
      expect(canManageMembers.value).toBe(false);
    });

    it('returns false for null', () => {
      const { canManageMembers } = useOrganization();
      expect(canManageMembers.value).toBe(false);
    });
  });

  describe('canDeleteOrg', () => {
    it('returns true only for OWNER', () => {
      const { canDeleteOrg } = useOrganization();

      mockCurrentUserRole.value = 'OWNER';
      expect(canDeleteOrg.value).toBe(true);

      mockCurrentUserRole.value = 'ADMIN';
      expect(canDeleteOrg.value).toBe(false);

      mockCurrentUserRole.value = 'MEMBER';
      expect(canDeleteOrg.value).toBe(false);
    });
  });

  describe('fetchOrganizations', () => {
    it('fetches and stores orgs', async () => {
      const orgs = [createOrg('org-a')];
      vi.mocked(globalThis.$fetch).mockResolvedValue({ organizations: orgs });

      const { fetchOrganizations, organizations } = useOrganization();
      await fetchOrganizations();

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/organizations');
      expect(organizations.value).toEqual(orgs);
    });

    it('sets empty array on error', async () => {
      mockOrganizations.value = [createOrg('old')];
      vi.mocked(globalThis.$fetch).mockRejectedValue(new Error('fail'));

      const { fetchOrganizations, organizations } = useOrganization();
      await fetchOrganizations();

      expect(organizations.value).toEqual([]);
    });

    it('sets fetching flag', async () => {
      vi.mocked(globalThis.$fetch).mockImplementation(async () => {
        expect(mockFetching.value).toBe(true);
        return Promise.resolve({ organizations: [] });
      });

      const { fetchOrganizations } = useOrganization();
      await fetchOrganizations();

      expect(mockFetching.value).toBe(false);
    });
  });

  describe('fetchMembers', () => {
    it('fetches members and role', async () => {
      const members = [{ userId: 'u1' }];
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        members,
        currentUserRole: 'ADMIN',
      });

      const { fetchMembers } = useOrganization();
      await fetchMembers('my-org');

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/organizations/my-org/members');
      expect(mockMembers.value).toEqual(members);
      expect(mockCurrentUserRole.value).toBe('ADMIN');
    });

    it('clears on error', async () => {
      mockMembers.value = [{ userId: 'old' }];
      mockCurrentUserRole.value = 'OWNER';
      vi.mocked(globalThis.$fetch).mockRejectedValue(new Error('fail'));

      const { fetchMembers } = useOrganization();
      await fetchMembers('my-org');

      expect(mockMembers.value).toEqual([]);
      expect(mockCurrentUserRole.value).toBeNull();
    });
  });

  describe('switchOrganization', () => {
    it('navigates to org dashboard', async () => {
      const { switchOrganization } = useOrganization();
      await switchOrganization('new-org');

      expect(mockRouterPush).toHaveBeenCalledWith('/org/new-org/dashboard');
    });

    it('skips when already on that org page', async () => {
      mockRouteParams.slug = 'same-org';

      const { switchOrganization } = useOrganization();
      await switchOrganization('same-org');

      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('sets switching flag', async () => {
      mockRouterPush.mockImplementation(async () => {
        expect(mockSwitching.value).toBe(true);
        return Promise.resolve();
      });

      const { switchOrganization } = useOrganization();
      await switchOrganization('new-org');

      expect(mockSwitching.value).toBe(false);
    });
  });

  describe('updateMemberRole', () => {
    it('calls API and refetches members', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ members: [], currentUserRole: null });

      const { updateMemberRole } = useOrganization();
      await updateMemberRole('my-org', 'user-1', 'ADMIN');

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        '/api/organizations/my-org/members/user-1/role',
        { method: 'PUT', body: { role: 'ADMIN' } },
      );
    });
  });

  describe('removeMember', () => {
    it('calls API and refetches members', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ members: [], currentUserRole: null });

      const { removeMember } = useOrganization();
      await removeMember('my-org', 'user-1');

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        '/api/organizations/my-org/members/user-1',
        { method: 'DELETE' },
      );
    });
  });
});
