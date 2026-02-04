import { magicLinkSchema } from '#shared/auth/schemas';

export function useAuthLogin() {
  const { signIn, fetchSession, redirectToUserDashboard, loggedIn, client } = useAuth();

  // Tabs
  const activeTab = ref('password');
  const tabItems = [
    { label: 'Password', value: 'password', icon: 'i-lucide-key' },
    { label: 'Magic Link', value: 'magic-link', icon: 'i-lucide-mail' },
  ];

  // Redirect if already authenticated
  onMounted(async () => {
    await fetchSession();
    if (loggedIn.value) {
      await redirectToUserDashboard();
    }
  });

  // Password form
  const passwordState = reactive({ email: '', password: '' });
  const passwordLoading = ref(false);
  const passwordError = ref('');

  async function submitPassword() {
    passwordLoading.value = true;
    passwordError.value = '';

    try {
      const result = await signIn.email({
        email: passwordState.email,
        password: passwordState.password,
      });

      if (result.error) {
        passwordError.value = result.error.message || 'Invalid email or password';
        return;
      }

      await fetchSession();
      await redirectToUserDashboard();
    }
    catch (e: unknown) {
      passwordError.value = getErrorMessage(e);
    }
    finally {
      passwordLoading.value = false;
    }
  }

  // Magic link form
  const magicLinkState = reactive({ email: '' });
  const magicLinkLoading = ref(false);
  const magicLinkError = ref('');

  async function submitMagicLink() {
    magicLinkLoading.value = true;
    magicLinkError.value = '';

    try {
      await client.signIn.magicLink({
        email: magicLinkState.email,
        callbackURL: '/auth/login',
      });

      await navigateTo({ name: 'auth-magic-link-sent', query: { email: magicLinkState.email } });
    }
    catch (e: unknown) {
      magicLinkError.value = getErrorMessage(e);
    }
    finally {
      magicLinkLoading.value = false;
    }
  }

  return {
    // Tabs
    activeTab,
    tabItems,
    // Password
    passwordState,
    passwordLoading,
    passwordError,
    submitPassword,
    // Magic link
    magicLinkSchema,
    magicLinkState,
    magicLinkLoading,
    magicLinkError,
    submitMagicLink,
  };
}
