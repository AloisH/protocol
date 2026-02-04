# Organization Management

Multi-tenant organization UI components.

## Components

- `OrganizationMembers.vue` - Member list with invite modal, role management
  - Props: `organizationSlug: string`
  - Features: Email invite, role update, member removal

- `OrganizationSwitcher.vue` - Dropdown to switch between user's organizations
  - Shows all user's orgs
  - "Create Organization" option
  - Uses ClientOnly wrapper

## Composable

- `composables/organization/useOrganization.ts` - Organization state
  - `organizations`, `currentOrganization`, `currentOrgSlug`, `currentOrgId` - Org context
  - `members`, `currentUserRole` - Member state
  - `canManageMembers`, `canDeleteOrg` - Permission checks
  - `fetchOrganizations()`, `fetchMembers(slug)` - Load data
  - `switchOrganization(slug)` - Switch active org
  - `fetching`, `switching` - Loading states

## Dependencies

- Server: `/api/organizations/*` endpoints
- Middleware: `require-organization.global.ts` (enforces org selection)
- Composables: Auto-imported (useAuth)

## Usage

```vue
<script setup lang="ts">
const { currentOrganization, switchOrganization, canManageMembers } = useOrganization();

onMounted(async () => {
  await fetchOrganizations();
});

// Switch org
await switchOrganization('new-org-slug');
</script>

<template>
  <OrganizationSwitcher />
  <OrganizationMembers :organization-slug="currentOrgSlug" />
</template>
```

**Role hierarchy:** OWNER > ADMIN > MEMBER > GUEST

**Route pattern:** `/org/[slug]/*` - All org-scoped pages use slug

See: [server/CLAUDE.md](../../../server/CLAUDE.md) for org access control
