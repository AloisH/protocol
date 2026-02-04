# Bistro — Simplified Implementation Plan

> **Purpose:** Step-by-step implementation guide. Simplified structure with 2 apps (web, landing) and 1 package (cli).

---

## Implementation Phases Overview

```
Phase 0: Repository & Environment Setup ✓ (DONE)
Phase 1: Web App (apps/web) (Day 1-5)
Phase 2: Landing Page (apps/landing) (Day 5-7)
Phase 3: CLI Tool (packages/cli) (Day 7-10)
Phase 4: CI/CD & Polish (Day 10-14)
```

---

## Phase 0: Repository & Environment Setup ✓

**Status:** COMPLETED

- Repository initialized
- README.md created
- package.json, docker-compose.yml, .env.example, .gitignore created
- Git commit made

---

## Phase 1: Web App (apps/web)

### Step 1.1: Initialize Nuxt 4 App

```bash
cd apps/web
```

#### Create package.json

```bash
cat > package.json << 'EOF'
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "@nuxt/ui": "^2.13.0",
    "@prisma/client": "^5.9.0",
    "@vercel/ai": "^3.0.0",
    "better-auth": "^0.1.0",
    "nuxt": "^3.10.0",
    "vue": "^3.4.15",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@nuxt/devtools": "^1.0.8",
    "prisma": "^5.9.0",
    "typescript": "^5.3.3"
  }
}
EOF

bun install
```

### Step 1.2: Create Nuxt Configuration

```bash
cat > nuxt.config.ts << 'EOF'
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    authSecret: process.env.AUTH_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    resendApiKey: process.env.RESEND_API_KEY,

    public: {
      appName: 'Bistro',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  compatibilityDate: '2024-01-01',
})
EOF
```

### Step 1.3: Create Directory Structure

```bash
mkdir -p pages
mkdir -p components
mkdir -p composables
mkdir -p server/api
mkdir -p server/middleware
mkdir -p server/utils
mkdir -p prisma
mkdir -p utils
mkdir -p types
mkdir -p assets/css
mkdir -p public
```

### Step 1.4: Setup Prisma

```bash
# Initialize Prisma
bunx prisma init

# Create schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  emailVerified DateTime?
  image         String?

  accounts      Account[]
  sessions      Session[]
  projects      Project[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Project {
  id          String   @id @default(cuid())
  title       String
  description String?
  slug        String
  status      String   @default("draft")
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  aiJobs      AIJob[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, slug])
  @@map("projects")
}

model AIJob {
  id        String   @id @default(cuid())
  type      String
  status    String   @default("pending")
  input     Json
  output    Json?
  error     String?
  model     String
  tokens    Int?
  cost      Float?
  duration  Int?

  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("ai_jobs")
}
EOF
```

### Step 1.5: Create Prisma Client

```bash
cat > server/utils/db.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
EOF
```

### Step 1.6: Create Base Layout & Pages

#### app.vue

```bash
cat > app.vue << 'EOF'
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
EOF
```

#### layouts/default.vue

```bash
mkdir -p layouts

cat > layouts/default.vue << 'EOF'
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <AppHeader />
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
EOF
```

#### pages/index.vue

```bash
cat > pages/index.vue << 'EOF'
<script setup lang="ts">
const title = 'Welcome to Bistro'
const description = 'AI-powered SaaS starter kit built with Nuxt 4'

useSeoMeta({
  title,
  description,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh]">
    <h1 class="text-5xl font-bold mb-4">{{ title }}</h1>
    <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">{{ description }}</p>

    <div class="flex gap-4">
      <UButton to="/dashboard" size="lg">Get Started</UButton>
      <UButton to="http://localhost:3001" variant="outline" size="lg">Learn More</UButton>
    </div>
  </div>
</template>
EOF
```

#### pages/dashboard/index.vue

```bash
mkdir -p pages/dashboard

cat > pages/dashboard/index.vue << 'EOF'
<script setup lang="ts">
const title = 'Dashboard'
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">{{ title }}</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Projects</h2>
        </template>
        <p class="text-3xl font-bold">0</p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">AI Jobs</h2>
        </template>
        <p class="text-3xl font-bold">0</p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">API Calls</h2>
        </template>
        <p class="text-3xl font-bold">0</p>
      </UCard>
    </div>

    <UButton to="/dashboard/projects/new">Create Project</UButton>
  </div>
</template>
EOF
```

### Step 1.7: Create Components

#### components/AppHeader.vue

```bash
cat > components/AppHeader.vue << 'EOF'
<script setup lang="ts">
const config = useRuntimeConfig()
const appName = config.public.appName
</script>

<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center">
          <NuxtLink to="/" class="text-xl font-bold">
            {{ appName }}
          </NuxtLink>
        </div>

        <div class="flex items-center gap-4">
          <UButton to="/dashboard" variant="ghost">Dashboard</UButton>
          <UButton to="/auth/login" variant="ghost">Login</UButton>
        </div>
      </div>
    </nav>
  </header>
</template>
EOF
```

#### components/AppFooter.vue

```bash
cat > components/AppFooter.vue << 'EOF'
<template>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p class="text-center text-gray-600 dark:text-gray-400">
        © {{ new Date().getFullYear() }} Bistro. Open source under MIT License.
      </p>
    </div>
  </footer>
</template>
EOF
```

### Step 1.8: Create API Routes

#### server/api/health.get.ts

```bash
cat > server/api/health.get.ts << 'EOF'
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }
})
EOF
```

### Step 1.9: Initialize Database

```bash
# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev --name init
```

```bash
cd ../..
```

**Verification:**

- `bun run --filter web dev` starts app
- Visit http://localhost:3000
- Home page & dashboard load

---

## Phase 2: Landing Page (apps/landing)

### Step 2.1: Initialize Landing App

```bash
cd apps/landing

cat > package.json << 'EOF'
{
  "name": "landing",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev --port 3001",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxt/ui": "^2.13.0",
    "nuxt": "^3.10.0",
    "vue": "^3.4.15"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

bun install
```

### Step 2.2: Configure Landing Page

```bash
cat > nuxt.config.ts << 'EOF'
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  runtimeConfig: {
    public: {
      appName: 'Bistro',
    },
  },

  compatibilityDate: '2024-01-01',
})
EOF
```

### Step 2.3: Create Landing Structure

```bash
mkdir -p pages
mkdir -p components/landing
mkdir -p public
```

#### app.vue

```bash
cat > app.vue << 'EOF'
<template>
  <div>
    <NuxtPage />
  </div>
</template>
EOF
```

#### pages/index.vue

```bash
cat > pages/index.vue << 'EOF'
<script setup lang="ts">
useSeoMeta({
  title: 'Bistro - Open Source Nuxt 4 SaaS Starter',
  description: 'Free, AI-powered SaaS starter. Built with Nuxt 4, Better Auth, Vercel AI SDK, Prisma.',
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
    <LandingHeader />
    <LandingHero />
    <LandingFeatures />
    <LandingCta />
    <LandingFooter />
  </div>
</template>
EOF
```

### Step 2.4: Create Landing Components

#### components/landing/LandingHeader.vue

```bash
cat > components/landing/LandingHeader.vue << 'EOF'
<template>
  <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
    <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <h1 class="text-xl font-bold">Bistro</h1>
      <div class="flex items-center gap-4">
        <UButton to="https://github.com/bistro/bistro" target="_blank" variant="ghost">
          GitHub
        </UButton>
        <UButton to="http://localhost:3000">Get Started</UButton>
      </div>
    </nav>
  </header>
</template>
EOF
```

#### components/landing/LandingHero.vue

```bash
cat > components/landing/LandingHero.vue << 'EOF'
<template>
  <section class="py-20 px-4 text-center">
    <div class="mx-auto max-w-4xl">
      <UBadge color="primary" variant="soft" class="mb-4">
        100% Free & Open Source
      </UBadge>
      <h1 class="text-5xl md:text-7xl font-bold mb-6">
        Build AI SaaS <br />
        <span class="text-primary">10x Faster</span>
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        Production-ready Nuxt 4 starter with Better Auth, Vercel AI SDK, Prisma.
        Skip boring setup, ship faster.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton size="xl" to="http://localhost:3000">
          Get Started Free
        </UButton>
        <UButton size="xl" variant="outline" to="https://github.com/bistro/bistro" target="_blank">
          View on GitHub
        </UButton>
      </div>
    </div>
  </section>
</template>
EOF
```

#### components/landing/LandingFeatures.vue

```bash
cat > components/landing/LandingFeatures.vue << 'EOF'
<script setup lang="ts">
const features = [
  {
    icon: 'i-heroicons-sparkles',
    title: 'AI-First',
    description: 'Vercel AI SDK with streaming, multi-provider support.',
  },
  {
    icon: 'i-heroicons-shield-check',
    title: 'Better Auth',
    description: 'Modern auth with email, OAuth, magic links.',
  },
  {
    icon: 'i-heroicons-code-bracket',
    title: 'Nuxt 4 + TypeScript',
    description: 'Latest Nuxt with full TypeScript support.',
  },
  {
    icon: 'i-heroicons-paint-brush',
    title: 'Nuxt UI + Tailwind',
    description: 'Beautiful, accessible components.',
  },
  {
    icon: 'i-heroicons-circle-stack',
    title: 'Prisma + PostgreSQL',
    description: 'Type-safe database queries.',
  },
  {
    icon: 'i-heroicons-command-line',
    title: 'Powerful CLI',
    description: 'Scaffold projects with simple commands.',
  },
]
</script>

<template>
  <section class="py-20 px-4 bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-7xl">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Everything You Need</h2>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          Production-ready features
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <UCard v-for="feature in features" :key="feature.title">
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon :name="feature.icon" class="text-2xl text-primary" />
              <h3 class="text-lg font-semibold">{{ feature.title }}</h3>
            </div>
          </template>
          <p class="text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
        </UCard>
      </div>
    </div>
  </section>
</template>
EOF
```

#### components/landing/LandingCta.vue

```bash
cat > components/landing/LandingCta.vue << 'EOF'
<template>
  <section class="py-20 px-4 bg-primary text-white">
    <div class="mx-auto max-w-4xl text-center">
      <h2 class="text-4xl font-bold mb-4">Ready to Build?</h2>
      <p class="text-xl mb-8 opacity-90">
        Get started in minutes
      </p>
      <div class="bg-gray-900 rounded-lg p-6 mb-8 text-left">
        <code class="text-green-400">$ bun create bistro my-saas</code>
      </div>
      <UButton size="xl" color="white" to="http://localhost:3000">
        Start Building Now
      </UButton>
    </div>
  </section>
</template>
EOF
```

#### components/landing/LandingFooter.vue

```bash
cat > components/landing/LandingFooter.vue << 'EOF'
<template>
  <footer class="py-12 px-4 border-t">
    <div class="mx-auto max-w-7xl text-center">
      <p class="text-sm text-gray-600">
        © {{ new Date().getFullYear() }} Bistro. Open source under MIT License.
      </p>
    </div>
  </footer>
</template>
EOF
```

```bash
cd ../..
```

**Verification:**

- `bun run --filter landing dev` starts on port 3001
- Visit http://localhost:3001
- Landing page loads with all sections

---

## Phase 3: CLI Tool (packages/cli)

### Step 3.1: Initialize CLI

```bash
cd packages/cli

cat > package.json << 'EOF'
{
  "name": "@bistro/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "bistro": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "prompts": "^2.4.2",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "execa": "^8.0.1"
  },
  "devDependencies": {
    "@types/prompts": "^2.4.9",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3"
  }
}
EOF

bun install
```

### Step 3.2: Create CLI Structure

```bash
mkdir -p src/commands
```

#### src/index.ts

```bash
cat > src/index.ts << 'EOF'
#!/usr/bin/env node
import { Command } from 'commander'
import { create } from './commands/create.js'

const program = new Command()

program
  .name('bistro')
  .description('Bistro CLI - Build AI SaaS')
  .version('0.1.0')

program
  .command('create')
  .argument('[name]', 'Project name')
  .description('Create new Bistro project')
  .action(create)

program.parse()
EOF
```

#### src/commands/create.ts

```bash
cat > src/commands/create.ts << 'EOF'
import prompts from 'prompts'
import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'

export async function create(name?: string) {
  console.log(chalk.bold.cyan('\n🍽️  Bistro - Create your SaaS\n'))

  if (!name) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-bistro-app',
    })
    name = response.name
  }

  if (!name) {
    console.log(chalk.red('Project name required'))
    process.exit(1)
  }

  const spinner = ora('Creating project...').start()

  try {
    await execa('git', [
      'clone',
      '--depth', '1',
      'https://github.com/bistro/bistro',
      name,
    ])

    spinner.succeed('Project created!')

    console.log(chalk.green.bold('\n✓ Success!\n'))
    console.log('Next steps:')
    console.log(chalk.cyan(`  cd ${name}`))
    console.log(chalk.cyan('  bun install'))
    console.log(chalk.cyan('  docker compose up -d'))
    console.log(chalk.cyan('  bun dev\n'))
  } catch (error) {
    spinner.fail('Failed')
    console.error(error)
    process.exit(1)
  }
}
EOF
```

### Step 3.3: Build CLI

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

bun run build
```

```bash
cd ../..
```

**Verification:**

- `./packages/cli/dist/index.js --help` shows help

---

## Phase 4: CI/CD & Polish

### Step 4.1: GitHub Actions

```bash
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
EOF
```

### Step 4.2: Production Dockerfile

```bash
cat > Dockerfile << 'EOF'
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN cd apps/web && bun run build

FROM base AS release
COPY --from=build /app/apps/web/.output ./output
EXPOSE 3000
CMD ["bun", "run", "./output/server/index.mjs"]
EOF
```

### Step 4.3: Update Root Package.json

```bash
cd /home/alois/bistro

cat > package.json << 'EOF'
{
  "name": "bistro",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run --filter web dev",
    "dev:web": "bun run --filter web dev",
    "dev:landing": "bun run --filter landing dev",
    "build": "bun run --filter web build && bun run --filter landing build",
    "db:migrate": "cd apps/web && bunx prisma migrate dev",
    "db:studio": "cd apps/web && bunx prisma studio",
    "db:generate": "cd apps/web && bunx prisma generate"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.0.0"
  }
}
EOF
```

**Verification:**

- All scripts work
- Docker builds
- CI workflow valid

---

## Completion Checklist

- [ ] Phase 0: Repository setup ✓
- [ ] Phase 1: Web app functional
- [ ] Phase 2: Landing page deployed
- [ ] Phase 3: CLI tool working
- [ ] Phase 4: CI/CD configured

---

**Estimated Time:** 14 days
**Apps:** 2 (web, landing)
**Packages:** 1 (cli)
