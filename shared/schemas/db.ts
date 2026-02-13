import { z } from 'zod';

export const SupplementDoseSchema = z.object({
  dosage: z.number().positive().optional(),
  dosageUnit: z.string().max(20).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  timing: z.string().max(100).optional(),
});

export const ProtocolSchema = z.object({
  id: z.string().min(1, 'ID required'),
  name: z.string().min(1, 'Name required').max(100),
  description: z.string().max(500).optional(),
  category: z.string().default('general'),
  duration: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  scheduleDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  status: z.enum(['active', 'paused', 'completed']),
  targetMetric: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ActivityGroupSchema = z.object({
  id: z.string().min(1, 'ID required'),
  protocolId: z.string().min(1, 'Protocol ID required'),
  name: z.string().min(1, 'Name required').max(100),
  order: z.number().int().min(0),
});

const baseActivitySchema = z.object({
  id: z.string().min(1, 'ID required'),
  protocolId: z.string().min(1, 'Protocol ID required'),
  groupId: z.string().optional(),
  name: z.string().min(1, 'Name required').max(100),
  order: z.number().int().min(0),
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
    doses: z.array(SupplementDoseSchema).optional(),
    // Keep old fields for migration compat
    dosage: z.number().positive().optional(),
    dosageUnit: z.string().max(20).optional(),
    timing: z.string().max(100).optional(),
  }),
  baseActivitySchema.extend({
    activityType: z.literal('habit'),
  }),
]);

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
  dosesCompleted: z.array(z.boolean()).optional(),
  notes: z.string().max(500).optional(),
});

export const SettingsSchema = z.object({
  userId: z.string().min(1),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  notificationsEnabled: z.boolean().default(false),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
  reminderDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  restDaySchedule: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
});

export const DailyCompletionSchema = z.object({
  id: z.string().min(1, 'ID required'),
  protocolId: z.string().min(1, 'Protocol ID required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  completedAt: z.coerce.date(),
  notes: z.string().max(500).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export type ProtocolInput = z.infer<typeof ProtocolSchema>;
export type ActivityGroupInput = z.infer<typeof ActivityGroupSchema>;
export type ActivityInput = z.infer<typeof ActivitySchema>;
export type TrackingLogInput = z.infer<typeof TrackingLogSchema>;
export type SettingsInput = z.infer<typeof SettingsSchema>;
export type DailyCompletionInput = z.infer<typeof DailyCompletionSchema>;
