import { db } from '#shared/db/schema';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from './useSession';

vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }));

const TEST_DATE = '2024-06-15';

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

async function seedActivity(overrides: Record<string, unknown> = {}) {
  const activity = {
    id: 'a1',
    protocolId: 'p1',
    name: 'Push-ups',
    activityType: 'exercise' as const,
    order: 0,
    sets: 3,
    reps: 10,
    weight: 20,
    ...overrides,
  };
  await db.activities.add(activity);
  return activity;
}

async function seedTrackingLog(overrides: Record<string, unknown> = {}) {
  const date = new Date(TEST_DATE);
  date.setHours(12, 0, 0, 0);
  const log = {
    id: 'log1',
    activityId: 'a1',
    date,
    completed: true,
    setsDone: 3,
    repsDone: 8,
    weightUsed: 25,
    ...overrides,
  };
  await db.trackingLogs.add(log);
  return log;
}

describe('useSession', () => {
  beforeEach(async () => {
    await db.protocols.clear();
    await db.activities.clear();
    await db.trackingLogs.clear();
    await db.dailyCompletions.clear();
  });

  describe('initSession', () => {
    it('sets protocolId, sessionDate, resets state', async () => {
      const { initSession, protocolId, sessionDate, activityLogs, sessionNotes, sessionRating } = useSession();

      await initSession('p1', TEST_DATE);

      expect(protocolId.value).toBe('p1');
      expect(sessionDate.value).toBe(TEST_DATE);
      expect(activityLogs.value.size).toBe(0);
      expect(sessionNotes.value).toBe('');
      expect(sessionRating.value).toBeUndefined();
    });
  });

  describe('loadExistingSession', () => {
    it('initializes empty logs with activity defaults', async () => {
      await seedProtocol();
      await seedActivity({ sets: 4, reps: 12, weight: 30, duration: 60 });

      const { initSession, activityLogs } = useSession();
      await initSession('p1', TEST_DATE);

      const log = activityLogs.value.get('a1');
      expect(log).toBeDefined();
      expect(log!.completed).toBe(false);
      expect(log!.setsDone).toBe(4);
      expect(log!.repsDone).toBe(12);
      expect(log!.weightUsed).toBe(30);
      expect(log!.durationTaken).toBe(60);
    });

    it('restores existing tracking logs from DB', async () => {
      await seedProtocol();
      await seedActivity();
      await seedTrackingLog({ completed: true, setsDone: 2, repsDone: 15, weightUsed: 40 });

      const { initSession, activityLogs } = useSession();
      await initSession('p1', TEST_DATE);

      const log = activityLogs.value.get('a1');
      expect(log!.completed).toBe(true);
      expect(log!.setsDone).toBe(2);
      expect(log!.repsDone).toBe(15);
      expect(log!.weightUsed).toBe(40);
    });

    it('restores completion notes and rating', async () => {
      await seedProtocol();
      await db.dailyCompletions.add({
        id: 'dc1',
        protocolId: 'p1',
        date: TEST_DATE,
        completedAt: new Date(),
        notes: 'Great session',
        rating: 4,
      });

      const { initSession, sessionNotes, sessionRating } = useSession();
      await initSession('p1', TEST_DATE);

      expect(sessionNotes.value).toBe('Great session');
      expect(sessionRating.value).toBe(4);
    });

    it('initializes dosesCompleted for supplement activities', async () => {
      await seedProtocol();
      await seedActivity({
        id: 'supp1',
        activityType: 'supplement',
        doses: [
          { dosage: 500, dosageUnit: 'mg', timeOfDay: 'morning' },
          { dosage: 500, dosageUnit: 'mg', timeOfDay: 'evening' },
        ],
        sets: undefined,
        reps: undefined,
        weight: undefined,
      });

      const { initSession, activityLogs } = useSession();
      await initSession('p1', TEST_DATE);

      const log = activityLogs.value.get('supp1');
      expect(log!.dosesCompleted).toEqual([false, false]);
    });
  });

  describe('updateActivityLog', () => {
    it('partial updates to existing log', async () => {
      await seedProtocol();
      await seedActivity();

      const { initSession, updateActivityLog, activityLogs } = useSession();
      await initSession('p1', TEST_DATE);

      updateActivityLog('a1', { setsDone: 5, notes: 'Felt strong' });

      const log = activityLogs.value.get('a1');
      expect(log!.setsDone).toBe(5);
      expect(log!.notes).toBe('Felt strong');
      // Unchanged defaults preserved
      expect(log!.repsDone).toBe(10);
    });

    it('creates log if none exists', () => {
      const { updateActivityLog, activityLogs } = useSession();

      updateActivityLog('new-activity', { completed: true, setsDone: 3 });

      const log = activityLogs.value.get('new-activity');
      expect(log).toBeDefined();
      expect(log!.completed).toBe(true);
      expect(log!.setsDone).toBe(3);
    });
  });

  describe('toggleActivity', () => {
    it('flips completed and sets all doses to match', async () => {
      await seedProtocol();
      await seedActivity({
        id: 'supp1',
        activityType: 'supplement',
        doses: [{ dosage: 500 }, { dosage: 500 }],
      });

      const { initSession, toggleActivity, activityLogs } = useSession();
      await initSession('p1', TEST_DATE);

      // Initially not completed
      expect(activityLogs.value.get('supp1')!.completed).toBe(false);
      expect(activityLogs.value.get('supp1')!.dosesCompleted).toEqual([false, false]);

      toggleActivity('supp1');

      expect(activityLogs.value.get('supp1')!.completed).toBe(true);
      expect(activityLogs.value.get('supp1')!.dosesCompleted).toEqual([true, true]);

      // Toggle back
      toggleActivity('supp1');
      expect(activityLogs.value.get('supp1')!.completed).toBe(false);
      expect(activityLogs.value.get('supp1')!.dosesCompleted).toEqual([false, false]);
    });
  });

  describe('toggleDose', () => {
    it('flips individual dose, sets completed when all done', async () => {
      await seedProtocol();
      await seedActivity({
        id: 'supp1',
        activityType: 'supplement',
        doses: [{ dosage: 500 }, { dosage: 500 }],
      });

      const { initSession, toggleDose, activityLogs } = useSession();
      await initSession('p1', TEST_DATE);

      toggleDose('supp1', 0);
      expect(activityLogs.value.get('supp1')!.dosesCompleted).toEqual([true, false]);
      expect(activityLogs.value.get('supp1')!.completed).toBe(false);

      toggleDose('supp1', 1);
      expect(activityLogs.value.get('supp1')!.dosesCompleted).toEqual([true, true]);
      expect(activityLogs.value.get('supp1')!.completed).toBe(true);
    });

    it('no-op for invalid index', async () => {
      await seedProtocol();
      await seedActivity({
        id: 'supp1',
        activityType: 'supplement',
        doses: [{ dosage: 500 }],
      });

      const { initSession, toggleDose, activityLogs } = useSession();
      await initSession('p1', TEST_DATE);

      toggleDose('supp1', 5); // out of bounds
      expect(activityLogs.value.get('supp1')!.dosesCompleted).toEqual([false]);
    });
  });

  describe('saveSession', () => {
    it('persists tracking logs and daily completion to DB', async () => {
      await seedProtocol();
      await seedActivity();

      const { initSession, updateActivityLog, saveSession, sessionNotes, sessionRating } = useSession();
      await initSession('p1', TEST_DATE);

      updateActivityLog('a1', { completed: true, setsDone: 3, repsDone: 10 });
      sessionNotes.value = 'Good workout';
      sessionRating.value = 5;

      const result = await saveSession();
      expect(result).toBe(true);

      // Verify tracking log in DB
      const logs = await db.trackingLogs.where('activityId').equals('a1').toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.completed).toBe(true);
      expect(logs[0]!.setsDone).toBe(3);

      // Verify daily completion in DB
      const completions = await db.dailyCompletions.where('protocolId').equals('p1').toArray();
      expect(completions).toHaveLength(1);
      expect(completions[0]!.notes).toBe('Good workout');
      expect(completions[0]!.rating).toBe(5);
    });

    it('updates existing logs (idempotent)', async () => {
      await seedProtocol();
      await seedActivity();

      const { initSession, updateActivityLog, saveSession } = useSession();
      await initSession('p1', TEST_DATE);

      updateActivityLog('a1', { completed: true });
      await saveSession();

      // Save again with updated data
      updateActivityLog('a1', { setsDone: 99 });
      await saveSession();

      // Should still be 1 log, not 2
      const logs = await db.trackingLogs.where('activityId').equals('a1').toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.setsDone).toBe(99);

      const completions = await db.dailyCompletions.where('protocolId').equals('p1').toArray();
      expect(completions).toHaveLength(1);
    });
  });

  describe('completedCount / totalCount', () => {
    it('computed correctness', async () => {
      await seedProtocol();
      await seedActivity({ id: 'a1' });
      await seedActivity({ id: 'a2', name: 'Squats' });
      await seedActivity({ id: 'a3', name: 'Planks' });

      const { initSession, toggleActivity, completedCount, totalCount } = useSession();
      await initSession('p1', TEST_DATE);

      expect(totalCount.value).toBe(3);
      expect(completedCount.value).toBe(0);

      toggleActivity('a1');
      toggleActivity('a2');

      expect(completedCount.value).toBe(2);
      expect(totalCount.value).toBe(3);
    });
  });
});
