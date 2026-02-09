import type { DailyCompletion, Protocol } from '#shared/db/schema';
import { db } from '#shared/db/schema';
import { nanoid } from 'nanoid';

export function useDaily() {
  // Use useState for SSR-safe shared state
  const todaysProtocols = useState<Protocol[]>('daily-protocols', () => []);
  const completions = useState<DailyCompletion[]>('daily-completions', () => []);
  const loading = useState<boolean>('daily-loading', () => false);
  const error = useState<string | null>('daily-error', () => null);

  // Get today's date in YYYY-MM-DD format
  const today = computed(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]!;
  });

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = computed(() => new Date().getDay());

  // Get week of month (1-5)
  const weekOfMonth = computed(() => {
    const d = new Date();
    return Math.ceil(d.getDate() / 7);
  });

  // Check if protocol is scheduled for today based on duration
  function isScheduledToday(protocol: Protocol): boolean {
    switch (protocol.duration) {
      case 'daily':
        return true;
      case 'weekly':
        // Show weekly protocols on Monday (day 1)
        return dayOfWeek.value === 1;
      case 'monthly':
        // Show monthly protocols on first Monday of month
        return dayOfWeek.value === 1 && weekOfMonth.value === 1;
      case 'yearly': {
        // Show yearly protocols on first day of year
        const d = new Date();
        return d.getMonth() === 0 && d.getDate() === 1;
      }
      default:
        return false;
    }
  }

  // Load today's protocols and completions
  async function loadToday() {
    // Skip on server - IndexedDB not available
    if (import.meta.server)
      return;

    loading.value = true;
    error.value = null;

    try {
      // Get all active protocols
      const allProtocols = await db.protocols
        .where('status')
        .equals('active')
        .toArray();

      // Filter to those scheduled for today
      todaysProtocols.value = allProtocols.filter(isScheduledToday);

      // Get today's completions
      completions.value = await db.dailyCompletions
        .where('date')
        .equals(today.value)
        .toArray();
    }
    catch (e) {
      error.value = String(e);
      console.error('Failed to load daily data:', e);
    }
    finally {
      loading.value = false;
    }
  }

  // Check if a protocol is completed today
  function isCompletedToday(protocolId: string): boolean {
    return completions.value.some(c => c.protocolId === protocolId);
  }

  // Mark protocol as completed for today
  async function completeProtocol(protocolId: string, notes?: string) {
    if (import.meta.server)
      return;
    if (isCompletedToday(protocolId))
      return;

    const completion: DailyCompletion = {
      id: nanoid(),
      protocolId,
      date: today.value,
      completedAt: new Date(),
      notes,
    };

    await db.dailyCompletions.add(completion);
    completions.value = [...completions.value, completion];
  }

  // Undo completion
  async function uncompleteProtocol(protocolId: string) {
    if (import.meta.server)
      return;

    const completion = completions.value.find(
      c => c.protocolId === protocolId && c.date === today.value,
    );
    if (!completion)
      return;

    await db.dailyCompletions.delete(completion.id);
    completions.value = completions.value.filter(c => c.id !== completion.id);
  }

  // Toggle completion status
  async function toggleCompletion(protocolId: string) {
    if (isCompletedToday(protocolId)) {
      await uncompleteProtocol(protocolId);
    }
    else {
      await completeProtocol(protocolId);
    }
  }

  // Calculate streak for a protocol
  async function getStreak(protocolId: string): Promise<number> {
    if (import.meta.server)
      return 0;

    const protocol = todaysProtocols.value.find(p => p.id === protocolId);
    if (!protocol)
      return 0;

    // Get all completions for this protocol, sorted by date desc
    const allCompletions = await db.dailyCompletions
      .where('protocolId')
      .equals(protocolId)
      .toArray();

    if (allCompletions.length === 0)
      return 0;

    // Sort by date descending
    const sorted = allCompletions.sort((a, b) => b.date.localeCompare(a.date));

    let streak = 0;
    const checkDate = new Date();

    // For daily protocols, check consecutive days
    if (protocol.duration === 'daily') {
      for (const completion of sorted) {
        const expectedDate = checkDate.toISOString().split('T')[0]!;
        if (completion.date === expectedDate) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
        else if (completion.date < expectedDate) {
          // Gap in streak
          break;
        }
      }
    }
    else {
      // For weekly/monthly, just count total completions
      streak = sorted.length;
    }

    return streak;
  }

  // Get completion rate for last N days
  async function getCompletionRate(protocolId: string, days = 30): Promise<number> {
    if (import.meta.server)
      return 0;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0]!;

    const recentCompletions = await db.dailyCompletions
      .where('protocolId')
      .equals(protocolId)
      .and(c => c.date >= startDateStr)
      .count();

    // For daily protocols, rate is completions / days
    const protocol = todaysProtocols.value.find(p => p.id === protocolId);
    if (!protocol)
      return 0;

    if (protocol.duration === 'daily') {
      return Math.round((recentCompletions / days) * 100);
    }

    // For weekly, rate is completions / weeks
    if (protocol.duration === 'weekly') {
      return Math.round((recentCompletions / (days / 7)) * 100);
    }

    return recentCompletions > 0 ? 100 : 0;
  }

  // Computed: Today's progress
  const progress = computed(() => {
    const total = todaysProtocols.value.length;
    const completed = completions.value.length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return {
    todaysProtocols: readonly(todaysProtocols),
    completions: readonly(completions),
    loading: readonly(loading),
    error: readonly(error),
    today,
    progress,
    loadToday,
    isCompletedToday,
    completeProtocol,
    uncompleteProtocol,
    toggleCompletion,
    getStreak,
    getCompletionRate,
  };
}
