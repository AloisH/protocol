import { z } from 'zod';

/**
 * Email validation schemas
 */

export const sendEmailSchema = z.object({
  to: z.union([z.email(), z.array(z.email())]),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  from: z.email().optional(),
  replyTo: z.email().optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
