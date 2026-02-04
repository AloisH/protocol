import { useAuth } from './useAuth';

const REFRESH_INTERVAL = 60 * 1000; // Check every minute
const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // Refresh 5 min before expiry

export function useSessionRefresh() {
  const { session, fetchSession, loggedIn } = useAuth();

  if (import.meta.client) {
    const checkAndRefresh = async () => {
      if (!loggedIn.value || !session.value)
        return;

      const expiresAt = new Date(session.value.expiresAt);
      const now = new Date();
      const timeLeft = expiresAt.getTime() - now.getTime();

      // Auto-refresh 5 minutes before expiry
      if (timeLeft > 0 && timeLeft <= REFRESH_BEFORE_EXPIRY) {
        await fetchSession();
      }
    };

    // Check every minute
    const interval = setInterval(() => void checkAndRefresh(), REFRESH_INTERVAL);

    // Cleanup on unmount
    onBeforeUnmount(() => {
      clearInterval(interval);
    });
  }
}
