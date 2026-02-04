import { requireOrgAccess } from '../../../utils/require-org-access';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'List organization members',
    parameters: [{ in: 'path', name: 'slug', required: true, description: 'Organization slug' }],
  },
});

export default defineEventHandler(async (event) => {
  const ctx = await requireOrgAccess(event);

  const { organizationRepository }
    = await import('../../../features/organization/organization-repository');

  const members = await organizationRepository.findOrganizationMembers(ctx.organizationId);
  const currentMember = await organizationRepository.findMembership(ctx.userId, ctx.organizationId);

  return {
    members,
    currentUserRole: currentMember?.role || 'GUEST',
  };
});
