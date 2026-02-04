---
title: User Roles
description: Role-based access control in Bistro
navigation:
  title: User Roles
  order: 4
---

# User Roles

Bistro implements role-based access control (RBAC) at two levels: system-wide and organization-level.

## System Roles

Every user has a system role:

| Role          | Description                               |
| ------------- | ----------------------------------------- |
| `USER`        | Default role for all users                |
| `ADMIN`       | Can access admin panel, view all users    |
| `SUPER_ADMIN` | Full system access, can impersonate users |

### Checking Roles

Use the `useRole` composable:

```vue
<script setup lang="ts">
const { hasRole, isAdmin, isSuperAdmin } = useRole();
</script>

<template>
  <div v-if="isAdmin">
    <NuxtLink to="/admin/users">Admin Panel</NuxtLink>
  </div>
</template>
```

### Server-Side Authorization

Protect API routes with `requireRole`:

```typescript
// server/api/admin/users.get.ts
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN', 'SUPER_ADMIN']);
  // ... fetch users
});
```

## Organization Roles

Within organizations, members have roles:

| Role     | Manage Members | Manage Settings | Delete Org |
| -------- | -------------- | --------------- | ---------- |
| `OWNER`  | ✓              | ✓               | ✓          |
| `ADMIN`  | ✓              | ✓               | ✗          |
| `MEMBER` | ✗              | ✗               | ✗          |
| `GUEST`  | ✗              | ✗               | ✗          |

### Checking Organization Roles

```vue
<script setup lang="ts">
const { currentUserRole, canManageMembers } = useOrganization();
</script>

<template>
  <UButton v-if="canManageMembers"> Manage Members </UButton>
</template>
```

## Admin Impersonation

Super admins can impersonate other users:

1. Go to Admin Panel > Users
2. Click "Impersonate" on a user
3. A banner appears showing active impersonation
4. Click "Stop Impersonation" to return

**Limitations:**

- Cannot impersonate other super admins
- Sessions auto-expire after 1 hour
- All actions are logged

## Setting Up First Admin

1. Create a regular account
2. Open Prisma Studio: `bun db:studio`
3. Find your user in the User table
4. Change `role` to `SUPER_ADMIN`
5. Refresh the page

## Best Practices

1. **Limit super admins** - Only essential personnel
2. **Use org roles** - Prefer organization-level permissions
3. **Audit regularly** - Review admin access logs
4. **Document impersonation** - Always have a reason
