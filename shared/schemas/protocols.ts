import { z } from 'zod';

export const ProtocolFormSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  description: z.string().max(500).optional(),
  duration: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  scheduleDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
});

export type ProtocolFormInput = z.infer<typeof ProtocolFormSchema>;
