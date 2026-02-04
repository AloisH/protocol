import { z } from 'zod';
import { REASON_MAX_LENGTH, REASON_MIN_LENGTH, USER_ID_MIN_LENGTH } from './constants';

/**
 * Start impersonation schema
 */
export const startImpersonationSchema = z.object({
  userId: z.string().min(USER_ID_MIN_LENGTH),
  reason: z.string().min(REASON_MIN_LENGTH).max(REASON_MAX_LENGTH).optional(),
});

export type StartImpersonationInput = z.infer<typeof startImpersonationSchema>;

/**
 * Impersonation log response
 */
export const impersonationLogSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  targetUserId: z.string(),
  startedAt: z.date(),
  endedAt: z.date().nullable(),
  reason: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
});

export type ImpersonationLog = z.infer<typeof impersonationLogSchema>;
