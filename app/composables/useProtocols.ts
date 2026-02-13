import type { Protocol } from '#shared/db/schema';
import { db } from '#shared/db/schema';
import { ProtocolSchema } from '#shared/schemas/db';
import { nanoid } from 'nanoid';

export function useProtocols() {
  const protocols = ref<Protocol[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadProtocols() {
    loading.value = true;
    error.value = null;
    try {
      protocols.value = await db.protocols.toArray();
    }
    catch (e) {
      error.value = `Failed to load protocols: ${String(e)}`;
      console.error(error.value, e);
    }
    finally {
      loading.value = false;
    }
  }

  async function createProtocol(
    name: string,
    description: string,
    duration: Protocol['duration'] = 'daily',
    category: string = 'general',
    scheduleDays?: Protocol['scheduleDays'],
  ) {
    error.value = null;
    try {
      const protocol: Protocol = {
        id: nanoid(),
        name,
        description,
        duration,
        category,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(scheduleDays?.length ? { scheduleDays } : {}),
      };

      // Validate
      ProtocolSchema.parse(protocol);

      // Add to DB
      await db.protocols.add(protocol);

      // Reload
      await loadProtocols();
      return protocol;
    }
    catch (e) {
      error.value = `Failed to create protocol: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function updateProtocol(id: string, updates: Partial<Protocol>) {
    error.value = null;
    try {
      const existing = await db.protocols.get(id);
      if (!existing) {
        throw new Error(`Protocol ${id} not found`);
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      // Validate
      ProtocolSchema.parse(updated);

      // Update DB
      await db.protocols.update(id, updated);

      // Reload
      await loadProtocols();
      return updated;
    }
    catch (e) {
      error.value = `Failed to update protocol: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function deleteProtocol(id: string) {
    error.value = null;
    try {
      await db.transaction('rw', [db.protocols, db.activities, db.activityGroups, db.trackingLogs, db.dailyCompletions], async () => {
        const activityIds = await db.activities
          .where('protocolId')
          .equals(id)
          .primaryKeys();

        if (activityIds.length > 0) {
          await db.trackingLogs
            .where('activityId')
            .anyOf(activityIds)
            .delete();
        }

        await db.activities.where('protocolId').equals(id).delete();
        await db.activityGroups.where('protocolId').equals(id).delete();
        await db.dailyCompletions.where('protocolId').equals(id).delete();
        await db.protocols.delete(id);
      });
      await loadProtocols();
    }
    catch (e) {
      error.value = `Failed to delete protocol: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  async function getProtocolById(id: string): Promise<Protocol | undefined> {
    try {
      return await db.protocols.get(id);
    }
    catch (e) {
      console.error(`Failed to get protocol ${id}:`, e);
      return undefined;
    }
  }

  async function archiveProtocol(id: string) {
    return updateProtocol(id, { status: 'completed' });
  }

  async function pauseProtocol(id: string) {
    return updateProtocol(id, { status: 'paused' });
  }

  async function resumeProtocol(id: string) {
    return updateProtocol(id, { status: 'active' });
  }

  return {
    // State
    protocols: readonly(protocols),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadProtocols,
    createProtocol,
    updateProtocol,
    deleteProtocol,
    getProtocolById,
    archiveProtocol,
    pauseProtocol,
    resumeProtocol,
  };
}
