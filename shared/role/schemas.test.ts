import { describe, expect, it } from 'vitest';
import { roleSchema, updateRoleSchema } from './schemas';

describe('role Schemas', () => {
  describe('roleSchema', () => {
    it('accepts USER role', () => {
      expect(roleSchema.parse('USER')).toBe('USER');
    });

    it('accepts ADMIN role', () => {
      expect(roleSchema.parse('ADMIN')).toBe('ADMIN');
    });

    it('accepts SUPER_ADMIN role', () => {
      expect(roleSchema.parse('SUPER_ADMIN')).toBe('SUPER_ADMIN');
    });

    it('rejects invalid role', () => {
      expect(() => roleSchema.parse('INVALID')).toThrow();
    });

    it('rejects lowercase roles', () => {
      expect(() => roleSchema.parse('user')).toThrow();
      expect(() => roleSchema.parse('admin')).toThrow();
    });

    it('rejects empty string', () => {
      expect(() => roleSchema.parse('')).toThrow();
    });
  });

  describe('updateRoleSchema', () => {
    it('accepts valid role update', () => {
      const result = updateRoleSchema.parse({ role: 'ADMIN' });
      expect(result.role).toBe('ADMIN');
    });

    it('accepts all valid roles', () => {
      for (const role of ['USER', 'ADMIN', 'SUPER_ADMIN']) {
        const result = updateRoleSchema.parse({ role });
        expect(result.role).toBe(role);
      }
    });

    it('rejects invalid role', () => {
      expect(() => updateRoleSchema.parse({ role: 'MODERATOR' })).toThrow();
    });

    it('rejects missing role', () => {
      expect(() => updateRoleSchema.parse({})).toThrow();
    });
  });
});
