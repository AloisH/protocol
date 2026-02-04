import type { SendEmailInput } from '#shared/email';
import type { ExtractComponentProps } from '@vue-email/render';
import type { Component } from 'vue';
import { sendEmailSchema } from '#shared/email';
import { render } from '@vue-email/render';
import { getLogger } from '../../utils/logger';
import { log } from '../../utils/request-context';
import { resend } from './email-client';
import AccountDeletion from './templates/AccountDeletion.vue';
import MagicLinkEmail from './templates/MagicLinkEmail.vue';
import ResetPasswordEmail from './templates/ResetPasswordEmail.vue';
import VerifyEmail from './templates/VerifyEmail.vue';

interface SendTemplateEmailOptions<T extends Component> {
  to: string | string[];
  subject: string;
  template: T;
  props: ExtractComponentProps<T>;
  from?: string;
  replyTo?: string;
}

/**
 * Email service
 * Handles sending emails via Resend with vue-email templates
 */
export class EmailService {
  /**
   * Get default sender email
   */
  private getDefaultFrom(): string {
    return process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!resend;
  }

  /**
   * Send email with HTML content
   */
  async sendEmail(options: SendEmailInput): Promise<{ id: string } | null> {
    if (!resend) {
      log.warn('Email not sent - service not configured');
      return null;
    }

    const validated = sendEmailSchema.parse(options);

    try {
      const result = await resend.emails.send({
        from: validated.from ?? this.getDefaultFrom(),
        to: validated.to,
        subject: validated.subject,
        html: validated.html,
        text: validated.text,
        replyTo: validated.replyTo,
      });

      if (result.error) {
        getLogger().error({ error: result.error }, 'Resend API error');
        throw createError({
          statusCode: 500,
          message: 'Failed to send email',
          data: result.error,
        });
      }

      return { id: result.data.id };
    }
    catch (error) {
      getLogger().error({ error }, 'Failed to send email');
      throw createError({
        statusCode: 500,
        message: 'Failed to send email',
      });
    }
  }

  /**
   * Send email with vue-email template
   */
  async sendTemplateEmail<T extends Component>(
    options: SendTemplateEmailOptions<T>,
  ): Promise<{ id: string } | null> {
    if (!resend) {
      log.warn('Email not sent - service not configured');
      return null;
    }

    const html = await render(options.template, options.props, {
      pretty: process.env.NODE_ENV !== 'production',
    });

    const text = await render(options.template, options.props, {
      plainText: true,
    });

    return this.sendEmail({
      to: options.to,
      subject: options.subject,
      html,
      text,
      from: options.from,
      replyTo: options.replyTo,
    });
  }

  /**
   * Send email verification link
   */
  async sendEmailVerification(options: {
    to: string;
    name: string;
    verificationLink: string;
  }): Promise<{ id: string } | null> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: 'Verify your email address',
      template: VerifyEmail as Component,
      props: {
        name: options.name,
        verificationLink: options.verificationLink,
        email: options.to,
      },
    });
  }

  /**
   * Send password reset link
   */
  async sendPasswordReset(options: {
    to: string;
    name: string;
    resetLink: string;
  }): Promise<{ id: string } | null> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: 'Reset your Bistro password',
      template: ResetPasswordEmail as Component,
      props: {
        name: options.name,
        resetLink: options.resetLink,
        email: options.to,
      },
    });
  }

  /**
   * Send magic link authentication email
   */
  async sendMagicLink(options: { to: string; magicLink: string }): Promise<{ id: string } | null> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: 'Your login link for Bistro',
      template: MagicLinkEmail as Component,
      props: {
        magicLink: options.magicLink,
        email: options.to,
      },
    });
  }

  /**
   * Send account deletion confirmation email
   */
  async sendAccountDeletion(options: {
    to: string;
    name?: string;
  }): Promise<{ id: string } | null> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: 'Your Bistro account has been deleted',
      template: AccountDeletion as Component,
      props: {
        name: options.name,
      },
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
