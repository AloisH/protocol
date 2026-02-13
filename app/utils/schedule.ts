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

/**
 * Calculate current streak for a protocol given its completion dates.
 * Walks backwards from today, counting consecutive scheduled days with completions.
 */
export function calculateStreak(
  protocol: Pick<Protocol, 'duration' | 'scheduleDays'>,
  completionDates: string[],
): number {
  if (completionDates.length === 0)
    return 0;

  const completedSet = new Set(completionDates);
  const checkDate = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]!;
    if (isScheduledOnDate(protocol, checkDate)) {
      if (completedSet.has(dateStr)) {
        streak++;
      }
      else {
        break;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
