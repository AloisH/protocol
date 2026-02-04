import { serverAuth } from '../../../features/auth/auth-session';
import { sessionService } from '../../../features/auth/session-service';
import { defineApiHandler } from '../../../utils/api-handler';

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    description: 'Revoke a specific session',
    parameters: [{ in: 'path', name: 'sessionId', required: true, description: 'Session ID' }],
  },
});

export default defineApiHandler(async (ctx) => {
  const sessionId = getRouterParam(ctx.event, 'sessionId');
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'Session ID required',
    });
  }

  const session = await serverAuth().getSession({ headers: ctx.event.headers });
  const currentToken = session?.session.token;

  if (!currentToken) {
    throw createError({
      statusCode: 401,
      message: 'Session token not found',
    });
  }

  await sessionService.revokeSession(sessionId, ctx.userId, currentToken);
  return { success: true };
});
