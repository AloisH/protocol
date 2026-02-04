# App Context (app/)

Client-side Nuxt code - pages, components, composables, middleware.

## Structure

```
app/
├── app.vue              # Root layout (UApp wrapper)
├── app.config.ts        # Nuxt UI theme config
├── pages/               # File-based routes
│   ├── index.vue        # /
│   ├── dashboard.vue    # /dashboard (protected)
│   └── auth/
│       ├── login.vue    # /auth/login
│       └── register.vue # /auth/register
├── components/          # Auto-imported (feature-based)
│   ├── shared/          # AppLogo
│   ├── auth/            # AuthButton, AuthOAuthButtons
│   ├── todo/            # TodoList, TodoCreateForm
│   ├── organization/    # OrganizationMembers, OrganizationSwitcher
│   ├── admin/           # AdminImpersonationBanner, AdminSessionList
│   ├── docs/            # DocsSearch
│   └── onboarding/      # 7 onboarding components
├── composables/         # Auto-imported
│   └── useAuth.ts       # Auth state & methods
├── middleware/          # Route guards
│   └── auth.global.ts   # Global auth check
└── assets/
    └── css/main.css     # Global styles
```

## Pages (File-Based Routing)

**Convention:**

- `pages/index.vue` → `/`
- `pages/org/[slug]/dashboard.vue` → `/org/[slug]/dashboard`
- `pages/auth/login.vue` → `/auth/login`
- `pages/user/[id].vue` → `/user/:id`

**Layout:**

```vue
<template>
  <div>
    <h1>Page Title</h1>
    <p>Content</p>
  </div>
</template>

<script setup lang="ts">
// Auto-import composables
const { user, loggedIn } = useAuth();

// Auto-import Nuxt functions
const route = useRoute();
const router = useRouter();
</script>
```

**Dashboard Pages (Scrolling handled by layout):**

Pages using `layout: 'dashboard'` just render content - layout handles panel and scrolling:

```vue
<template>
  <UCard>
    <template #header>
      <h1 class="text-3xl font-bold">Page Title</h1>
    </template>
    <!-- Content renders inside layout's scrollable container -->
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
});
</script>
```

**Layout structure (`layouts/dashboard.vue`):**

- `UDashboardGroup` > `UDashboardSidebar` + `UDashboardPanel`
- Panel has `class="flex flex-col h-screen w-full"`
- Content wrapped in `<div class="flex-1 overflow-y-auto p-4 sm:p-6">`
- Pages render into this scrollable container via `<slot />`

## Components

**Auto-imported from `components/`:**

```vue
<template>
  <!-- No import needed for AppLogo, AuthButton, etc -->
  <UCard>
    <AppLogo />
    <AuthButton />
  </UCard>
</template>
```

**Nested feature directories:**

Components can be organized in feature-based subdirectories:

```
components/
├── auth/
│   ├── AuthButton.vue          → <AuthButton>
│   └── AuthOAuthButtons.vue    → <AuthOAuthButtons>
├── todo/
│   ├── TodoList.vue            → <TodoList>
│   └── TodoCreateForm.vue      → <TodoCreateForm>
└── organization/
    ├── OrganizationMembers.vue → <OrganizationMembers>
    └── OrganizationSwitcher.vue → <OrganizationSwitcher>
```

- Nested components auto-import by filename (NOT parent dir)
- `components/auth/AuthButton.vue` → `<AuthButton>` (not `<AuthAuthButton>`)
- Enabled via `pathPrefix: false` in nuxt.config.ts

**Component Naming Convention:**

**Strict feature prefix pattern:**

- ALL components in feature folders use `FeatureName*` prefix
- Prefix matches folder: `auth/AuthButton.vue`, `profile/ProfileForm.vue`
- Auto-import: `<AuthButton>` (filename only, NOT folder)
- Exception: `shared/` folder for app-wide utilities (AppLogo)

**Examples:**

- ✅ `auth/AuthButton.vue` → `<AuthButton>`
- ✅ `profile/ProfileForm.vue` → `<ProfileForm>`
- ✅ `admin/AdminSessionList.vue` → `<AdminSessionList>`
- ❌ `profile/Form.vue` (missing prefix)
- ❌ `profile/ProfileProfileForm.vue` (double prefix)

**Nuxt UI components (always available):**

- Layout: `UApp`, `UHeader`, `UMain`, `UFooter`
- Forms: `UForm`, `UFormField`, `UInput`, `UButton`
- Feedback: `UAlert`, `UToast` (via `useToast()`)
- Navigation: `ULink`, `NuxtLink`
- Utilities: `UColorModeButton`, `UIcon`, `UModal`

**IMPORTANT: Always check Nuxt UI documentation**

- Before using any Nuxt UI component, check https://ui.nuxt.com
- Color props: Use `error`, `success`, `warning`, `info`, `primary`, `neutral` (NOT `red`, `green`, etc.)
- Modal usage: Use `v-model:open` with `#content` slot
- Toast notifications: Use `useToast()` composable for success/error feedback

**Testing:**

```typescript
// Place next to component: AuthButton.test.ts
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AuthButton from './AuthButton.vue';

describe('AuthButton', () => {
  it('renders', async () => {
    const wrapper = await mountSuspended(AuthButton);
    expect(wrapper.html()).toContain('Login');
  });
});
```

## Composables (useAuth)

**Auto-imported from `composables/`:**

Composables can be organized in feature-based subdirectories:

```
composables/
├── auth/
│   ├── useAuth.ts          → useAuth()
│   ├── useAuthRedirect.ts  → useAuthRedirect()
│   └── useRole.ts          → useRole()
├── organization/
│   └── useOrganization.ts  → useOrganization()
├── todo/
│   └── useTodos.ts         → useTodos()
├── docs/
│   ├── useDocsNavigation.ts → useDocsNavigation()
│   └── useDocsSearch.ts    → useDocsSearch()
└── admin/
    └── useImpersonation.ts → useImpersonation()
```

- Nested composables auto-import by filename
- `composables/auth/useAuth.ts` → `useAuth()` (use anywhere, no import)
- Requires `composables/**` in nuxt.config.ts imports.dirs
- Use feature-prefixed names (useAuthSession, useOrgContext)

**Pattern:**

```typescript
// Auto-imported, no import needed
const {
  session, // Ref<Session | null>
  user, // Ref<User | null>
  loggedIn, // Computed<boolean>
  isPending, // Ref<boolean>
  signIn, // { email, social }
  signUp, // { email }
  signOut, // ({ redirectTo })
  fetchSession, // () => Promise<SessionData>
  client, // Better Auth client
} = useAuth();
```

**Usage:**

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

**OAuth callback handling:**

```typescript
onMounted(async () => {
  // Better Auth redirects to login page after OAuth
  await fetchSession(); // Fetch updated session
  if (loggedIn.value) {
    await navigateTo('/org/[slug]/dashboard');
  }
});
```

## Middleware (Route Guards)

**Global auth middleware (auth.global.ts):**

- Runs on every route change
- Reads publicRoutes from nuxt.config.ts
- Redirects to /auth/login if not authenticated

**Adding public routes:**

```typescript
// Update nuxt.config.ts (NOT middleware):
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      publicRoutes: [
        '/',
        '/auth/login',
        '/auth/register',
        '/pricing', // ← Add new public route here
      ],
    },
  },
});
```

**Page-specific middleware:**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'], // Apply specific middleware
});
</script>
```

## Organization State & Routing

### Organization Context

**useOrganization composable** - Centralized org state:

```typescript
const {
  organizations, // Ref<Organization[]>
  currentOrganization, // Computed<Organization | undefined>
  currentOrgSlug, // Computed<string>
  currentOrgId, // Computed<string | null>
  members, // Ref<MemberWithUser[]>
  currentUserRole, // Ref<OrganizationRole | null>
  canManageMembers, // Computed<boolean>
  canDeleteOrg, // Computed<boolean>
  fetchOrganizations, // () => Promise<void>
  fetchMembers, // (slug: string) => Promise<void>
  switchOrganization, // (slug: string) => Promise<void>
  fetching, // Readonly<Ref<boolean>>
  switching, // Readonly<Ref<boolean>>
} = useOrganization();
```

**Usage:**

- Auto-imported, no import needed
- Call fetch methods on mount
- Access computed values reactively
- Session tracking via useAuth integration

### Organization Routing

**Route structure:**

```
/org/
  ├── create              # Create new org
  ├── select              # Choose/switch org
  ├── invite?token=...    # Accept invite
  └── [slug]/             # Org-scoped routes (slug from URL)
      ├── dashboard       # Main page
      ├── members         # Member management
      └── settings        # Org settings
```

**Pattern:** Dynamic `[slug]` segment uses URL-friendly slug (not ID). Extract via `route.params.slug`.

### Organization Components

**OrganizationSwitcher** (`components/OrganizationSwitcher.vue`):

- Dropdown showing user's orgs
- Click to switch → navigate to /org/[slug]/dashboard
- "Create Organization" option
- Uses UDropdownMenu + ClientOnly

**OrganizationMembers** (`components/OrganizationMembers.vue`):

- Props: `organizationSlug: string`
- Fetches: GET /api/organizations/[slug]/members
- Invite modal with email + role

**OnboardingOrganization** (`components/OnboardingOrganization.vue`):

- Org creation form for onboarding flow
- Auto-slugifies org name

### Middleware

**require-organization.global.ts**:

- Redirects to /org/select if no org selected
- Enforces org selection for protected pages
- Skips for auth/onboarding/user routes

### Data Scoping Pattern

```vue
<script setup lang="ts">
const slug = route.params.slug as string;

// Org context implicit from session, validated server-side
const { data } = await useFetch(`/api/organizations/${slug}/members`);
</script>
```

Server validates membership via requireOrgAccess or service layer.

## Forms (Zod Validation)

**Pattern:**

```vue
<script setup lang="ts">
import { z } from 'zod';

const state = reactive({
  email: '',
  password: '',
});

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars'),
});

const loading = ref(false);
const error = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    // API call
  } catch (e) {
    error.value = 'Error occurred';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="email" label="Email">
      <UInput v-model="state.email" type="email" />
    </UFormField>
    <UButton type="submit" :loading="loading">Submit</UButton>
  </UForm>
</template>
```

## Toast Notifications

**Use toast for success/error feedback:**

```vue
<script setup lang="ts">
const toast = useToast();

async function onSubmit() {
  try {
    // API call
    toast.add({
      title: 'Success',
      description: 'Action completed',
      color: 'success',
      icon: 'i-lucide-check',
    });
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Something went wrong',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
  }
}
</script>
```

## Styling

**Tailwind classes (Nuxt UI v4):**

```vue
<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <!-- Content -->
    </UCard>
  </div>
</template>
```

**Dark mode:**

- Automatic via `UColorModeButton`
- Use `dark:` prefix for dark mode styles
- Example: `text-neutral-500 dark:text-neutral-400`

## OAuth Conditional UI

**Pattern (see AuthOAuthButtons.vue):**

```vue
<script setup lang="ts">
const config = useRuntimeConfig();

const hasOAuth = computed(
  () => config.public.oauthGithubEnabled || config.public.oauthGoogleEnabled,
);
</script>

<template>
  <div v-if="hasOAuth">
    <UButton v-if="config.public.oauthGithubEnabled" @click="signInWithGithub">
      Continue with GitHub
    </UButton>
    <UButton v-if="config.public.oauthGoogleEnabled" @click="signInWithGoogle">
      Continue with Google
    </UButton>
  </div>
</template>
```
