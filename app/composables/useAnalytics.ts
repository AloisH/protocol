import { db } from '#shared/db/schema';
import { calculateStreak, isScheduledOnDate } from '~/utils/schedule';

export interface ProtocolStats {
  protocolId: string;
  name: string;
  completionRate: number;
  streak: number;
  totalCompletions: number;
}

export interface CalendarDay {
  date: string;
  completed: boolean;
  count: number;
}

export interface TrendPoint {
  date: string;
  rate: number;
}

export function useAnalytics() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Get calendar data for a protocol (last N days)
  async function getCalendarData(
    protocolId: string | null,
    days: number = 90,
  ): Promise<CalendarDay[]> {
    if (import.meta.server)
      return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split('T')[0]!;

      let completions;
      if (protocolId) {
        completions = await db.dailyCompletions
          .where('protocolId')
          .equals(protocolId)
          .and(c => c.date >= startStr)
          .toArray();
      }
      else {
        completions = await db.dailyCompletions
          .where('date')
          .aboveOrEqual(startStr)
          .toArray();
      }

      // Group by date
      const byDate = new Map<string, number>();
      for (const c of completions) {
        byDate.set(c.date, (byDate.get(c.date) ?? 0) + 1);
      }

      // Generate all days
      const result: CalendarDay[] = [];
      for (let i = 0; i <= days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0]!;
        const count = byDate.get(dateStr) ?? 0;
        result.push({
          date: dateStr,
          completed: count > 0,
          count,
        });
      }

      return result;
    }
    catch (e) {
      console.error('Failed to get calendar data:', e);
      return [];
    }
  }

  // Get completion trend for chart
  async function getCompletionTrend(
    protocolId: string | null,
    days: number = 30,
  ): Promise<TrendPoint[]> {
    if (import.meta.server)
      return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split('T')[0]!;

      // Get protocols to calculate expected completions
      let protocols;
      if (protocolId) {
        const p = await db.protocols.get(protocolId);
        protocols = p ? [p] : [];
      }
      else {
        protocols = await db.protocols.where('status').equals('active').toArray();
      }

      if (protocols.length === 0)
        return [];

      const protocolIds = new Set(protocols.map(p => p.id));

      // Get completions
      let completions;
      if (protocolId) {
        completions = await db.dailyCompletions
          .where('protocolId')
          .equals(protocolId)
          .and(c => c.date >= startStr)
          .toArray();
      }
      else {
        completions = await db.dailyCompletions
          .where('date')
          .aboveOrEqual(startStr)
          .toArray();
      }

      // Filter to relevant protocols
      const relevantCompletions = completions.filter(c => protocolIds.has(c.protocolId));

      // Group by date
      const byDate = new Map<string, number>();
      for (const c of relevantCompletions) {
        byDate.set(c.date, (byDate.get(c.date) ?? 0) + 1);
      }

      // Generate trend points with per-day expected count
      const result: TrendPoint[] = [];
      for (let i = 0; i <= days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0]!;
        const expected = protocols.filter(p => isScheduledOnDate(p, d)).length;
        const count = byDate.get(dateStr) ?? 0;
        const rate = expected > 0 ? Math.round((count / expected) * 100) : 0;
        result.push({ date: dateStr, rate: Math.min(rate, 100) });
      }

      return result;
    }
    catch (e) {
      console.error('Failed to get completion trend:', e);
      return [];
    }
  }

  // Get stats for all protocols
  async function getProtocolStats(days: number = 30): Promise<ProtocolStats[]> {
    if (import.meta.server)
      return [];

    loading.value = true;
    error.value = null;

    try {
      const protocols = await db.protocols.where('status').equals('active').toArray();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split('T')[0]!;

      const stats: ProtocolStats[] = [];

      for (const protocol of protocols) {
        const completions = await db.dailyCompletions
          .where('protocolId')
          .equals(protocol.id)
          .toArray();

        const recentCompletions = completions.filter(c => c.date >= startStr);

        // Calculate expected completions based on duration
        let expected = days;
        if (protocol.duration === 'weekly')
          expected = Math.floor(days / 7);
        if (protocol.duration === 'monthly')
          expected = Math.floor(days / 30);

        const rate = expected > 0 ? Math.round((recentCompletions.length / expected) * 100) : 0;

        const streak = calculateStreak(protocol, completions.map(c => c.date));

        stats.push({
          protocolId: protocol.id,
          name: protocol.name,
          completionRate: Math.min(rate, 100),
          streak,
          totalCompletions: completions.length,
        });
      }

      return stats.sort((a, b) => b.completionRate - a.completionRate);
    }
    catch (e) {
      error.value = String(e);
      console.error('Failed to get protocol stats:', e);
      return [];
    }
    finally {
      loading.value = false;
    }
  }

  // Get overall stats
  async function getOverallStats(days: number = 30) {
    if (import.meta.server)
      return { totalCompletions: 0, avgRate: 0, bestStreak: 0 };

    try {
      const stats = await getProtocolStats(days);
      const totalCompletions = stats.reduce((sum, s) => sum + s.totalCompletions, 0);
      const avgRate = stats.length > 0
        ? Math.round(stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length)
        : 0;
      const bestStreak = Math.max(0, ...stats.map(s => s.streak));

      return { totalCompletions, avgRate, bestStreak };
    }
    catch (e) {
      console.error('Failed to get overall stats:', e);
      return { totalCompletions: 0, avgRate: 0, bestStreak: 0 };
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    getCalendarData,
    getCompletionTrend,
    getProtocolStats,
    getOverallStats,
  };
}
