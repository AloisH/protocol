export function useNow() {
  const now = ref(new Date());

  if (typeof document !== 'undefined') {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    function update() {
      now.value = new Date();
    }

    function scheduleNextMidnight() {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const ms = midnight.getTime() - Date.now();
      timerId = setTimeout(() => {
        update();
        scheduleNextMidnight();
      }, ms);
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        update();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    scheduleNextMidnight();

    onScopeDispose(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timerId)
        clearTimeout(timerId);
    });
  }

  return { now: readonly(now) };
}
