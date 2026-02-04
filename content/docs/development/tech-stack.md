---
title: Tech Stack
description: Overview of the technologies powering Bistro
navigation:
  title: Tech Stack
  order: 1
---

# Tech Stack

Bistro is built with modern, production-ready technologies.

## Frontend

### Nuxt 4

The latest version of Nuxt provides:

- Server-side rendering (SSR)
- File-based routing
- Auto-imports for components and composables
- Hybrid rendering strategies

### Vue 3

Using the Composition API with `<script setup>`:

- Reactive state management with `ref` and `reactive`
- Composables for reusable logic
- TypeScript support

### Nuxt UI v4

Component library providing:

- Pre-built accessible components
- Dark mode support
- Tailwind CSS integration
- Consistent design system

### Tailwind CSS 4

Utility-first CSS framework:

- Rapid UI development
- Responsive design utilities
- Custom theme configuration

## Backend

### Nitro Server

Nuxt's server engine:

- API routes in `server/api/`
- Server middleware
- Edge-compatible

### Prisma 7

Next-generation ORM:

- Type-safe database queries
- Auto-generated types
- Migration system
- Prisma Studio for database management

### PostgreSQL

Robust relational database:

- ACID compliance
- JSON support
- Full-text search

### Better Auth

Authentication library:

- Email/password authentication
- OAuth providers (GitHub, Google)
- Session management
- Admin impersonation

## Development Tools

### Bun

Fast JavaScript runtime:

- Package management
- Script runner
- Test runner

### TypeScript

Type safety throughout:

- Strict mode enabled
- Prisma-generated types
- Zod for runtime validation

### Vitest

Testing framework:

- Fast test execution
- Vue component testing
- Coverage reporting

### ESLint & Prettier

Code quality:

- Consistent formatting
- Error prevention
- Auto-fix on save

## Infrastructure

### Docker

Containerization:

- Development environment
- Production deployment
- Docker Compose orchestration

### GitHub Actions

CI/CD pipeline:

- Automated testing
- Type checking
- Build verification
