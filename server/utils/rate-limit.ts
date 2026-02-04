import type { H3Event } from 'h3';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Max requests allowed in window */
  limit: number;
  /** Window duration in seconds */
  window: number;
}

// In-memory store (use Redis for distributed systems)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * Rate limit configurations by endpoint type
 */
export const rateLimitConfigs = {
  // Aggressive limits for sensitive auth endpoints
  login: { limit: 5, window: 15 * 60 }, // 5 per 15 min
  register: { limit: 3, window: 60 * 60 }, // 3 per hour
  passwordReset: { limit: 3, window: 60 * 60 }, // 3 per hour
  magicLink: { limit: 3, window: 60 * 60 }, // 3 per hour

  // Moderate limits for general auth
  authGeneral: { limit: 30, window: 60 }, // 30 per minute
} as const;

/**
 * Get client identifier (IP address)
 */
function getClientId(event: H3Event): string {
  const forwarded = getHeader(event, 'x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }
  return getHeader(event, 'x-real-ip') || event.node.req.socket.remoteAddress || 'unknown';
}

/**
 * Check rate limit for a key
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    store.set(key, { count: 1, resetAt: now + config.window * 1000 });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.window * 1000 };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Apply rate limiting to an event
 * @returns true if allowed, throws 429 error if rate limited
 */
export function rateLimit(event: H3Event, endpoint: keyof typeof rateLimitConfigs): boolean {
  const clientId = getClientId(event);
  const config = rateLimitConfigs[endpoint];
  const key = `${endpoint}:${clientId}`;

  const result = checkRateLimit(key, config);

  // Set rate limit headers
  setHeader(event, 'X-RateLimit-Limit', String(config.limit));
  setHeader(event, 'X-RateLimit-Remaining', String(result.remaining));
  setHeader(event, 'X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    setHeader(event, 'Retry-After', retryAfter);

    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    });
  }

  return true;
}
