import { z } from 'zod';
import {
  ORG_DESCRIPTION_MAX_LENGTH,
  ORG_NAME_MAX_LENGTH,
  ORG_NAME_MIN_LENGTH,
  ORG_ROLES,
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  SLUG_REGEX,
} from './constants';

/**
 * Organization validation schemas
 */

/**
 * Organization role enum matching Prisma
 */
export const organizationRoleSchema = z.enum(ORG_ROLES);

export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

/**
 * Organization slug validation
 * - Lowercase alphanumeric + hyphens
 * - 2-50 characters
 * - No leading/trailing hyphens
 */
export const slugSchema = z
  .string()
  .min(SLUG_MIN_LENGTH, `Slug must be at least ${SLUG_MIN_LENGTH} characters`)
  .max(SLUG_MAX_LENGTH, `Slug must be at most ${SLUG_MAX_LENGTH} characters`)
  .regex(SLUG_REGEX, 'Slug must be lowercase alphanumeric with hyphens');

/**
 * Create organization schema
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(ORG_NAME_MIN_LENGTH, 'Name is required')
    .max(ORG_NAME_MAX_LENGTH, `Name must be at most ${ORG_NAME_MAX_LENGTH} characters`),
  slug: slugSchema,
  description: z
    .string()
    .max(
      ORG_DESCRIPTION_MAX_LENGTH,
      `Description must be at most ${ORG_DESCRIPTION_MAX_LENGTH} characters`,
    )
    .optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/**
 * Update organization schema
 */
export const updateOrganizationSchema = createOrganizationSchema.partial();

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

/**
 * Invite member schema
 */
export const inviteMemberSchema = z.object({
  email: z.email('Invalid email address'),
  role: organizationRoleSchema.default('MEMBER'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/**
 * Update member role schema
 */
export const updateMemberRoleSchema = z.object({
  role: organizationRoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
