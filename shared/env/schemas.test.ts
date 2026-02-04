import { describe, expect, it } from 'vitest';
import { OPTIONAL_VAR_GROUPS, validateEnv } from './schemas';

describe('env Schemas', () => {
  describe('validateEnv - development', () => {
    it('accepts minimal valid config', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'a'.repeat(32),
        },
        false,
      );
      expect(result.success).toBe(true);
    });

    it('rejects missing DATABASE_URL', () => {
      const result = validateEnv(
        {
          AUTH_SECRET: 'a'.repeat(32),
        },
        false,
      );
      expect(result.success).toBe(false);
    });

    it('rejects non-postgresql DATABASE_URL', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
          AUTH_SECRET: 'a'.repeat(32),
        },
        false,
      );
      expect(result.success).toBe(false);
    });

    it('rejects AUTH_SECRET under 32 chars', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'short',
        },
        false,
      );
      expect(result.success).toBe(false);
    });

    it('accepts all optional vars', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'a'.repeat(32),
          RESEND_API_KEY: 're_xxx',
          OPENAI_API_KEY: 'sk-xxx',
          ANTHROPIC_API_KEY: 'sk-ant-xxx',
          REDIS_URL: 'redis://localhost:6379',
          GITHUB_CLIENT_ID: 'gh_id',
          GITHUB_CLIENT_SECRET: 'gh_secret',
          GOOGLE_CLIENT_ID: 'google_id',
          GOOGLE_CLIENT_SECRET: 'google_secret',
          POLAR_API_KEY: 'polar_key',
          POLAR_WEBHOOK_SECRET: 'polar_secret',
          SENTRY_DSN: 'https://sentry.io/xxx',
          SENTRY_AUTH_TOKEN: 'sentry_token',
          S3_ENDPOINT: 'https://s3.amazonaws.com',
          S3_ACCESS_KEY_ID: 'access_key',
          S3_SECRET_ACCESS_KEY: 'secret_key',
          S3_BUCKET: 'my-bucket',
          LOG_LEVEL: 'debug',
          LOG_SAMPLE_RATE: '0.1',
        },
        false,
      );
      expect(result.success).toBe(true);
    });

    it('accepts valid LOG_LEVEL values', () => {
      for (const level of ['debug', 'info', 'warn', 'error']) {
        const result = validateEnv(
          {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            AUTH_SECRET: 'a'.repeat(32),
            LOG_LEVEL: level,
          },
          false,
        );
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid LOG_LEVEL', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'a'.repeat(32),
          LOG_LEVEL: 'verbose',
        },
        false,
      );
      expect(result.success).toBe(false);
    });

    it('accepts valid LOG_SAMPLE_RATE values', () => {
      for (const rate of ['0', '0.05', '0.5', '1', '1.0']) {
        const result = validateEnv(
          {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            AUTH_SECRET: 'a'.repeat(32),
            LOG_SAMPLE_RATE: rate,
          },
          false,
        );
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid LOG_SAMPLE_RATE', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'a'.repeat(32),
          LOG_SAMPLE_RATE: '1.5',
        },
        false,
      );
      expect(result.success).toBe(false);
    });
  });

  describe('validateEnv - production', () => {
    it('requires AUTH_TRUSTED_ORIGINS', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'production-secret-at-least-32-chars',
        },
        true,
      );
      expect(result.success).toBe(false);
    });

    it('requires https in AUTH_TRUSTED_ORIGINS', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'production-secret-at-least-32-chars',
          AUTH_TRUSTED_ORIGINS: 'http://example.com',
        },
        true,
      );
      expect(result.success).toBe(false);
    });

    it('rejects default AUTH_SECRET in production', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'your-secret-key-min-32-chars-long',
          AUTH_TRUSTED_ORIGINS: 'https://example.com',
        },
        true,
      );
      expect(result.success).toBe(false);
    });

    it('accepts valid production config', () => {
      const result = validateEnv(
        {
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          AUTH_SECRET: 'my-production-secret-key-32-plus',
          AUTH_TRUSTED_ORIGINS: 'https://example.com',
        },
        true,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('oPTIONAL_VAR_GROUPS', () => {
    it('contains email group', () => {
      expect(OPTIONAL_VAR_GROUPS.email).toContain('RESEND_API_KEY');
    });

    it('contains ai group', () => {
      expect(OPTIONAL_VAR_GROUPS.ai).toContain('OPENAI_API_KEY');
      expect(OPTIONAL_VAR_GROUPS.ai).toContain('ANTHROPIC_API_KEY');
    });

    it('contains oauth group', () => {
      expect(OPTIONAL_VAR_GROUPS.oauth).toContain('GITHUB_CLIENT_ID');
      expect(OPTIONAL_VAR_GROUPS.oauth).toContain('GOOGLE_CLIENT_ID');
    });

    it('contains payments group', () => {
      expect(OPTIONAL_VAR_GROUPS.payments).toContain('POLAR_API_KEY');
    });

    it('contains storage group', () => {
      expect(OPTIONAL_VAR_GROUPS.storage).toContain('REDIS_URL');
      expect(OPTIONAL_VAR_GROUPS.storage).toContain('S3_BUCKET');
    });

    it('contains observability group', () => {
      expect(OPTIONAL_VAR_GROUPS.observability).toContain('SENTRY_DSN');
    });

    it('contains logging group', () => {
      expect(OPTIONAL_VAR_GROUPS.logging).toContain('LOG_LEVEL');
      expect(OPTIONAL_VAR_GROUPS.logging).toContain('LOG_SAMPLE_RATE');
    });
  });
});
