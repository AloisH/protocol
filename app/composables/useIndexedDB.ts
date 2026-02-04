import { db } from '~/shared/db/schema'

export function useIndexedDB() {
  const dbInfo = ref<{
    tables: string[]
    size?: number
  }>({
    tables: [],
  })

  async function getDBInfo() {
    try {
      const tables = db.tables.map(t => t.name)
      dbInfo.value = { tables }
      return dbInfo.value
    }
    catch (e) {
      console.error('Failed to get DB info:', e)
      return dbInfo.value
    }
  }

  async function getTableStats(tableName: string) {
    try {
      let count = 0
      let sample: unknown[] = []

      switch (tableName) {
        case 'protocols':
          count = await db.protocols.count()
          sample = await db.protocols.limit(1).toArray()
          break
        case 'routines':
          count = await db.routines.count()
          sample = await db.routines.limit(1).toArray()
          break
        case 'exercises':
          count = await db.exercises.count()
          sample = await db.exercises.limit(1).toArray()
          break
        case 'trackingLogs':
          count = await db.trackingLogs.count()
          sample = await db.trackingLogs.limit(1).toArray()
          break
        case 'settings':
          count = await db.settings.count()
          sample = await db.settings.limit(1).toArray()
          break
        default:
          throw new Error(`Table ${tableName} not found`)
      }

      return { count, sample }
    }
    catch (e) {
      console.error(`Failed to get stats for ${tableName}:`, e)
      return { count: 0, sample: [] }
    }
  }

  async function clearTable(tableName: string) {
    try {
      switch (tableName) {
        case 'protocols':
          await db.protocols.clear()
          break
        case 'routines':
          await db.routines.clear()
          break
        case 'exercises':
          await db.exercises.clear()
          break
        case 'trackingLogs':
          await db.trackingLogs.clear()
          break
        case 'settings':
          await db.settings.clear()
          break
        default:
          throw new Error(`Table ${tableName} not found`)
      }
      return true
    }
    catch (e) {
      console.error(`Failed to clear ${tableName}:`, e)
      return false
    }
  }

  async function clearAllData() {
    try {
      await Promise.all([
        db.protocols.clear(),
        db.routines.clear(),
        db.exercises.clear(),
        db.trackingLogs.clear(),
        db.settings.clear(),
      ])
      return true
    }
    catch (e) {
      console.error('Failed to clear all data:', e)
      return false
    }
  }

  async function exportData() {
    try {
      const data = {
        protocols: await db.protocols.toArray(),
        routines: await db.routines.toArray(),
        exercises: await db.exercises.toArray(),
        trackingLogs: await db.trackingLogs.toArray(),
        settings: await db.settings.toArray(),
      }
      return data
    }
    catch (e) {
      console.error('Failed to export data:', e)
      return null
    }
  }

  async function importData(data: {
    protocols?: unknown[]
    routines?: unknown[]
    exercises?: unknown[]
    trackingLogs?: unknown[]
    settings?: unknown[]
  }) {
    try {
      await db.transaction('rw', db.protocols, db.routines, db.exercises, db.trackingLogs, db.settings, async () => {
        if (data.protocols?.length)
          await db.protocols.bulkAdd(data.protocols)
        if (data.routines?.length)
          await db.routines.bulkAdd(data.routines)
        if (data.exercises?.length)
          await db.exercises.bulkAdd(data.exercises)
        if (data.trackingLogs?.length)
          await db.trackingLogs.bulkAdd(data.trackingLogs)
        if (data.settings?.length)
          await db.settings.bulkAdd(data.settings)
      })
      return true
    }
    catch (e) {
      console.error('Failed to import data:', e)
      return false
    }
  }

  // Debug: log all data to console
  async function debugLogAllData() {
    const data = await exportData()
    if (data) {
      console.table(data)
      console.log('Full data export:', JSON.stringify(data, null, 2))
    }
  }

  return {
    dbInfo: readonly(dbInfo),
    getDBInfo,
    getTableStats,
    clearTable,
    clearAllData,
    exportData,
    importData,
    debugLogAllData,
  }
}
