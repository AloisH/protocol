import { db } from '#shared/db/schema';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAnalytics } from './useAnalytics';

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]!;
}

async function seedProtocol(overrides: Record<string, unknown> = {}) {
  const protocol = {
    id: 'p1',
    name: 'Test Protocol',
    category: 'general',
    duration: 'daily' as const,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  await db.protocols.add(protocol);
  return protocol;
}

async function seedCompletion(protocolId: string, date: string) {
  await db.dailyCompletions.add({
    id: `c-${protocolId}-${date}`,
    protocolId,
    date,
    completedAt: new Date(),
  });
}

describe('useAnalytics', () => {
  beforeEach(async () => {
    await db.protocols.clear();
    await db.dailyCompletions.clear();
  });

  describe('getCalendarData', () => {
    it('returns full date range with completion data', async () => {
      await seedProtocol();
      await seedCompletion('p1', todayStr());

      const { getCalendarData } = useAnalytics();
      const data = await getCalendarData('p1', 7);

      // 7 days + today = 8 entries (i=0..7)
      expect(data).toHaveLength(8);
      const todayEntry = data.find(d => d.date === todayStr());
      expect(todayEntry?.completed).toBe(true);
      expect(todayEntry?.count).toBe(1);
    });

    it('marks days without completions as not completed', async () => {
      await seedProtocol();
      const { getCalendarData } = useAnalytics();
      const data = await getCalendarData('p1', 3);

      expect(data.every(d => !d.completed)).toBe(true);
      expect(data.every(d => d.count === 0)).toBe(true);
    });

    it('returns all protocols when protocolId is null', async () => {
      await seedProtocol({ id: 'a' });
      await seedProtocol({ id: 'b', name: 'B' });
      await seedCompletion('a', todayStr());
      await seedCompletion('b', todayStr());

      const { getCalendarData } = useAnalytics();
      const data = await getCalendarData(null, 1);

      const todayEntry = data.find(d => d.date === todayStr());
      expect(todayEntry?.count).toBe(2);
    });
  });

  describe('getCompletionTrend', () => {
    it('calculates per-day rate', async () => {
      await seedProtocol();
      await seedCompletion('p1', todayStr());

      const { getCompletionTrend } = useAnalytics();
      const trend = await getCompletionTrend('p1', 3);

      const todayPoint = trend.find(t => t.date === todayStr());
      expect(todayPoint?.rate).toBe(100);

      // Non-completed day should be 0
      const yesterdayPoint = trend.find(t => t.date === daysAgoStr(1));
      expect(yesterdayPoint?.rate).toBe(0);
    });

    it('handles div-by-zero (no protocols scheduled)', async () => {
      // Yearly protocol — not scheduled most days
      await seedProtocol({ duration: 'yearly' });

      const { getCompletionTrend } = useAnalytics();
      const trend = await getCompletionTrend('p1', 3);

      // Most days rate=0 (not scheduled, expected=0 → rate=0)
      const nonJan1 = trend.filter((t) => {
        const d = new Date(`${t.date}T12:00:00`);
        return !(d.getMonth() === 0 && d.getDate() === 1);
      });
      expect(nonJan1.every(t => t.rate === 0)).toBe(true);
    });

    it('returns empty for no protocols', async () => {
      const { getCompletionTrend } = useAnalytics();
      const trend = await getCompletionTrend('nonexistent', 7);
      expect(trend).toHaveLength(0);
    });

    it('all durations work (weekly)', async () => {
      await seedProtocol({ duration: 'weekly' });

      const { getCompletionTrend } = useAnalytics();
      const trend = await getCompletionTrend('p1', 14);

      // Should have 15 points
      expect(trend).toHaveLength(15);
      // Mondays should have expected=1, others expected=0
      for (const point of trend) {
        const d = new Date(`${point.date}T12:00:00`);
        if (d.getDay() !== 1) {
          expect(point.rate).toBe(0);
        }
      }
    });

    it('null protocolId aggregates all active', async () => {
      await seedProtocol({ id: 'a' });
      await seedProtocol({ id: 'b', name: 'B' });
      await seedCompletion('a', todayStr());
      await seedCompletion('b', todayStr());

      const { getCompletionTrend } = useAnalytics();
      const trend = await getCompletionTrend(null, 1);

      const todayPoint = trend.find(t => t.date === todayStr());
      // 2 completions / 2 expected = 100%
      expect(todayPoint?.rate).toBe(100);
    });
  });

  describe('getProtocolStats', () => {
    it('returns stats sorted by completion rate', async () => {
      await seedProtocol({ id: 'high', name: 'High' });
      await seedProtocol({ id: 'low', name: 'Low' });

      // Give "high" more completions
      await seedCompletion('high', todayStr());
      await seedCompletion('high', daysAgoStr(1));
      await seedCompletion('low', todayStr());

      const { getProtocolStats } = useAnalytics();
      const stats = await getProtocolStats(30);

      expect(stats).toHaveLength(2);
      expect(stats[0]!.protocolId).toBe('high');
      expect(stats[0]!.totalCompletions).toBe(2);
      expect(stats[1]!.protocolId).toBe('low');
    });

    it('handles weekly duration expected count', async () => {
      await seedProtocol({ duration: 'weekly' });
      await seedCompletion('p1', todayStr());

      const { getProtocolStats } = useAnalytics();
      const stats = await getProtocolStats(28);

      // expected = floor(28/7) = 4, rate = 1/4 = 25%
      expect(stats[0]!.completionRate).toBe(25);
    });

    it('handles monthly duration expected count', async () => {
      await seedProtocol({ duration: 'monthly' });
      await seedCompletion('p1', todayStr());

      const { getProtocolStats } = useAnalytics();
      const stats = await getProtocolStats(30);

      // expected = floor(30/30) = 1, rate = 1/1 = 100%
      expect(stats[0]!.completionRate).toBe(100);
    });

    it('caps rate at 100', async () => {
      await seedProtocol({ duration: 'monthly' });
      // 2 completions with expected=1
      await seedCompletion('p1', todayStr());
      await seedCompletion('p1', daysAgoStr(1));

      const { getProtocolStats } = useAnalytics();
      const stats = await getProtocolStats(30);

      expect(stats[0]!.completionRate).toBeLessThanOrEqual(100);
    });
  });

  describe('getOverallStats', () => {
    it('aggregates across protocols', async () => {
      await seedProtocol({ id: 'a' });
      await seedProtocol({ id: 'b', name: 'B' });
      await seedCompletion('a', todayStr());
      await seedCompletion('b', todayStr());

      const { getOverallStats } = useAnalytics();
      const overall = await getOverallStats(30);

      expect(overall.totalCompletions).toBe(2);
      expect(overall.avgRate).toBeGreaterThan(0);
    });

    it('returns zeros when no protocols', async () => {
      const { getOverallStats } = useAnalytics();
      const overall = await getOverallStats(30);

      expect(overall.totalCompletions).toBe(0);
      expect(overall.avgRate).toBe(0);
      expect(overall.bestStreak).toBe(0);
    });
  });
});
