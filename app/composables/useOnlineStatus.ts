export function useOnlineStatus() {
  const isOnline = ref(true);

  if (import.meta.client) {
    isOnline.value = navigator.onLine;

    const setOnline = () => (isOnline.value = true);
    const setOffline = () => (isOnline.value = false);

    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    onScopeDispose(() => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    });
  }

  return readonly(isOnline);
}
