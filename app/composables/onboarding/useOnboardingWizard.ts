const STORAGE_KEY = 'bistro:onboarding';
const TOTAL_STEPS = 6;

export function useOnboardingWizard() {
  const { fetchSession } = useAuth();
  const toast = useToast();

  const state = reactive({
    currentStep: 1,
    profile: {
      bio: '',
      company: '',
    },
    preferences: {
      emailNotifications: true,
    },
    useCase: '',
    organization: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const isLoading = ref(false);
  const createdOrgSlug = ref<string | null>(null);

  const isFirstStep = computed(() => state.currentStep === 1);
  const isLastStep = computed(() => state.currentStep === TOTAL_STEPS);

  // Load from localStorage on mount
  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<typeof state>;
        Object.assign(state, parsed);
      }
      catch {
        // Invalid stored state, ignore
      }
    }
  });

  // Save to localStorage on state change
  watch(
    state,
    (newState) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    },
    { deep: true },
  );

  async function saveCurrentStep() {
    // Steps 1 and 6 don't save data
    if (state.currentStep === 1 || state.currentStep === 6)
      return;

    try {
      isLoading.value = true;

      // Step 5 creates organization
      if (state.currentStep === 5) {
        const response = await $fetch<{ organization: { slug: string } }>('/api/organizations', {
          method: 'POST',
          body: state.organization,
        });
        createdOrgSlug.value = response.organization.slug;
        return;
      }

      const stepMap: Record<
        number,
        { step: 'profile' | 'preferences' | 'useCase'; data: Record<string, unknown> }
      > = {
        2: { step: 'profile', data: state.profile },
        3: { step: 'preferences', data: state.preferences },
        4: { step: 'useCase', data: { useCase: state.useCase } },
      };

      const payload = stepMap[state.currentStep];
      if (payload) {
        await $fetch('/api/user/onboarding', {
          method: 'PUT',
          body: payload,
        });
      }
    }
    catch (error) {
      toast.add({
        title: 'Error',
        description:
          (error as { data?: { message?: string } } | null)?.data?.message ?? 'Failed to save progress',
        color: 'error',
      });
      throw error;
    }
    finally {
      isLoading.value = false;
    }
  }

  async function complete() {
    try {
      isLoading.value = true;

      await $fetch('/api/user/onboarding/complete', {
        method: 'POST',
      });

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);

      // Fetch updated session with cache bypass to get fresh onboardingCompleted flag
      await fetchSession({ forceRefresh: true });

      toast.add({
        title: 'Welcome!',
        description: 'Your account is all set up',
        color: 'success',
      });

      // Redirect to org dashboard if org was created, otherwise to org select
      if (createdOrgSlug.value) {
        await navigateTo({ name: 'org-slug-dashboard', params: { slug: createdOrgSlug.value } });
      }
      else {
        await navigateTo({ name: 'organizations-select' });
      }
    }
    catch (error) {
      toast.add({
        title: 'Error',
        description:
          (error as { data?: { message?: string } } | null)?.data?.message
          ?? 'Failed to complete onboarding',
        color: 'error',
      });
    }
    finally {
      isLoading.value = false;
    }
  }

  async function nextStep() {
    if (isLoading.value)
      return;

    if (state.currentStep < TOTAL_STEPS) {
      await saveCurrentStep();
      state.currentStep++;
    }
    else {
      await complete();
    }
  }

  function previousStep() {
    if (state.currentStep > 1) {
      state.currentStep--;
    }
  }

  async function skipStep() {
    if (isLoading.value)
      return;

    if (state.currentStep < TOTAL_STEPS) {
      state.currentStep++;
    }
    else {
      await complete();
    }
  }

  return {
    state,
    isLoading,
    isFirstStep,
    isLastStep,
    nextStep,
    previousStep,
    skipStep,
    TOTAL_STEPS,
  };
}
