# Authentication Patterns SOP

Standard Operating Procedures for implementing authentication patterns in Bistro.

---

## OAuth Callback Redirect Pattern

**When:** Implementing auth pages (login, register, forgot-password, magic-link, reset-password)

**Problem:** OAuth providers redirect to callback URL, need to check session and redirect to dashboard

**Pattern:**

```vue
<script setup lang="ts">
const { fetchSession, redirectToUserDashboard, loggedIn } = useAuth();

// Redirect if already authenticated (e.g., after OAuth callback)
onMounted(async () => {
  await fetchSession();
  if (loggedIn.value) {
    await redirectToUserDashboard();
  }
});
</script>
```

**Why inline vs composable:**

- Explicit and visible in component code
- Saves only 1 line (thin wrapper adds no value)
- Better DX - developers see exactly what happens on mount

**Files using this pattern:**

- `/auth/login.vue`
- `/auth/register.vue`
- `/auth/forgot-password.vue`
- `/auth/magic-link.vue`
- `/auth/reset-password.vue`

---

## Post-Auth Redirect Pattern

**When:** After successful sign in/up, need to redirect user to dashboard

**Pattern:**

```vue
<script setup lang="ts">
const { signIn, fetchSession, redirectToUserDashboard } = useAuth();

async function handleLogin() {
  const result = await signIn.email({ email, password });

  if (result.error) {
    // Handle error
    return;
  }

  await fetchSession();
  await redirectToUserDashboard();
}
</script>
```

**Key points:**

- Always call `fetchSession()` after auth operations
- Use `redirectToUserDashboard()` (fetches user's orgs, navigates to first org)
- Handle errors before redirecting

---

## Role-Based Access Control Pattern

**When:** Need to check user roles in components

**Pattern:**

```vue
<script setup lang="ts">
const { isSuperAdmin, isAdmin, hasRole } = useRole();

// Conditional UI
const showAdminPanel = isSuperAdmin;

// Check specific roles
const canManage = hasRole(['ADMIN', 'SUPER_ADMIN']);
</script>

<template>
  <UButton v-if="isSuperAdmin" to="/admin/users"> Admin Panel </UButton>
</template>
```

**Don't:**

- ❌ Duplicate role logic in components (use useRole composable)
- ❌ Create custom role checks (use hasRole method)
- ❌ Access user.role directly (use useRole helpers)

**Do:**

- ✅ Use useRole composable for all role checks
- ✅ Use server-side validation (client checks are UX only)

---

## Page-Level Role Guards

**When:** Need to restrict entire page to specific roles

**Pattern (current - ad-hoc):**

```vue
<script setup lang="ts">
const { isSuperAdmin } = useRole();
const toast = useToast();

onMounted(() => {
  if (!isSuperAdmin.value) {
    toast.add({
      title: 'Access denied',
      description: 'You do not have permission to access this page',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
    navigateTo('/');
  }
});
</script>
```

**Note:** Only 2 pages use this pattern. If 3+ pages need guards, create `useRequireRole` composable.

---

## Organization Permissions Pattern

**When:** Need to check org-level permissions (canManageMembers, canDeleteOrg, etc)

**Pattern:**

```vue
<script setup lang="ts">
const { canManageMembers, canDeleteOrg, currentUserRole } = useOrganization();
</script>

<template>
  <UButton v-if="canManageMembers" @click="inviteMember"> Invite Member </UButton>

  <UButton v-if="canDeleteOrg" color="error" @click="deleteOrg"> Delete Organization </UButton>
</template>
```

**Don't:**

- ❌ Duplicate permission checks in components
  ```vue
  <!-- BAD: Duplicates logic from useOrganization -->
  const canManageMembers = computed(() => ['OWNER', 'ADMIN'].includes(currentUserRole.value ?? '')
  );
  ```

**Do:**

- ✅ Use from useOrganization composable
- ✅ Add new permissions to composable (single source of truth)

---

## Public Route Checking Pattern

**When:** Implementing middleware that needs to check public routes

**Pattern:**

```typescript
import { isPublicRoute } from '~/app/utils/route';

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig();
  const publicRoutes = config.public.publicRoutes as string[];

  if (isPublicRoute(to.path, publicRoutes)) {
    return; // Allow access
  }

  // Protected route logic...
});
```

**Don't:**

- ❌ Inline wildcard matching logic
  ```typescript
  // BAD: Duplicates isPublicRoute logic
  const isPublic = publicRoutes.some((route) => {
    if (route.endsWith('/*')) {
      const base = route.slice(0, -2);
      return to.path === base || to.path.startsWith(base + '/');
    }
    return to.path === route;
  });
  ```

**Do:**

- ✅ Use `isPublicRoute()` utility (DRY, testable, supports wildcards)

**Utility location:** `app/utils/route.ts`

---

## Adding New Public Routes

**When:** Need to make page accessible without auth

**Steps:**

1. **Update nuxt.config.ts (single source of truth):**

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      publicRoutes: [
        '/',
        '/auth/login',
        '/auth/register',
        '/blog/*', // Wildcard: matches /blog and /blog/anything
        '/pricing', // Add new route here
      ],
    },
  },
});
```

2. **Test:**

- Visit route without auth (should work)
- Middleware reads from config automatically

**Don't:**

- ❌ Modify middleware files directly
- ❌ Add route checks in components

---

## Composable Separation

**useAuth vs useRole:**

**useAuth** (auth state & operations):

- session, user, loggedIn, isPending
- signIn, signUp, signOut
- fetchSession, redirectToUserDashboard
- Better Auth client

**useRole** (authorization helpers):

- userRole, isSuperAdmin, isAdmin, isUser
- hasRole(roles)
- Derives from useAuth().user.role

**Why separate:**

- Single Responsibility Principle
- Not all useAuth consumers need role logic
- Cleaner API surface

**Usage:**

```vue
<script setup lang="ts">
// Need auth state only
const { user, loggedIn } = useAuth();

// Need role checks
const { isSuperAdmin } = useRole();

// Both are fine - they're designed to work together
</script>
```

---

## Session Management

**When to fetch session:**

```typescript
// After auth operations
await signIn.email({ email, password });
await fetchSession(); // ← Refresh session state

// On mount for auth pages (OAuth callbacks)
onMounted(async () => {
  await fetchSession();
  if (loggedIn.value) {
    await redirectToUserDashboard();
  }
});

// Auto-sync on client-side (handled by useAuth)
// No manual fetchSession needed for regular navigation
```

**Session cache:**

- Better Auth caches session for 5 min
- May see stale data briefly after updates
- fetchSession() bypasses cache

---

## Testing Auth Patterns

**Public route utility:**

```typescript
import { describe, it, expect } from 'vitest';
import { isPublicRoute } from './route';

describe('isPublicRoute', () => {
  const routes = ['/', '/auth/login', '/blog/*'];

  it('matches exact routes', () => {
    expect(isPublicRoute('/', routes)).toBe(true);
  });

  it('matches wildcard routes', () => {
    expect(isPublicRoute('/blog/post-1', routes)).toBe(true);
  });
});
```

**Mock auth in components:**

```typescript
import { vi } from 'vitest';

vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: ref({ name: 'Test User' }),
    loggedIn: ref(true),
    signOut: vi.fn(),
  })),
}));
```

---

## Anti-Patterns

**❌ DON'T: Create thin wrapper composables**

```typescript
// BAD: Saves 1 line, hides behavior
export const useAuthRedirect = () => {
  const { fetchSession, loggedIn, redirectToUserDashboard } = useAuth();
  onMounted(async () => {
    await fetchSession();
    if (loggedIn.value) await redirectToUserDashboard();
  });
};
```

**✅ DO: Inline simple patterns**

```typescript
// GOOD: Explicit, visible
onMounted(async () => {
  await fetchSession();
  if (loggedIn.value) await redirectToUserDashboard();
});
```

**❌ DON'T: Duplicate permission checks**

```vue
<!-- BAD: Duplicates useOrganization logic -->
<script setup lang="ts">
const { currentUserRole } = useOrganization();
const canManage = computed(() => ['OWNER', 'ADMIN'].includes(currentUserRole.value ?? ''));
</script>
```

**✅ DO: Use from composable**

```vue
<!-- GOOD: Single source of truth -->
<script setup lang="ts">
const { canManageMembers } = useOrganization();
</script>
```

**❌ DON'T: Duplicate public route logic**

```typescript
// BAD: Reinvents isPublicRoute
const isPublic = publicRoutes.some((r) => r === to.path);
```

**✅ DO: Use utility function**

```typescript
// GOOD: Reusable, testable, supports wildcards
import { isPublicRoute } from '~/app/utils/route';
if (isPublicRoute(to.path, publicRoutes)) return;
```

---

## When to Refactor

**Create utility when:**

- Logic duplicated in 2+ places
- Logic is complex (wildcard matching, etc)
- Logic is testable in isolation

**Create composable when:**

- State management needed
- Multiple consumers
- Clear domain boundary

**Keep inline when:**

- Used in 1-2 places
- Simple (< 5 lines)
- Specific to component context

**Example decision tree:**

```
Is it duplicated in 2+ files?
├─ No → Keep inline
└─ Yes → Is it stateful?
         ├─ Yes → Create composable
         └─ No → Is it complex?
                 ├─ Yes → Create utility
                 └─ No → Inline (YAGNI)
```

---

## References

- **Authentication system:** `.agent/System/authentication_system.md`
- **Better Auth docs:** https://www.better-auth.com
- **useAuth source:** `app/composables/auth/useAuth.ts`
- **useRole source:** `app/composables/auth/useRole.ts`
- **Public route utility:** `app/utils/route.ts`
