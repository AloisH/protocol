/**
 * Organization constants
 */

export const SLUG_MIN_LENGTH = 2;
export const SLUG_MAX_LENGTH = 50;
export const ORG_NAME_MIN_LENGTH = 1;
export const ORG_NAME_MAX_LENGTH = 100;
export const ORG_DESCRIPTION_MAX_LENGTH = 500;

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ORG_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as const;
