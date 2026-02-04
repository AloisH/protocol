import { userRepository } from '../../../features/user/user-repository';
import { defineApiHandler } from '../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Reset onboarding to initial state',
  },
});

export default defineApiHandler(async (ctx) => {
  await userRepository.updateOnboarding(ctx.userId, {
    onboardingCompleted: false,
    onboardingSteps: {},
  });
  return { success: true };
});
