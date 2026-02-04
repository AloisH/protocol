import { ac, roles } from '#shared/auth/access-control';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, magicLink } from 'better-auth/plugins';
import { logAuthEvent } from '../../utils/audit-log';
import { db } from '../../utils/db';
import { getLogger } from '../../utils/logger';
import { log } from '../../utils/request-context';
import { emailService } from '../email/email-service';

// Build socialProviders config conditionally based on env vars
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'USER',
        input: false, // Prevent users from setting role during signup
      },
      onboardingCompleted: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      bio: {
        type: 'string',
        required: false,
        input: false,
      },
      company: {
        type: 'string',
        required: false,
        input: false,
      },
      useCase: {
        type: 'string',
        required: false,
        input: false,
      },
      emailNotifications: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string; name: string };
      url: string;
    }) => {
      if (!emailService.isConfigured()) {
        log.warn('Password reset disabled - email not configured');
        return;
      }

      try {
        await emailService.sendPasswordReset({
          to: user.email,
          name: user.name,
          resetLink: url,
        });
        getLogger().info('Password reset email sent');
      }
      catch (error) {
        getLogger().error({ error }, 'Failed to send password reset email');
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async ({ user, url }) => {
      if (!emailService.isConfigured()) {
        log.warn('Email verification disabled - email not configured');
        return;
      }

      try {
        await emailService.sendEmailVerification({
          to: user.email,
          name: user.name,
          verificationLink: url,
        });
        getLogger().info('Verification email sent');
      }
      catch (error) {
        getLogger().error({ error }, 'Failed to send verification email');
        // Don't throw - allow registration even if email fails
      }
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  trustedOrigins: process.env.AUTH_TRUSTED_ORIGINS?.split(',').map(s => s.trim()) || [
    'http://localhost:3000',
  ],
  socialProviders,
  plugins: [
    admin({
      ac,

      roles: roles as Record<string, any>,
      defaultRole: 'USER',
      impersonationSessionDuration: 60 * 60, // 1 hour
      allowImpersonatingAdmins: false, // Cannot impersonate other admins
      adminRoles: ['SUPER_ADMIN', 'ADMIN'], // Roles that can use admin features
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (!emailService.isConfigured()) {
          log.warn('Magic link disabled - email not configured');
          return;
        }

        try {
          await emailService.sendMagicLink({
            to: email,
            magicLink: url,
          });
          getLogger().info('Magic link sent');
        }
        catch (error) {
          getLogger().error({ error }, 'Failed to send magic link');
        }
      },
      expiresIn: 60 * 15, // 15 min
      disableSignUp: false, // Allow new user registration
    }),
  ],
});

// Export for audit logging utility access
export { logAuthEvent };
