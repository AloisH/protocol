# Admin Features

SUPER_ADMIN role features (impersonation, user management).

## Components

- `AdminImpersonationBanner.vue` - Global banner shown during active impersonation
  - Shows target user email
  - "Stop Impersonation" button
  - Auto-hides when not impersonating

- `AdminSessionList.vue` - User session list for admin panel
  - Props: `userId: string`
  - Shows all sessions for a user
  - Device info, last active, revoke capability

## Composable

- `composables/admin/useImpersonation.ts` - Impersonation state
  - `isImpersonating`, `impersonatedUser` - Active impersonation state
  - `startImpersonation(userId)` - Start impersonating user
  - `stopImpersonation()` - End impersonation session
  - `checkImpersonation()` - Check if currently impersonating

## Dependencies

- Server: `/api/admin/impersonate/*` (SUPER_ADMIN only)
- Better Auth: Admin plugin with impersonation
- Composables: Auto-imported (useAuth, useRole)

## Usage

```vue
<script setup lang="ts">
const { isSuperAdmin } = useRole();
const { isImpersonating, startImpersonation, stopImpersonation } = useImpersonation();

// Start impersonating
await startImpersonation('user-id-here');

// Stop
await stopImpersonation();
</script>

<template>
  <!-- Global banner (add to app.vue) -->
  <AdminImpersonationBanner />

  <!-- Admin panel -->
  <div v-if="isSuperAdmin">
    <AdminSessionList :user-id="targetUserId" />
  </div>
</template>
```

**Security:**

- SUPER_ADMIN role required
- Cannot impersonate other SUPER_ADMINs
- 1-hour auto-expiration
- Audit logging in ImpersonationLog table

**Admin routes:** `/admin/users` (user list with impersonate button)

See: [server/CLAUDE.md](../../../server/CLAUDE.md) for RBAC patterns
