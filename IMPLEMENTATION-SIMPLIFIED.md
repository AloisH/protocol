# Bistro — Simplified Implementation Plan

> **Purpose:** Streamlined step-by-step guide for minimal monorepo: apps/web, apps/landing (with docs), packages/cli

---

## Simplified Structure

```
bistro/
├── apps/
│   ├── web/              # Main SaaS app (Nuxt 4 + Prisma)
│   └── landing/          # Marketing + docs site (Nuxt Content)
├── packages/
│   └── cli/              # CLI tool
├── .github/workflows/    # CI/CD
├── .vscode/             # IDE configs
├── .cursorrules         # AI assistant rules
├── docker-compose.yml
└── package.json
```

**What's removed:**

- No separate packages/lib, packages/ui, packages/config, packages/database
- No templates/, prompts/, scripts/ (add later)
- No .devcontainer (add if needed)
- Prisma lives directly in apps/web
- Docs merged into apps/landing

---

## Phase 0: Repository & Environment Setup

### Step 0.1: Initialize Repository

```bash
mkdir bistro
cd bistro
git init
git branch -M main

cat > README.md << 'EOF'
# Bistro

Free, open-source Nuxt 4 starter kit for AI-powered SaaS

## Quick Start
\`\`\`bash
bun create bistro my-saas
cd my-saas
docker compose up -d
bun dev
\`\`\`

## License
MIT
EOF

git add README.md
git commit -m "Initial commit"
```

### Step 0.2: Create Directory Structure

```bash
mkdir -p apps/web
mkdir -p apps/landing
mkdir -p packages/cli
mkdir -p .github/workflows
mkdir -p .vscode
```

### Step 0.3: Root Package.json

```bash
cat > package.json << 'EOF'
{
  "name": "bistro",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run --filter web dev",
    "dev:landing": "bun run --filter landing dev --port 3001",
    "build": "bun run --filter web build",
    "build:landing": "bun run --filter landing build",
    "lint": "eslint apps/*/",
    "format": "prettier --write \"**/*.{ts,tsx,vue,js,jsx,json,md}\"",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "cd apps/web && bunx prisma migrate dev",
    "db:studio": "cd apps/web && bunx prisma studio",
    "db:generate": "cd apps/web && bunx prisma generate"
  },
  "devDependencies": {
    "@playwright/test": "^1.42.0",
    "@types/node": "^20.11.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.0.0"
  }
}
EOF
```

### Step 0.4: Git Config

```bash
cat > .gitignore << 'EOF'
node_modules
.nuxt
dist
.output
.env
.env*.local
*.log
.DS_Store
.vscode/settings.json
.turbo
*.tsbuildinfo
.cache
*.db
*.db-journal
EOF

cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
EOF
```

### Step 0.5: Docker Compose

```bash
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: bistro-postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bistro
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: bistro-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF
```

### Step 0.6: Root .env

```bash
cat > .env.example << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bistro"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="change-me-to-random-32-chars"
AUTH_URL="http://localhost:3000"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
RESEND_API_KEY=""
POLAR_ACCESS_TOKEN=""
NODE_ENV="development"
EOF

cp .env.example .env
```

```bash
bun install
```

---

## Phase 1: Main Web App (apps/web)

### Step 1.1: Initialize Web App with Nuxt UI Starter

```bash
# Create from official Nuxt UI starter template
bunx nuxi init apps/web -t github:nuxt-ui-templates/starter

cd apps/web
bun install
```

**What this gives you:**

- Nuxt 4 + TypeScript pre-configured
- Nuxt UI with Tailwind CSS 4
- ESLint + Prettier setup
- Dark mode ready
- Production-ready base

### Step 1.2: Add Additional Dependencies

```bash
# Add Prisma for database
bun add @prisma/client
bun add -d prisma

# Add AI and auth
bun add @vercel/ai better-auth zod
```

### Step 1.3: Update Nuxt Config

```bash
cat >> nuxt.config.ts << 'EOF'
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    authSecret: process.env.AUTH_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {
      appName: 'Bistro',
      appUrl: process.env.AUTH_URL || 'http://localhost:3000',
    },
  },
EOF
```

### Step 1.4: Setup Prisma

```bash
bunx prisma init

cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  projects  Project[]
  @@map("users")
}

model Project {
  id          String   @id @default(cuid())
  title       String
  description String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("projects")
}
EOF
```

### Step 1.4: Create Structure

```bash
mkdir -p pages
mkdir -p components
mkdir -p composables
mkdir -p server/api/v1
mkdir -p server/middleware
mkdir -p server/utils
mkdir -p lib
```

### Step 1.5: Create Basic Pages

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

mkdir -p layouts
cat > layouts/default.vue << 'EOF'
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <AppHeader />
    <main class="mx-auto max-w-7xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
EOF

cat > pages/index.vue << 'EOF'
<script setup lang="ts">
useSeoMeta({
  title: 'Bistro - AI-Powered SaaS Starter',
  description: 'Free, open-source Nuxt 4 starter kit',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh]">
    <h1 class="text-5xl font-bold mb-4">Welcome to Bistro</h1>
    <p class="text-xl text-gray-600 mb-8">AI-powered SaaS starter kit</p>
    <UButton to="/dashboard" size="lg">Get Started</UButton>
  </div>
</template>
EOF

mkdir -p pages/dashboard
cat > pages/dashboard/index.vue << 'EOF'
<script setup lang="ts">
const title = 'Dashboard'
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">{{ title }}</h1>
    <div class="grid grid-cols-3 gap-6">
      <UCard>
        <template #header>Projects</template>
        <p class="text-3xl font-bold">0</p>
      </UCard>
    </div>
  </div>
</template>
EOF
```

### Step 1.6: Create Components

```bash
cat > components/AppHeader.vue << 'EOF'
<template>
  <header class="bg-white dark:bg-gray-800 border-b">
    <nav class="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
      <NuxtLink to="/" class="text-xl font-bold">Bistro</NuxtLink>
      <div class="flex items-center gap-4">
        <UButton to="/dashboard" variant="ghost">Dashboard</UButton>
      </div>
    </nav>
  </header>
</template>
EOF
```

### Step 1.7: Create API Routes

```bash
mkdir -p server/api/v1

cat > server/api/v1/health.get.ts << 'EOF'
export default defineEventHandler(() => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})
EOF
```

### Step 1.8: Create Prisma Client Util

```bash
cat > server/utils/db.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
EOF
```

```bash
cd ../..
docker compose up -d
cd apps/web
bunx prisma migrate dev --name init
cd ../..
```

**Verification:**

- `bun run dev` starts app on http://localhost:3000
- Pages load correctly
- Database connected

---

## Phase 2: Landing Page (apps/landing)

### Step 2.1: Initialize Landing with Official Template

```bash
# Create from official Nuxt UI landing template (includes Nuxt Content)
bunx nuxi init apps/landing -t github:nuxt-ui-templates/landing

cd apps/landing
bun install
```

**What this gives you:**

- Nuxt 4 + Nuxt UI pre-configured
- Nuxt Content for docs/blog
- Landing page sections ready
- SEO optimized
- Dark mode support

### Step 2.2: Customize Content

The template comes with landing page sections. Edit the content files:

```bash
# Edit main landing content
# File: content/index.yml
# Update hero, features, sections

# Add Bistro-specific docs
cat > content/1.docs/1.getting-started/1.installation.md << 'EOF'
---
title: Installation
---

# Getting Started

## Quick Start

\`\`\`bash
bun create bistro my-saas
cd my-saas
docker compose up -d
bun dev
\`\`\`

Visit http://localhost:3000
EOF

# The template already includes:
# - Hero section
# - Features grid
# - CTA sections
# - Footer
# - Docs routing
```

```bash
cd ../..
```

**Verification:**

- `bun run dev:landing` starts on http://localhost:3001
- Landing page renders with template sections
- Docs accessible at /docs
- Content editable in YAML/Markdown

---

## Phase 3: CLI Tool (packages/cli)

### Step 3.1: Setup CLI

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
mkdir -p src
```

### Step 3.2: Create CLI

```bash
cat > src/index.ts << 'EOF'
#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'

const program = new Command()

program
  .name('bistro')
  .description('Bistro CLI')
  .version('0.1.0')

program
  .command('create')
  .argument('[name]', 'Project name')
  .action(async (name = 'my-bistro-app') => {
    console.log(chalk.cyan('\\n🍽️  Creating Bistro app...\\n'))
    const spinner = ora('Cloning repository...').start()

    try {
      await execa('git', ['clone', 'https://github.com/bistro/bistro', name])
      spinner.succeed('Created!')
      console.log(chalk.green(`\\ncd ${name}\\nbun install\\ndocker compose up -d\\nbun dev\\n`))
    } catch (error) {
      spinner.fail('Failed')
      console.error(error)
    }
  })

program.parse()
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  },
  "include": ["src"]
}
EOF

bun run build
```

```bash
cd ../..
```

**Verification:**

- `./packages/cli/dist/index.js --help` shows help
- CLI builds successfully

---

## Phase 4: IDE & AI Assistant Configs

### Step 4.1: VSCode

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
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma"
  ]
}
EOF
```

### Step 4.2: Cursor AI

```bash
cat > .cursorrules << 'EOF'
# Bistro Project

## Stack
- Nuxt 4 + Nitro
- Nuxt UI + Tailwind 4
- PostgreSQL + Prisma
- Better Auth
- Vercel AI SDK

## Style
- TypeScript strict
- Composition API
- Auto-imports
- Zod validation
EOF
```

---

## Phase 5: CI/CD

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

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
EOF
```

---

## Phase 6: Testing

```bash
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
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

test('homepage works', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Bistro')
})
EOF
```

---

## Phase 7: Production

```bash
cat > Dockerfile << 'EOF'
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "apps/web/.output/server/index.mjs"]
EOF
```

---

## Quick Commands

```bash
# Dev
bun dev                 # Start web app
bun dev:landing         # Start landing
bun run db:migrate      # Run migrations
bun run db:studio       # Open Prisma Studio

# Build
bun run build           # Build web app
bun run build:landing   # Build landing

# Test
bun test               # Unit tests
bun test:e2e           # E2E tests

# Docker
docker compose up -d   # Start DB
docker compose down    # Stop services
```

---

## Completion Checklist

- [ ] Phase 0: Repository initialized
- [ ] Phase 1: Web app running
- [ ] Phase 2: Landing page deployed
- [ ] Phase 3: CLI working
- [ ] Phase 4: IDE configs done
- [ ] Phase 5: CI/CD active
- [ ] Phase 6: Tests passing
- [ ] Phase 7: Production ready

---

**Total Time:** ~7-14 days
**Files:** ~50 files
**LOC:** ~3,000-5,000
