# Authentication & Authorization System

**Related docs:** project_architecture.md, database_schema.md

---

## Overview

**Auth library:** Better Auth v1.4
**Strategy:** Email/password + OAuth (GitHub, Google)
**Session:** Cookie-based (5 min cache)
**RBAC:** USER | ADMIN | SUPER_ADMIN
**Impersonation:** SUPER_ADMIN only (1-hour expiry)

---

## Architecture

### Server-Side (Better Auth)

**Config location:** `server/features/auth/auth-config.ts`

**Setup:**

```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { db } from '../../utils/db';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    // Conditional OAuth (only if env vars present)
    ...(process.env.GITHUB_CLIENT_ID && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    }),
  },

  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  trustedOrigins: ['http://localhost:3000', process.env.APP_URL || 'http://localhost:3000'],
});
```

**Key features:**

- Prisma adapter (DB integration)
- Email/password provider (always enabled)
- OAuth providers (conditional on env vars)
- Admin plugin (impersonation)
- Session cookie cache (5 min)
- Trusted origins for CORS

**Session helper:** `server/features/auth/auth-session.ts`

```typescript
import { auth } from './auth-config';

export const serverAuth = () => auth;
```

**Usage in API handlers:**

```typescript
import { serverAuth } from '~/server/features/auth/auth-session';

const session = await serverAuth().getSession({ headers: event.headers });
if (!session?.user) {
  throw createError({ statusCode: 401, message: 'Unauthorized' });
}
const userId = session.user.id;
```

---

### Client-Side (Better Auth Client)

**Composable location:** `app/composables/useAuth.ts`

**Setup:**

```typescript
import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';

export const useAuth = () => {
  const url = useRequestURL();
  const headers = import.meta.server ? useRequestHeaders() : undefined;

  const client = createAuthClient({
    baseURL: url.origin,
    fetchOptions: { headers },
    plugins: [adminClient()],
  });

  const session = useState('auth:session', () => null);
  const user = useState('auth:user', () => null);
  const sessionFetching = useState('auth:sessionFetching', () => false);

  const fetchSession = async () => {
    if (sessionFetching.value) return;
    sessionFetching.value = true;
    const { data } = await client.getSession({ fetchOptions: { headers } });
    session.value = data?.session || null;
    user.value = data?.user || null;
    sessionFetching.value = false;
    return data;
  };

  // Auto-sync on client-side session changes
  if (import.meta.client) {
    client.$store.listen('$sessionSignal', async (signal) => {
      if (!signal) return;
      await fetchSession();
    });
  }

  return {
    session,
    user,
    loggedIn: computed(() => !!session.value),
    isPending: sessionFetching,
    signIn: client.signIn,
    signUp: client.signUp,
    async signOut({ redirectTo }: { redirectTo?: string } = {}) {
      const res = await client.signOut();
      session.value = null;
      user.value = null;
      if (redirectTo) await navigateTo(redirectTo);
      return res;
    },
    fetchSession,
    client,
  };
};
```

**API:**

- `session`: Reactive session state
- `user`: Reactive user state
- `loggedIn`: Computed boolean
- `isPending`: Loading state
- `signIn.email()`: Email/password login
- `signIn.social()`: OAuth login
- `signUp.email()`: Email/password registration
- `signOut()`: Logout
- `fetchSession()`: Refresh session
- `redirectToUserDashboard()`: Redirect to user's first org dashboard

**Usage in components:**

```vue
<script setup lang="ts">
const { user, loggedIn, signOut } = useAuth();

async function handleLogout() {
  await signOut({ redirectTo: '/auth/login' });
}
</script>

<template>
  <div v-if="loggedIn">
    <p>Welcome {{ user?.name }}</p>
    <UButton @click="handleLogout">Logout</UButton>
  </div>
</template>
```

---

## Authentication Flows

### Email/Password Registration

**Flow:**

1. User submits registration form (`/auth/register`)
2. Client calls `signUp.email({ email, password, name })`
3. Better Auth:
   - Hashes password (bcrypt)
   - Creates User record
   - Creates Account record (providerId='credential')
   - Creates Session record
   - Sets `better-auth.session_token` cookie
4. Client calls `fetchSession()` to update state
5. Client redirects to `/org/[slug]/dashboard`

**Code:**

```vue
<script setup lang="ts">
const { signUp, fetchSession } = useAuth();

const state = reactive({
  email: '',
  password: '',
  name: '',
});

async function handleRegister() {
  try {
    await signUp.email({
      email: state.email,
      password: state.password,
      name: state.name,
    });
    await fetchSession();
    await navigateTo('/org/[slug]/dashboard');
  } catch (e) {
    // Handle error
  }
}
</script>
```

---

### Email/Password Login

**Flow:**

1. User submits login form (`/auth/login`)
2. Client calls `signIn.email({ email, password })`
3. Better Auth:
   - Verifies password hash
   - Creates Session record
   - Sets `better-auth.session_token` cookie
4. Client calls `fetchSession()` to update state
5. Client redirects to `/org/[slug]/dashboard`

**Code:**

```vue
<script setup lang="ts">
const { signIn, fetchSession } = useAuth();

const state = reactive({
  email: '',
  password: '',
});

async function handleLogin() {
  try {
    await signIn.email({
      email: state.email,
      password: state.password,
    });
    await fetchSession();
    await navigateTo('/org/[slug]/dashboard');
  } catch (e) {
    // Handle error
  }
}
</script>
```

---

### OAuth Login (GitHub, Google)

**Flow:**

1. User clicks OAuth button (`/auth/login`)
2. Client calls `signIn.social({ provider: 'github' })`
3. Better Auth redirects to provider OAuth page
4. User authorizes app on provider
5. Provider redirects back to Better Auth callback
6. Better Auth:
   - Exchanges code for tokens
   - Creates/updates User record
   - Creates Account record (providerId='github')
   - Creates Session record
   - Sets `better-auth.session_token` cookie
   - Redirects to `/auth/login`
7. Client calls `fetchSession()` to update state
8. Client redirects to `/org/[slug]/dashboard`

**Code:**

```vue
<script setup lang="ts">
const { signIn, fetchSession, loggedIn } = useAuth();
const config = useRuntimeConfig();

async function handleGitHub() {
  await signIn.social({
    provider: 'github',
    callbackURL: '/auth/login', // Better Auth redirects here
  });
}

onMounted(async () => {
  // Better Auth redirects to login page after OAuth
  await fetchSession(); // Fetch updated session
  if (loggedIn.value) {
    await navigateTo('/org/[slug]/dashboard');
  }
});
</script>

<template>
  <UButton v-if="config.public.oauthGithubEnabled" @click="handleGitHub">
    Continue with GitHub
  </UButton>
</template>
```

**Conditional OAuth UI:**

```vue
<script setup lang="ts">
const config = useRuntimeConfig();

const hasOAuth = computed(
  () => config.public.oauthGithubEnabled || config.public.oauthGoogleEnabled,
);
</script>

<template>
  <div v-if="hasOAuth">
    <UButton v-if="config.public.oauthGithubEnabled" @click="signIn.social({ provider: 'github' })">
      Continue with GitHub
    </UButton>
    <UButton v-if="config.public.oauthGoogleEnabled" @click="signIn.social({ provider: 'google' })">
      Continue with Google
    </UButton>
  </div>
</template>
```

---

### Logout

**Flow:**

1. User clicks logout button
2. Client calls `signOut({ redirectTo: '/auth/login' })`
3. Better Auth:
   - Deletes Session record
   - Clears `better-auth.session_token` cookie
4. Client clears local state
5. Client redirects to `/auth/login`

**Code:**

```vue
<script setup lang="ts">
const { signOut } = useAuth();

async function handleLogout() {
  await signOut({ redirectTo: '/auth/login' });
}
</script>
```

---

## Role-Based Access Control (RBAC)

### Roles

**Enum:** `User.role` (database field)

```prisma
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}
```

**Levels:**

- `USER`: Default role, access to own data
- `ADMIN`: Admin features (user management)
- `SUPER_ADMIN`: Full access (impersonation, role changes)

---

### Server-Side RBAC

**Middleware:** `server/middleware/role-guard.ts`

```typescript
export const requireRole = (allowedRoles: Role[]) => {
  return async (event: H3Event) => {
    const session = await serverAuth().getSession({ headers: event.headers });
    if (!session?.user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user || !allowedRoles.includes(user.role)) {
      throw createError({ statusCode: 403, message: 'Forbidden' });
    }

    return user;
  };
};
```

**Usage in API handlers:**

```typescript
import { requireRole } from '../../middleware/role-guard';

export default defineEventHandler(async (event) => {
  const user = await requireRole(['ADMIN', 'SUPER_ADMIN'])(event);

  // User has ADMIN or SUPER_ADMIN role
  const users = await db.user.findMany();
  return { users };
});
```

**Admin-only endpoints:**

```typescript
// GET /api/admin/users - List all users (ADMIN+)
export default defineEventHandler(async (event) => {
  await requireRole(['ADMIN', 'SUPER_ADMIN'])(event);
  const users = await db.user.findMany();
  return { users };
});

// PUT /api/admin/users/:id/role - Update role (SUPER_ADMIN only)
export default defineEventHandler(async (event) => {
  await requireRole(['SUPER_ADMIN'])(event);
  const id = getRouterParam(event, 'id');
  const { role } = await readBody(event);
  const user = await db.user.update({
    where: { id },
    data: { role },
  });
  return { user };
});
```

---

### Client-Side RBAC

**Composable:** `app/composables/useRole.ts`

```typescript
export const useRole = () => {
  const { user } = useAuth();

  const hasRole = (roles: Role[]) => {
    if (!user.value) return false;
    return roles.includes(user.value.role);
  };

  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN');
  const isAdmin = computed(
    () => user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN',
  );

  return {
    hasRole,
    isSuperAdmin,
    isAdmin,
  };
};
```

**Usage in components:**

```vue
<script setup lang="ts">
const { isSuperAdmin, isAdmin } = useRole();
</script>

<template>
  <div>
    <UButton v-if="isAdmin" to="/admin/users">Admin Panel</UButton>
    <UButton v-if="isSuperAdmin" @click="handleImpersonate"> Impersonate User </UButton>
  </div>
</template>
```

---

## Admin Impersonation

### Overview

SUPER_ADMIN can impersonate users to debug issues or test features.

**Features:**

- 1-hour auto-expiration
- Cannot impersonate other SUPER_ADMINs
- Audit logging (ImpersonationLog table)
- Global banner during impersonation
- Stop impersonation anytime

---

### Server-Side (Better Auth Admin Plugin)

**Config:** `server/features/auth/auth-config.ts`

```typescript
import { admin } from 'better-auth/plugins';

export const auth = betterAuth({
  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],
});
```

**Start impersonation API:** `server/api/admin/impersonate.post.ts`

```typescript
import { requireRole } from '../../../middleware/role-guard';

export default defineEventHandler(async (event) => {
  const admin = await requireRole(['SUPER_ADMIN'])(event);
  const { userId, reason } = await readBody(event);

  // Cannot impersonate other SUPER_ADMINs
  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (targetUser?.role === 'SUPER_ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Cannot impersonate other SUPER_ADMINs',
    });
  }

  // Create impersonation session (Better Auth)
  const session = await serverAuth().impersonate({
    userId,
    adminId: admin.id,
  });

  // Log impersonation
  await db.impersonationLog.create({
    data: {
      adminId: admin.id,
      targetUserId: userId,
      reason,
      ipAddress: event.node.req.socket.remoteAddress,
      userAgent: event.node.req.headers['user-agent'],
    },
  });

  return { session };
});
```

**Stop impersonation API:** `server/api/admin/impersonate/stop.post.ts`

```typescript
export default defineEventHandler(async (event) => {
  const session = await serverAuth().getSession({ headers: event.headers });
  if (!session?.impersonatedBy) {
    throw createError({ statusCode: 400, message: 'Not impersonating' });
  }

  // Stop impersonation (Better Auth)
  await serverAuth().stopImpersonation({
    sessionId: session.id,
  });

  // Update log
  await db.impersonationLog.updateMany({
    where: {
      adminId: session.impersonatedBy,
      targetUserId: session.user.id,
      endedAt: null,
    },
    data: { endedAt: new Date() },
  });

  return { success: true };
});
```

---

### Client-Side

**Start impersonation:**

```vue
<script setup lang="ts">
const { isSuperAdmin } = useRole();

async function handleImpersonate(userId: string) {
  const reason = prompt('Reason for impersonation?');
  await $fetch('/api/admin/impersonate', {
    method: 'POST',
    body: { userId, reason },
  });

  // Refresh session
  await fetchSession();
  await navigateTo('/org/[slug]/dashboard');
}
</script>
```

**Stop impersonation:**

```vue
<script setup lang="ts">
const { session, fetchSession } = useAuth();

const isImpersonating = computed(() => !!session.value?.impersonatedBy);

async function handleStopImpersonation() {
  await $fetch('/api/admin/impersonate/stop', { method: 'POST' });
  await fetchSession();
  await navigateTo('/admin/users');
}
</script>

<template>
  <div v-if="isImpersonating" class="impersonation-banner">
    <p>You are impersonating {{ user?.name }}</p>
    <UButton @click="handleStopImpersonation">Stop Impersonation</UButton>
  </div>
</template>
```

---

## Route Protection

### Global Auth Middleware

**Location:** `app/middleware/auth.global.ts`

**Flow:**

1. Runs on every route change
2. Reads publicRoutes from `nuxt.config.ts`
3. Allows access to public routes
4. Checks session for protected routes
5. Redirects to `/auth/login` if unauthenticated

**Code:**

```typescript
import { isPublicRoute } from '~/app/utils/route';

export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes centralized in nuxt.config.ts
  const config = useRuntimeConfig();
  const publicRoutes = config.public.publicRoutes as string[];

  // Allow access to public routes (supports /* wildcards)
  if (isPublicRoute(to.path, publicRoutes)) {
    return;
  }

  // Check if user is authenticated
  const { session, fetchSession } = useAuth();
  await fetchSession();

  // Redirect to login if not authenticated
  if (!session.value) {
    return navigateTo('/auth/login');
  }
});
```

**Public route utility:** `app/utils/route.ts`

```typescript
/**
 * Check if path matches public route pattern (supports wildcards)
 */
export function isPublicRoute(path: string, publicRoutes: string[]): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2);
      return path === basePath || path.startsWith(basePath + '/');
    }
    return path === route;
  });
}
```

---

### Public Routes Configuration

**Location:** `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      publicRoutes: [
        '/',
        '/auth/login',
        '/auth/register',
        '/auth/verify-email',
        '/auth/forgot-password',
        '/auth/forgot-password-sent',
        '/auth/reset-password',
        '/auth/magic-link',
        '/auth/magic-link-sent',
        '/api/auth/verify-email',
      ],
    },
  },
});
```

**Adding new public routes:**

```typescript
// ✅ DO: Add to nuxt.config.ts
publicRoutes: [
  '/',
  '/auth/login',
  '/pricing', // ← Add here
];

// ❌ DON'T: Modify middleware directly
```

---

## Session Management

### Session Cookie

**Name:** `better-auth.session_token`
**Duration:** Configurable (default 30 days)
**Cache:** 5 min (may see stale session)

**Attributes:**

- `HttpOnly`: Prevents JavaScript access
- `Secure`: HTTPS only (production)
- `SameSite`: CSRF protection

---

### Session Refresh

**Auto-refresh on client:**

```typescript
// useAuth composable
if (import.meta.client) {
  client.$store.listen('$sessionSignal', async (signal) => {
    if (!signal) return;
    await fetchSession();
  });
}
```

**Manual refresh:**

```typescript
const { fetchSession } = useAuth();
await fetchSession();
```

---

### Session Revocation

**Logout (single session):**

```typescript
await signOut();
```

**Revoke all sessions (user):**

```typescript
// API endpoint: DELETE /api/user/sessions
await db.session.deleteMany({
  where: { userId },
});
```

**Revoke specific session:**

```typescript
// API endpoint: DELETE /api/user/sessions/:id
await db.session.delete({
  where: { id, userId },
});
```

---

## Security Features

### Password Hashing

**Library:** bcrypt (via Better Auth)
**Rounds:** 10 (configurable)

---

### CSRF Protection

**SameSite cookie:** Prevents cross-site requests
**Trusted origins:** Configured in Better Auth

---

### Rate Limiting (Planned)

**Strategy:** Token bucket per IP/user
**Limits:**

- Login: 5 attempts per 15 min
- Registration: 3 attempts per hour
- Password reset: 3 attempts per hour

---

### Email Verification (Planned)

**Flow:**

1. User registers
2. Better Auth sends verification email
3. User clicks link
4. Better Auth verifies token, sets `emailVerified=true`
5. User can access protected features

---

### Password Reset (Planned)

**Flow:**

1. User submits forgot-password form
2. Better Auth sends reset email
3. User clicks link
4. User submits new password
5. Better Auth updates password hash

---

## Environment Variables

**Required:**

```bash
AUTH_SECRET=your-secret-key-change-in-production  # 32+ chars
```

**Optional (OAuth):**

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Optional (Email - Planned):**

```bash
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@example.com
```

---

## Common Gotchas

1. **OAuth session refresh**: Must call `fetchSession()` after OAuth callback
2. **Public routes**: Add to `nuxt.config.ts` (NOT middleware)
3. **Session cache**: 5 min cache may show stale data
4. **SUPER_ADMIN impersonation**: Cannot impersonate other SUPER_ADMINs
5. **Role checks**: Always verify role on server-side (client checks are UI only)
6. **Session token**: Cookie name is `better-auth.session_token`
7. **Type safety**: No `as` or `!` assertions - always check session exists

---

## Troubleshooting

### "Unauthorized on protected route"

**Fix:** Ensure session cookie sent. Check DevTools → Network → Cookies

### "OAuth buttons not showing"

**Fix:** Add env vars, restart dev server:

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### "Session not updating after login"

**Fix:** Call `fetchSession()` after auth operations:

```typescript
await signIn.email({ email, password });
await fetchSession(); // ← Add this
await navigateTo('/org/[slug]/dashboard');
```

### "Cannot impersonate user"

**Fix:** Ensure:

- You are SUPER_ADMIN
- Target user is not SUPER_ADMIN
- Session is valid
