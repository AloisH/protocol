import { serverAuth } from '../../../features/auth/auth-session';
import { sessionService } from '../../../features/auth/session-service';
import { defineApiHandler } from '../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Revoke all sessions except current',
  },
});

export default defineApiHandler(async (ctx) => {
  const session = await serverAuth().getSession({ headers: ctx.event.headers });
  const currentToken = session?.session.token;

  if (!currentToken) {
    throw createError({
      statusCode: 401,
      message: 'Session token not found',
    });
  }

  const count = await sessionService.revokeOtherSessions(currentToken, ctx.userId);
  return { count };
});
