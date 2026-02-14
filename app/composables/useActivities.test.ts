import { db } from '#shared/db/schema';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useActivities } from './useActivities';

vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }));

async function seedActivity(overrides: Record<string, unknown> = {}) {
  const activity = {
    id: 'a1',
    protocolId: 'p1',
    name: 'Test Activity',
    activityType: 'habit' as const,
    order: 0,
    ...overrides,
  };
  await db.activities.add(activity);
  return activity;
}

describe('useActivities', () => {
  beforeEach(async () => {
    await db.activities.clear();
    await db.trackingLogs.clear();
  });

  describe('loadActivities', () => {
    it('loads all activities', async () => {
      await seedActivity({ id: 'a1', order: 1 });
      await seedActivity({ id: 'a2', name: 'Second', order: 0 });

      const { loadActivities, activities } = useActivities();
      await loadActivities();

      expect(activities.value).toHaveLength(2);
      // Sorted by order
      expect(activities.value[0]!.id).toBe('a2');
      expect(activities.value[1]!.id).toBe('a1');
    });

    it('filters by protocolId', async () => {
      await seedActivity({ id: 'a1', protocolId: 'p1' });
      await seedActivity({ id: 'a2', protocolId: 'p2', name: 'Other' });

      const { loadActivities, activities } = useActivities();
      await loadActivities('p1');

      expect(activities.value).toHaveLength(1);
      expect(activities.value[0]!.protocolId).toBe('p1');
    });
  });

  describe('createActivity', () => {
    it('creates and reloads', async () => {
      const { createActivity, activities } = useActivities();
      const activity = await createActivity('p1', 'Push-ups', 'exercise');

      expect(activity.name).toBe('Push-ups');
      expect(activity.activityType).toBe('exercise');
      expect(activities.value).toHaveLength(1);

      // Verify in DB
      const dbActivity = await db.activities.get('test-id-123');
      expect(dbActivity?.name).toBe('Push-ups');
    });

    it('validates via Zod schema', async () => {
      const { createActivity, error } = useActivities();

      await expect(createActivity('p1', '', 'habit')).rejects.toThrow();
      expect(error.value).toBeTruthy();
    });
  });

  describe('updateActivity', () => {
    it('updates and reloads', async () => {
      await seedActivity();

      const { loadActivities, updateActivity, activities } = useActivities();
      await loadActivities('p1');

      await updateActivity('a1', { name: 'Updated Name' });

      expect(activities.value[0]!.name).toBe('Updated Name');
    });

    it('throws for nonexistent activity', async () => {
      const { updateActivity } = useActivities();
      await expect(updateActivity('nonexistent', { name: 'X' })).rejects.toThrow('not found');
    });
  });

  describe('deleteActivity', () => {
    it('removes activity and associated tracking logs', async () => {
      await seedActivity();
      await db.trackingLogs.add({
        id: 'log1',
        activityId: 'a1',
        date: new Date(),
        completed: true,
      });

      const { deleteActivity } = useActivities();
      await deleteActivity('a1');

      expect(await db.activities.get('a1')).toBeUndefined();
      expect(await db.trackingLogs.get('log1')).toBeUndefined();
    });
  });

  describe('reorderActivities', () => {
    it('updates order and groupId', async () => {
      await seedActivity({ id: 'a1', order: 0 });
      await seedActivity({ id: 'a2', name: 'Second', order: 1 });

      const { reorderActivities, activities } = useActivities();
      await reorderActivities('p1', ['a2', 'a1'], 'group-1');

      // Verify DB
      const a2 = await db.activities.get('a2');
      const a1 = await db.activities.get('a1');
      expect(a2?.order).toBe(0);
      expect(a1?.order).toBe(1);
      expect(a2?.groupId).toBe('group-1');

      // Activities reloaded and sorted
      expect(activities.value[0]!.id).toBe('a2');
    });
  });

  describe('moveToGroup', () => {
    it('moves activity to group', async () => {
      await seedActivity();

      const { moveToGroup, activities } = useActivities();
      await moveToGroup('a1', 'new-group');

      const updated = await db.activities.get('a1');
      expect(updated?.groupId).toBe('new-group');
      expect(activities.value[0]!.groupId).toBe('new-group');
    });

    it('removes from group with undefined', async () => {
      await seedActivity({ groupId: 'old-group' });

      const { moveToGroup } = useActivities();
      await moveToGroup('a1', undefined);

      const updated = await db.activities.get('a1');
      expect(updated?.groupId).toBeUndefined();
    });

    it('throws for nonexistent activity', async () => {
      const { moveToGroup } = useActivities();
      await expect(moveToGroup('nonexistent', 'g1')).rejects.toThrow('not found');
    });
  });
});
