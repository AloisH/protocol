import { describe, expect, it } from 'vitest';
import {
  forgotPasswordSchema,
  magicLinkSchema,
  passwordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from './schemas';

describe('auth Schemas', () => {
  describe('passwordSchema', () => {
    it('accepts valid password with all requirements', () => {
      const result = passwordSchema.parse('Password123');
      expect(result).toBe('Password123');
    });

    it('rejects password under 8 chars', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow(/at least 8 characters/);
    });

    it('rejects password without uppercase', () => {
      expect(() => passwordSchema.parse('password123')).toThrow(/uppercase/);
    });

    it('rejects password without lowercase', () => {
      expect(() => passwordSchema.parse('PASSWORD123')).toThrow(/lowercase/);
    });

    it('rejects password without number', () => {
      expect(() => passwordSchema.parse('Passworddd')).toThrow(/number/);
    });

    it('accepts complex password', () => {
      const result = passwordSchema.parse('MyStr0ngP@ssword!');
      expect(result).toBe('MyStr0ngP@ssword!');
    });
  });

  describe('signInSchema', () => {
    it('accepts valid credentials', () => {
      const result = signInSchema.parse({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(result.email).toBe('user@example.com');
      expect(result.password).toBe('anypassword');
    });

    it('allows weak passwords (existing users)', () => {
      // Sign in doesn't enforce complexity
      const result = signInSchema.parse({
        email: 'user@example.com',
        password: 'weak',
      });
      expect(result.password).toBe('weak');
    });

    it('rejects invalid email', () => {
      expect(() =>
        signInSchema.parse({
          email: 'not-an-email',
          password: 'pass',
        }),
      ).toThrow(/email/i);
    });

    it('rejects empty password', () => {
      expect(() =>
        signInSchema.parse({
          email: 'user@example.com',
          password: '',
        }),
      ).toThrow();
    });
  });

  describe('signUpSchema', () => {
    it('accepts valid sign up data', () => {
      const result = signUpSchema.parse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      });
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('enforces password complexity on sign up', () => {
      expect(() =>
        signUpSchema.parse({
          name: 'John',
          email: 'john@example.com',
          password: 'weak',
        }),
      ).toThrow();
    });

    it('rejects empty name', () => {
      expect(() =>
        signUpSchema.parse({
          name: '',
          email: 'john@example.com',
          password: 'Password123',
        }),
      ).toThrow(/name/i);
    });

    it('rejects invalid email', () => {
      expect(() =>
        signUpSchema.parse({
          name: 'John',
          email: 'invalid',
          password: 'Password123',
        }),
      ).toThrow(/email/i);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('accepts valid email', () => {
      const result = forgotPasswordSchema.parse({ email: 'user@example.com' });
      expect(result.email).toBe('user@example.com');
    });

    it('rejects invalid email', () => {
      expect(() => forgotPasswordSchema.parse({ email: 'invalid' })).toThrow(/email/i);
    });
  });

  describe('resetPasswordSchema', () => {
    it('accepts matching passwords', () => {
      const result = resetPasswordSchema.parse({
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      });
      expect(result.password).toBe('NewPassword123');
    });

    it('rejects non-matching passwords', () => {
      expect(() =>
        resetPasswordSchema.parse({
          password: 'NewPassword123',
          confirmPassword: 'DifferentPassword123',
        }),
      ).toThrow(/match/i);
    });

    it('enforces password complexity', () => {
      expect(() =>
        resetPasswordSchema.parse({
          password: 'weak',
          confirmPassword: 'weak',
        }),
      ).toThrow();
    });
  });

  describe('magicLinkSchema', () => {
    it('accepts valid email', () => {
      const result = magicLinkSchema.parse({ email: 'user@example.com' });
      expect(result.email).toBe('user@example.com');
    });

    it('rejects invalid email', () => {
      expect(() => magicLinkSchema.parse({ email: 'not-email' })).toThrow(/email/i);
    });
  });
});
