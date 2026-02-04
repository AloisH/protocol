import type { Component } from 'vue';
import { render } from '@vue-email/render';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resend } from './email-client';
import { EmailService } from './email-service';

type SendEmailResult = Awaited<ReturnType<NonNullable<typeof resend>['emails']['send']>>;

// Mock resend
vi.mock('./email-client', () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}));

// Mock vue-email render
vi.mock('@vue-email/render', () => ({
  render: vi.fn(),
}));

// Mock createError
vi.mock('h3', () => ({
  createError: vi.fn((error: { statusCode: number; message: string }) => error),
}));

const mockEmails = vi.mocked(resend!.emails);
const mockRender = vi.mocked(render);

// Mock success response
const mockEmailResponse = {
  data: { id: 'test-email-id' },
  error: null,
} as unknown as SendEmailResult;

describe('emailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService();
    mockEmails.send.mockResolvedValue(mockEmailResponse);
    mockRender.mockResolvedValue('<html>rendered</html>');
  });

  describe('isConfigured', () => {
    it('returns true when resend is configured', () => {
      expect(emailService.isConfigured()).toBe(true);
    });
  });

  describe('sendEmail', () => {
    it('sends email successfully with valid input', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result).toEqual({ id: 'test-email-id' });
      expect(mockEmails.send).toHaveBeenCalledWith({
        from: 'noreply@resend.dev',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: undefined,
        replyTo: undefined,
      });
    });

    it('sends email to multiple recipients', async () => {
      await emailService.sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockEmails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
        }),
      );
    });

    it('uses custom sender when provided', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        from: 'custom@example.com',
      });

      expect(mockEmails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        }),
      );
    });

    it('includes replyTo when provided', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        replyTo: 'reply@example.com',
      });

      expect(mockEmails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'reply@example.com',
        }),
      );
    });

    it('throws error when Resend API returns error', async () => {
      const errorResponse = {
        data: null,
        error: { message: 'Invalid API key', name: 'validation_error' },
      } as unknown as SendEmailResult;
      mockEmails.send.mockResolvedValue(errorResponse);

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to send email',
      });
    });

    it('throws error when send fails', async () => {
      mockEmails.send.mockRejectedValue(new Error('Network error'));

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to send email',
      });
    });

    it('validates email format', async () => {
      await expect(
        emailService.sendEmail({
          to: 'invalid-email',
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      ).rejects.toThrow();
    });

    it('validates required fields', async () => {
      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: '',
          html: '<p>Test</p>',
        }),
      ).rejects.toThrow();
    });
  });

  describe('sendTemplateEmail', () => {
    const mockTemplate = { name: 'TestTemplate' } as Component;

    it('renders template and sends email', async () => {
      mockRender
        .mockResolvedValueOnce('<html>rendered html</html>')
        .mockResolvedValueOnce('rendered text');

      const result = await emailService.sendTemplateEmail({
        to: 'test@example.com',
        subject: 'Test Template',
        template: mockTemplate,
        props: { name: 'John' },
      });

      expect(result).toEqual({ id: 'test-email-id' });

      // Check render was called twice (HTML + text)
      expect(mockRender).toHaveBeenCalledTimes(2);
      expect(mockRender).toHaveBeenNthCalledWith(
        1,
        mockTemplate,
        { name: 'John' },
        { pretty: expect.any(Boolean) },
      );
      expect(mockRender).toHaveBeenNthCalledWith(
        2,
        mockTemplate,
        { name: 'John' },
        { plainText: true },
      );

      // Check email was sent with rendered content
      expect(mockEmails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<html>rendered html</html>',
          text: 'rendered text',
        }),
      );
    });

    it('passes custom from and replyTo to sendEmail', async () => {
      await emailService.sendTemplateEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: mockTemplate,
        props: {},
        from: 'custom@example.com',
        replyTo: 'reply@example.com',
      });

      expect(mockEmails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
          replyTo: 'reply@example.com',
        }),
      );
    });
  });

  describe('sendEmailVerification', () => {
    it('sends verification email with correct params', async () => {
      const result = await emailService.sendEmailVerification({
        to: 'test@example.com',
        name: 'Test User',
        verificationLink: 'https://example.com/verify?token=abc',
      });

      expect(result).toEqual({ id: 'test-email-id' });
      expect(mockRender).toHaveBeenCalled();
    });

    it('includes email in props', async () => {
      await emailService.sendEmailVerification({
        to: 'user@example.com',
        name: 'User',
        verificationLink: 'https://example.com/verify',
      });

      expect(mockRender).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'user@example.com',
          name: 'User',
          verificationLink: 'https://example.com/verify',
        }),
        expect.anything(),
      );
    });
  });

  describe('sendPasswordReset', () => {
    it('sends password reset email with correct params', async () => {
      const result = await emailService.sendPasswordReset({
        to: 'test@example.com',
        name: 'Test User',
        resetLink: 'https://example.com/reset?token=abc',
      });

      expect(result).toEqual({ id: 'test-email-id' });
      expect(mockRender).toHaveBeenCalled();
    });

    it('uses correct subject', async () => {
      await emailService.sendPasswordReset({
        to: 'test@example.com',
        name: 'Test User',
        resetLink: 'https://example.com/reset',
      });

      expect(mockEmails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Reset your Bistro password',
        }),
      );
    });

    it('includes email in props', async () => {
      await emailService.sendPasswordReset({
        to: 'user@example.com',
        name: 'User',
        resetLink: 'https://example.com/reset',
      });

      expect(mockRender).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'user@example.com',
          name: 'User',
          resetLink: 'https://example.com/reset',
        }),
        expect.anything(),
      );
    });
  });

  describe('sendAccountDeletion', () => {
    it('sends deletion email with correct subject', async () => {
      const result = await emailService.sendAccountDeletion({
        to: 'test@example.com',
        name: 'Test User',
      });

      expect(result).toEqual({ id: 'test-email-id' });
      expect(mockRender).toHaveBeenCalled();
      expect(mockEmails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Bistro account has been deleted',
        }),
      );
    });

    it('passes name in props', async () => {
      await emailService.sendAccountDeletion({
        to: 'user@example.com',
        name: 'John Doe',
      });

      expect(mockRender).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'John Doe',
        }),
        expect.anything(),
      );
    });

    it('works without name (optional)', async () => {
      const result = await emailService.sendAccountDeletion({
        to: 'user@example.com',
      });

      expect(mockRender).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: undefined,
        }),
        expect.anything(),
      );
      expect(result).toEqual({ id: 'test-email-id' });
    });
  });
});
