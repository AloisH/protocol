import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  deleteAccountEmailSchema,
  deleteAccountPasswordSchema,
  deleteAccountSchema,
  updateOnboardingSchema,
  updateProfileSchema,
} from './schemas';

describe('user Schemas', () => {
  describe('updateProfileSchema', () => {
    it('accepts valid profile data', () => {
      const result = updateProfileSchema.parse({
        name: 'John Doe',
      });
      expect(result.name).toBe('John Doe');
    });

    it('accepts profile with image URL', () => {
      const result = updateProfileSchema.parse({
        name: 'Jane',
        image: 'https://example.com/avatar.png',
      });
      expect(result.image).toBe('https://example.com/avatar.png');
    });

    it('rejects empty name', () => {
      expect(() => updateProfileSchema.parse({ name: '' })).toThrow();
    });

    it('rejects name over 200 chars', () => {
      expect(() => updateProfileSchema.parse({ name: 'a'.repeat(201) })).toThrow();
    });

    it('rejects invalid image URL', () => {
      expect(() => updateProfileSchema.parse({ name: 'Test', image: 'not-a-url' })).toThrow();
    });
  });

  describe('changePasswordSchema', () => {
    it('accepts valid password change', () => {
      const result = changePasswordSchema.parse({
        currentPassword: 'oldpass',
        newPassword: 'newpassword123',
      });
      expect(result.currentPassword).toBe('oldpass');
      expect(result.newPassword).toBe('newpassword123');
    });

    it('accepts with revokeOtherSessions', () => {
      const result = changePasswordSchema.parse({
        currentPassword: 'old',
        newPassword: 'newpassword',
        revokeOtherSessions: true,
      });
      expect(result.revokeOtherSessions).toBe(true);
    });

    it('rejects empty current password', () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: '',
          newPassword: 'newpassword',
        }),
      ).toThrow();
    });

    it('rejects new password under 8 chars', () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: 'old',
          newPassword: 'short',
        }),
      ).toThrow();
    });
  });

  describe('deleteAccountPasswordSchema', () => {
    it('accepts valid password', () => {
      const result = deleteAccountPasswordSchema.parse({ password: 'mypassword' });
      expect(result.password).toBe('mypassword');
    });

    it('rejects empty password', () => {
      expect(() => deleteAccountPasswordSchema.parse({ password: '' })).toThrow();
    });
  });

  describe('deleteAccountEmailSchema', () => {
    it('accepts valid email', () => {
      const result = deleteAccountEmailSchema.parse({ email: 'user@example.com' });
      expect(result.email).toBe('user@example.com');
    });

    it('rejects invalid email', () => {
      expect(() => deleteAccountEmailSchema.parse({ email: 'not-an-email' })).toThrow();
    });
  });

  describe('deleteAccountSchema', () => {
    it('accepts password only', () => {
      const result = deleteAccountSchema.parse({ password: 'mypass' });
      expect(result.password).toBe('mypass');
    });

    it('accepts email only', () => {
      const result = deleteAccountSchema.parse({ email: 'test@example.com' });
      expect(result.email).toBe('test@example.com');
    });

    it('accepts both password and email', () => {
      const result = deleteAccountSchema.parse({
        password: 'pass',
        email: 'test@example.com',
      });
      expect(result.password).toBe('pass');
      expect(result.email).toBe('test@example.com');
    });

    it('accepts empty object', () => {
      const result = deleteAccountSchema.parse({});
      expect(result.password).toBeUndefined();
      expect(result.email).toBeUndefined();
    });
  });

  describe('updateOnboardingSchema', () => {
    it('accepts valid onboarding step', () => {
      const result = updateOnboardingSchema.parse({
        step: 'profile',
        data: { bio: 'Developer' },
      });
      expect(result.step).toBe('profile');
      expect(result.data.bio).toBe('Developer');
    });

    it('accepts preferences step', () => {
      const result = updateOnboardingSchema.parse({
        step: 'preferences',
        data: { emailNotifications: true },
      });
      expect(result.data.emailNotifications).toBe(true);
    });

    it('accepts useCase step', () => {
      const result = updateOnboardingSchema.parse({
        step: 'useCase',
        data: { useCase: 'business' },
      });
      expect(result.data.useCase).toBe('business');
    });

    it('rejects invalid step', () => {
      expect(() =>
        updateOnboardingSchema.parse({
          step: 'invalid',
          data: {},
        }),
      ).toThrow();
    });

    it('rejects bio over 500 chars', () => {
      expect(() =>
        updateOnboardingSchema.parse({
          step: 'profile',
          data: { bio: 'a'.repeat(501) },
        }),
      ).toThrow();
    });

    it('rejects company over 100 chars', () => {
      expect(() =>
        updateOnboardingSchema.parse({
          step: 'profile',
          data: { company: 'a'.repeat(101) },
        }),
      ).toThrow();
    });

    it('rejects invalid useCase', () => {
      expect(() =>
        updateOnboardingSchema.parse({
          step: 'useCase',
          data: { useCase: 'invalid' },
        }),
      ).toThrow();
    });

    it('accepts all valid useCases', () => {
      for (const useCase of ['personal', 'business', 'agency', 'other']) {
        const result = updateOnboardingSchema.parse({
          step: 'useCase',
          data: { useCase },
        });
        expect(result.data.useCase).toBe(useCase);
      }
    });
  });
});
