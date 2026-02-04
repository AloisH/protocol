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

export interface Activity {
  id: string;
  protocolId: string;
  name: string;
  activityType: 'warmup' | 'exercise' | 'supplement' | 'habit';
  order: number;
  frequency: 'daily' | 'weekly' | string[];
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
  restDaySchedule?: string[];
}

// Simple daily completion tracking at protocol level
export interface DailyCompletion {
  id: string;
  protocolId: string;
  date: string; // YYYY-MM-DD format for easy querying
  completedAt: Date;
  notes?: string;
}

export class ProtocolDB extends Dexie {
  protocols!: Table<Protocol>;
  routines!: Table<Routine>;
  exercises!: Table<Exercise>;
  activities!: Table<Activity>;
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
      // Migrate routines to activities
      const routines = await tx.table<Routine>('routines').toArray();
      for (const routine of routines) {
        await tx.table<Activity>('activities').add({
          ...routine,
          activityType: 'habit',
        });
      }

      // Migrate exercises to activities
      const exercises = await tx.table<Exercise>('exercises').toArray();
      for (const exercise of exercises) {
        const routine = await tx.table<Routine>('routines').get(exercise.routineId);
        if (routine) {
          await tx.table<Activity>('activities').add({
            id: exercise.id,
            protocolId: routine.protocolId,
            name: exercise.name,
            activityType: 'exercise',
            order: 0,
            frequency: 'daily',
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
  }
}

export const db = new ProtocolDB();
