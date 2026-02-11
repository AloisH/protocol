# App Context (app/)

Client-side Nuxt code - pages, components, composables.

## Structure

```
app/
├── app.vue              # Root layout (PWA install, JSON-LD, OG)
├── pages/
│   ├── index.vue              # / — Today's dashboard
│   ├── protocols/index.vue    # /protocols — Protocol list + CRUD
│   ├── execute/[protocolId].vue # /execute/:id — Session execution
│   ├── analytics.vue          # /analytics — Charts, metrics
│   ├── settings.vue           # /settings — Export/import, notifications
│   └── legal/                 # Privacy policy, terms
├── components/          # Auto-imported (feature-based, pathPrefix: false)
│   ├── shared/          # AppHeader, AppFooter, AppLogo, ErrorBoundary
│   ├── protocols/       # ProtocolCard, ProtocolForm, DeleteProtocolDialog
│   ├── activities/      # ActivityCard, ActivityForm, ActivityList, groups
│   ├── session/         # SessionModal, SessionActivityItem, SessionRating
│   ├── analytics/       # CompletionChart, CompletionCalendar, MetricCard
│   ├── settings/        # ExportSection, ImportSection, NotificationsSection
│   ├── dashboard/       # DashboardShortcutsHelp
│   ├── blog/            # BlogPostAuthor, BlogPostGrid (placeholder)
│   └── content/         # Alert
├── composables/         # Auto-imported (incl. nested dirs)
│   ├── useProtocols.ts        # Protocol CRUD
│   ├── useActivities.ts       # Activity CRUD + reorder + groups
│   ├── useActivityGroups.ts   # Group CRUD + reorder
│   ├── useSession.ts          # Session execution state
│   ├── useDaily.ts            # Today's protocols, completions, streaks
│   ├── useTracking.ts         # TrackingLog queries
│   ├── useAnalytics.ts        # Calendar, trends, stats
│   ├── useSettings.ts         # App settings
│   ├── useTimer.ts            # Countdown timer
│   ├── useBeep.ts             # Audio feedback
│   ├── useNotifications.ts    # Web Notifications API
│   ├── useIndexedDB.ts        # Export/import/clear
│   └── ...                    # useSeo, useSlugify, useKeyboardShortcuts
├── layouts/
│   └── default.vue      # Sticky header + footer
├── plugins/
│   └── notifications.client.ts  # Scheduled reminders
├── utils/
│   └── error.ts         # getErrorMessage() helper
└── assets/
    └── css/main.css     # Global styles
```

## Pages (File-Based Routing)

| File                             | Route          | Purpose                                      |
| -------------------------------- | -------------- | -------------------------------------------- |
| `pages/index.vue`                | `/`            | Daily progress ring, protocol cards, streaks |
| `pages/protocols/index.vue`      | `/protocols`   | All protocols, create/edit/delete            |
| `pages/execute/[protocolId].vue` | `/execute/:id` | Full-screen session with timer               |
| `pages/analytics.vue`            | `/analytics`   | Charts, calendar heatmap, stats              |
| `pages/settings.vue`             | `/settings`    | Export/import, notifications                 |

## Components

**Auto-imported from `components/` with `pathPrefix: false`:**

```
activities/ActivityCard.vue     → <ActivityCard>
protocols/ProtocolCard.vue      → <ProtocolCard>
session/SessionModal.vue        → <SessionModal>
shared/AppHeader.vue            → <AppHeader>
```

**Nuxt UI v4 components (always available):**

- Layout: `UApp`, `UContainer`, `UCard`
- Forms: `UInput`, `UButton`, `UCheckbox`, `USelect` (use `:items` not `:options`), `UTextarea`
- Feedback: `UAlert`, `UToast`, `USkeleton`
- Navigation: `ULink`, `NuxtLink`
- Utilities: `UColorModeButton`, `UIcon`, `UModal` (use `#body`/`#footer` slots), `UDropdownMenu`, `UBadge`

**Component Pattern:**

```vue
<script setup lang="ts">
import type { Protocol } from '#shared/db/schema'

interface Props {
  protocol: Protocol
}

defineProps<Props>()

defineEmits<{
  delete: [id: string]
  edit: [protocol: Protocol]
}>()
</script>
```

**Testing:**

```typescript
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProtocolCard from './ProtocolCard.vue'

describe('ProtocolCard', () => {
  it('renders protocol name', async () => {
    const wrapper = await mountSuspended(ProtocolCard, {
      props: { protocol: { id: '1', name: 'Test', /* ... */ } },
    })
    expect(wrapper.text()).toContain('Test')
  })
})
```

## Composables

**Auto-imported from `composables/` + `composables/**`:\*\*

Key patterns:

- `ref()` for client-only state
- `useState()` for SSR-safe shared state (useDaily, useSettings)
- `readonly()` on all exported state
- `import.meta.server` guard before any Dexie call
- Zod validation on create/update

## Forms & Validation

```vue
<script setup lang="ts">
import { ProtocolFormSchema } from '#shared/schemas/protocols'

const state = reactive({ name: '', duration: 'daily' as const })

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
    <UFormField name="duration" label="Duration">
      <USelect v-model="state.duration" :items="['daily', 'weekly', 'monthly', 'yearly']" />
    </UFormField>
    <UButton type="submit">Create</UButton>
  </UForm>
</template>
```

## Critical Rules

1. **`<script setup>` only** — No Options API
2. **Auto-imports** — No manual imports for components/composables
3. **Zod validation** — Use schemas from `#shared/schemas/*`
4. **Readonly refs** — Export state as `readonly(state)`
5. **SSR guard** — `if (import.meta.server) return` before Dexie access
6. **Dexie for storage** — All data in IndexedDB via composables
7. **No server calls** — Fully client-side, no API routes
8. **USelect uses `:items`** — Not `:options` (Nuxt UI v4)
9. **UModal uses named slots** — `#body`, `#footer`

## Debugging

1. **Vue DevTools** — Inspect components, state
2. **DevTools → Application → IndexedDB** → Check ProtocolDB data
3. **Console** → Check for errors
4. **Network** → Should be empty (no API calls)
