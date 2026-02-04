import { organizationRepository } from '../../../../features/organization/organization-repository';
import { organizationService } from '../../../../features/organization/organization-service';
import { defineApiHandler } from '../../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'Remove member from organization (requires OWNER/ADMIN)',
    parameters: [
      { in: 'path', name: 'slug', required: true, description: 'Organization slug' },
      { in: 'path', name: 'userId', required: true, description: 'User ID to remove' },
    ],
  },
});

export default defineApiHandler(async (ctx) => {
  const slug = getRouterParam(ctx.event, 'slug');
  const userId = getRouterParam(ctx.event, 'userId');

  if (!slug || !userId) {
    throw createError({
      statusCode: 400,
      message: 'Slug and userId required',
    });
  }

  const org = await organizationRepository.findBySlug(slug);
  if (!org) {
    throw createError({
      statusCode: 404,
      message: 'Organization not found',
    });
  }

  await organizationService.removeMember(ctx.userId, org.id, userId);
  return { success: true };
});
