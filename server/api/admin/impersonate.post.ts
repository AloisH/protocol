import { startImpersonationSchema } from '#shared/impersonation';
import { impersonationService } from '../../features/impersonation/impersonation-service';
import { requireRole } from '../../utils/require-role';

defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    description: 'Start user impersonation (requires SUPER_ADMIN)',
  },
});

export default defineEventHandler(async (event) => {
  // Check role
  const ctx = await requireRole(event, ['SUPER_ADMIN']);

  // Validate body
  const rawBody: unknown = await readBody(event);
  const validationResult = startImpersonationSchema.safeParse(rawBody);

  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: validationResult.error.issues,
    });
  }

  // Start impersonation
  const log = await impersonationService.startImpersonation(
    ctx.userId,
    validationResult.data,
    event,
  );

  return {
    success: true,
    log,
  };
});
