import { z } from 'zod';

const baseFormSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  activityType: z.enum(['warmup', 'exercise', 'supplement', 'habit']),
  frequency: z.union([
    z.enum(['daily', 'weekly']),
    z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
  ]),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  notes: z.string().max(500).optional(),
});

export const ActivityFormSchema = z.discriminatedUnion('activityType', [
  baseFormSchema.extend({
    activityType: z.literal('warmup'),
    duration: z.number().positive().optional(),
  }),
  baseFormSchema.extend({
    activityType: z.literal('exercise'),
    sets: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    weight: z.number().positive().optional(),
    equipmentType: z.string().max(50).optional(),
  }),
  baseFormSchema.extend({
    activityType: z.literal('supplement'),
    dosage: z.number().positive().optional(),
    dosageUnit: z.string().max(20).optional(),
    timing: z.string().max(100).optional(),
  }),
  baseFormSchema.extend({
    activityType: z.literal('habit'),
  }),
]);

export type ActivityFormInput = z.infer<typeof ActivityFormSchema>;
