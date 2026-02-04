import { updateMemberRoleSchema } from '#shared/organization';
import { organizationRepository } from '../../../../../features/organization/organization-repository';
import { organizationService } from '../../../../../features/organization/organization-service';
import { defineValidatedApiHandler } from '../../../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'Update member role (requires OWNER)',
    parameters: [
      { in: 'path', name: 'slug', required: true, description: 'Organization slug' },
      { in: 'path', name: 'userId', required: true, description: 'User ID' },
    ],
  },
});

export default defineValidatedApiHandler(updateMemberRoleSchema, async (ctx) => {
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

  const member = await organizationService.updateMemberRole(
    ctx.userId,
    org.id,
    userId,
    ctx.body!.role,
  );

  return { member };
});
