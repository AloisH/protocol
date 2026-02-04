import { db, type TrackingLog } from '~/shared/db/schema'

export interface CompletionMetrics {
  total: number
  completed: number
  rate: number
  streak: number
}

export interface ProgressMetrics {
  averageWeight?: number
  totalReps?: number
  averageEnergy?: number
  averageDifficulty?: number
  trend: 'improving' | 'stable' | 'declining'
}

export function useAnalytics() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function getCompletionMetrics(
    exerciseId: string,
    days: number = 30,
  ): Promise<CompletionMetrics> {
    loading.value = true
    error.value = null
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const allLogs: TrackingLog[] = []
      // @ts-ignore Dexie type resolution issue
      const query = await db.trackingLogs.where('exerciseId').equals(exerciseId)
      // @ts-ignore Dexie type resolution issue
      for (const log of await query.toArray()) {
        const logDate = log instanceof Object && 'date' in log ? (log as TrackingLog).date : new Date()
        if (logDate >= since) {
          allLogs.push(log as TrackingLog)
        }
      }

      const completed = allLogs.filter((log: TrackingLog) => log.completed).length
      const total = allLogs.length
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0

      // Calculate streak
      let streak = 0
      const sorted = [...allLogs].sort((a: TrackingLog, b: TrackingLog) => b.date.getTime() - a.date.getTime())
      for (const log of sorted) {
        if (log.completed) streak++
        else break
      }

      return { total, completed, rate, streak }
    }
    catch (e) {
      error.value = `Failed to get completion metrics: ${String(e)}`
      console.error(error.value, e)
      return { total: 0, completed: 0, rate: 0, streak: 0 }
    }
    finally {
      loading.value = false
    }
  }

  async function getProgressMetrics(
    exerciseId: string,
    days: number = 30,
  ): Promise<ProgressMetrics> {
    loading.value = true
    error.value = null
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const allLogs: TrackingLog[] = []
      // @ts-ignore Dexie type resolution issue
      const query = await db.trackingLogs.where('exerciseId').equals(exerciseId)
      // @ts-ignore Dexie type resolution issue
      for (const log of await query.toArray()) {
        const typedLog = log as TrackingLog
        if (typedLog.date >= since && typedLog.completed) {
          allLogs.push(typedLog)
        }
      }

      if (allLogs.length === 0) {
        return { trend: 'stable' }
      }

      // Calculate averages
      const weights = allLogs.filter((log: TrackingLog) => log.weightUsed).map((log: TrackingLog) => log.weightUsed!)
      const reps = allLogs.filter((log: TrackingLog) => log.repsDone).map((log: TrackingLog) => log.repsDone!)
      const energies = allLogs.filter((log: TrackingLog) => log.energyLevel).map((log: TrackingLog) => log.energyLevel!)
      const difficulties = allLogs.filter((log: TrackingLog) => log.difficultyFelt).map((log: TrackingLog) => log.difficultyFelt!)

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b) / arr.length : undefined

      const averageWeight = avg(weights)
      const totalReps = reps.reduce((a, b) => a + b, 0)
      const averageEnergy = avg(energies)
      const averageDifficulty = avg(difficulties)

      // Calculate trend
      const midpoint = Math.floor(allLogs.length / 2)
      const firstHalf = allLogs.slice(0, midpoint)
      const secondHalf = allLogs.slice(midpoint)

      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvgWeight = avg(
          firstHalf.filter((log: TrackingLog) => log.weightUsed).map((log: TrackingLog) => log.weightUsed!),
        ) ?? 0
        const secondAvgWeight = avg(
          secondHalf.filter((log: TrackingLog) => log.weightUsed).map((log: TrackingLog) => log.weightUsed!),
        ) ?? 0

        if (secondAvgWeight > firstAvgWeight * 1.05) trend = 'improving'
        else if (secondAvgWeight < firstAvgWeight * 0.95) trend = 'declining'
      }

      return { averageWeight, totalReps, averageEnergy, averageDifficulty, trend }
    }
    catch (e) {
      error.value = `Failed to get progress metrics: ${String(e)}`
      console.error(error.value, e)
      return { trend: 'stable' }
    }
    finally {
      loading.value = false
    }
  }

  async function getCompletionTrend(protocolId: string, days: number = 90) {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      // @ts-ignore Dexie type resolution issue
      const routines = await db.routines.where('protocolId').equals(protocolId).toArray()
      const routineIds = routines.map(r => r.id)

      // @ts-ignore Dexie type resolution issue
      const exercises = await db.exercises.filter(ex => routineIds.includes(ex.routineId)).toArray()
      const exerciseIds = exercises.map(ex => ex.id)

      // @ts-ignore Dexie type resolution issue
      const allLogs = await db.trackingLogs.toArray()
      const relevantLogs = allLogs.filter(log => exerciseIds.includes((log as TrackingLog).exerciseId) && (log as TrackingLog).date >= since)

      const byDate: Record<string, number> = {}
      relevantLogs.forEach((log) => {
        const typedLog = log as TrackingLog
        const dateKey = typedLog.date.toISOString().split('T')[0]
        if (!byDate[dateKey]) byDate[dateKey] = 0
        if (typedLog.completed) byDate[dateKey] += 1
      })

      return Object.entries(byDate).map(([date, completed]) => ({
        date,
        rate: (completed / exerciseIds.length) * 100,
      }))
    }
    catch (e) {
      console.error('Failed to get completion trend:', e)
      return []
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    getCompletionMetrics,
    getProgressMetrics,
    getCompletionTrend,
  }
}
