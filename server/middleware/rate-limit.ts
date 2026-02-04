import { rateLimit } from '../utils/rate-limit';

/**
 * Rate limiting middleware for auth endpoints
 * Applies different limits based on endpoint sensitivity
 */
export default defineEventHandler((event) => {
  const path = event.path;

  // Only apply to auth routes
  if (!path.startsWith('/api/auth')) {
    return;
  }

  // Map paths to rate limit configs
  if (path.includes('/sign-in') || path.includes('/signin')) {
    rateLimit(event, 'login');
  }
  else if (path.includes('/sign-up') || path.includes('/signup')) {
    rateLimit(event, 'register');
  }
  else if (path.includes('/reset-password') || path.includes('/forgot-password')) {
    rateLimit(event, 'passwordReset');
  }
  else if (path.includes('/magic-link')) {
    rateLimit(event, 'magicLink');
  }
  else {
    // General auth endpoints (session, etc.)
    rateLimit(event, 'authGeneral');
  }
});
