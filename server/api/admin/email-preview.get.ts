import { render } from '@vue-email/render';
import AccountDeletion from '../../features/email/templates/AccountDeletion.vue';
import MagicLinkEmail from '../../features/email/templates/MagicLinkEmail.vue';
import ResetPasswordEmail from '../../features/email/templates/ResetPasswordEmail.vue';
import VerifyEmail from '../../features/email/templates/VerifyEmail.vue';
import { requireRole } from '../../utils/require-role';

defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    description: 'Preview all email templates (requires ADMIN/SUPER_ADMIN)',
  },
});

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN', 'SUPER_ADMIN']);

  const sampleData = {
    verifyEmail: {
      name: 'John Doe',
      verificationLink: 'https://bistro.dev/auth/verify-email?token=abc123def456',
      email: 'john.doe@example.com',
    },
    resetPassword: {
      name: 'Jane Smith',
      resetLink: 'https://bistro.dev/auth/reset-password?token=xyz789uvw012',
      email: 'jane.smith@example.com',
    },
    magicLink: {
      magicLink: 'https://bistro.dev/auth/magic-link?token=magic123link456',
      email: 'user@example.com',
    },
    accountDeletion: {
      name: 'Bob Johnson',
    },
  };

  const [verifyEmailHtml, verifyEmailText] = await Promise.all([
    render(VerifyEmail, sampleData.verifyEmail, { pretty: true }),
    render(VerifyEmail, sampleData.verifyEmail, { plainText: true }),
  ]);

  const [resetPasswordHtml, resetPasswordText] = await Promise.all([
    render(ResetPasswordEmail, sampleData.resetPassword, { pretty: true }),
    render(ResetPasswordEmail, sampleData.resetPassword, { plainText: true }),
  ]);

  const [magicLinkHtml, magicLinkText] = await Promise.all([
    render(MagicLinkEmail, sampleData.magicLink, { pretty: true }),
    render(MagicLinkEmail, sampleData.magicLink, { plainText: true }),
  ]);

  const [accountDeletionHtml, accountDeletionText] = await Promise.all([
    render(AccountDeletion, sampleData.accountDeletion, { pretty: true }),
    render(AccountDeletion, sampleData.accountDeletion, { plainText: true }),
  ]);

  return {
    templates: [
      {
        id: 'verify-email',
        name: 'Email Verification',
        description: 'Sent when users sign up to verify their email address',
        subject: 'Verify your email address',
        html: verifyEmailHtml,
        text: verifyEmailText,
        props: sampleData.verifyEmail,
      },
      {
        id: 'reset-password',
        name: 'Password Reset',
        description: 'Sent when users request password reset',
        subject: 'Reset your Bistro password',
        html: resetPasswordHtml,
        text: resetPasswordText,
        props: sampleData.resetPassword,
      },
      {
        id: 'magic-link',
        name: 'Magic Link Login',
        description: 'Passwordless authentication link',
        subject: 'Your login link for Bistro',
        html: magicLinkHtml,
        text: magicLinkText,
        props: sampleData.magicLink,
      },
      {
        id: 'account-deletion',
        name: 'Account Deletion',
        description: 'Confirmation email sent after account deletion',
        subject: 'Your Bistro account has been deleted',
        html: accountDeletionHtml,
        text: accountDeletionText,
        props: sampleData.accountDeletion,
      },
    ],
  };
});
