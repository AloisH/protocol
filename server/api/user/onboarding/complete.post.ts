import { userService } from '../../../features/user/user-service';
import { defineApiHandler } from '../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Mark onboarding as complete',
  },
});

export default defineApiHandler(async (ctx) => {
  await userService.completeOnboarding(ctx.userId);
  return { success: true };
});
