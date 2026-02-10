export function useTimer(onComplete?: () => void) {
  const remaining = ref(0);
  const isRunning = ref(false);
  const isComplete = ref(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function start(seconds: number) {
    clearTimer();
    remaining.value = seconds;
    isRunning.value = true;
    isComplete.value = false;
    intervalId = setInterval(() => {
      remaining.value--;
      if (remaining.value <= 0) {
        clearTimer();
        isRunning.value = false;
        isComplete.value = true;
        onComplete?.();
      }
    }, 1000);
  }

  function pause() {
    if (isRunning.value) {
      clearTimer();
      isRunning.value = false;
    }
  }

  function resume() {
    if (!isRunning.value && remaining.value > 0 && !isComplete.value) {
      isRunning.value = true;
      intervalId = setInterval(() => {
        remaining.value--;
        if (remaining.value <= 0) {
          clearTimer();
          isRunning.value = false;
          isComplete.value = true;
          onComplete?.();
        }
      }, 1000);
    }
  }

  function reset() {
    clearTimer();
    remaining.value = 0;
    isRunning.value = false;
    isComplete.value = false;
  }

  onUnmounted(clearTimer);

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
