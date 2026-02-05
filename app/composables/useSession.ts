import type { DailyCompletion, TrackingLog } from '#shared/db/schema';
import { db } from '#shared/db/schema';
import { nanoid } from 'nanoid';

export interface ActivityLog {
  activityId: string;
  completed: boolean;
  setsDone?: number;
  repsDone?: number;
  weightUsed?: number;
  durationTaken?: number;
  notes?: string;
}

export function useSession() {
  const protocolId = ref<string | null>(null);
  const sessionDate = ref<string>('');
  const activityLogs = ref<Map<string, ActivityLog>>(new Map());
  const sessionNotes = ref('');
  const sessionRating = ref<number | undefined>(undefined);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Initialize session for a protocol
  async function initSession(pId: string, date?: string) {
    protocolId.value = pId;
    sessionDate.value = date || new Date().toISOString().split('T')[0];
    activityLogs.value = new Map();
    sessionNotes.value = '';
    sessionRating.value = undefined;

    // Load existing data
    await loadExistingSession();
  }

  // Load existing logs and completion for this session
  async function loadExistingSession() {
    if (!protocolId.value || import.meta.server)
      return;

    loading.value = true;
    error.value = null;

    try {
      // Get activities for this protocol
      const activities = await db.activities
        .where('protocolId')
        .equals(protocolId.value)
        .toArray();

      // Get existing logs for today
      const dayStart = new Date(sessionDate.value);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(sessionDate.value);
      dayEnd.setHours(23, 59, 59, 999);

      for (const activity of activities) {
        const existingLogs = await db.trackingLogs
          .where('activityId')
          .equals(activity.id)
          .filter(log => log.date >= dayStart && log.date <= dayEnd)
          .toArray();

        if (existingLogs.length > 0) {
          const log = existingLogs[0];
          activityLogs.value.set(activity.id, {
            activityId: activity.id,
            completed: log.completed,
            setsDone: log.setsDone,
            repsDone: log.repsDone,
            weightUsed: log.weightUsed,
            durationTaken: log.durationTaken,
            notes: log.notes,
          });
        }
        else {
          // Initialize empty log with defaults from activity
          activityLogs.value.set(activity.id, {
            activityId: activity.id,
            completed: false,
            setsDone: activity.sets,
            repsDone: activity.reps,
            weightUsed: activity.weight,
            durationTaken: activity.duration,
          });
        }
      }

      // Load existing completion
      const completion = await db.dailyCompletions
        .where('[protocolId+date]')
        .equals([protocolId.value, sessionDate.value])
        .first();

      if (completion) {
        sessionNotes.value = completion.notes || '';
        sessionRating.value = completion.rating;
      }
    }
    catch (e) {
      error.value = `Failed to load session: ${String(e)}`;
      console.error(error.value, e);
    }
    finally {
      loading.value = false;
    }
  }

  // Update an activity log
  function updateActivityLog(activityId: string, updates: Partial<ActivityLog>) {
    const existing = activityLogs.value.get(activityId) || {
      activityId,
      completed: false,
    };
    activityLogs.value.set(activityId, { ...existing, ...updates });
  }

  // Toggle activity completion
  function toggleActivity(activityId: string) {
    const existing = activityLogs.value.get(activityId);
    if (existing) {
      existing.completed = !existing.completed;
      activityLogs.value.set(activityId, existing);
    }
  }

  // Save the entire session
  async function saveSession() {
    if (!protocolId.value || import.meta.server)
      return;

    loading.value = true;
    error.value = null;

    try {
      const sessionDateObj = new Date(sessionDate.value);
      sessionDateObj.setHours(12, 0, 0, 0);

      // Save/update tracking logs for each activity
      for (const [activityId, log] of activityLogs.value) {
        // Check for existing log
        const dayStart = new Date(sessionDate.value);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(sessionDate.value);
        dayEnd.setHours(23, 59, 59, 999);

        const existingLogs = await db.trackingLogs
          .where('activityId')
          .equals(activityId)
          .filter(l => l.date >= dayStart && l.date <= dayEnd)
          .toArray();

        const trackingLog: TrackingLog = {
          id: existingLogs[0]?.id || nanoid(),
          activityId,
          date: sessionDateObj,
          completed: log.completed,
          setsDone: log.setsDone,
          repsDone: log.repsDone,
          weightUsed: log.weightUsed,
          durationTaken: log.durationTaken,
          notes: log.notes,
        };

        if (existingLogs.length > 0) {
          await db.trackingLogs.update(existingLogs[0].id, trackingLog);
        }
        else {
          await db.trackingLogs.add(trackingLog);
        }
      }

      // Save/update daily completion
      const existingCompletion = await db.dailyCompletions
        .where('[protocolId+date]')
        .equals([protocolId.value, sessionDate.value])
        .first();

      const completion: DailyCompletion = {
        id: existingCompletion?.id || nanoid(),
        protocolId: protocolId.value,
        date: sessionDate.value,
        completedAt: new Date(),
        notes: sessionNotes.value || undefined,
        rating: sessionRating.value,
      };

      if (existingCompletion) {
        await db.dailyCompletions.update(existingCompletion.id, completion);
      }
      else {
        await db.dailyCompletions.add(completion);
      }

      return true;
    }
    catch (e) {
      error.value = `Failed to save session: ${String(e)}`;
      console.error(error.value, e);
      return false;
    }
    finally {
      loading.value = false;
    }
  }

  // Get completion count
  const completedCount = computed(() => {
    let count = 0;
    for (const log of activityLogs.value.values()) {
      if (log.completed)
        count++;
    }
    return count;
  });

  const totalCount = computed(() => activityLogs.value.size);

  return {
    // State
    protocolId: readonly(protocolId),
    sessionDate: readonly(sessionDate),
    activityLogs: readonly(activityLogs),
    sessionNotes,
    sessionRating,
    loading: readonly(loading),
    error: readonly(error),
    completedCount,
    totalCount,

    // Methods
    initSession,
    updateActivityLog,
    toggleActivity,
    saveSession,
  };
}
