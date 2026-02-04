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

// Minimal schema for local-only PWA
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof baseEnvSchema>;

export function validateEnv(env: Record<string, string | undefined>, _isProduction?: boolean) {
  return baseEnvSchema.safeParse(env);
}
