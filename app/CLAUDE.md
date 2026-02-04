# App Context (app/)

Client-side Nuxt code - pages, components, composables.

## Structure

```
app/
├── app.vue              # Root layout
├── pages/               # File-based routes
│   ├── index.vue        # Home /
│   ├── protocols/       # Protocol list /protocols
│   ├── protocols/[id].vue  # Protocol detail
│   ├── tracking.vue     # Daily tracking /tracking
│   └── analytics.vue    # Progress analytics /analytics
├── components/          # Auto-imported (feature-based)
│   ├── shared/          # Shared utilities
│   ├── protocols/       # ProtocolCard, ProtocolForm
│   ├── routines/        # RoutineList, RoutineForm
│   ├── tracking/        # ExerciseLog, SessionHistory
│   └── analytics/       # ProgressChart, MetricsPanel
├── composables/         # Auto-imported
│   ├── useProtocols.ts
│   ├── useTracking.ts
│   ├── useAnalytics.ts
│   └── useSettings.ts
├── layouts/
│   └── default.vue      # Default layout
└── assets/
    └── css/main.css     # Global styles
```

## Pages (File-Based Routing)

**Convention:**

- `pages/index.vue` → `/`
- `pages/protocols.vue` → `/protocols`
- `pages/protocols/[id].vue` → `/protocols/:id`
- `pages/tracking.vue` → `/tracking`

**Basic Page Structure:**

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'Protocols - Protocol',
  description: 'Manage your personal routines',
})

const { protocols, loading } = useProtocols()

onMounted(async () => {
  await useProtocols().loadProtocols()
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">Protocols</h1>
    <UCard v-if="loading">
      <USkeleton class="h-12 w-12 rounded-full" />
    </UCard>
    <div v-else class="grid gap-4">
      <ProtocolCard v-for="p in protocols" :key="p.id" :protocol="p" />
    </div>
  </div>
</template>
```

## Components

**Auto-imported from `components/`:**

Components can be organized in feature-based subdirectories:

```
components/
├── protocols/
│   ├── ProtocolCard.vue         → <ProtocolCard>
│   └── ProtocolForm.vue         → <ProtocolForm>
├── routines/
│   ├── RoutineList.vue          → <RoutineList>
│   └── RoutineForm.vue          → <RoutineForm>
├── tracking/
│   ├── ExerciseLog.vue          → <ExerciseLog>
│   └── SessionHistory.vue       → <SessionHistory>
├── analytics/
│   ├── ProgressChart.vue        → <ProgressChart>
│   └── MetricsPanel.vue         → <MetricsPanel>
└── shared/
    └── AppHeader.vue            → <AppHeader>
```

**Component Naming Convention:**

- Feature prefix matches folder: `protocols/ProtocolCard.vue`
- Auto-import: `<ProtocolCard>` (filename only)
- Shared folder: `shared/AppHeader.vue` → `<AppHeader>`

**Nuxt UI components (always available):**

- Layout: `UApp`, `UContainer`, `UCard`
- Forms: `UInput`, `UButton`, `UCheckbox`, `USelect`, `UTextarea`
- Feedback: `UAlert`, `UToast`, `USkeleton`
- Navigation: `ULink`, `NuxtLink`
- Utilities: `UColorModeButton`, `UIcon`, `UModal`, `UDropdownMenu`

**Important:** Check Nuxt UI v4 docs at https://ui.nuxt.com

**Component Pattern:**

```vue
<script setup lang="ts">
import type { Protocol } from '~/shared/db/schema'

interface Props {
  protocol: Protocol
}

defineProps<Props>()

const emit = defineEmits<{
  delete: [id: string]
  edit: [protocol: Protocol]
}>()
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-bold">{{ protocol.name }}</h3>
    </template>
    <p class="text-sm text-gray-600">{{ protocol.description }}</p>
    <template #footer>
      <div class="flex gap-2">
        <UButton @click="$emit('edit', protocol)">Edit</UButton>
        <UButton @click="$emit('delete', protocol.id)" variant="ghost">Delete</UButton>
      </div>
    </template>
  </UCard>
</template>
```

**Testing:**

```typescript
// Place next to component: ProtocolCard.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProtocolCard from './ProtocolCard.vue'

describe('ProtocolCard', () => {
  it('renders protocol name', async () => {
    const wrapper = await mountSuspended(ProtocolCard, {
      props: {
        protocol: {
          id: '1',
          name: 'Neck Training',
          description: 'Daily neck exercises',
          category: 'exercises',
          duration: 'daily',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    })
    expect(wrapper.text()).toContain('Neck Training')
  })
})
```

## Composables

**Auto-imported from `composables/`:**

Composables are organized by feature and auto-imported:

```
composables/
├── useProtocols.ts      → useProtocols()
├── useTracking.ts       → useTracking()
├── useAnalytics.ts      → useAnalytics()
└── useSettings.ts       → useSettings()
```

**useProtocols Pattern:**

```typescript
// app/composables/useProtocols.ts
import { db, type Protocol } from '~/shared/db/schema'

export function useProtocols() {
  const protocols = ref<Protocol[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadProtocols() {
    loading.value = true
    try {
      protocols.value = await db.protocols.toArray()
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function createProtocol(
    name: string,
    description: string,
    duration: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ) {
    const id = crypto.randomUUID()
    const protocol: Protocol = {
      id,
      name,
      description,
      category: 'general',
      duration,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.protocols.add(protocol)
    await loadProtocols()
    return protocol
  }

  async function deleteProtocol(id: string) {
    await db.protocols.delete(id)
    await loadProtocols()
  }

  async function updateProtocol(id: string, updates: Partial<Protocol>) {
    await db.protocols.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    await loadProtocols()
  }

  return {
    protocols: readonly(protocols),
    loading: readonly(loading),
    error: readonly(error),
    loadProtocols,
    createProtocol,
    deleteProtocol,
    updateProtocol,
  }
}
```

**Usage in Components:**

```vue
<script setup lang="ts">
// Auto-imported, no import needed
const { protocols, createProtocol, deleteProtocol } = useProtocols()

const name = ref('')

async function handleCreate() {
  await createProtocol(name.value, '', 'daily')
  name.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <UInput v-model="name" placeholder="Protocol name" />
      <UButton @click="handleCreate">Create</UButton>
    </div>
    <div class="grid gap-4">
      <ProtocolCard
        v-for="p in protocols"
        :key="p.id"
        :protocol="p"
        @delete="deleteProtocol"
      />
    </div>
  </div>
</template>
```

## Forms & Validation

**Pattern with Zod:**

```vue
<script setup lang="ts">
import { z } from 'zod'

const state = reactive({
  name: '',
  description: '',
  duration: 'daily',
})

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  duration: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
})

const { createProtocol } = useProtocols()
const loading = ref(false)

async function onSubmit() {
  try {
    loading.value = true
    await createProtocol(state.name, state.description, state.duration)
    state.name = ''
    state.description = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="name" label="Name">
      <UInput v-model="state.name" />
    </UFormField>

    <UFormField name="description" label="Description (optional)">
      <UTextarea v-model="state.description" />
    </UFormField>

    <UFormField name="duration" label="Duration">
      <USelect
        v-model="state.duration"
        :options="['daily', 'weekly', 'monthly', 'yearly']"
      />
    </UFormField>

    <UButton type="submit" :loading="loading">Create Protocol</UButton>
  </UForm>
</template>
```

## Toast Notifications

**Use toast for user feedback:**

```vue
<script setup lang="ts">
const toast = useToast()

async function handleSubmit() {
  try {
    // Do something
    toast.add({
      title: 'Success',
      description: 'Protocol created',
      color: 'success',
      icon: 'i-lucide-check',
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: String(e),
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
}
</script>
```

## Styling

**Tailwind classes:**

```vue
<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <h1 class="text-3xl font-bold mb-4">Protocols</h1>
      <p class="text-gray-600 mb-6">Manage your personal routines</p>
    </UCard>
  </div>
</template>
```

**Dark mode:**

- Automatic via `UColorModeButton`
- Use `dark:` prefix: `text-neutral-500 dark:text-neutral-400`

## State Management

**No global store needed** - Use composables for local state:

```typescript
// ✅ Good - Local composable state
const { protocols } = useProtocols()

// ❌ Avoid - Complex global stores
// Use Pinia only if absolutely necessary
```

## Performance

**Lazy loading with `ClientOnly`:**

```vue
<template>
  <ClientOnly>
    <!-- This component only renders on client -->
    <HeavyComponent />
    <template #fallback>
      <USkeleton class="h-12 w-full" />
    </template>
  </ClientOnly>
</template>
```

**Computed vs Method:**

```typescript
// ✅ Use computed for derived values
const completionRate = computed(() => {
  return protocols.value.length > 0
    ? (completedCount.value / protocols.value.length) * 100
    : 0
})

// ❌ Avoid methods for data that should be reactive
// Method won't update automatically
```

## Critical Rules

1. **`<script setup>` only** — No Options API
2. **Composition API** — Use refs, computed, reactive, watch
3. **Auto-imports** — No manual imports for components/composables
4. **Zod validation** — Validate user input with `z.object()`
5. **Readonly refs** — Export state as `readonly(state)`
6. **Feature-based** — Organize by domain (protocols, tracking, analytics)
7. **Dexie for storage** — All data in IndexedDB via composables
8. **No server calls** — Fully client-side, no API routes

## Debugging

1. **Vue DevTools** — Inspect components, state
2. **Browser DevTools** → **Application** → **IndexedDB** → Check data
3. **Console** → Check for errors
4. **Network** → Should be empty (no API calls)
