import { describe, expect, it } from 'vitest';
import {
  createOrganizationSchema,
  inviteMemberSchema,
  organizationRoleSchema,
  slugSchema,
  updateMemberRoleSchema,
  updateOrganizationSchema,
} from './schemas';

describe('organization Schemas', () => {
  describe('slugSchema', () => {
    it('accepts valid slugs', () => {
      expect(slugSchema.parse('my-org')).toBe('my-org');
      expect(slugSchema.parse('org123')).toBe('org123');
      expect(slugSchema.parse('my-cool-org')).toBe('my-cool-org');
      expect(slugSchema.parse('ab')).toBe('ab'); // min length
      expect(slugSchema.parse('a'.repeat(50))).toBe('a'.repeat(50)); // max length
    });

    it('rejects slugs shorter than 2 chars', () => {
      expect(() => slugSchema.parse('a')).toThrow();
      expect(() => slugSchema.parse('')).toThrow();
    });

    it('rejects slugs longer than 50 chars', () => {
      expect(() => slugSchema.parse('a'.repeat(51))).toThrow();
    });

    it('rejects uppercase letters', () => {
      expect(() => slugSchema.parse('MyOrg')).toThrow();
      expect(() => slugSchema.parse('MY-ORG')).toThrow();
    });

    it('rejects leading hyphens', () => {
      expect(() => slugSchema.parse('-my-org')).toThrow();
    });

    it('rejects trailing hyphens', () => {
      expect(() => slugSchema.parse('my-org-')).toThrow();
    });

    it('rejects consecutive hyphens', () => {
      expect(() => slugSchema.parse('my--org')).toThrow();
    });

    it('rejects special characters', () => {
      expect(() => slugSchema.parse('my_org')).toThrow();
      expect(() => slugSchema.parse('my.org')).toThrow();
      expect(() => slugSchema.parse('my@org')).toThrow();
      expect(() => slugSchema.parse('my org')).toThrow();
    });
  });

  describe('createOrganizationSchema', () => {
    it('accepts valid organization data', () => {
      const data = { name: 'My Org', slug: 'my-org' };
      expect(createOrganizationSchema.parse(data)).toEqual(data);
    });

    it('accepts organization with description', () => {
      const data = { name: 'My Org', slug: 'my-org', description: 'A great org' };
      expect(createOrganizationSchema.parse(data)).toEqual(data);
    });

    it('rejects missing name', () => {
      expect(() => createOrganizationSchema.parse({ slug: 'my-org' })).toThrow();
    });

    it('rejects empty name', () => {
      expect(() => createOrganizationSchema.parse({ name: '', slug: 'my-org' })).toThrow();
    });

    it('rejects name longer than 100 chars', () => {
      expect(() =>
        createOrganizationSchema.parse({ name: 'a'.repeat(101), slug: 'my-org' }),
      ).toThrow();
    });

    it('rejects missing slug', () => {
      expect(() => createOrganizationSchema.parse({ name: 'My Org' })).toThrow();
    });

    it('rejects invalid slug', () => {
      expect(() => createOrganizationSchema.parse({ name: 'My Org', slug: 'My-Org' })).toThrow();
    });

    it('rejects description longer than 500 chars', () => {
      expect(() =>
        createOrganizationSchema.parse({
          name: 'My Org',
          slug: 'my-org',
          description: 'a'.repeat(501),
        }),
      ).toThrow();
    });
  });

  describe('updateOrganizationSchema', () => {
    it('accepts partial updates', () => {
      expect(updateOrganizationSchema.parse({ name: 'New Name' })).toEqual({ name: 'New Name' });
      expect(updateOrganizationSchema.parse({ slug: 'new-slug' })).toEqual({ slug: 'new-slug' });
      expect(updateOrganizationSchema.parse({ description: 'New desc' })).toEqual({
        description: 'New desc',
      });
    });

    it('accepts empty object', () => {
      expect(updateOrganizationSchema.parse({})).toEqual({});
    });

    it('still validates field constraints', () => {
      expect(() => updateOrganizationSchema.parse({ name: '' })).toThrow();
      expect(() => updateOrganizationSchema.parse({ slug: 'Invalid' })).toThrow();
    });
  });

  describe('inviteMemberSchema', () => {
    it('accepts valid invite with role', () => {
      const data = { email: 'user@example.com', role: 'ADMIN' as const };
      expect(inviteMemberSchema.parse(data)).toEqual(data);
    });

    it('defaults role to MEMBER', () => {
      const result = inviteMemberSchema.parse({ email: 'user@example.com' });
      expect(result.role).toBe('MEMBER');
    });

    it('rejects invalid email', () => {
      expect(() => inviteMemberSchema.parse({ email: 'invalid' })).toThrow();
      expect(() => inviteMemberSchema.parse({ email: '' })).toThrow();
      expect(() => inviteMemberSchema.parse({ email: 'user@' })).toThrow();
    });

    it('rejects invalid role', () => {
      expect(() =>
        inviteMemberSchema.parse({ email: 'user@example.com', role: 'INVALID' }),
      ).toThrow();
    });

    it('accepts all valid roles', () => {
      const roles = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as const;
      roles.forEach((role) => {
        expect(inviteMemberSchema.parse({ email: 'user@example.com', role }).role).toBe(role);
      });
    });
  });

  describe('updateMemberRoleSchema', () => {
    it('accepts valid roles', () => {
      expect(updateMemberRoleSchema.parse({ role: 'OWNER' })).toEqual({ role: 'OWNER' });
      expect(updateMemberRoleSchema.parse({ role: 'ADMIN' })).toEqual({ role: 'ADMIN' });
      expect(updateMemberRoleSchema.parse({ role: 'MEMBER' })).toEqual({ role: 'MEMBER' });
      expect(updateMemberRoleSchema.parse({ role: 'GUEST' })).toEqual({ role: 'GUEST' });
    });

    it('rejects invalid roles', () => {
      expect(() => updateMemberRoleSchema.parse({ role: 'INVALID' })).toThrow();
      expect(() => updateMemberRoleSchema.parse({ role: '' })).toThrow();
    });

    it('rejects missing role', () => {
      expect(() => updateMemberRoleSchema.parse({})).toThrow();
    });
  });

  describe('organizationRoleSchema', () => {
    it('accepts valid roles', () => {
      expect(organizationRoleSchema.parse('OWNER')).toBe('OWNER');
      expect(organizationRoleSchema.parse('ADMIN')).toBe('ADMIN');
      expect(organizationRoleSchema.parse('MEMBER')).toBe('MEMBER');
      expect(organizationRoleSchema.parse('GUEST')).toBe('GUEST');
    });

    it('rejects invalid roles', () => {
      expect(() => organizationRoleSchema.parse('SUPERADMIN')).toThrow();
      expect(() => organizationRoleSchema.parse('owner')).toThrow(); // lowercase
      expect(() => organizationRoleSchema.parse('')).toThrow();
    });
  });
});
