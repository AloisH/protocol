import { userRepository } from '../../../features/user/user-repository';
import { requireRole } from '../../../utils/require-role';

defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    description: 'List all users (requires ADMIN/SUPER_ADMIN)',
  },
});

export default defineEventHandler(async (event) => {
  // Check role - both ADMIN and SUPER_ADMIN can view users
  await requireRole(event, ['ADMIN', 'SUPER_ADMIN']);

  // Get all users
  const users = await userRepository.listAllUsers();

  return {
    users,
  };
});
