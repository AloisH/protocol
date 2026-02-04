import { requireOrgAccess } from '../../../../utils/require-org-access';

defineRouteMeta({
  openAPI: {
    tags: ['Organizations'],
    description: 'List organization invites (requires OWNER/ADMIN)',
    parameters: [{ in: 'path', name: 'slug', required: true, description: 'Organization slug' }],
  },
});

export default defineEventHandler(async (event) => {
  // Check user is OWNER or ADMIN
  const ctx = await requireOrgAccess(event, {
    allowedRoles: ['OWNER', 'ADMIN'],
  });

  // Get all invites for organization
  const { organizationRepository }
    = await import('../../../../features/organization/organization-repository');
  const invites = await organizationRepository.findInvitesByOrganization(ctx.organizationId);

  return { invites };
});
