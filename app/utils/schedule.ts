import type { Protocol } from '#shared/db/schema';

const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/**
 * Check if a protocol is scheduled on a given date.
 * Handles all duration types + scheduleDays override.
 */
export function isScheduledOnDate(
  protocol: Pick<Protocol, 'duration' | 'scheduleDays'>,
  date: Date,
): boolean {
  if (protocol.scheduleDays?.length) {
    return protocol.scheduleDays.includes(dayMap[date.getDay()]!);
  }

  switch (protocol.duration) {
    case 'daily':
      return true;
    case 'weekly':
      return date.getDay() === 1; // Monday
    case 'monthly':
      return date.getDay() === 1 && Math.ceil(date.getDate() / 7) === 1; // First Monday
    case 'yearly':
      return date.getMonth() === 0 && date.getDate() === 1; // Jan 1
    case 'custom':
      return false; // Custom without scheduleDays — not scheduled
    default:
      return false;
  }
}
