# Protocol — Implementation Guide

> **Purpose:** Step-by-step implementation guide for Protocol - local-first PWA for routine tracking.

**For detailed step-by-step setup, see [IMPLEMENTATION-SIMPLIFIED.md](./IMPLEMENTATION-SIMPLIFIED.md)**

---

## Implementation Phases Overview

```
Phase 0: Repository & Setup (Day 1)
Phase 1: Core Nuxt + Dexie (Day 1-3)
Phase 2: Features (Day 3-5)
Phase 3: IDE Configs (Day 5)
Phase 4: CI/CD & Tests (Day 5-7)
Phase 5: Production Build (Day 7)
```

---

## Quick Start

```bash
# Clone repo
git clone https://github.com/alois/protocol
cd protocol

# Install
bun install

# Start dev
bun run dev

# Visit http://localhost:3000
```

---

## Tech Stack

| Layer          | Technology          | Purpose               |
| -------------- | ------------------- | --------------------- |
| **Framework**  | Nuxt 4              | Vue 3 SSG framework   |
| **Storage**    | Dexie.js            | IndexedDB wrapper     |
| **UI**         | Nuxt UI             | Component library     |
| **Styling**    | Tailwind 4          | Utility-first CSS     |
| **PWA**        | Vite PWA            | Offline + installable |
| **Validation** | Zod                 | Type-safe schemas     |
| **Testing**    | Vitest + Playwright | Unit & E2E tests      |
| **Runtime**    | Bun                 | Fast JS runtime       |

---

## Architecture

**Client-side only** — No server, no database, no auth needed.

```
┌─────────────────────────────────────────┐
│  Nuxt 4 Pages + Vue Components         │
│  (Composition API, auto-imports)        │
└────────────────┬────────────────────────┘
                 │
     ┌───────────▼───────────┐
     │  Composables          │
     │  (useProtocols,       │
     │   useTracking, etc)   │
     └───────────┬───────────┘
                 │
     ┌───────────▼───────────┐
     │  Dexie.js             │
     │  (Zod validation)     │
     └───────────┬───────────┘
                 │
     ┌───────────▼───────────┐
     │  IndexedDB            │
     │  (Browser storage)    │
     └───────────────────────┘
```

---

## Data Model

### Protocol

- id, name, description, category
- duration (daily/weekly/monthly/yearly)
- status (active/paused/completed)
- targetMetric (improvement goal)
- createdAt, updatedAt

### Routine

- id, protocolId, name, order
- frequency (daily/weekly/custom)
- timeOfDay (morning/afternoon/evening)
- notes

### Exercise

- id, routineId, name
- sets, reps, weight (optional)
- equipmentType, notes

### TrackingLog

- id, exerciseId, date
- completed (boolean)
- setsDone, repsDone, weightUsed
- energyLevel, difficultyFelt (1-10)
- notes

See [shared/db/schema.ts](./shared/db/schema.ts) for full schema.

---

## Project Structure

```
app/
├── pages/          # Routes
├── components/     # Vue components
├── composables/    # Logic composition
└── layouts/        # Layouts

shared/
├── db/            # Dexie schema & queries
└── schemas/       # Zod validation

public/           # Static assets
.github/          # CI/CD
.vscode/          # IDE config
```

---

## Key Patterns

### 1. Composables for Logic

```typescript
// app/composables/useProtocols.ts
export function useProtocols() {
  const protocols = ref<Protocol[]>([])

  async function loadProtocols() {
    protocols.value = await db.protocols.toArray()
  }

  async function createProtocol(...) { ... }

  return { protocols: readonly(protocols), createProtocol }
}
```

### 2. Dexie for Storage

```typescript
// shared/db/schema.ts
export class ProtocolDB extends Dexie {
  protocols!: Table<Protocol>
  routines!: Table<Routine>
  exercises!: Table<Exercise>
  trackingLogs!: Table<TrackingLog>

  constructor() {
    super('ProtocolDB')
    this.version(1).stores({
      protocols: '++id, status',
      routines: '++id, protocolId',
      exercises: '++id, routineId',
      trackingLogs: '++id, exerciseId, date',
    })
  }
}

export const db = new ProtocolDB()
```

### 3. Zod for Validation

```typescript
// shared/schemas/protocol.ts
import { z } from 'zod'

export const ProtocolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
})
```

### 4. Components with Composition API

```vue
<script setup lang="ts">
const { protocols, createProtocol } = useProtocols()
const name = ref('')

async function handleCreate() {
  await createProtocol(name.value, '')
  name.value = ''
}
</script>

<template>
  <div>
    <UInput v-model="name" />
    <UButton @click="handleCreate">Create</UButton>
  </div>
</template>
```

---

## Development

### Commands

```bash
# Dev
bun run dev          # Start (:3000)
bun run preview      # Preview build
bun run typecheck    # Type check

# Build
bun run build        # Build for production
bun run lint         # ESLint

# Test
bun run test         # Unit tests (watch)
bun run test:run     # Unit tests (single)
bun run test:integration  # E2E

# Utilities
bun run format       # Prettier
```

### Hot Module Replacement (HMR)

Changes are automatically reloaded in the browser during development.

### Debugging

1. **Components:** Vue DevTools extension
2. **Storage:** Browser DevTools → Application → IndexedDB
3. **Errors:** Browser console

---

## Testing

### Unit Tests (Vitest)

```typescript
// tests/unit/composables/useProtocols.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useProtocols } from '~/app/composables/useProtocols'

describe('useProtocols', () => {
  let composable: ReturnType<typeof useProtocols>

  beforeEach(() => {
    composable = useProtocols()
  })

  it('loads protocols', async () => {
    await composable.loadProtocols()
    expect(Array.isArray(composable.protocols.value)).toBe(true)
  })
})
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/protocols.spec.ts
import { test, expect } from '@playwright/test'

test('create protocol flow', async ({ page }) => {
  await page.goto('/protocols')
  await page.click('button:has-text("New")')
  await page.fill('input[placeholder="Name"]', 'My Routine')
  await page.click('button:has-text("Create")')
  await expect(page.locator('text=My Routine')).toBeVisible()
})
```

---

## Deployment

### Static Hosting (Vercel, Netlify, GitHub Pages)

```bash
# Build
bun run build

# Upload dist/ folder to hosting
```

### PWA Features

- **Offline:** Service worker caches app shell
- **Installable:** Add to home screen on iOS/Android
- **Fast:** Instant load, no server latency
- **Sync:** Cross-tab sync via Broadcast Channel API

---

## Critical Rules

1. **Composition API only** — Use `<script setup>`, no Options API
2. **Zod validation** — Validate user input with `#shared/schemas/*`
3. **Dexie for storage** — All data in IndexedDB via `shared/db/schema.ts`
4. **No type assertions** — No `as` casts, use Zod for runtime safety
5. **Readonly refs** — Export protocols as `readonly(protocols)`
6. **Auto-imports** — Components, composables auto-imported
7. **Local-first** — All features work offline

---

## Troubleshooting

| Issue                   | Solution                                            |
| ----------------------- | --------------------------------------------------- |
| **Dexie errors**        | Check schema.ts version matches constructor version |
| **Build fails**         | Run `bun install` and clear `.nuxt/` directory      |
| **Tests fail**          | Ensure IndexedDB mock is initialized in test setup  |
| **PWA not installing**  | Check manifest.json and HTTPS on prod               |
| **Data not persisting** | Check IndexedDB in DevTools → Application tab       |

---

## Documentation

- **[IDEA.md](./IDEA.md)** — Project vision & goals
- **[CLAUDE.md](./CLAUDE.md)** — Project rules & workflow
- **[.agent/README.md](./.agent/README.md)** — System documentation
- **[IMPLEMENTATION-SIMPLIFIED.md](./IMPLEMENTATION-SIMPLIFIED.md)** — Detailed setup steps

---

## Next Steps

1. Clone repository
2. Run `bun install`
3. Run `bun run dev`
4. Create your first protocol
5. Implement additional features
6. Deploy to production

See [IMPLEMENTATION-SIMPLIFIED.md](./IMPLEMENTATION-SIMPLIFIED.md) for detailed step-by-step setup.
