import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { useNow } from './useNow';

describe('useNow', () => {
  let scope: ReturnType<typeof effectScope>;

  beforeEach(() => {
    vi.useFakeTimers();
    scope = effectScope();
  });

  afterEach(() => {
    scope.stop();
    vi.useRealTimers();
  });

  it('returns a Date ref', () => {
    let now: ReturnType<typeof useNow>['now'];
    scope.run(() => {
      now = useNow().now;
    });
    expect(now!.value).toBeInstanceOf(Date);
  });

  it('updates on visibilitychange', () => {
    const start = new Date('2025-06-15T10:00:00');
    vi.setSystemTime(start);

    let now: ReturnType<typeof useNow>['now'];
    scope.run(() => {
      now = useNow().now;
    });

    expect(now!.value.getTime()).toBe(start.getTime());

    // Advance time 1 hour then trigger visibility
    vi.setSystemTime(new Date('2025-06-15T11:00:00'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(now!.value.getTime()).toBe(new Date('2025-06-15T11:00:00').getTime());
  });
});
