export function useNewsletter() {
  const toast = useToast();

  const email = ref('');
  const subscribing = ref(false);

  async function subscribe() {
    if (!email.value)
      return;

    subscribing.value = true;
    try {
      // TODO: Implement actual subscription API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.add({
        title: 'Subscribed!',
        description: 'Thanks for subscribing. We\'ll keep you posted.',
        color: 'success',
        icon: 'i-lucide-check',
      });
      email.value = '';
    }
    catch {
      toast.add({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
    }
    finally {
      subscribing.value = false;
    }
  }

  return { email, subscribing, subscribe };
}
