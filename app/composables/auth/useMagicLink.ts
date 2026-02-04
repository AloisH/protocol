export function useMagicLink() {
  const { fetchSession, redirectToUserDashboard, loggedIn, client } = useAuth();
  const config = useRuntimeConfig();
  const toast = useToast();

  const state = reactive({ email: '' });
  const loading = ref(false);
  const error = ref('');

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
      const result = await client.signIn.magicLink({
        email: state.email,
        callbackURL: config.public.authCallbackUrl,
      });

      if (result.error) {
        error.value = result.error.message || 'Failed to send magic link';
        return;
      }

      toast.add({
        title: 'Email sent',
        description: 'Check your inbox for the login link',
        color: 'success',
        icon: 'i-lucide-mail-check',
      });

      await navigateTo({ name: 'auth-magic-link-sent', query: { email: state.email } });
    }
    catch (e: unknown) {
      error.value = getErrorMessage(e);
    }
    finally {
      loading.value = false;
    }
  }

  return { state, loading, error, submit };
}
