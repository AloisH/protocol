import { z } from 'zod';

export const ProtocolSchema = z.object({
  id: z.string().min(1, 'ID required'),
  name: z.string().min(1, 'Name required').max(100),
  description: z.string().max(500).optional(),
  category: z.string().default('general'),
  duration: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  status: z.enum(['active', 'paused', 'completed']),
  targetMetric: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const baseActivitySchema = z.object({
  id: z.string().min(1, 'ID required'),
  protocolId: z.string().min(1, 'Protocol ID required'),
  name: z.string().min(1, 'Name required').max(100),
  order: z.number().int().min(0),
  frequency: z.union([
    z.enum(['daily', 'weekly']),
    z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
  ]),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  notes: z.string().max(500).optional(),
});

export const ActivitySchema = z.discriminatedUnion('activityType', [
  baseActivitySchema.extend({
    activityType: z.literal('warmup'),
    duration: z.number().positive().optional(),
  }),
  baseActivitySchema.extend({
    activityType: z.literal('exercise'),
    sets: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    weight: z.number().positive().optional(),
    equipmentType: z.string().max(50).optional(),
  }),
  baseActivitySchema.extend({
    activityType: z.literal('supplement'),
    dosage: z.number().positive().optional(),
    dosageUnit: z.string().max(20).optional(),
    timing: z.string().max(100).optional(),
  }),
  baseActivitySchema.extend({
    activityType: z.literal('habit'),
  }),
]);

/** @deprecated Use ActivitySchema instead */
export const RoutineSchema = z.object({
  id: z.string().min(1, 'ID required'),
  protocolId: z.string().min(1, 'Protocol ID required'),
  name: z.string().min(1, 'Name required').max(100),
  order: z.number().int().min(0),
  frequency: z.union([
    z.enum(['daily', 'weekly']),
    z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
  ]),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  notes: z.string().max(500).optional(),
});

/** @deprecated Use ActivitySchema instead */
export const ExerciseSchema = z.object({
  id: z.string().min(1, 'ID required'),
  routineId: z.string().min(1, 'Routine ID required'),
  name: z.string().min(1, 'Name required').max(100),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  equipmentType: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const TrackingLogSchema = z.object({
  id: z.string().min(1, 'ID required'),
  activityId: z.string().min(1, 'Activity ID required'),
  date: z.coerce.date(),
  completed: z.boolean(),
  setsDone: z.number().int().nonnegative().optional(),
  repsDone: z.number().int().nonnegative().optional(),
  weightUsed: z.number().positive().optional(),
  durationTaken: z.number().positive().optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  difficultyFelt: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
});

export const SettingsSchema = z.object({
  userId: z.string().min(1),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  notificationsEnabled: z.boolean().default(true),
  restDaySchedule: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
});

export type ProtocolInput = z.infer<typeof ProtocolSchema>;
export type ActivityInput = z.infer<typeof ActivitySchema>;
export type TrackingLogInput = z.infer<typeof TrackingLogSchema>;
export type SettingsInput = z.infer<typeof SettingsSchema>;

/** @deprecated Use ActivityInput instead */
export type RoutineInput = z.infer<typeof RoutineSchema>;
/** @deprecated Use ActivityInput instead */
export type ExerciseInput = z.infer<typeof ExerciseSchema>;
