# Protocol — Simplified Implementation Plan

> **Purpose:** Streamlined setup guide for local-first PWA with Nuxt 4 + Dexie.js

---

## Simplified Structure

```
protocol/
├── app/
│   ├── pages/           # Route pages
│   ├── components/      # Vue components
│   ├── composables/     # Shared logic
│   └── layouts/         # Page layouts
├── shared/
│   ├── db/             # Dexie schema
│   └── schemas/        # Zod schemas
├── public/             # Static assets
├── .github/workflows/  # CI/CD
├── .vscode/            # IDE configs
├── .cursorrules        # AI assistant rules
└── package.json
```

**Key points:**

- Single Nuxt 4 app (no monorepo)
- Client-side only (no server)
- Dexie.js for local storage
- No Docker/Postgres needed
- No auth system needed

---

## Phase 0: Repository & Setup

### Step 0.1: Initialize Repository

```bash
# Clone existing repo or init new
git clone https://github.com/alois/protocol
cd protocol

# Or init new:
# git init -b main
```

### Step 0.2: Create Directory Structure

```bash
mkdir -p app/pages
mkdir -p app/components
mkdir -p app/composables
mkdir -p app/layouts
mkdir -p shared/db
mkdir -p shared/schemas
mkdir -p public
mkdir -p .github/workflows
mkdir -p .vscode
```

### Step 0.3: Root Package.json

```json
{
  "name": "protocol",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nuxi dev",
    "build": "nuxi build",
    "preview": "nuxi preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:integration": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write \"**/*.{ts,tsx,vue,js,jsx,json,md}\""
  },
  "dependencies": {
    "@nuxt/ui": "latest",
    "dexie": "latest",
    "nuxt": "^4.0.0",
    "vite-plugin-pwa": "latest",
    "vue": "^3.4.0",
    "zod": "latest"
  },
  "devDependencies": {
    "@nuxt/test-utils": "latest",
    "@playwright/test": "latest",
    "eslint": "latest",
    "prettier": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

### Step 0.4: Git Config

```bash
cat > .gitignore << 'EOF'
node_modules
.nuxt
dist
.output
*.log
.DS_Store
.vscode/settings.json
*.tsbuildinfo
.cache
.env
.env*.local
EOF
```

### Step 0.5: Install Dependencies

```bash
bun install
```

---

## Phase 1: Core Nuxt App Setup

### Step 1.1: Initialize Nuxt Project

```bash
# Use official Nuxt UI starter
bunx nuxi init . -t github:nuxt-ui-templates/starter

bun install
```

**What this gives you:**

- Nuxt 4 + TypeScript pre-configured
- Nuxt UI with Tailwind CSS 4
- ESLint + Prettier setup
- Dark mode ready
- Auto-imports

### Step 1.2: Add Local-First Dependencies

```bash
# Dexie for IndexedDB + PWA
bun add dexie
bun add -d vite-plugin-pwa

# Validation
bun add zod
```

### Step 1.3: Setup Nuxt Config (PWA)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // ... existing config
  vite: {
    optimizeDeps: {
      include: ['dexie'],
    },
  },
  modules: [
    ['@vite-pwa/nuxt', {
      manifest: {
        name: 'Protocol',
        short_name: 'Protocol',
        description: 'Track your personal routines',
        theme_color: '#ffffff',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }],
  ],
})
```

### Step 1.4: Setup Dexie Schema

```typescript
// shared/db/schema.ts
import Dexie, { Table } from 'dexie'

export interface Protocol {
  id: string
  name: string
  description?: string
  category: string
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly'
  status: 'active' | 'paused' | 'completed'
  targetMetric?: string
  createdAt: Date
  updatedAt: Date
}

export interface Routine {
  id: string
  protocolId: string
  name: string
  order: number
  frequency: 'daily' | 'weekly' | string[]
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
  notes?: string
}

export interface Exercise {
  id: string
  routineId: string
  name: string
  sets?: number
  reps?: number
  weight?: number
  equipmentType?: string
  notes?: string
}

export interface TrackingLog {
  id: string
  exerciseId: string
  date: Date
  completed: boolean
  setsDone?: number
  repsDone?: number
  weightUsed?: number
  durationTaken?: number
  energyLevel?: number
  difficultyFelt?: number
  notes?: string
}

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

### Step 1.5: Create Directory Structure

```bash
mkdir -p app/components/{protocols,routines,tracking,analytics}
mkdir -p app/composables
mkdir -p shared/db
mkdir -p shared/schemas
```

### Step 1.6: Create Basic Pages

```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<!-- app/pages/index.vue -->
<script setup lang="ts">
useSeoMeta({
  title: 'Protocol - Track Your Routines',
  description: 'Local-first PWA for personal routine tracking',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh]">
    <h1 class="text-5xl font-bold mb-4">Protocol</h1>
    <p class="text-xl text-gray-600 mb-8">Track your personal routines</p>
    <UButton to="/protocols" size="lg">Get Started</UButton>
  </div>
</template>
```

### Step 1.7: Create Composable

```typescript
// app/composables/useProtocols.ts
import { db, type Protocol } from '~/shared/db/schema'

export function useProtocols() {
  const protocols = ref<Protocol[]>([])

  async function loadProtocols() {
    protocols.value = await db.protocols.toArray()
  }

  async function createProtocol(name: string, description: string, duration: string) {
    const id = Math.random().toString(36).substr(2, 9)
    const protocol: Protocol = {
      id,
      name,
      description,
      category: 'general',
      duration: duration as any,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.protocols.add(protocol)
    await loadProtocols()
    return protocol
  }

  onMounted(() => loadProtocols())

  return {
    protocols: readonly(protocols),
    createProtocol,
    loadProtocols,
  }
}
```

**Verification:**

- `bun run dev` starts app on http://localhost:3000
- Pages load correctly
- Dexie database initialized in browser
- No server needed

---

## Phase 2: Features Implementation

### Step 2.1: Add Tracking Components

```bash
# Create tracking UI
mkdir -p app/components/tracking

cat > app/components/tracking/ExerciseLog.vue << 'EOF'
<script setup lang="ts">
const props = defineProps({
  exerciseId: String,
})

const { logExercise } = useTracking()
const completed = ref(false)
const weight = ref<number>()
const notes = ref('')

async function submit() {
  if (props.exerciseId) {
    await logExercise(props.exerciseId, new Date(), {
      completed: completed.value,
      weightUsed: weight.value,
      notes: notes.value,
    })
    completed.value = false
    weight.value = undefined
    notes.value = ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <UCheckbox v-model="completed" label="Completed" />
    <UInput v-model.number="weight" type="number" placeholder="Weight (optional)" />
    <UTextarea v-model="notes" placeholder="Notes" />
    <UButton @click="submit" class="w-full">Log Exercise</UButton>
  </div>
</template>
EOF
```

### Step 2.2: Add Pages

```bash
mkdir -p app/pages

cat > app/pages/protocols.vue << 'EOF'
<script setup lang="ts">
const { protocols, createProtocol } = useProtocols()

const showForm = ref(false)
const name = ref('')
const description = ref('')
const duration = ref('daily')

async function handleCreate() {
  await createProtocol(name.value, description.value, duration.value)
  showForm.value = false
  name.value = ''
  description.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Protocols</h1>
      <UButton @click="showForm = !showForm">New Protocol</UButton>
    </div>

    <div v-if="showForm" class="bg-white p-6 rounded-lg space-y-4">
      <UInput v-model="name" placeholder="Protocol name" />
      <UInput v-model="description" placeholder="Description" />
      <USelect v-model="duration" :options="['daily', 'weekly', 'monthly', 'yearly']" />
      <div class="flex gap-2">
        <UButton @click="handleCreate">Create</UButton>
        <UButton @click="showForm = false" variant="ghost">Cancel</UButton>
      </div>
    </div>

    <div class="grid gap-4">
      <UCard v-for="p in protocols" :key="p.id">
        <template #header>{{ p.name }}</template>
        <p>{{ p.description }}</p>
        <p class="text-sm text-gray-500 mt-2">{{ p.duration }}</p>
      </UCard>
    </div>
  </div>
</template>
EOF
```

---

## Phase 3: IDE & AI Assistant Configs

### Step 3.1: VSCode

```bash
cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
EOF

cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
EOF
```

### Step 3.2: Cursor AI

```bash
cat > .cursorrules << 'EOF'
# Protocol Project

## Stack
- Nuxt 4 (client-side)
- Dexie.js + IndexedDB
- Nuxt UI + Tailwind 4
- Vue 3 Composition API
- Vite PWA

## Style
- TypeScript strict
- <script setup> only
- No Options API
- Zod validation for user input
EOF
```

---

## Phase 4: CI/CD

```bash
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:run

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:integration
EOF
```

---

## Phase 5: Testing

```bash
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
  },
})
EOF

bunx playwright install

cat > playwright.config.ts << 'EOF'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'bun dev',
    url: 'http://localhost:3000',
  },
})
EOF

mkdir -p tests/e2e
cat > tests/e2e/home.spec.ts << 'EOF'
import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Protocol')
})

test('can create protocol', async ({ page }) => {
  await page.goto('/protocols')
  await page.click('button:has-text("New Protocol")')
  await page.fill('input[placeholder="Protocol name"]', 'My Routine')
  await page.click('button:has-text("Create")')
  await expect(page.locator('text=My Routine')).toBeVisible()
})
EOF
```

---

## Phase 6: Production Build

```bash
# Build static site
bun run build

# Preview locally
bun run preview

# Deploy to Vercel/Netlify (upload dist/ folder)
```

---

## Quick Commands

```bash
# Development
bun run dev                # Start dev server (:3000)
bun run preview            # Preview production build

# Build & Deploy
bun run build              # Build for production
bun run typecheck          # Type check
bun run lint               # ESLint

# Testing
bun run test               # Unit tests (watch)
bun run test:run           # Unit tests (single run)
bun run test:integration   # E2E tests (Playwright)

# Utilities
bun run format             # Format code (Prettier)
```

---

## Completion Checklist

- [ ] Phase 0: Repository initialized
- [ ] Phase 1: Nuxt app running with Dexie
- [ ] Phase 2: Core features implemented
- [ ] Phase 3: IDE configs done
- [ ] Phase 4: CI/CD active
- [ ] Phase 5: Tests passing
- [ ] Phase 6: Production build working
- [ ] Deploy to Vercel/Netlify

---

**Total Time:** ~5-7 days
**Files:** ~20-30 files
**LOC:** ~1,500-2,500 (lean & focused)
