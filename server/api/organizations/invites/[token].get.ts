import { organizationRepository } from '../../../features/organization/organization-repository';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'Get invite details by token (public)',
    parameters: [{ in: 'path', name: 'token', required: true, description: 'Invite token' }],
  },
});

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token');
  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Invite token is required',
    });
  }

  // Find invite by token
  const invite = await organizationRepository.findInviteByToken(token);
  if (!invite) {
    throw createError({
      statusCode: 404,
      message: 'Invite not found',
    });
  }

  // Check if expired
  if (invite.expiresAt < new Date()) {
    throw createError({
      statusCode: 400,
      message: 'Invite has expired',
    });
  }

  // Check if already accepted
  if (invite.acceptedAt) {
    throw createError({
      statusCode: 400,
      message: 'Invite has already been accepted',
    });
  }

  // Return invite details (without sensitive data)
  return {
    invite: {
      email: invite.email,
      role: invite.role,
      organization: {
        name: invite.organization.name,
        slug: invite.organization.slug,
        description: invite.organization.description,
      },
      expiresAt: invite.expiresAt,
    },
  };
});
