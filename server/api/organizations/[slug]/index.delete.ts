import { organizationRepository } from '../../../features/organization/organization-repository';
import { organizationService } from '../../../features/organization/organization-service';
import { defineApiHandler } from '../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'Delete organization (requires OWNER)',
    parameters: [{ in: 'path', name: 'slug', required: true, description: 'Organization slug' }],
  },
});

export default defineApiHandler(async (ctx) => {
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

  // Delete (service checks OWNER permission)
  await organizationService.deleteOrganization(ctx.userId, org.id);
  return { success: true };
});
