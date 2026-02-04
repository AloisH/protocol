export interface OrgInvite {
  id: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
}

export function useOrgInvite(token: string) {
  const router = useRouter();
  const toast = useToast();

  const accepting = ref(false);

  // Redirect if no token
  if (!token) {
    void router.push('/org/select');
  }

  // Fetch invite data
  const { data: inviteData, error: fetchError } = useFetch<{ invite: OrgInvite }>(
    `/api/organizations/invites/${token}`,
    { key: `invite-${token}` },
  );

  const invite = computed(() => inviteData.value?.invite ?? null);

  async function acceptInvite() {
    if (!invite.value)
      return;

    accepting.value = true;
    try {
      await $fetch('/api/organizations/invites/accept', {
        method: 'POST',
        body: { token },
      });

      toast.add({
        title: 'Success',
        description: 'You have joined the organization',
        color: 'success',
        icon: 'i-lucide-check',
      });

      await router.push(`/org/${invite.value.organization.slug}/dashboard`);
    }
    catch (err) {
      const error = err as { data?: { message?: string } };
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to accept invite',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
    }
    finally {
      accepting.value = false;
    }
  }

  return {
    invite,
    fetchError,
    accepting,
    acceptInvite,
  };
}
