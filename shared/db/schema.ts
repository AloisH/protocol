import Dexie, { type Table } from 'dexie'

export interface Protocol {
  id: string
  name: string
  description?: string
  category: string
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly'
  status: 'active' | 'paused' | 'completed'
  targetMetric?: string
  createdAt: Date
  updatedAt: Date
}

export interface Routine {
  id: string
  protocolId: string
  name: string
  order: number
  frequency: 'daily' | 'weekly' | string[]
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
  notes?: string
}

export interface Exercise {
  id: string
  routineId: string
  name: string
  sets?: number
  reps?: number
  weight?: number
  equipmentType?: string
  notes?: string
}

export interface TrackingLog {
  id: string
  exerciseId: string
  date: Date
  completed: boolean
  setsDone?: number
  repsDone?: number
  weightUsed?: number
  durationTaken?: number
  energyLevel?: number
  difficultyFelt?: number
  notes?: string
}

export interface Settings {
  userId: string
  theme: 'light' | 'dark' | 'auto'
  notificationsEnabled: boolean
  restDaySchedule?: string[]
}

export class ProtocolDB extends Dexie {
  protocols!: Table<Protocol>
  routines!: Table<Routine>
  exercises!: Table<Exercise>
  trackingLogs!: Table<TrackingLog>
  settings!: Table<Settings>

  constructor() {
    super('ProtocolDB')
    this.version(1).stores({
      protocols: '++id, status, createdAt',
      routines: '++id, protocolId, order',
      exercises: '++id, routineId',
      trackingLogs: '++id, exerciseId, [exerciseId+date]',
      settings: '++userId',
    })
  }
}

export const db = new ProtocolDB()
