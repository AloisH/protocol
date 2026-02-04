import type { CreateOrganizationInput } from '#shared/organization';
import { createOrganizationSchema } from '#shared/organization';

export function useOrgCreate() {
  const router = useRouter();
  const toast = useToast();

  const state = reactive<CreateOrganizationInput>({
    name: '',
    slug: '',
    description: '',
  });

  const loading = ref(false);

  // Auto-generate slug from name using existing useSlugify
  useSlugify(toRef(state, 'name'), toRef(state, 'slug'));

  async function createOrganization() {
    loading.value = true;
    try {
      const response = await $fetch<{ organization: { slug: string } }>('/api/organizations', {
        method: 'POST',
        body: state,
      });

      toast.add({
        title: 'Success',
        description: 'Organization created successfully',
        color: 'success',
        icon: 'i-lucide-check',
      });

      await router.push(`/org/${response.organization.slug}/dashboard`);
    }
    catch (err) {
      const error = err as { data?: { message?: string } };
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to create organization',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
    }
    finally {
      loading.value = false;
    }
  }

  return {
    state,
    loading,
    schema: createOrganizationSchema,
    createOrganization,
  };
}
