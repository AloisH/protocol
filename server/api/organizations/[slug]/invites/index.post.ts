import { inviteMemberSchema } from '#shared/organization';
import { organizationRepository } from '../../../../features/organization/organization-repository';
import { organizationService } from '../../../../features/organization/organization-service';
import { defineValidatedApiHandler } from '../../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'Invite member to organization (requires OWNER/ADMIN)',
    parameters: [{ in: 'path', name: 'slug', required: true, description: 'Organization slug' }],
  },
});

export default defineValidatedApiHandler(inviteMemberSchema, async (ctx) => {
  const slug = getRouterParam(ctx.event, 'slug');
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Organization slug is required',
    });
  }

  // Lookup organization by slug
  const org = await organizationRepository.findBySlug(slug);
  if (!org) {
    throw createError({
      statusCode: 404,
      message: 'Organization not found',
    });
  }

  // Create invite (service checks OWNER/ADMIN permissions)
  const invite = await organizationService.inviteMember(ctx.userId, org.id, ctx.body!);
  return { invite };
});
