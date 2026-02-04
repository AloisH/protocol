import { nanoid } from 'nanoid';
import pino from 'pino';

export interface LogContext {
  // Request lifecycle
  requestId: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;

  // HTTP
  method: string;
  url: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;

  // User
  userId?: string;
  userRole?: string;

  // Organization
  orgId?: string;
  orgSlug?: string;
  orgRole?: string;

  // Impersonation
  isImpersonated?: boolean;
  impersonatorId?: string;

  // Business metrics
  dbQueriesCount?: number;
  itemsProcessed?: number;

  // Error (if request failed)
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };

  // Request trace - log entries accumulated during request
  trace?: Array<{
    level: 'debug' | 'info' | 'warn';
    msg: string;
    at: number; // ms since request start
  }>;

  // Tail sampling
  sampled: boolean;
  samplingReason: 'error' | 'slow' | 'random' | 'all';
}

const isDev = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

export const logger = pino({
  level: logLevel,

  // Pretty in dev, JSON in prod
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,requestId,startTime,endTime,ip,userAgent,sampled,samplingReason',
          singleLine: false,
        },
      }
    : undefined,
});

export function generateRequestId(): string {
  return `req-${nanoid(12)}`;
}

export function getLogger() {
  return logger;
}
