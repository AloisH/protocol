import type { MembersListResponse, MemberWithUser } from '#shared/organization';
import type { Organization, OrganizationRole } from '../../../prisma/generated/client';

export function useOrganization() {
  // State - SSR-safe with useState
  const organizations = useState<Organization[]>('org:list', () => []);
  const members = useState<MemberWithUser[]>('org:members', () => []);
  const currentUserRole = useState<OrganizationRole | null>('org:currentUserRole', () => null);
  const fetching = useState('org:fetching', () => false);
  const switching = useState('org:switching', () => false);

  // Track last visited org (persists across navigations within session)
  const lastOrgSlug = useState<string | null>('org:lastSlug', () => null);

  // Get route
  const route = useRoute();
  const router = useRouter();

  // URL-based slug (only on /org/[slug]/* routes)
  const urlOrgSlug = computed(() => route.params.slug as string | undefined);

  // Update lastOrgSlug when on org route
  watch(
    urlOrgSlug,
    (slug) => {
      if (slug) {
        lastOrgSlug.value = slug;
      }
    },
    { immediate: true },
  );

  // Active org: prefer URL slug, fallback to last visited, fallback to first org
  const activeOrganization = computed(() => {
    if (urlOrgSlug.value) {
      return organizations.value.find(org => org.slug === urlOrgSlug.value);
    }
    if (lastOrgSlug.value) {
      return organizations.value.find(org => org.slug === lastOrgSlug.value);
    }
    return organizations.value[0] ?? null;
  });

  const activeOrgSlug = computed(() => activeOrganization.value?.slug ?? '');

  // Keep backwards compat aliases
  const currentOrgSlug = computed(() => urlOrgSlug.value ?? activeOrgSlug.value);
  const currentOrgId = computed(() => activeOrganization.value?.id ?? null);
  const currentOrganization = activeOrganization;

  const canManageMembers = computed(() => ['OWNER', 'ADMIN'].includes(currentUserRole.value ?? ''));

  const canDeleteOrg = computed(() => currentUserRole.value === 'OWNER');

  // Methods - API calls
  async function fetchOrganizations() {
    try {
      fetching.value = true;
      const data = await $fetch<{ organizations: Organization[] }>('/api/organizations');
      organizations.value = data.organizations;
    }
    catch {
      organizations.value = [];
    }
    finally {
      fetching.value = false;
    }
  }

  async function fetchMembers(slug: string) {
    try {
      fetching.value = true;
      const data = await $fetch<MembersListResponse>(`/api/organizations/${slug}/members`);
      members.value = data.members;
      currentUserRole.value = data.currentUserRole;
    }
    catch {
      members.value = [];
      currentUserRole.value = null;
    }
    finally {
      fetching.value = false;
    }
  }

  async function switchOrganization(slug: string) {
    // Only skip if already on this org's page (URL slug matches)
    // Always navigate if on non-org page (profile, admin, etc.)
    if (slug === urlOrgSlug.value)
      return;

    try {
      switching.value = true;
      await router.push(`/org/${slug}/dashboard`);
    }
    finally {
      switching.value = false;
    }
  }

  async function updateMemberRole(slug: string, userId: string, role: OrganizationRole) {
    await $fetch(`/api/organizations/${slug}/members/${userId}/role`, {
      method: 'PUT',
      body: { role },
    });
    await fetchMembers(slug);
  }

  async function removeMember(slug: string, userId: string) {
    await $fetch(`/api/organizations/${slug}/members/${userId}`, {
      method: 'DELETE',
    });
    await fetchMembers(slug);
  }

  return {
    // State
    organizations: readonly(organizations),
    members: readonly(members),
    currentOrganization,
    currentOrgSlug,
    currentOrgId,

    // Active org (works without URL slug)
    activeOrganization,
    activeOrgSlug,

    // Permissions
    currentUserRole,
    canManageMembers,
    canDeleteOrg,

    // Methods
    fetchOrganizations,
    fetchMembers,
    switchOrganization,
    updateMemberRole,
    removeMember,

    // Status
    fetching: readonly(fetching),
    switching: readonly(switching),
  };
}
