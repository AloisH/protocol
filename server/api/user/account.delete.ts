import { userService } from '../../features/user/user-service';
import { defineApiHandler } from '../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Delete user account (requires password or email confirmation)',
  },
});

export default defineApiHandler(async (ctx) => {
  const body = await readBody<{ password?: string; email?: string }>(ctx.event);

  if (body.password) {
    await userService.deleteAccountWithPassword(ctx.userId, body.password);
  }
  else if (body.email) {
    await userService.deleteAccountWithEmail(ctx.userId, body.email);
  }
  else {
    throw createError({
      statusCode: 400,
      message: 'Password or email required',
    });
  }

  return { success: true };
});
