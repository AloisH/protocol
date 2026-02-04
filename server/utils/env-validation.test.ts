import { describe, expect, it } from 'vitest';
import { getFieldErrors, OPTIONAL_VAR_GROUPS, validateEnv } from '../../shared/env';

describe('validateEnv', () => {
  const validBaseEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    AUTH_SECRET: 'test-secret-at-least-32-chars-long',
  };

  describe('development', () => {
    it('passes with required vars', () => {
      const result = validateEnv(validBaseEnv, false);
      expect(result.success).toBe(true);
    });

    it('fails without DATABASE_URL', () => {
      const env = { ...validBaseEnv, DATABASE_URL: undefined };
      const result = validateEnv(env, false);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFieldErrors(result.error).DATABASE_URL).toBeDefined();
      }
    });

    it('fails with non-postgresql DATABASE_URL', () => {
      const env = { ...validBaseEnv, DATABASE_URL: 'mysql://localhost' };
      const result = validateEnv(env, false);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFieldErrors(result.error).DATABASE_URL?.[0]).toContain('PostgreSQL');
      }
    });

    it('fails with short AUTH_SECRET', () => {
      const env = { ...validBaseEnv, AUTH_SECRET: 'short' };
      const result = validateEnv(env, false);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFieldErrors(result.error).AUTH_SECRET?.[0]).toContain('32');
      }
    });

    it('allows optional vars missing', () => {
      const result = validateEnv(validBaseEnv, false);
      expect(result.success).toBe(true);
    });
  });

  describe('production', () => {
    const validProdEnv = {
      ...validBaseEnv,
      AUTH_TRUSTED_ORIGINS: 'https://example.com',
    };

    it('passes with production vars', () => {
      const result = validateEnv(validProdEnv, true);
      expect(result.success).toBe(true);
    });

    it('fails without AUTH_TRUSTED_ORIGINS', () => {
      const result = validateEnv(validBaseEnv, true);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = getFieldErrors(result.error);
        expect(fieldErrors.AUTH_TRUSTED_ORIGINS).toBeDefined();
      }
    });

    it('fails with default AUTH_SECRET', () => {
      const env = {
        ...validProdEnv,
        AUTH_SECRET: 'your-secret-key-min-32-chars-long',
      };
      const result = validateEnv(env, true);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = getFieldErrors(result.error);
        const authSecretError = fieldErrors.AUTH_SECRET?.[0] || fieldErrors._root?.[0];
        expect(authSecretError).toContain('default');
      }
    });

    it('fails without https:// in AUTH_TRUSTED_ORIGINS', () => {
      const env = { ...validProdEnv, AUTH_TRUSTED_ORIGINS: 'http://example.com' };
      const result = validateEnv(env, true);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = getFieldErrors(result.error);
        expect(fieldErrors.AUTH_TRUSTED_ORIGINS?.[0]).toContain('https://');
      }
    });
  });

  describe('oPTIONAL_VAR_GROUPS', () => {
    it('contains expected groups', () => {
      expect(OPTIONAL_VAR_GROUPS).toHaveProperty('email');
      expect(OPTIONAL_VAR_GROUPS).toHaveProperty('ai');
      expect(OPTIONAL_VAR_GROUPS).toHaveProperty('oauth');
      expect(OPTIONAL_VAR_GROUPS).toHaveProperty('payments');
      expect(OPTIONAL_VAR_GROUPS).toHaveProperty('storage');
      expect(OPTIONAL_VAR_GROUPS).toHaveProperty('observability');
    });
  });
});
