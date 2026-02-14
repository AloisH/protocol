import { describe, expect, it } from 'vitest';
import { calculateStreak, isScheduledOnDate } from './schedule';

describe('isScheduledOnDate', () => {
  // Helper: create date for a specific day of week (0=Sun, 1=Mon, ...)
  function dateOnDay(dayOfWeek: number): Date {
    // 2024-01-15 is a Monday; offset to desired day
    const d = new Date(2024, 0, 15 + (dayOfWeek - 1));
    return d;
  }

  describe('daily', () => {
    it('returns true for any day', () => {
      for (let d = 0; d < 7; d++) {
        expect(isScheduledOnDate({ duration: 'daily' }, dateOnDay(d))).toBe(true);
      }
    });
  });

  describe('weekly', () => {
    it('returns true only on Monday', () => {
      expect(isScheduledOnDate({ duration: 'weekly' }, dateOnDay(1))).toBe(true); // Mon
      expect(isScheduledOnDate({ duration: 'weekly' }, dateOnDay(0))).toBe(false); // Sun
      expect(isScheduledOnDate({ duration: 'weekly' }, dateOnDay(3))).toBe(false); // Wed
    });
  });

  describe('monthly', () => {
    it('returns true on first Monday of month', () => {
      // 2024-01-01 is a Monday and the first Monday
      expect(isScheduledOnDate({ duration: 'monthly' }, new Date(2024, 0, 1))).toBe(true);
    });

    it('returns false on second Monday', () => {
      expect(isScheduledOnDate({ duration: 'monthly' }, new Date(2024, 0, 8))).toBe(false);
    });

    it('returns false on non-Monday', () => {
      expect(isScheduledOnDate({ duration: 'monthly' }, new Date(2024, 0, 2))).toBe(false);
    });
  });

  describe('yearly', () => {
    it('returns true on Jan 1', () => {
      expect(isScheduledOnDate({ duration: 'yearly' }, new Date(2024, 0, 1))).toBe(true);
    });

    it('returns false on any other day', () => {
      expect(isScheduledOnDate({ duration: 'yearly' }, new Date(2024, 0, 2))).toBe(false);
      expect(isScheduledOnDate({ duration: 'yearly' }, new Date(2024, 5, 1))).toBe(false);
    });
  });

  describe('custom', () => {
    it('returns false without scheduleDays', () => {
      expect(isScheduledOnDate({ duration: 'custom' }, new Date(2024, 0, 15))).toBe(false);
    });
  });

  describe('scheduleDays override', () => {
    it('overrides duration when set', () => {
      const protocol = { duration: 'daily' as const, scheduleDays: ['mon', 'wed', 'fri'] as const };
      expect(isScheduledOnDate(protocol, dateOnDay(1))).toBe(true); // Mon
      expect(isScheduledOnDate(protocol, dateOnDay(3))).toBe(true); // Wed
      expect(isScheduledOnDate(protocol, dateOnDay(2))).toBe(false); // Tue
    });

    it('works with custom duration + scheduleDays', () => {
      const protocol = { duration: 'custom' as const, scheduleDays: ['sat', 'sun'] as const };
      expect(isScheduledOnDate(protocol, dateOnDay(6))).toBe(true); // Sat
      expect(isScheduledOnDate(protocol, dateOnDay(0))).toBe(true); // Sun
      expect(isScheduledOnDate(protocol, dateOnDay(1))).toBe(false); // Mon
    });

    it('empty scheduleDays falls through to duration', () => {
      const protocol = { duration: 'daily' as const, scheduleDays: [] as const };
      expect(isScheduledOnDate(protocol, new Date(2024, 0, 15))).toBe(true);
    });
  });
});

describe('calculateStreak', () => {
  function todayStr(): string {
    return new Date().toISOString().split('T')[0]!;
  }

  function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0]!;
  }

  it('returns 0 for empty completions', () => {
    expect(calculateStreak({ duration: 'daily' }, [])).toBe(0);
  });

  it('returns 1 when only today completed', () => {
    expect(calculateStreak({ duration: 'daily' }, [todayStr()])).toBe(1);
  });

  it('counts consecutive days', () => {
    const dates = [todayStr(), daysAgo(1), daysAgo(2)];
    expect(calculateStreak({ duration: 'daily' }, dates)).toBe(3);
  });

  it('breaks on gap', () => {
    // today + 2 days ago (gap at yesterday)
    const dates = [todayStr(), daysAgo(2)];
    expect(calculateStreak({ duration: 'daily' }, dates)).toBe(1);
  });

  it('handles weekly — skips non-Monday days', () => {
    // Find last Monday and the Monday before
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysSinceMonday);
    const mondayBefore = new Date(lastMonday);
    mondayBefore.setDate(lastMonday.getDate() - 7);

    const dates = [
      lastMonday.toISOString().split('T')[0]!,
      mondayBefore.toISOString().split('T')[0]!,
    ];

    // If today is Monday, streak should be 2 (today + last week)
    // If today is not Monday, streak should be 2 (last Mon + Mon before)
    // unless today is before Monday in the week — the function walks back from today
    const result = calculateStreak({ duration: 'weekly' }, dates);
    expect(result).toBe(2);
  });

  it('handles scheduleDays — skips unscheduled days', () => {
    const now = new Date();
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const todayDay = dayMap[now.getDay()]!;

    // Schedule only today's day of week
    const protocol = { duration: 'custom' as const, scheduleDays: [todayDay] };

    // Complete today and same day last week
    const lastWeekSameDay = new Date(now);
    lastWeekSameDay.setDate(now.getDate() - 7);

    const dates = [
      todayStr(),
      lastWeekSameDay.toISOString().split('T')[0]!,
    ];

    expect(calculateStreak(protocol, dates)).toBe(2);
  });

  it('returns 0 when today is scheduled but not completed', () => {
    // Only yesterday completed, today missing
    expect(calculateStreak({ duration: 'daily' }, [daysAgo(1)])).toBe(0);
  });
});
