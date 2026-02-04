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

export interface Routine {
  id: string;
  protocolId: string;
  name: string;
  order: number;
  frequency: 'daily' | 'weekly' | string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  notes?: string;
}

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
  exerciseId: string;
  date: Date;
  completed: boolean;
  setsDone?: number;
  repsDone?: number;
  weightUsed?: number;
  durationTaken?: number;
  energyLevel?: number;
  difficultyFelt?: number;
  notes?: string;
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
  }
}

export const db = new ProtocolDB();
