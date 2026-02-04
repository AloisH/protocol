# Admin Components System

Admin impersonation and user management features for SUPER_ADMIN role.

**Related:** authentication_system.md, database_schema.md

---

## Overview

**Purpose:** Allow SUPER_ADMIN to impersonate users, view sessions, audit activity

**Components:** 2 (ImpersonationBanner, SessionList)

**Composables:** useImpersonation (state + methods)

**Security:** SUPER_ADMIN role required, cannot impersonate other SUPER_ADMINs, 1-hour auto-expiration, audit logging

**Pages:** `/admin/users` (admin panel)

---

## Architecture

### Role-Based Access Control (RBAC)

**Roles hierarchy:**

- SUPER_ADMIN (full access, impersonation)
- ADMIN (limited admin features)
- USER (normal user)

**Permission checks:**

- `useRole().isSuperAdmin` - Client-side role check
- `requireRole(['SUPER_ADMIN'])` - Server-side middleware
- Routes: `/admin/*` protected by role check

**Impersonation restrictions:**

- SUPER_ADMIN can impersonate USER and ADMIN
- SUPER_ADMIN cannot impersonate other SUPER_ADMIN
- 1-hour auto-expiration (Better Auth default)
- Audit trail in ImpersonationLog table

---

## Component Reference

### ImpersonationBanner

**File:** `/home/alois/bistro/app/components/admin/ImpersonationBanner.vue`

**Purpose:** Global warning banner during active impersonation

**Props:** None

**State:** Uses `useImpersonation()` composable

**Display:**

- Fixed top banner (z-50, above all content)
- Warning color scheme (warning-100/warning-950 bg)
- Animated pulse icon (i-lucide-alert-triangle)
- Target user name/email display
- "Stop" button (warning color, with loading state)
- Spacer div below (73px) to prevent content overlap

**Features:**

- Auto-checks impersonation on mount
- Only renders if `isImpersonating === true`
- Responsive layout (flex, gap-4)
- Toast notification on stop success/error
- Redirects to `/admin/users` after stop

**Styling:**

- Fixed positioning, full width
- Warning color scheme throughout
- Animate-in slide from top
- Backdrop blur for glassmorphism
- Shadow effects

**Pattern:**

```vue
<script setup>
const { isImpersonating, impersonatedUser, stopImpersonation, checkImpersonation } =
  useImpersonation();
const loading = ref(false);

onMounted(async () => {
  await checkImpersonation(); // Check on mount
});

async function handleStop() {
  loading.value = true;
  const result = await stopImpersonation();
  loading.value = false;

  if (result.success) {
    toast.add({ title: 'Stopped', color: 'success' });
    await navigateTo('/admin/users');
  } else {
    toast.add({ title: 'Error', color: 'error' });
  }
}
</script>

<template>
  <div v-if="isImpersonating" class="fixed top-0 ...">
    <!-- Banner content -->
  </div>
  <div v-if="isImpersonating" class="h-[73px]" />
  <!-- Spacer -->
</template>
```

**Integration:** Add to app.vue root layout for global visibility

---

### SessionList

**File:** `/home/alois/bistro/app/components/admin/SessionList.vue`

**Purpose:** Presentational component for displaying user sessions

**Props:**

```typescript
{
  sessions: SessionWithMetadata[],
  loading?: boolean  // For revoke button state
}
```

**Events:**

```typescript
{
  'revoke': [sessionId: string]
}
```

**SessionWithMetadata type:**

```typescript
{
  id: string,
  isCurrent: boolean,
  browser: string,
  os: string,
  device: string,  // 'Mobile' | 'Tablet' | 'Desktop'
  ipAddress: string | null,
  createdAt: Date,
  lastActive: Date
}
```

**Display per session:**

- Device icon (smartphone/tablet/monitor)
- Browser + OS (e.g., "Chrome on macOS")
- "Current Session" badge (if isCurrent)
- IP address (with map-pin icon)
- Last active time (relative format)
- Revoke button (disabled for current session)

**Empty state:**

- Shield-off icon
- "No active sessions found"

**Helpers:**

- `getDeviceIcon(device)` - Maps device type to Lucide icon
- `formatTime(date)` - Relative time formatting (same as TodoList pattern)

**Pattern:**

```vue
<script setup>
defineProps<{ sessions: SessionWithMetadata[], loading?: boolean }>();
defineEmits<{ revoke: [id: string] }>();

function getDeviceIcon(device: string): string {
  if (device === 'Mobile') return 'i-lucide-smartphone';
  if (device === 'Tablet') return 'i-lucide-tablet';
  return 'i-lucide-monitor';
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="session in sessions" :key="session.id">
      <!-- Session card -->
      <UButton v-if="!session.isCurrent" @click="$emit('revoke', session.id)"> Revoke </UButton>
    </div>
  </div>
</template>
```

**Usage:** Embedded in SessionManagement (profile) or admin user detail page

---

## Composable Reference

### useImpersonation

**File:** `/home/alois/bistro/app/composables/admin/useImpersonation.ts`

**Purpose:** Manage impersonation state and operations

**State:**

```typescript
const isImpersonating = useState('impersonating', () => false);
const impersonatedUser = useState<User | null>('impersonatedUser', () => null);
```

**Methods:**

```typescript
// Start impersonating a user
startImpersonation(userId: string, reason?: string): Promise<{
  success: boolean,
  error?: string
}>

// Stop impersonation
stopImpersonation(): Promise<{
  success: boolean,
  error?: string
}>

// Check if currently impersonating
checkImpersonation(): Promise<void>
```

**Implementation details:**

**startImpersonation:**

1. POST /api/admin/impersonate with { userId, reason }
2. Fetch updated session (now as impersonated user)
3. Set isImpersonating = true
4. Return success/error

**stopImpersonation:**

1. POST /api/admin/impersonate/stop
2. Clear state (isImpersonating = false, impersonatedUser = null)
3. Full page reload to `/admin/users` (window.location.href)
4. Reload needed to clear cached session state

**checkImpersonation:**

1. GET /api/admin/impersonate/active
2. Update state based on response
3. Catch errors silently (not impersonating or unauthorized)

**Pattern:**

```vue
<script setup>
const { isImpersonating, impersonatedUser, startImpersonation, stopImpersonation, checkImpersonation } = useImpersonation();

// Check on mount
onMounted(async () => {
  await checkImpersonation();
});

// Start impersonation
async function impersonate(userId: string) {
  const result = await startImpersonation(userId, 'Admin debugging');
  if (result.success) {
    toast.add({ title: 'Impersonating user', color: 'success' });
    await navigateTo('/org/[slug]/dashboard');
  } else {
    toast.add({ title: result.error, color: 'error' });
  }
}

// Stop impersonation
async function stop() {
  await stopImpersonation(); // Redirects to /admin/users
}
</script>
```

---

## API Integration

**Endpoints:**

| Endpoint                          | Method | Purpose              | Role Required |
| --------------------------------- | ------ | -------------------- | ------------- |
| POST /api/admin/impersonate       | POST   | Start impersonation  | SUPER_ADMIN   |
| POST /api/admin/impersonate/stop  | POST   | Stop impersonation   | SUPER_ADMIN   |
| GET /api/admin/impersonate/active | GET    | Check active session | SUPER_ADMIN   |
| GET /api/admin/sessions           | GET    | List user sessions   | ADMIN+        |

**Impersonation flow:**

1. Admin navigates to `/admin/users`
2. Clicks "Impersonate" button for target user
3. POST /api/admin/impersonate with userId
4. Better Auth creates impersonation session
5. Session switches to target user context
6. Banner appears, actions performed as user
7. Click "Stop" to end impersonation
8. POST /api/admin/impersonate/stop
9. Session restored to admin, redirect to /admin/users

---

## Security Features

**Role enforcement:**

- Server: requireRole(['SUPER_ADMIN']) middleware on all admin endpoints
- Client: v-if="isSuperAdmin" for UI visibility
- Double-checked on server (never trust client)

**Impersonation restrictions:**

- Cannot impersonate SUPER_ADMIN (enforced server-side)
- 1-hour auto-expiration (Better Auth default)
- Reason field for audit trail (optional but recommended)
- ImpersonationLog table tracks all activity

**Audit logging:**

```prisma
model ImpersonationLog {
  id             String   @id @default(cuid())
  adminId        String   // Who started impersonation
  targetUserId   String   // Who was impersonated
  reason         String?  // Why (optional)
  startedAt      DateTime @default(now())
  endedAt        DateTime?
  ipAddress      String?
  userAgent      String?
}
```

**Session security:**

- Cannot revoke current session (prevent lockout)
- Full page reload after stop (clear cached state)
- Server validates impersonation on every request

---

## Common Patterns

### Admin Panel Layout

```vue
<script setup lang="ts">
const { isSuperAdmin } = useRole();

// Redirect if not admin
onMounted(() => {
  if (!isSuperAdmin.value) {
    navigateTo('/');
  }
});

definePageMeta({
  middleware: ['auth', 'admin'], // Custom admin middleware
});
</script>

<template>
  <div v-if="isSuperAdmin">
    <ImpersonationBanner />
    <!-- Global banner -->

    <div class="admin-panel">
      <!-- Admin content -->
    </div>
  </div>
</template>
```

### Impersonation Button in User List

```vue
<script setup>
const { startImpersonation } = useImpersonation();
const loading = ref<string | null>(null);

async function impersonate(userId: string) {
  loading.value = userId;
  const result = await startImpersonation(userId, 'Admin review');
  loading.value = null;

  if (result.success) {
    await navigateTo('/org/[slug]/dashboard'); // View as user
  } else {
    toast.add({ title: result.error, color: 'error' });
  }
}
</script>

<template>
  <UButton
    v-for="user in users"
    :key="user.id"
    :loading="loading === user.id"
    @click="impersonate(user.id)"
  >
    Impersonate
  </UButton>
</template>
```

### Global Banner Integration

**Add to app.vue:**

```vue
<template>
  <UApp>
    <ImpersonationBanner />
    <!-- Fixed top banner -->

    <UHeader>
      <AuthButton />
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
```

---

## Testing Patterns

**Impersonation flow:**

```typescript
it('starts impersonation and shows banner', async () => {
  const wrapper = await mountSuspended(ImpersonationBanner);

  // Initially hidden
  expect(wrapper.find('.fixed').exists()).toBe(false);

  // Start impersonation
  const { startImpersonation } = useImpersonation();
  await startImpersonation('user-123');

  // Banner appears
  await wrapper.vm.$nextTick();
  expect(wrapper.find('.fixed').exists()).toBe(true);
  expect(wrapper.text()).toContain('Viewing as');
});
```

**Role check:**

```typescript
it('hides admin features for non-admin', async () => {
  const { isSuperAdmin } = useRole();
  isSuperAdmin.value = false;

  const wrapper = await mountSuspended(AdminPanel);
  expect(wrapper.find('.admin-panel').exists()).toBe(false);
});
```

---

## Styling Guidelines

**Banner:**

- Warning color scheme (yellow/orange)
- Fixed positioning, z-index 50
- Full width, responsive padding
- Animate-in slide from top
- Backdrop blur for depth

**Session cards:**

- Border, rounded corners
- Gray border (200/700)
- Device icons (text-2xl, gray-400/500)
- Current session badge (primary color)

**Admin actions:**

- Error color for dangerous actions (impersonate, revoke)
- Outline variant for secondary actions
- Loading states on all async buttons

---

## Related Documentation

- [Authentication System](./../System/authentication_system.md) - RBAC, roles, Better Auth
- [Database Schema](./../System/database_schema.md) - ImpersonationLog, Session models
- [Profile Components](./../System/profile_components_system.md) - SessionManagement integration
- Component files: `/home/alois/bistro/app/components/admin/CLAUDE.md`

---

_Last updated: 2026-01-06_
