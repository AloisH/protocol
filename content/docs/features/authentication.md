---
title: Authentication
description: Understand Bistro's authentication system
navigation:
  title: Authentication
  order: 1
---

# Authentication

Bistro uses [Better Auth](https://www.better-auth.com/) for authentication, providing email/password and OAuth authentication out of the box.

## Features

- **Email/Password** - Traditional authentication with email verification
- **OAuth** - GitHub and Google (optional, enabled via environment variables)
- **Magic Links** - Passwordless authentication via email
- **Session Management** - Secure session handling with database storage
- **Role-Based Access Control** - USER, ADMIN, SUPER_ADMIN roles
- **Admin Impersonation** - SUPER_ADMIN can impersonate users (with audit logging)

## Authentication Flow

1. User registers via `/auth/register`
2. Email verification sent (optional but recommended)
3. User logs in via `/auth/login`
4. Session created and stored in database
5. Protected routes check session via middleware

## Using Authentication in Your App

### In Components

Use the `useAuth` composable:

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
    <button @click="handleLogout">Logout</button>
  </div>
</template>
```

### In API Routes

Use the `serverAuth()` helper:

```typescript
import { serverAuth } from '~/server/utils/serverAuth';

export default defineEventHandler(async (event) => {
  const session = await serverAuth().getSession({ headers: event.headers });

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // User is authenticated
  const userId = session.user.id;
});
```

## Roles & Permissions

Bistro includes a role-based access control system:

- **USER** - Default role for registered users
- **ADMIN** - Can manage organization members
- **SUPER_ADMIN** - Full system access, can impersonate users

### Check Roles in Components

```vue
<script setup lang="ts">
const { hasRole, isAdmin, isSuperAdmin } = useRole();
</script>

<template>
  <div>
    <button v-if="isAdmin">Admin Panel</button>
    <button v-if="isSuperAdmin">Impersonate User</button>
  </div>
</template>
```

### Protect API Routes by Role

```typescript
import { requireRole } from '~/server/utils/require-role';

export default defineEventHandler(async (event) => {
  // Only ADMIN and SUPER_ADMIN can access
  await requireRole(['ADMIN', 'SUPER_ADMIN'])(event);

  // Your admin-only logic here
});
```

## OAuth Setup

### GitHub OAuth

1. Create GitHub OAuth App at https://github.com/settings/developers
2. Set callback URL: `http://localhost:3000/api/auth/callback/github`
3. Add credentials to `.env`:

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### Google OAuth

1. Create OAuth 2.0 Client at https://console.cloud.google.com/apis/credentials
2. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Add credentials to `.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

OAuth buttons will automatically appear on login/register pages when credentials are configured.

## Session Management

Users can view and manage their active sessions from the profile page:

- View all active sessions
- See device and location information
- Revoke individual sessions
- Revoke all other sessions

## Security Best Practices

1. **Use strong AUTH_SECRET** - Generate with `openssl rand -base64 32`
2. **Enable email verification** - Verify user email addresses
3. **Use HTTPS in production** - Always use HTTPS for authentication
4. **Implement rate limiting** - Prevent brute force attacks (coming soon)
5. **Regular security audits** - Keep dependencies updated

## Next Steps

- [Database](/docs/features/database) - Understand the database schema
- [Multi-tenancy](/docs/features/organizations) - Work with organizations
