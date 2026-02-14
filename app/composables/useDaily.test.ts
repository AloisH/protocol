import { db } from '#shared/db/schema';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDaily } from './useDaily';

vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }));

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
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

async function seedCompletion(protocolId: string, date?: string) {
  const completion = {
    id: `c-${protocolId}-${date ?? todayStr()}`,
    protocolId,
    date: date ?? todayStr(),
    completedAt: new Date(),
  };
  await db.dailyCompletions.add(completion);
  return completion;
}

describe('useDaily', () => {
  beforeEach(async () => {
    await db.protocols.clear();
    await db.dailyCompletions.clear();
  });

  describe('loadToday', () => {
    it('loads scheduled protocols + completions', async () => {
      await seedProtocol();
      await seedCompletion('p1');

      const { loadToday, todaysProtocols, completions } = useDaily();
      await loadToday();

      expect(todaysProtocols.value).toHaveLength(1);
      expect(completions.value).toHaveLength(1);
    });

    it('filters out non-scheduled protocols', async () => {
      // Weekly protocol — only scheduled on Monday
      await seedProtocol({ id: 'p-weekly', duration: 'weekly' });

      const { loadToday, todaysProtocols } = useDaily();
      await loadToday();

      const today = new Date();
      if (today.getDay() === 1) {
        expect(todaysProtocols.value).toHaveLength(1);
      }
      else {
        expect(todaysProtocols.value).toHaveLength(0);
      }
    });

    it('excludes inactive protocols', async () => {
      await seedProtocol({ id: 'paused', status: 'paused' });

      const { loadToday, todaysProtocols } = useDaily();
      await loadToday();

      expect(todaysProtocols.value).toHaveLength(0);
    });
  });

  describe('completeProtocol', () => {
    it('adds completion to DB and state', async () => {
      await seedProtocol();
      const { loadToday, completeProtocol, completions } = useDaily();
      await loadToday();

      await completeProtocol('p1');

      expect(completions.value).toHaveLength(1);
      expect(completions.value[0]?.protocolId).toBe('p1');

      // Verify in DB
      const dbCompletions = await db.dailyCompletions.where('protocolId').equals('p1').toArray();
      expect(dbCompletions).toHaveLength(1);
    });

    it('does not duplicate completion', async () => {
      await seedProtocol();
      const { loadToday, completeProtocol, completions } = useDaily();
      await loadToday();

      await completeProtocol('p1');
      await completeProtocol('p1'); // duplicate

      expect(completions.value).toHaveLength(1);
    });
  });

  describe('uncompleteProtocol', () => {
    it('removes completion from DB and state', async () => {
      await seedProtocol();
      await seedCompletion('p1');

      const { loadToday, uncompleteProtocol, completions } = useDaily();
      await loadToday();
      expect(completions.value).toHaveLength(1);

      await uncompleteProtocol('p1');

      expect(completions.value).toHaveLength(0);
      const dbCount = await db.dailyCompletions.where('protocolId').equals('p1').count();
      expect(dbCount).toBe(0);
    });

    it('no-op if not completed', async () => {
      await seedProtocol();
      const { loadToday, uncompleteProtocol, completions } = useDaily();
      await loadToday();

      await uncompleteProtocol('p1');
      expect(completions.value).toHaveLength(0);
    });
  });

  describe('toggleCompletion', () => {
    it('completes when uncompleted', async () => {
      await seedProtocol();
      const { loadToday, toggleCompletion, completions } = useDaily();
      await loadToday();

      await toggleCompletion('p1');
      expect(completions.value).toHaveLength(1);
    });

    it('uncompletes when completed', async () => {
      await seedProtocol();
      await seedCompletion('p1');

      const { loadToday, toggleCompletion, completions } = useDaily();
      await loadToday();

      await toggleCompletion('p1');
      expect(completions.value).toHaveLength(0);
    });
  });

  describe('isCompletedToday', () => {
    it('returns true when completed', async () => {
      await seedProtocol();
      await seedCompletion('p1');

      const { loadToday, isCompletedToday } = useDaily();
      await loadToday();

      expect(isCompletedToday('p1')).toBe(true);
    });

    it('returns false when not completed', async () => {
      await seedProtocol();
      const { loadToday, isCompletedToday } = useDaily();
      await loadToday();

      expect(isCompletedToday('p1')).toBe(false);
    });
  });

  describe('progress', () => {
    it('computes percentage', async () => {
      await seedProtocol({ id: 'p1' });
      await seedProtocol({ id: 'p2', name: 'Second' });
      await seedCompletion('p1');

      const { loadToday, progress } = useDaily();
      await loadToday();

      expect(progress.value.total).toBe(2);
      expect(progress.value.completed).toBe(1);
      expect(progress.value.percentage).toBe(50);
    });

    it('returns 0 when no protocols', async () => {
      const { loadToday, progress } = useDaily();
      await loadToday();

      expect(progress.value.percentage).toBe(0);
    });
  });

  describe('getStreak', () => {
    it('returns streak from completions', async () => {
      await seedProtocol();
      await seedCompletion('p1', todayStr());

      const { loadToday, getStreak } = useDaily();
      await loadToday();

      const streak = await getStreak('p1');
      expect(streak).toBe(1);
    });

    it('returns 0 for unknown protocol', async () => {
      const { loadToday, getStreak } = useDaily();
      await loadToday();

      const streak = await getStreak('nonexistent');
      expect(streak).toBe(0);
    });
  });

  describe('getCompletionRate', () => {
    it('calculates daily rate', async () => {
      await seedProtocol();
      // Complete today
      await seedCompletion('p1', todayStr());

      const { loadToday, getCompletionRate } = useDaily();
      await loadToday();

      const rate = await getCompletionRate('p1', 30);
      // 1 completion / 30 days
      expect(rate).toBe(Math.round((1 / 30) * 100));
    });

    it('calculates weekly rate', async () => {
      await seedProtocol({ id: 'pw', duration: 'weekly' });
      await seedCompletion('pw', todayStr());

      const { loadToday, getCompletionRate } = useDaily();
      await loadToday();

      // Only works if today is Monday (protocol loaded into todaysProtocols)
      if (new Date().getDay() === 1) {
        const rate = await getCompletionRate('pw', 28);
        // 1 completion / 4 weeks
        expect(rate).toBe(25);
      }
    });

    it('calculates custom scheduleDays rate', async () => {
      const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
      const todayDay = dayMap[new Date().getDay()]!;

      await seedProtocol({ id: 'pc', duration: 'custom', scheduleDays: [todayDay] });
      await seedCompletion('pc', todayStr());

      const { loadToday, getCompletionRate } = useDaily();
      await loadToday();

      const rate = await getCompletionRate('pc', 7);
      // 1 completion / 1 scheduled day in 7 days
      expect(rate).toBe(100);
    });

    it('returns 0 for unknown protocol', async () => {
      const { loadToday, getCompletionRate } = useDaily();
      await loadToday();

      expect(await getCompletionRate('nonexistent')).toBe(0);
    });
  });
});
