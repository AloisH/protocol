export function useAuthRegister() {
  const { signUp, fetchSession, redirectToUserDashboard, loggedIn } = useAuth();
  const toast = useToast();

  const state = reactive({
    name: '',
    email: '',
    password: '',
  });

  const loading = ref(false);
  const error = ref('');

  // Redirect if already authenticated
  onMounted(async () => {
    await fetchSession();
    if (loggedIn.value) {
      await redirectToUserDashboard();
    }
  });

  async function submit() {
    loading.value = true;
    error.value = '';

    try {
      const result = await signUp.email({
        name: state.name,
        email: state.email,
        password: state.password,
      });

      if (result.error) {
        error.value = result.error.message || 'Failed to create account';
        return;
      }

      toast.add({
        title: 'Account created!',
        description: 'Check your email for verification link.',
        color: 'success',
        icon: 'i-lucide-mail-check',
      });

      await navigateTo({ name: 'auth-verify-email', query: { email: state.email } });
    }
    catch (e: unknown) {
      error.value = getErrorMessage(e);
    }
    finally {
      loading.value = false;
    }
  }

  return {
    state,
    loading,
    error,
    submit,
  };
}
