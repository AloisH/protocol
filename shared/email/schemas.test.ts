import { describe, expect, it } from 'vitest';
import { sendEmailSchema } from './schemas';

describe('email Schemas', () => {
  describe('sendEmailSchema', () => {
    it('accepts single email recipient', () => {
      const result = sendEmailSchema.parse({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      });
      expect(result.to).toBe('user@example.com');
    });

    it('accepts array of email recipients', () => {
      const result = sendEmailSchema.parse({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      });
      expect(result.to).toHaveLength(2);
    });

    it('accepts optional text content', () => {
      const result = sendEmailSchema.parse({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>HTML</p>',
        text: 'Plain text',
      });
      expect(result.text).toBe('Plain text');
    });

    it('accepts optional from address', () => {
      const result = sendEmailSchema.parse({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
        from: 'sender@example.com',
      });
      expect(result.from).toBe('sender@example.com');
    });

    it('accepts optional replyTo address', () => {
      const result = sendEmailSchema.parse({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
        replyTo: 'reply@example.com',
      });
      expect(result.replyTo).toBe('reply@example.com');
    });

    it('rejects invalid to email', () => {
      expect(() =>
        sendEmailSchema.parse({
          to: 'not-an-email',
          subject: 'Test',
          html: '<p>Content</p>',
        }),
      ).toThrow();
    });

    it('rejects invalid email in array', () => {
      expect(() =>
        sendEmailSchema.parse({
          to: ['valid@example.com', 'invalid'],
          subject: 'Test',
          html: '<p>Content</p>',
        }),
      ).toThrow();
    });

    it('rejects empty subject', () => {
      expect(() =>
        sendEmailSchema.parse({
          to: 'user@example.com',
          subject: '',
          html: '<p>Content</p>',
        }),
      ).toThrow();
    });

    it('rejects empty html', () => {
      expect(() =>
        sendEmailSchema.parse({
          to: 'user@example.com',
          subject: 'Test',
          html: '',
        }),
      ).toThrow();
    });

    it('rejects invalid from email', () => {
      expect(() =>
        sendEmailSchema.parse({
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>Content</p>',
          from: 'invalid',
        }),
      ).toThrow();
    });

    it('rejects invalid replyTo email', () => {
      expect(() =>
        sendEmailSchema.parse({
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>Content</p>',
          replyTo: 'invalid',
        }),
      ).toThrow();
    });
  });
});
