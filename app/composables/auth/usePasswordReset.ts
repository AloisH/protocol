export function usePasswordResetRequest() {
  const { fetchSession, redirectToUserDashboard, loggedIn, client } = useAuth();
  const toast = useToast();
  const config = useRuntimeConfig();

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
      const result = await client.requestPasswordReset({
        email: state.email,
        redirectTo: `${config.public.appUrl}/auth/reset-password`,
      });

      if (result.error) {
        error.value = result.error.message || 'Failed to send reset email';
        return;
      }

      toast.add({
        title: 'Email sent',
        description: 'Check your inbox for the reset link',
        color: 'success',
        icon: 'i-lucide-mail-check',
      });

      await navigateTo({ name: 'auth-forgot-password-sent', query: { email: state.email } });
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

export function usePasswordReset() {
  const { fetchSession, redirectToUserDashboard, loggedIn, client } = useAuth();
  const route = useRoute();
  const toast = useToast();

  const token = ref(route.query.token as string);
  const state = reactive({
    password: '',
    confirmPassword: '',
  });
  const loading = ref(false);
  const error = ref('');

  onMounted(async () => {
    await fetchSession();
    if (loggedIn.value) {
      await redirectToUserDashboard();
      return;
    }

    if (!token.value) {
      toast.add({
        title: 'Invalid link',
        description: 'Password reset link is missing or invalid',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
      void navigateTo({ name: 'auth-forgot-password' });
    }
  });

  async function submit() {
    loading.value = true;
    error.value = '';

    try {
      const result = await client.resetPassword({
        newPassword: state.password,
        token: token.value,
      });

      if (result.error) {
        error.value = result.error.message || 'Failed to reset password';
        return;
      }

      toast.add({
        title: 'Password updated',
        description: 'You can now sign in with your new password',
        color: 'success',
        icon: 'i-lucide-check',
      });

      await navigateTo({ name: 'auth-login' });
    }
    catch (e: unknown) {
      error.value = getErrorMessage(e, 'Invalid or expired reset link');
    }
    finally {
      loading.value = false;
    }
  }

  return { state, loading, error, submit };
}
