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
    order: number = 0,
  ) {
    error.value = null;
    try {
      const activity: Activity = {
        id: nanoid(),
        protocolId,
        name,
        activityType,
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

  async function reorderActivities(protocolId: string, order: string[], groupId?: string) {
    error.value = null;
    try {
      await Promise.all(
        order.map(async (id, idx) =>
          db.activities.update(id, { order: idx, groupId: groupId ?? undefined }),
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

  let reloadTimer: ReturnType<typeof setTimeout> | null = null;

  /** Persist order + groupId to DB, then debounced reload to sync state */
  async function persistOrder(protocolId: string, items: { id: string }[], groupId: string | undefined) {
    try {
      await db.transaction('rw', db.activities, async () => {
        for (let i = 0; i < items.length; i++) {
          const itemId = items[i]!.id;
          if (groupId !== undefined) {
            await db.activities.update(itemId, { order: i, groupId });
          }
          else {
            await db.activities.update(itemId, { order: i });
            await db.activities.where('id').equals(itemId).modify({ groupId: undefined });
          }
        }
      });
      // Debounced reload — both source & target call persistOrder,
      // single reload fires after both complete
      if (reloadTimer) {
        clearTimeout(reloadTimer);
      }
      reloadTimer = setTimeout(() => {
        void loadActivities(protocolId).then(() => {
          reloadTimer = null;
        });
      }, 300);
    }
    catch (e) {
      console.error('Failed to persist order:', e);
      await loadActivities(protocolId);
    }
  }

  async function moveToGroup(activityId: string, groupId: string | undefined) {
    error.value = null;
    try {
      const activity = await db.activities.get(activityId);
      if (!activity)
        throw new Error(`Activity ${activityId} not found`);
      await db.activities.update(activityId, { groupId });
      await loadActivities(activity.protocolId);
    }
    catch (e) {
      error.value = `Failed to move activity: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  const ungroupedActivities = computed(() => {
    return activities.value.filter(a => !a.groupId);
  });

  // Memoized map — returns stable array references while activities ref unchanged,
  // preventing watchers from resetting local drag state on parent re-render
  const groupedActivitiesMap = computed(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities.value) {
      if (a.groupId) {
        const list = map.get(a.groupId);
        if (list) {
          list.push(a);
        }
        else {
          map.set(a.groupId, [a]);
        }
      }
    }
    return map;
  });

  const EMPTY_ACTIVITIES: Activity[] = [];

  function activitiesForGroup(groupId: string) {
    return groupedActivitiesMap.value.get(groupId) ?? EMPTY_ACTIVITIES;
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
    persistOrder,
    moveToGroup,

    // Grouped
    ungroupedActivities,
    activitiesForGroup,
  };
}
