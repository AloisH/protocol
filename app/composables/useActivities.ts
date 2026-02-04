import type { Activity } from '#shared/db/schema';
import { db } from '#shared/db/schema';
import { ActivitySchema } from '#shared/schemas/db';
import { nanoid } from 'nanoid';

export function useActivities() {
  const activities = ref<Activity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadActivities(protocolId?: string) {
    loading.value = true;
    error.value = null;
    try {
      if (protocolId) {
        activities.value = await db.activities
          .where('protocolId')
          .equals(protocolId)
          .toArray();
      }
      else {
        activities.value = await db.activities.toArray();
      }
      // Sort by order
      activities.value.sort((a, b) => a.order - b.order);
    }
    catch (e) {
      error.value = `Failed to load activities: ${String(e)}`;
      console.error(error.value, e);
    }
    finally {
      loading.value = false;
    }
  }

  async function createActivity(
    protocolId: string,
    name: string,
    activityType: 'warmup' | 'exercise' | 'supplement' | 'habit' = 'habit',
    frequency: 'daily' | 'weekly' | string[] = 'daily',
    order: number = 0,
  ) {
    error.value = null;
    try {
      const activity: Activity = {
        id: nanoid(),
        protocolId,
        name,
        activityType,
        frequency,
        order,
      };

      // Validate
      ActivitySchema.parse(activity);

      // Add to DB
      await db.activities.add(activity);

      // Reload
      await loadActivities(protocolId);
      return activity;
    }
    catch (e) {
      error.value = `Failed to create activity: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function updateActivity(id: string, updates: Partial<Activity>) {
    error.value = null;
    try {
      const existing = await db.activities.get(id);
      if (!existing) {
        throw new Error(`Activity ${id} not found`);
      }

      const updated = { ...existing, ...updates };

      // Validate
      ActivitySchema.parse(updated);

      // Update DB
      await db.activities.update(id, updated);

      // Reload
      await loadActivities(existing.protocolId);
      return updated;
    }
    catch (e) {
      error.value = `Failed to update activity: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function deleteActivity(id: string) {
    error.value = null;
    try {
      const activity = await db.activities.get(id);
      await db.activities.delete(id);

      // Delete associated tracking logs
      if (activity) {
        const logsToDelete = await db.trackingLogs
          .where('activityId')
          .equals(id)
          .toArray();
        await Promise.all(logsToDelete.map(async log => db.trackingLogs.delete(log.id)));
        await loadActivities(activity.protocolId);
      }
    }
    catch (e) {
      error.value = `Failed to delete activity: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function reorderActivities(protocolId: string, order: string[]) {
    error.value = null;
    try {
      // Update order for each activity
      await Promise.all(
        order.map(async (id, idx) =>
          db.activities.update(id, { order: idx }),
        ),
      );
      await loadActivities(protocolId);
    }
    catch (e) {
      error.value = `Failed to reorder activities: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  return {
    // State
    activities: readonly(activities),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
  };
}
