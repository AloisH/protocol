import { userService } from '../../features/user/user-service';
import { defineApiHandler } from '../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Get current onboarding state',
  },
});

export default defineApiHandler(async (ctx) => {
  const state = await userService.getOnboardingState(ctx.userId);
  return state;
});
