import type { Table } from 'dexie';
import Dexie from 'dexie';

export interface Protocol {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'active' | 'paused' | 'completed';
  targetMetric?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityGroup {
  id: string;
  protocolId: string;
  name: string;
  order: number;
}

export interface Activity {
  id: string;
  protocolId: string;
  groupId?: string;
  name: string;
  activityType: 'warmup' | 'exercise' | 'supplement' | 'habit';
  order: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';

  // Exercise-specific
  sets?: number;
  reps?: number;
  weight?: number;
  equipmentType?: string;

  // Supplement-specific
  dosage?: number;
  dosageUnit?: string;
  timing?: string;

  // Warmup-specific
  duration?: number;

  // Rest time (exercise/warmup)
  restTime?: number; // seconds

  notes?: string;
}

/** @deprecated Use Activity instead */
export interface Routine {
  id: string;
  protocolId: string;
  name: string;
  order: number;
  frequency: 'daily' | 'weekly' | string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  notes?: string;
}

/** @deprecated Use Activity instead */
export interface Exercise {
  id: string;
  routineId: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  equipmentType?: string;
  notes?: string;
}

export interface TrackingLog {
  id: string;
  activityId: string;
  date: Date;
  completed: boolean;
  setsDone?: number;
  repsDone?: number;
  weightUsed?: number;
  durationTaken?: number;
  energyLevel?: number;
  difficultyFelt?: number;
  notes?: string;
  /** @deprecated Use activityId instead */
  exerciseId?: string;
}

export interface Settings {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  reminderTime?: string; // HH:MM format
  reminderDays?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  restDaySchedule?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
}

// Simple daily completion tracking at protocol level
export interface DailyCompletion {
  id: string;
  protocolId: string;
  date: string; // YYYY-MM-DD format for easy querying
  completedAt: Date;
  notes?: string;
  rating?: number; // 1-5 session rating
}

export class ProtocolDB extends Dexie {
  protocols!: Table<Protocol>;
  routines!: Table<Routine>;
  exercises!: Table<Exercise>;
  activities!: Table<Activity>;
  activityGroups!: Table<ActivityGroup>;
  trackingLogs!: Table<TrackingLog>;
  settings!: Table<Settings>;
  dailyCompletions!: Table<DailyCompletion>;

  constructor() {
    super('ProtocolDB');
    this.version(1).stores({
      protocols: '++id, status, createdAt',
      routines: '++id, protocolId, order',
      exercises: '++id, routineId',
      trackingLogs: '++id, exerciseId, [exerciseId+date]',
      settings: '++userId',
    });
    this.version(2).stores({
      protocols: '++id, status, createdAt',
      routines: '++id, protocolId, order',
      exercises: '++id, routineId',
      trackingLogs: '++id, exerciseId, [exerciseId+date]',
      settings: '++userId',
      dailyCompletions: '++id, protocolId, date, [protocolId+date]',
    });
    this.version(3).stores({
      protocols: '++id, status, createdAt',
      routines: '++id, protocolId, order',
      exercises: '++id, routineId',
      activities: '++id, protocolId, order',
      trackingLogs: '++id, activityId, [activityId+date]',
      settings: '++userId',
      dailyCompletions: '++id, protocolId, date, [protocolId+date]',
    }).upgrade(async (tx) => {
      // Migrate routines to activities (raw table to handle legacy fields)
      const routines = await tx.table<Routine>('routines').toArray();
      const activityTable = tx.table('activities');
      for (const routine of routines) {
        await activityTable.add({
          ...routine,
          activityType: 'habit',
        });
      }

      // Migrate exercises to activities
      const exercises = await tx.table<Exercise>('exercises').toArray();
      for (const exercise of exercises) {
        const routine = await tx.table<Routine>('routines').get(exercise.routineId);
        if (routine) {
          await activityTable.add({
            id: exercise.id,
            protocolId: routine.protocolId,
            name: exercise.name,
            activityType: 'exercise',
            order: 0,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            equipmentType: exercise.equipmentType,
            notes: exercise.notes,
          });
        }
      }

      // Migrate trackingLogs exerciseId to activityId
      const logs = await tx.table<TrackingLog & { exerciseId?: string }>('trackingLogs').toArray();
      for (const log of logs) {
        await tx.table<TrackingLog>('trackingLogs').update(log.id, {
          activityId: log.exerciseId ?? '',
        });
      }
    });
    this.version(4).stores({
      protocols: '++id, status, createdAt',
      routines: '++id, protocolId, order',
      exercises: '++id, routineId',
      activities: '++id, protocolId, groupId, order',
      activityGroups: '++id, protocolId, order',
      trackingLogs: '++id, activityId, [activityId+date]',
      settings: '++userId',
      dailyCompletions: '++id, protocolId, date, [protocolId+date]',
    });
  }
}

export const db = new ProtocolDB();
