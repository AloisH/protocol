import type { ActivityGroup } from '#shared/db/schema';
import { db } from '#shared/db/schema';
import { ActivityGroupSchema } from '#shared/schemas/db';
import { nanoid } from 'nanoid';

export function useActivityGroups() {
  const groups = ref<ActivityGroup[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadGroups(protocolId: string) {
    loading.value = true;
    error.value = null;
    try {
      groups.value = await db.activityGroups
        .where('protocolId')
        .equals(protocolId)
        .sortBy('order');
    }
    catch (e) {
      error.value = `Failed to load groups: ${String(e)}`;
      console.error(error.value, e);
    }
    finally {
      loading.value = false;
    }
  }

  async function createGroup(protocolId: string, name: string) {
    error.value = null;
    try {
      const maxOrder = groups.value.length > 0
        ? Math.max(...groups.value.map(g => g.order)) + 1
        : 0;

      const group: ActivityGroup = {
        id: nanoid(),
        protocolId,
        name,
        order: maxOrder,
      };

      ActivityGroupSchema.parse(group);
      await db.activityGroups.add(group);
      await loadGroups(protocolId);
      return group;
    }
    catch (e) {
      error.value = `Failed to create group: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function updateGroup(id: string, updates: Partial<Pick<ActivityGroup, 'name' | 'order'>>) {
    error.value = null;
    try {
      const existing = await db.activityGroups.get(id);
      if (!existing)
        throw new Error(`Group ${id} not found`);

      const updated = { ...existing, ...updates };
      ActivityGroupSchema.parse(updated);
      await db.activityGroups.update(id, updates);
      await loadGroups(existing.protocolId);
      return updated;
    }
    catch (e) {
      error.value = `Failed to update group: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function deleteGroup(id: string) {
    error.value = null;
    try {
      const group = await db.activityGroups.get(id);
      if (!group)
        return;

      // Cascade: delete activities in group + their tracking logs
      const activities = await db.activities
        .where('groupId')
        .equals(id)
        .toArray();

      for (const activity of activities) {
        await db.trackingLogs
          .where('activityId')
          .equals(activity.id)
          .delete();
      }
      await db.activities
        .where('groupId')
        .equals(id)
        .delete();

      await db.activityGroups.delete(id);
      await loadGroups(group.protocolId);
    }
    catch (e) {
      error.value = `Failed to delete group: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function reorderGroups(protocolId: string, orderedIds: string[]) {
    error.value = null;
    try {
      await Promise.all(
        orderedIds.map(async (id, idx) => db.activityGroups.update(id, { order: idx })),
      );
      await loadGroups(protocolId);
    }
    catch (e) {
      error.value = `Failed to reorder groups: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  return {
    groups: readonly(groups),
    loading: readonly(loading),
    error: readonly(error),
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
  };
}
