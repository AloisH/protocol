import { z } from 'zod';

/**
 * Extract field errors from Zod error (replaces deprecated flatten())
 */
export function getFieldErrors(error: z.ZodError): Record<string, string[] | undefined> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path])
      fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

// Base schema - all environments
const baseEnvSchema = z.object({
  // Required
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL required')
    .startsWith('postgresql://', 'DATABASE_URL must be PostgreSQL'),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be >= 32 chars'),

  // Optional - graceful degradation
  RESEND_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  POLAR_API_KEY: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
  LOG_SAMPLE_RATE: z
    .string()
    .regex(/^0(\.\d+)?$|^1(\.0)?$/)
    .optional()
    .default('0.05'),
});

// Production schema - adds requirements
const productionEnvSchema = baseEnvSchema
  .extend({
    AUTH_TRUSTED_ORIGINS: z
      .string()
      .min(1, 'AUTH_TRUSTED_ORIGINS required in production')
      .refine(val => val.includes('https://'), {
        message: 'AUTH_TRUSTED_ORIGINS must include https://',
      }),
  })
  .refine(data => data.AUTH_SECRET !== 'your-secret-key-min-32-chars-long', {
    message: 'AUTH_SECRET must not be default in production',
    path: ['AUTH_SECRET'],
  });

export type EnvConfig = z.infer<typeof baseEnvSchema>;
export type ProductionEnvConfig = z.infer<typeof productionEnvSchema>;

export function validateEnv(env: Record<string, string | undefined>, isProduction: boolean) {
  const schema = isProduction ? productionEnvSchema : baseEnvSchema;
  return schema.safeParse(env);
}

// Optional var groups for warnings
export const OPTIONAL_VAR_GROUPS = {
  email: ['RESEND_API_KEY'],
  ai: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'],
  oauth: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  payments: ['POLAR_API_KEY', 'POLAR_WEBHOOK_SECRET'],
  storage: [
    'REDIS_URL',
    'BLOB_READ_WRITE_TOKEN',
    'S3_ENDPOINT',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_BUCKET',
  ],
  observability: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN'],
  logging: ['LOG_LEVEL', 'LOG_SAMPLE_RATE'],
} as const;
