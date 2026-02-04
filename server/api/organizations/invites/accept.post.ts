import { organizationService } from '../../../features/organization/organization-service';
import { defineApiHandler } from '../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'Accept organization invite with token',
  },
});

export default defineApiHandler(async (ctx) => {
  const body = await readBody<{ token?: string }>(ctx.event);

  if (!body.token) {
    throw createError({
      statusCode: 400,
      message: 'Invite token is required',
    });
  }

  // Accept invite (validates token, email match, expiry)
  const member = await organizationService.acceptInvite(ctx.userId, body.token);
  return { member };
});
