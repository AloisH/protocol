interface UseResendCooldownOptions {
  cooldownSeconds?: number;
  onSuccess?: () => void;
  onRateLimit?: () => void;
  onError?: (error: unknown) => void;
}

export function useResendCooldown(options: UseResendCooldownOptions = {}) {
  const { cooldownSeconds = 60, onSuccess, onRateLimit, onError } = options;
  const toast = useToast();

  const resending = ref(false);
  const cooldown = ref(0);
  const canResend = computed(() => cooldown.value === 0 && !resending.value);
  let cooldownTimer: NodeJS.Timeout | null = null;

  onBeforeUnmount(() => {
    if (cooldownTimer) {
      clearInterval(cooldownTimer);
    }
  });

  function startCooldown() {
    cooldown.value = cooldownSeconds;
    cooldownTimer = setInterval(() => {
      cooldown.value--;
      if (cooldown.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  }

  async function resend(action: () => Promise<unknown>, successMessage: string) {
    if (!canResend.value)
      return;

    resending.value = true;

    try {
      await action();

      toast.add({
        title: 'Email sent',
        description: successMessage,
        color: 'success',
        icon: 'i-lucide-mail-check',
      });

      startCooldown();
      onSuccess?.();
    }
    catch (e: unknown) {
      const err = e as { status?: number } | null;
      if (err?.status === 429) {
        toast.add({
          title: 'Too many attempts',
          description: 'Please wait before trying again',
          color: 'error',
          icon: 'i-lucide-alert-triangle',
        });
        onRateLimit?.();
      }
      else {
        toast.add({
          title: 'Failed to send',
          description: 'Please try again later',
          color: 'error',
          icon: 'i-lucide-alert-triangle',
        });
        onError?.(e);
      }
    }
    finally {
      resending.value = false;
    }
  }

  return {
    resending,
    cooldown,
    canResend,
    resend,
  };
}
