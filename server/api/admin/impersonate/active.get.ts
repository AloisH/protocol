import { impersonationService } from '../../../features/impersonation/impersonation-service';
import { requireRole } from '../../../utils/require-role';

defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    description: 'Get active impersonation session (requires SUPER_ADMIN)',
  },
});

export default defineEventHandler(async (event) => {
  // Check role
  const ctx = await requireRole(event, ['SUPER_ADMIN']);

  // Get active session
  const activeSession = await impersonationService.getActiveImpersonation(ctx.userId);

  return {
    active: !!activeSession,
    session: activeSession,
  };
});
