import { updateRoleSchema } from '#shared/role';
import { userRepository } from '../../../../features/user/user-repository';
import { requireRole } from '../../../../utils/require-role';

defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    description: 'Update user role (requires SUPER_ADMIN)',
    parameters: [{ in: 'path', name: 'userId', required: true, description: 'User ID' }],
  },
});

export default defineEventHandler(async (event) => {
  // Check role - only SUPER_ADMIN can change roles
  const ctx = await requireRole(event, ['SUPER_ADMIN']);

  // Get user ID from route params
  const targetUserId = getRouterParam(event, 'userId');
  if (!targetUserId) {
    throw createError({
      statusCode: 400,
      message: 'User ID required',
    });
  }

  // Validate body
  const rawBody: unknown = await readBody(event);
  const validationResult = updateRoleSchema.safeParse(rawBody);

  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: validationResult.error.issues,
    });
  }

  // Prevent self-demotion
  if (targetUserId === ctx.userId && validationResult.data.role !== 'SUPER_ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Cannot demote yourself',
    });
  }

  // Update role
  const user = await userRepository.updateRole(targetUserId, validationResult.data.role);

  return {
    success: true,
    user,
  };
});
