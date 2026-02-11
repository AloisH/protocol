# SOP: Adding Pages

**Related docs:** [Project Architecture](../System/project_architecture.md)

---

## File-Based Routing

| File | Route |
|------|-------|
| `pages/index.vue` | `/` |
| `pages/protocols/index.vue` | `/protocols` |
| `pages/execute/[protocolId].vue` | `/execute/:protocolId` |
| `pages/analytics.vue` | `/analytics` |
| `pages/settings.vue` | `/settings` |
| `pages/legal/privacy.vue` | `/legal/privacy` |

---

## Step-by-Step

### 1. Create Page File

```vue
<script setup lang="ts">
// SEO
useSeoMeta({
  title: 'Page Title - Protocol',
  description: 'Page description',
})

// Composables (auto-imported)
const { data, loading, error } = useSomeComposable()

// Load data on mount (client-side only)
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Page Title</h1>
    <!-- Content -->
  </div>
</template>
```

### 2. SSR Guard

All Dexie access must be client-only:

```typescript
// In composable
async function loadData() {
  if (import.meta.server) return  // Skip on SSR
  // ... Dexie queries
}

// Or in page
onMounted(async () => {
  // onMounted only runs client-side
  await loadData()
})
```

### 3. Add Navigation (if needed)

Update `AppHeader.vue` nav links:

```typescript
const navLinks = computed<NavigationMenuItem[]>(() => [
  { label: 'Protocols', to: '/protocols', icon: 'i-lucide-clipboard-list' },
  { label: 'Analytics', to: '/analytics', icon: 'i-lucide-chart-line' },
  { label: 'New Page', to: '/new-page', icon: 'i-lucide-some-icon' },
])
```

### 4. Dynamic Routes

For params like `[protocolId]`:

```vue
<script setup lang="ts">
const route = useRoute()
const protocolId = computed(() => route.params.protocolId as string)
</script>
```

---

## Page Patterns

### Loading State

```vue
<template>
  <div v-if="loading" class="flex justify-center py-12">
    <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8" />
  </div>
  <div v-else-if="error">
    <UAlert color="error" :title="error" />
  </div>
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

### Forms with Zod

```vue
<script setup lang="ts">
import { ProtocolFormSchema } from '#shared/schemas/protocols'

const state = reactive({ name: '', duration: 'daily' })

async function onSubmit() {
  const validated = ProtocolFormSchema.parse(state)
  await createProtocol(validated)
}
</script>

<template>
  <UForm :state="state" :schema="ProtocolFormSchema" @submit="onSubmit">
    <UFormField name="name" label="Name">
      <UInput v-model="state.name" />
    </UFormField>
    <UButton type="submit">Create</UButton>
  </UForm>
</template>
```

---

## Nuxt UI v4 Notes

- `USelect`: Use `:items` not `:options`
- `UModal`: Use `#body` and `#footer` slots
- `UBadge`: Has `variant="soft"` for subtle badges
- `UForm` + `UFormField`: Integrated Zod validation
- `UColorModeButton`: Dark mode toggle

---

_Last updated: 2026-02-11_
