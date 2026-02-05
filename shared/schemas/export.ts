import { z } from 'zod';
import {
  ActivitySchema,
  DailyCompletionSchema,
  ProtocolSchema,
  SettingsSchema,
  TrackingLogSchema,
} from './db';

export const ExportDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.coerce.date(),
  data: z.object({
    protocols: z.array(ProtocolSchema),
    activities: z.array(ActivitySchema),
    trackingLogs: z.array(TrackingLogSchema),
    settings: z.array(SettingsSchema),
    dailyCompletions: z.array(DailyCompletionSchema),
  }),
});

export type ExportData = z.infer<typeof ExportDataSchema>;
