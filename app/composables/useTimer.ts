export function useTimer(onComplete?: () => void) {
  const remaining = ref(0);
  const isRunning = ref(false);
  const isComplete = ref(false);

  let endTime = 0;
  let pausedRemaining = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function tick() {
    if (!isRunning.value)
      return;
    const now = Date.now();
    const left = Math.ceil((endTime - now) / 1000);
    if (left <= 0) {
      remaining.value = 0;
      clearTimer();
      isRunning.value = false;
      isComplete.value = true;
      onComplete?.();
    }
    else {
      remaining.value = left;
    }
  }

  function start(seconds: number) {
    clearTimer();
    endTime = Date.now() + seconds * 1000;
    remaining.value = seconds;
    isRunning.value = true;
    isComplete.value = false;
    intervalId = setInterval(tick, 250);
  }

  function pause() {
    if (isRunning.value) {
      pausedRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      clearTimer();
      isRunning.value = false;
      remaining.value = pausedRemaining;
    }
  }

  function resume() {
    if (!isRunning.value && remaining.value > 0 && !isComplete.value) {
      endTime = Date.now() + remaining.value * 1000;
      isRunning.value = true;
      intervalId = setInterval(tick, 250);
    }
  }

  function reset() {
    clearTimer();
    remaining.value = 0;
    isRunning.value = false;
    isComplete.value = false;
    endTime = 0;
    pausedRemaining = 0;
  }

  // Recalculate on tab focus (background tab fix)
  function onVisibilityChange() {
    if (document.visibilityState === 'visible' && isRunning.value) {
      tick();
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onUnmounted(() => {
    clearTimer();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });

  return {
    remaining: readonly(remaining),
    isRunning: readonly(isRunning),
    isComplete: readonly(isComplete),
    start,
    pause,
    resume,
    reset,
  };
}
