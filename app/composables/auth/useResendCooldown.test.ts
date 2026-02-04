import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('onBeforeUnmount', vi.fn());

const mockToastAdd = vi.fn();
vi.stubGlobal('useToast', vi.fn(() => ({ add: mockToastAdd })));

// Import after mocks
const { useResendCooldown } = await import('./useResendCooldown');

describe('useResendCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with canResend true', () => {
      const { canResend, resending, cooldown } = useResendCooldown();

      expect(canResend.value).toBe(true);
      expect(resending.value).toBe(false);
      expect(cooldown.value).toBe(0);
    });
  });

  describe('canResend', () => {
    it('is false during cooldown', async () => {
      const { canResend, resend } = useResendCooldown({ cooldownSeconds: 10 });
      const action = vi.fn().mockResolvedValue(undefined);

      await resend(action, 'Email sent');

      expect(canResend.value).toBe(false);
    });

    it('is false while resending', async () => {
      const { canResend, resend, resending } = useResendCooldown();
      let resolveAction: () => void;
      const action = vi.fn(async () => new Promise<void>((r) => {
        resolveAction = r;
      }));

      const promise = resend(action, 'Email sent');
      expect(resending.value).toBe(true);
      expect(canResend.value).toBe(false);

      resolveAction!();
      await promise;
    });
  });

  describe('resend', () => {
    it('calls action and shows success toast', async () => {
      const { resend } = useResendCooldown();
      const action = vi.fn().mockResolvedValue(undefined);

      await resend(action, 'Check your inbox');

      expect(action).toHaveBeenCalled();
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Email sent',
          description: 'Check your inbox',
          color: 'success',
        }),
      );
    });

    it('starts cooldown after success', async () => {
      const { resend, cooldown } = useResendCooldown({ cooldownSeconds: 60 });
      const action = vi.fn().mockResolvedValue(undefined);

      await resend(action, 'Sent');

      expect(cooldown.value).toBe(60);
    });

    it('decrements cooldown every second', async () => {
      const { resend, cooldown } = useResendCooldown({ cooldownSeconds: 5 });
      const action = vi.fn().mockResolvedValue(undefined);

      await resend(action, 'Sent');
      expect(cooldown.value).toBe(5);

      vi.advanceTimersByTime(1000);
      expect(cooldown.value).toBe(4);

      vi.advanceTimersByTime(2000);
      expect(cooldown.value).toBe(2);

      vi.advanceTimersByTime(2000);
      expect(cooldown.value).toBe(0);
    });

    it('does nothing when canResend is false', async () => {
      const { resend, cooldown } = useResendCooldown({ cooldownSeconds: 60 });
      const action = vi.fn().mockResolvedValue(undefined);

      await resend(action, 'First');
      expect(cooldown.value).toBe(60);

      vi.clearAllMocks();
      await resend(action, 'Second');

      expect(action).not.toHaveBeenCalled();
    });

    it('handles rate limit error (429)', async () => {
      const onRateLimit = vi.fn();
      const { resend } = useResendCooldown({ onRateLimit });
      const action = vi.fn().mockRejectedValue({ status: 429 });

      await resend(action, 'Sent');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Too many attempts',
          color: 'error',
        }),
      );
      expect(onRateLimit).toHaveBeenCalled();
    });

    it('handles generic error', async () => {
      const onError = vi.fn();
      const { resend } = useResendCooldown({ onError });
      const error = new Error('Network error');
      const action = vi.fn().mockRejectedValue(error);

      await resend(action, 'Sent');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to send',
          color: 'error',
        }),
      );
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('calls onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const { resend } = useResendCooldown({ onSuccess });
      const action = vi.fn().mockResolvedValue(undefined);

      await resend(action, 'Sent');

      expect(onSuccess).toHaveBeenCalled();
    });

    it('resets resending flag after completion', async () => {
      const { resend, resending } = useResendCooldown();
      const action = vi.fn().mockResolvedValue(undefined);

      await resend(action, 'Sent');

      expect(resending.value).toBe(false);
    });

    it('resets resending flag after error', async () => {
      const { resend, resending } = useResendCooldown();
      const action = vi.fn().mockRejectedValue(new Error('fail'));

      await resend(action, 'Sent');

      expect(resending.value).toBe(false);
    });
  });
});
