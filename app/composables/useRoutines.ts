import { db, type Routine } from '~/shared/db/schema'
import { RoutineSchema } from '~/shared/schemas/db'
import { nanoid } from 'nanoid'

export function useRoutines() {
  const routines = ref<Routine[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadRoutines(protocolId?: string) {
    loading.value = true
    error.value = null
    try {
      if (protocolId) {
        routines.value = await db.routines
          .where('protocolId')
          .equals(protocolId)
          .toArray()
      }
      else {
        routines.value = await db.routines.toArray()
      }
      // Sort by order
      routines.value.sort((a, b) => a.order - b.order)
    }
    catch (e) {
      error.value = `Failed to load routines: ${String(e)}`
      console.error(error.value, e)
    }
    finally {
      loading.value = false
    }
  }

  async function createRoutine(
    protocolId: string,
    name: string,
    frequency: 'daily' | 'weekly' | string[] = 'daily',
    order: number = 0,
  ) {
    error.value = null
    try {
      const routine: Routine = {
        id: nanoid(),
        protocolId,
        name,
        frequency,
        order,
      }

      // Validate
      RoutineSchema.parse(routine)

      // Add to DB
      await db.routines.add(routine)

      // Reload
      await loadRoutines(protocolId)
      return routine
    }
    catch (e) {
      error.value = `Failed to create routine: ${String(e)}`
      console.error(error.value, e)
      throw e
    }
  }

  async function updateRoutine(id: string, updates: Partial<Routine>) {
    error.value = null
    try {
      const existing = await db.routines.get(id)
      if (!existing) {
        throw new Error(`Routine ${id} not found`)
      }

      const updated = { ...existing, ...updates }

      // Validate
      RoutineSchema.parse(updated)

      // Update DB
      await db.routines.update(id, updated)

      // Reload
      await loadRoutines(existing.protocolId)
      return updated
    }
    catch (e) {
      error.value = `Failed to update routine: ${String(e)}`
      console.error(error.value, e)
      throw e
    }
  }

  async function deleteRoutine(id: string) {
    error.value = null
    try {
      const routine = await db.routines.get(id)
      await db.routines.delete(id)
      if (routine) {
        await loadRoutines(routine.protocolId)
      }
    }
    catch (e) {
      error.value = `Failed to delete routine: ${String(e)}`
      console.error(error.value, e)
      throw e
    }
  }

  async function reorderRoutines(protocolId: string, order: string[]) {
    error.value = null
    try {
      // Update order for each routine
      await Promise.all(
        order.map((id, idx) =>
          db.routines.update(id, { order: idx }),
        ),
      )
      await loadRoutines(protocolId)
    }
    catch (e) {
      error.value = `Failed to reorder routines: ${String(e)}`
      console.error(error.value, e)
      throw e
    }
  }

  return {
    // State
    routines: readonly(routines),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    reorderRoutines,
  }
}
