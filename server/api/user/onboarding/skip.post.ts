import { userService } from '../../../features/user/user-service';
import { defineApiHandler } from '../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Skip onboarding (marks as complete)',
  },
});

export default defineApiHandler(async (ctx) => {
  await userService.skipOnboarding(ctx.userId);
  return { success: true };
});
