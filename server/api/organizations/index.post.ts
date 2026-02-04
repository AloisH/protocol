import { createOrganizationSchema } from '#shared/organization';
import { organizationService } from '../../features/organization/organization-service';
import { defineValidatedApiHandler } from '../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'Create new organization (creator becomes OWNER)',
  },
});

export default defineValidatedApiHandler(createOrganizationSchema, async (ctx) => {
  const organization = await organizationService.createOrganization(ctx.userId, ctx.body!);
  return { organization };
});
