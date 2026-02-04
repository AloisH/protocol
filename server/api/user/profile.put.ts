import { updateProfileSchema } from '#shared/user';
import { userService } from '../../features/user/user-service';
import { defineValidatedApiHandler } from '../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Update user profile (name, image)',
  },
});

export default defineValidatedApiHandler(updateProfileSchema, async (ctx) => {
  const profile = await userService.updateProfile(ctx.userId, ctx.body!);
  return { profile };
});
