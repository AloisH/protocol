export function useNotifications() {
  const permission = ref<NotificationPermission>('default');
  const supported = ref(false);

  function init() {
    if (import.meta.client && 'Notification' in window) {
      supported.value = true;
      permission.value = Notification.permission;
    }
  }

  async function requestPermission(): Promise<boolean> {
    if (!supported.value)
      return false;

    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      return result === 'granted';
    }
    catch (e) {
      console.error('Failed to request notification permission:', e);
      return false;
    }
  }

  function showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!supported.value || permission.value !== 'granted') {
      return null;
    }

    try {
      return new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });
    }
    catch (e) {
      console.error('Failed to show notification:', e);
      return null;
    }
  }

  return {
    permission: readonly(permission),
    supported: readonly(supported),
    init,
    requestPermission,
    showNotification,
  };
}
