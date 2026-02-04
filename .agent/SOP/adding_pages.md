# SOP: Adding New Pages

**Related docs:** ../System/project_architecture.md, ../System/authentication_system.md

---

## Overview

How to add new pages using Nuxt file-based routing.

---

## File-Based Routing

**Convention:**

- `pages/index.vue` → `/`
- `pages/org/[slug]/dashboard.vue` → `/org/[slug]/dashboard`
- `pages/auth/login.vue` → `/auth/login`
- `pages/projects/[id].vue` → `/projects/:id`
- `pages/admin/users.vue` → `/admin/users`

---

## Step-by-Step

### 1. Create Page File

**Location:** `app/pages/<path>.vue`

**Basic page:**

```vue
<!-- pages/projects/index.vue → /projects -->
<template>
  <div>
    <h1>Projects</h1>
    <p>List of projects</p>
  </div>
</template>

<script setup lang="ts">
// Auto-imported composables available
const { user } = useAuth();
</script>
```

**Dynamic route:**

```vue
<!-- pages/projects/[id].vue → /projects/:id -->
<template>
  <div>
    <h1>{{ project?.title }}</h1>
    <p>{{ project?.description }}</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const id = route.params.id as string;

const { data: project } = await useFetch(`/api/projects/${id}`);
</script>
```

---

### 2. Add Route Protection (If Needed)

**Option 1: Global middleware (automatic)**

All routes protected by default unless in `publicRoutes`.

**Option 2: Public route**

Add to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      publicRoutes: [
        '/',
        '/auth/login',
        '/pricing', // ← Add new public route
      ],
    },
  },
});
```

**Option 3: Page-specific middleware**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'], // Apply custom middleware
});
</script>
```

---

### 3. Add Role-Based Access (If Admin Page)

**SUPER_ADMIN only:**

```vue
<!-- pages/admin/users.vue -->
<template>
  <div v-if="isSuperAdmin">
    <h1>User Management</h1>
    <!-- Admin content -->
  </div>
  <div v-else>
    <p>Access denied</p>
  </div>
</template>

<script setup lang="ts">
const { isSuperAdmin } = useRole();

// Or redirect if not admin
onMounted(() => {
  if (!isSuperAdmin.value) {
    navigateTo('/org/[slug]/dashboard');
  }
});
</script>
```

**ADMIN or SUPER_ADMIN:**

```vue
<script setup lang="ts">
const { isAdmin } = useRole();

onMounted(() => {
  if (!isAdmin.value) {
    navigateTo('/org/[slug]/dashboard');
  }
});
</script>
```

---

### 4. Fetch Data

**Option 1: useFetch (SSR-friendly)**

```vue
<script setup lang="ts">
const { data: projects, pending, error } = await useFetch('/api/projects');
</script>

<template>
  <div>
    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Error: {{ error.message }}</p>
    <div v-else>
      <div v-for="project in projects" :key="project.id">
        {{ project.title }}
      </div>
    </div>
  </div>
</template>
```

**Option 2: $fetch (client-side only)**

```vue
<script setup lang="ts">
const projects = ref([]);
const loading = ref(false);

async function loadProjects() {
  loading.value = true;
  try {
    const { projects: data } = await $fetch('/api/projects');
    projects.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadProjects());
</script>
```

**Option 3: Composable**

```vue
<script setup lang="ts">
const { projects, loading, loadProjects } = useProjects();

onMounted(() => loadProjects());
</script>
```

---

### 5. Add Form (If Needed)

**Using Nuxt UI + Zod:**

```vue
<script setup lang="ts">
import { z } from 'zod';

const state = reactive({
  title: '',
  description: '',
  slug: '',
});

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

const loading = ref(false);
const toast = useToast();

async function onSubmit() {
  loading.value = true;
  try {
    await $fetch('/api/projects', {
      method: 'POST',
      body: state,
    });
    toast.add({
      title: 'Success',
      description: 'Project created',
      color: 'success',
    });
    await navigateTo('/projects');
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="title" label="Title">
      <UInput v-model="state.title" />
    </UFormField>
    <UFormField name="description" label="Description">
      <UTextarea v-model="state.description" />
    </UFormField>
    <UFormField name="slug" label="Slug">
      <UInput v-model="state.slug" />
    </UFormField>
    <UButton type="submit" :loading="loading">Create</UButton>
  </UForm>
</template>
```

---

### 6. Add Navigation (If Needed)

**Update header/sidebar:**

```vue
<!-- components/AppHeader.vue -->
<template>
  <UHeader>
    <UHeaderLinks>
      <UHeaderLink to="/">Home</UHeaderLink>
      <UHeaderLink to="/projects">Projects</UHeaderLink>
      <UHeaderLink v-if="isAdmin" to="/admin/users">Admin</UHeaderLink>
    </UHeaderLinks>
  </UHeader>
</template>

<script setup lang="ts">
const { isAdmin } = useRole();
</script>
```

---

### 7. Add SEO Meta (Optional)

**Using useHead:**

```vue
<script setup lang="ts">
useHead({
  title: 'Projects',
  meta: [{ name: 'description', content: 'Manage your projects' }],
});
</script>
```

**Using useSeoMeta:**

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'Projects',
  description: 'Manage your projects',
  ogTitle: 'Projects',
  ogDescription: 'Manage your projects',
});
</script>
```

---

## Layout

### Default Layout (UApp)

**Location:** `app/app.vue`

```vue
<template>
  <UApp>
    <UHeader>
      <AppLogo />
      <UHeaderLinks>
        <UHeaderLink to="/">Home</UHeaderLink>
        <UHeaderLink to="/projects">Projects</UHeaderLink>
      </UHeaderLinks>
      <AuthButton />
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <p>© 2025 Bistro</p>
    </UFooter>
  </UApp>
</template>
```

**All pages use this layout automatically.**

---

### Custom Layout (If Needed)

**Create layout:**

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="admin-layout">
    <aside>Admin Sidebar</aside>
    <main>
      <slot />
    </main>
  </div>
</template>
```

**Use in page:**

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});
</script>
```

---

## Styling

### Tailwind Classes

```vue
<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <h1 class="text-2xl font-bold">Title</h1>
      <p class="text-gray-600 dark:text-gray-400">Description</p>
    </UCard>
  </div>
</template>
```

---

### Dark Mode

**Automatic via UColorModeButton:**

```vue
<template>
  <div class="text-gray-900 dark:text-gray-100">Content adapts to dark mode</div>
</template>
```

---

## Nuxt UI Components

**Always check https://ui.nuxt.com before using.**

**Common components:**

- `UCard`: Card container
- `UButton`: Button with loading state
- `UInput`: Text input
- `UTextarea`: Textarea
- `UForm`: Form with Zod validation
- `UFormField`: Form field wrapper
- `UAlert`: Alert message
- `UModal`: Modal dialog
- `UTable`: Data table

**Example:**

```vue
<template>
  <UCard>
    <UButton to="/projects" color="primary">View Projects</UButton>
    <UAlert color="success" title="Success" description="Action completed" />
  </UCard>
</template>
```

---

## Auto-Imports

**No imports needed for:**

- Components in `app/components/`
- Composables in `app/composables/`
- Nuxt utils: `useRoute()`, `useState()`, `navigateTo()`, etc.
- Nuxt UI components: `UButton`, `UCard`, etc.

**Example:**

```vue
<script setup lang="ts">
// No imports needed!
const { user } = useAuth(); // Auto-imported
const route = useRoute(); // Auto-imported
</script>

<template>
  <!-- No imports needed! -->
  <UButton>Click Me</UButton>
  <AppLogo />
</template>
```

---

## Common Scenarios

### Redirect After Login

```vue
<script setup lang="ts">
const { signIn, fetchSession } = useAuth();

async function handleLogin() {
  await signIn.email({ email, password });
  await fetchSession();
  await navigateTo('/org/[slug]/dashboard');
}
</script>
```

---

### Protected Page

```vue
<script setup lang="ts">
const { loggedIn } = useAuth();

// Redirect if not logged in
onMounted(() => {
  if (!loggedIn.value) {
    navigateTo('/auth/login');
  }
});
</script>
```

**NOTE:** Global middleware handles this automatically.

---

### Admin-Only Page

```vue
<script setup lang="ts">
const { isSuperAdmin } = useRole();

onMounted(() => {
  if (!isSuperAdmin.value) {
    navigateTo('/org/[slug]/dashboard');
  }
});
</script>
```

---

### Page with Loading State

```vue
<script setup lang="ts">
const { data: projects, pending } = await useFetch('/api/projects');
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else>
      <div v-for="project in projects" :key="project.id">
        {{ project.title }}
      </div>
    </div>
  </div>
</template>
```

---

### Dynamic Route with 404

```vue
<script setup lang="ts">
const route = useRoute();
const id = route.params.id as string;

const { data: project, error } = await useFetch(`/api/projects/${id}`);

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, message: 'Project not found' });
}
</script>
```

---

## Troubleshooting

### "Page not found"

**Fix:** Ensure file in `pages/` directory, restart dev server

### "Middleware not running"

**Fix:** Check `nuxt.config.ts` publicRoutes, ensure middleware file exists

### "Component not auto-imported"

**Fix:** Ensure in `app/components/`, use PascalCase name, restart dev server

### "useFetch not working"

**Fix:** Use `await useFetch()` (async), check API endpoint exists

### "Route params undefined"

**Fix:** Ensure file named `[id].vue`, access via `route.params.id`

---

## Checklist

- [ ] Create page file in `pages/`
- [ ] Add route protection (public or protected)
- [ ] Add role check (if admin page)
- [ ] Fetch data (useFetch or $fetch)
- [ ] Add form (if needed)
- [ ] Add navigation link (if needed)
- [ ] Add SEO meta (if public page)
- [ ] Test page (manual + automated)
- [ ] Run linter (`bun lint`)
- [ ] Run typecheck (`bun typecheck`)
- [ ] Commit changes
