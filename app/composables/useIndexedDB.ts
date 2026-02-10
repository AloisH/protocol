import type { ExportData } from '#shared/schemas/export';
import { db } from '#shared/db/schema';
import { ExportDataSchema } from '#shared/schemas/export';

export function useIndexedDB() {
  const dbInfo = ref<{
    tables: string[];
    size?: number;
  }>({
    tables: [],
  });

  async function getDBInfo() {
    try {
      const tables = db.tables.map(t => t.name);
      dbInfo.value = { tables };
      return dbInfo.value;
    }
    catch (e) {
      console.error('Failed to get DB info:', e);
      return dbInfo.value;
    }
  }

  async function getTableStats(tableName: string) {
    try {
      let count = 0;
      let sample: unknown[] = [];

      switch (tableName) {
        case 'protocols':
          count = await db.protocols.count();
          sample = await db.protocols.limit(1).toArray();
          break;
        case 'activities':
          count = await db.activities.count();
          sample = await db.activities.limit(1).toArray();
          break;
        case 'trackingLogs':
          count = await db.trackingLogs.count();
          sample = await db.trackingLogs.limit(1).toArray();
          break;
        case 'settings':
          count = await db.settings.count();
          sample = await db.settings.limit(1).toArray();
          break;
        case 'dailyCompletions':
          count = await db.dailyCompletions.count();
          sample = await db.dailyCompletions.limit(1).toArray();
          break;
        default:
          throw new Error(`Table ${tableName} not found`);
      }

      return { count, sample };
    }
    catch (e) {
      console.error(`Failed to get stats for ${tableName}:`, e);
      return { count: 0, sample: [] };
    }
  }

  async function clearTable(tableName: string) {
    try {
      switch (tableName) {
        case 'protocols':
          await db.protocols.clear();
          break;
        case 'activities':
          await db.activities.clear();
          break;
        case 'trackingLogs':
          await db.trackingLogs.clear();
          break;
        case 'settings':
          await db.settings.clear();
          break;
        case 'dailyCompletions':
          await db.dailyCompletions.clear();
          break;
        default:
          throw new Error(`Table ${tableName} not found`);
      }
      return true;
    }
    catch (e) {
      console.error(`Failed to clear ${tableName}:`, e);
      return false;
    }
  }

  async function clearAllData() {
    try {
      await Promise.all([
        db.protocols.clear(),
        db.activities.clear(),
        db.trackingLogs.clear(),
        db.settings.clear(),
        db.dailyCompletions.clear(),
      ]);
      return true;
    }
    catch (e) {
      console.error('Failed to clear all data:', e);
      return false;
    }
  }

  async function exportData(): Promise<ExportData | null> {
    try {
      const data: ExportData = {
        version: 1,
        exportedAt: new Date(),
        data: {
          protocols: await db.protocols.toArray(),
          activities: await db.activities.toArray() as ExportData['data']['activities'],
          trackingLogs: await db.trackingLogs.toArray() as ExportData['data']['trackingLogs'],
          settings: await db.settings.toArray(),
          dailyCompletions: await db.dailyCompletions.toArray(),
        },
      };
      return data;
    }
    catch (e) {
      console.error('Failed to export data:', e);
      return null;
    }
  }

  function downloadExport(data: ExportData) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function validateImport(data: unknown): { success: true; data: ExportData } | { success: false; error: string } {
    const result = ExportDataSchema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return { success: false, error: issues };
    }
    return { success: true, data: result.data };
  }

  async function importData(
    data: ExportData,
    mode: 'merge' | 'replace' = 'merge',
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await db.transaction('rw', [db.protocols, db.activities, db.trackingLogs, db.settings, db.dailyCompletions], async () => {
        if (mode === 'replace') {
          await Promise.all([
            db.protocols.clear(),
            db.activities.clear(),
            db.trackingLogs.clear(),
            db.settings.clear(),
            db.dailyCompletions.clear(),
          ]);
        }

        const { protocols, activities, trackingLogs, settings, dailyCompletions } = data.data;

        if (mode === 'replace') {
          if (protocols.length)
            await db.protocols.bulkAdd(protocols);
          if (activities.length)
            await db.activities.bulkAdd(activities);
          if (trackingLogs.length)
            await db.trackingLogs.bulkAdd(trackingLogs);
          if (settings.length)
            await db.settings.bulkAdd(settings);
          if (dailyCompletions.length)
            await db.dailyCompletions.bulkAdd(dailyCompletions);
        }
        else {
          // Merge: use bulkPut to upsert
          if (protocols.length)
            await db.protocols.bulkPut(protocols);
          if (activities.length)
            await db.activities.bulkPut(activities);
          if (trackingLogs.length)
            await db.trackingLogs.bulkPut(trackingLogs);
          if (settings.length)
            await db.settings.bulkPut(settings);
          if (dailyCompletions.length)
            await db.dailyCompletions.bulkPut(dailyCompletions);
        }
      });
      return { success: true };
    }
    catch (e) {
      console.error('Failed to import data:', e);
      return { success: false, error: e instanceof Error ? e.message : 'Import failed' };
    }
  }

  async function debugLogAllData() {
    const data = await exportData();
    if (data) {
      console.warn('Database export:', data);
    }
  }

  return {
    dbInfo: readonly(dbInfo),
    getDBInfo,
    getTableStats,
    clearTable,
    clearAllData,
    exportData,
    downloadExport,
    validateImport,
    importData,
    debugLogAllData,
  };
}
