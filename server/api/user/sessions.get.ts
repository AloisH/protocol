import { serverAuth } from '../../features/auth/auth-session';
import { sessionService } from '../../features/auth/session-service';
import { defineApiHandler } from '../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'List active sessions for current user',
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

  const sessions = await sessionService.listSessions(ctx.userId, currentToken);
  return { sessions };
});
