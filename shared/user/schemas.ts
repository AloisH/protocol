import { z } from 'zod';
import {
  BIO_MAX_LENGTH,
  COMPANY_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  ONBOARDING_STEPS,
  PASSWORD_MIN_LENGTH,
  USE_CASES,
} from './constants';

/**
 * User validation schemas
 */

export const updateProfileSchema = z.object({
  name: z.string().min(NAME_MIN_LENGTH, 'Name is required').max(NAME_MAX_LENGTH),
  image: z.url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(NAME_MIN_LENGTH, 'Current password is required'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  revokeOtherSessions: z.boolean().optional(),
});

export const deleteAccountPasswordSchema = z.object({
  password: z.string().min(NAME_MIN_LENGTH, 'Password is required'),
});

export const deleteAccountEmailSchema = z.object({
  email: z.email('Invalid email address'),
});

export const deleteAccountSchema = z.object({
  password: z.string().optional(),
  email: z.email().optional(),
});

export const updateOnboardingSchema = z.object({
  step: z.enum(ONBOARDING_STEPS),
  data: z.object({
    bio: z.string().max(BIO_MAX_LENGTH).optional(),
    company: z.string().max(COMPANY_MAX_LENGTH).optional(),
    emailNotifications: z.boolean().optional(),
    useCase: z.enum(USE_CASES).optional(),
  }),
});

/** Schema for onboardingSteps JSON field */
export const onboardingStepsSchema = z.record(z.enum(ONBOARDING_STEPS), z.boolean());

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountPasswordInput = z.infer<typeof deleteAccountPasswordSchema>;
export type DeleteAccountEmailInput = z.infer<typeof deleteAccountEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>;
export type OnboardingSteps = z.infer<typeof onboardingStepsSchema>;
