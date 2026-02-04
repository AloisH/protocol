import { updateOnboardingSchema } from '#shared/user';
import { userService } from '../../features/user/user-service';
import { defineValidatedApiHandler } from '../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Update onboarding step data',
  },
});

export default defineValidatedApiHandler(updateOnboardingSchema, async (ctx) => {
  const state = await userService.updateOnboarding(ctx.userId, ctx.body!);
  return state;
});
