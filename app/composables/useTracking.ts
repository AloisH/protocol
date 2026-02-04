import { db, type TrackingLog } from '~/shared/db/schema'
import { TrackingLogSchema } from '~/shared/schemas/db'
import { nanoid } from 'nanoid'

export function useTracking() {
  const logs = ref<TrackingLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadLogs(exerciseId?: string) {
    loading.value = true
    error.value = null
    try {
      if (exerciseId) {
        logs.value = await db.trackingLogs
          .where('exerciseId')
          .equals(exerciseId)
          .toArray()
      }
      else {
        logs.value = await db.trackingLogs.toArray()
      }
      // Sort by date descending
      logs.value.sort((a, b) => b.date.getTime() - a.date.getTime())
    }
    catch (e) {
      error.value = `Failed to load tracking logs: ${String(e)}`
      console.error(error.value, e)
    }
    finally {
      loading.value = false
    }
  }

  async function logExercise(
    exerciseId: string,
    date: Date,
    data: Partial<TrackingLog> = {},
  ) {
    error.value = null
    try {
      const log: TrackingLog = {
        id: nanoid(),
        exerciseId,
        date,
        completed: data.completed ?? false,
        setsDone: data.setsDone,
        repsDone: data.repsDone,
        weightUsed: data.weightUsed,
        durationTaken: data.durationTaken,
        energyLevel: data.energyLevel,
        difficultyFelt: data.difficultyFelt,
        notes: data.notes,
      }

      // Validate
      TrackingLogSchema.parse(log)

      // Add to DB
      await db.trackingLogs.add(log)

      // Reload
      await loadLogs(exerciseId)
      return log
    }
    catch (e) {
      error.value = `Failed to log exercise: ${String(e)}`
      console.error(error.value, e)
      throw e
    }
  }

  async function updateLog(id: string, updates: Partial<TrackingLog>) {
    error.value = null
    try {
      const existing = await db.trackingLogs.get(id)
      if (!existing) {
        throw new Error(`Log ${id} not found`)
      }

      const updated = { ...existing, ...updates }

      // Validate
      TrackingLogSchema.parse(updated)

      // Update DB
      await db.trackingLogs.update(id, updated)

      // Reload
      await loadLogs(existing.exerciseId)
      return updated
    }
    catch (e) {
      error.value = `Failed to update log: ${String(e)}`
      console.error(error.value, e)
      throw e
    }
  }

  async function deleteLog(id: string) {
    error.value = null
    try {
      const log = await db.trackingLogs.get(id)
      await db.trackingLogs.delete(id)
      if (log) {
        await loadLogs(log.exerciseId)
      }
    }
    catch (e) {
      error.value = `Failed to delete log: ${String(e)}`
      console.error(error.value, e)
      throw e
    }
  }

  async function getLogsForDate(exerciseId: string, date: Date) {
    try {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      return await db.trackingLogs
        .where('exerciseId')
        .equals(exerciseId)
        .filter(log => log.date >= dayStart && log.date <= dayEnd)
        .toArray()
    }
    catch (e) {
      console.error('Failed to get logs for date:', e)
      return []
    }
  }

  async function getProgressByExercise(
    exerciseId: string,
    days: number = 30,
  ): Promise<TrackingLog[]> {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      return await db.trackingLogs
        .where('exerciseId')
        .equals(exerciseId)
        .filter(log => log.date >= since)
        .toArray()
    }
    catch (e) {
      console.error('Failed to get progress:', e)
      return []
    }
  }

  const completionRate = computed(() => {
    if (logs.value.length === 0) return 0
    const completed = logs.value.filter(log => log.completed).length
    return Math.round((completed / logs.value.length) * 100)
  })

  const recentLogs = computed(() => {
    return logs.value.slice(0, 10)
  })

  return {
    // State
    logs: readonly(logs),
    loading: readonly(loading),
    error: readonly(error),
    completionRate,
    recentLogs,

    // Methods
    loadLogs,
    logExercise,
    updateLog,
    deleteLog,
    getLogsForDate,
    getProgressByExercise,
  }
}
