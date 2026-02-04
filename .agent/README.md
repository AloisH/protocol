# Bistro Documentation Index

Central documentation for Bistro - Free MIT-licensed Nuxt 4 starter for AI-powered SaaS.

---

## Quick Start

New to the project? Start here:

1. **[Project Architecture](./System/project_architecture.md)** - Project goals, tech stack, structure, patterns
2. **[Database Schema](./System/database_schema.md)** - Database models, relations, queries
3. **[Authentication System](./System/authentication_system.md)** - Auth flows, RBAC, impersonation
4. **[Onboarding System](./System/onboarding_system.md)** - 5-step user onboarding flow
5. **[Organizations System](./System/organizations_system.md)** - Multi-tenancy, invites, roles
6. **[Todo System](./System/todos_system.md)** - Example CRUD feature (use as template)

Then refer to SOPs for specific tasks.

---

## System Documentation

**Understand the current state of the system.**

### Core Architecture

- **[Project Architecture](./System/project_architecture.md)**
  - Project goals and status
  - Tech stack (Nuxt 4, Prisma 7, Better Auth)
  - Project structure
  - Directory organization
  - Architecture patterns (client/server, feature-based)
  - Integration points (DB, auth, email, AI, payments)
  - Environment configuration
  - CI/CD pipeline
  - Deployment strategies
  - Performance targets
  - Key gotchas

### Database

- **[Database Schema](./System/database_schema.md)**
  - Schema models (User, Account, Session, ImpersonationLog, etc.)
  - Relations and indexes
  - Database connection (Prisma singleton pattern)
  - Query patterns (user-scoped, transactions, relations)
  - Migrations workflow
  - Prisma Studio usage
  - Environment configuration
  - Schema diagram
  - Troubleshooting

### Authentication & Authorization

- **[Authentication System](./System/authentication_system.md)**
  - Better Auth setup (server + client)
  - Authentication flows (email/password, OAuth, logout)
  - Role-Based Access Control (USER/ADMIN/SUPER_ADMIN)
  - Server-side RBAC (middleware, API endpoints)
  - Client-side RBAC (composables)
  - Admin impersonation (1-hour expiry, audit logging)
  - Route protection (global middleware, public routes)
  - Session management (cookie, cache, refresh, revocation)
  - Security features (password hashing, CSRF, rate limiting)
  - Environment variables
  - Troubleshooting

### User Experience

- **[Onboarding System](./System/onboarding_system.md)**
  - 5-step guided flow
  - Step components (Welcome, Profile, UseCase, Preferences, Complete)
  - Progress tracking in database
  - Skip/resume functionality
  - API endpoints (get, update, complete, skip, restart)
  - Middleware integration
  - Common patterns

### Multi-Tenancy

- **[Organizations System](./System/organizations_system.md)**
  - Multi-tenant architecture
  - Organization roles (OWNER, ADMIN, MEMBER, GUEST)
  - Permission matrix
  - Invite system (create, accept, revoke)
  - Member management
  - Data scoping (CRITICAL: always filter by organizationId)
  - API endpoints (orgs, members, invites)
  - Pages (/organizations/_, /org/[slug]/_)
  - Components (OrganizationSwitcher, OrganizationMembers)
  - Common patterns

### Example Features

- **[Todo System](./System/todos_system.md)**
  - Reference CRUD implementation
  - Service + repository pattern
  - User-scoped queries
  - Filter/sort with URL persistence
  - Optimistic UI updates
  - Use as template for your features

### Testing

- **[Testing Infrastructure](./System/testing_infrastructure.md)**
  - Transaction-per-test pattern
  - Fixture factories (createTestUser, createTestOrg, createTestTodo)
  - Repository testing patterns
  - H3 event mocking
  - Edge cases and gotchas
  - Running tests

---

## Component Documentation

**Component-level docs and patterns.**

### Component-Level Docs (CLAUDE.md in feature directories)

- `app/components/todo/CLAUDE.md` - Todo CRUD components
- `app/components/auth/CLAUDE.md` - Auth UI components
- `app/components/organization/CLAUDE.md` - Org management
- `app/components/onboarding/CLAUDE.md` - Onboarding flow
- `app/components/profile/CLAUDE.md` - User profile
- `app/components/admin/CLAUDE.md` - Admin features
- `app/components/shared/CLAUDE.md` - Shared utilities
- `app/components/docs/CLAUDE.md` - Docs search

### System-Level Component Docs

- **[Onboarding Components](./System/onboarding_components_system.md)**
  - 5-step flow architecture (7 components)
  - Progress tracking, step navigation
  - Form validation, v-model patterns
  - API integration, middleware

- **[Profile Components](./System/profile_components_system.md)**
  - User settings architecture (6 components)
  - Password management, session control
  - Account deletion, security patterns
  - Modal confirmations, form validation

- **[Admin Components](./System/admin_components_system.md)**
  - Admin RBAC features (2 components)
  - Impersonation system, audit logging
  - Session management, security restrictions

---

## Standard Operating Procedures (SOPs)

**Best practices for common tasks.**

### Database

- **[Database Migrations](./SOP/database_migrations.md)**
  - Creating schema changes
  - Generating migrations
  - Applying migrations
  - Common scenarios (add field, rename, relations, indexes)
  - Manual migration edits
  - Rollback strategies
  - Production migrations
  - Prisma Client regeneration
  - Troubleshooting

### Backend

- **[Adding API Endpoints](./SOP/adding_api_endpoints.md)**
  - Feature-based architecture (repository → service → API)
  - Defining Zod schemas
  - Creating repositories (user-scoped queries)
  - Creating services (business logic)
  - Creating API handlers (GET/POST/PUT/DELETE)
  - Role-based access control
  - Testing endpoints
  - Import conventions
  - API handler helpers (defineApiHandler, defineValidatedApiHandler)
  - Common scenarios (pagination, filtering, file upload)
  - Troubleshooting

### Infrastructure

- **[Bun + Vite Configuration](./SOP/bun_vite_configuration.md)**
  - Critical Vite FS allow setup for Bun's .bun directory
  - MIME type error fixes
  - Virtual module export errors
  - Dependency version conflicts
  - Nuxt Content migration (serverQueryContent → queryCollection)
  - Browser cache issues
  - Development workflow (fresh install, cache clearing)
  - Troubleshooting checklist

### Frontend

- **[Adding Pages](./SOP/adding_pages.md)**
  - File-based routing (index, dynamic routes)
  - Route protection (public, protected, admin-only)
  - Role-based access (RBAC on pages)
  - Data fetching (useFetch, $fetch, composables)
  - Forms (Nuxt UI + Zod validation)
  - Navigation
  - SEO meta
  - Layouts (default, custom)
  - Styling (Tailwind, dark mode)
  - Nuxt UI components
  - Auto-imports
  - Common scenarios (redirect, loading, 404)
  - Troubleshooting

### General

- **[Troubleshooting](./SOP/troubleshooting.md)**
  - Database issues (Prisma, connections, types)
  - Authentication issues (OAuth, sessions)
  - Build & CI issues
  - Testing issues
  - Development issues
  - Docker issues
  - Quick fixes checklist

---

## Task Documentation (Placeholder)

**PRD & implementation plans for features.**

_No task docs yet. Create when planning new features._

**Template:**

```
Tasks/
├── feature-name.md           # PRD + implementation plan
└── another-feature.md
```

---

## Document Structure

### System Documentation

**Purpose:** Document current state of system
**Audience:** New engineers, all team members
**Update:** After implementing features

**Includes:**

- Architecture overview
- Tech stack details
- Integration points
- Code patterns
- Configuration
- Gotchas

### SOPs

**Purpose:** Best practices for common tasks
**Audience:** Engineers performing specific tasks
**Update:** When mistakes happen, new patterns emerge

**Includes:**

- Step-by-step instructions
- Code examples
- Common scenarios
- Troubleshooting
- Checklists

### Tasks

**Purpose:** PRD + implementation plan for features
**Audience:** Engineers implementing features
**Update:** Before starting new features

**Includes:**

- Requirements
- Technical approach
- Implementation steps
- Testing strategy
- Acceptance criteria

---

## Related Documentation

**Root project docs (CLAUDE.md files):**

- `/CLAUDE.md` - Root project guidance
- `/server/CLAUDE.md` - Server layer patterns
- `/app/CLAUDE.md` - App layer patterns

**Feature-specific docs:**

- `/server/features/auth/auth.md` - Auth feature
- `/server/features/user/user.md` - User feature
- `/server/features/email/email.md` - Email feature

---

## How to Use This Documentation

### For New Engineers

1. Read [Project Architecture](./System/project_architecture.md) - Get overview
2. Read [Database Schema](./System/database_schema.md) - Understand data model
3. Read [Authentication System](./System/authentication_system.md) - Understand auth
4. Refer to SOPs when performing tasks

### For Implementing Features

1. Check if similar feature exists (search codebase)
2. Read relevant System docs for context
3. Follow relevant SOP (Database Migrations, Adding API Endpoints, Adding Pages)
4. Create Task doc if complex feature
5. Update System docs after implementation

### For Fixing Bugs

1. Check relevant System doc for architecture understanding
2. Search Troubleshooting sections in docs
3. Refer to SOP if making changes (migrations, endpoints, pages)

### For Code Review

1. Verify changes follow architecture patterns (System docs)
2. Verify changes follow best practices (SOPs)
3. Check for gotchas (listed in System docs)

---

## Documentation Maintenance

### When to Update

**System docs:**

- After implementing new features
- After architecture changes
- When integration points change
- When new gotchas discovered

**SOPs:**

- When mistakes happen (add to Troubleshooting)
- When new patterns emerge (add to Common Scenarios)
- When best practices change

**Task docs:**

- Before implementing new features (create)
- After implementation (mark complete, add learnings)

### How to Update

1. Read existing docs first (avoid duplication)
2. Update relevant sections (don't rewrite entire file)
3. Keep docs concise (sacrifice grammar for brevity)
4. Add cross-references (Related docs section)
5. Update this README if adding new docs

---

## Contributing

All engineers should contribute to documentation:

- Add troubleshooting tips when you solve issues
- Document gotchas when you discover them
- Create Task docs for complex features
- Update System docs after implementing features
- Improve SOPs based on experience

---

## Document Locations

```
.agent/
├── README.md                              # This file (index)
├── System/                                # Current state of system
│   ├── project_architecture.md           # Tech stack, structure, patterns
│   ├── database_schema.md                # DB models, relations, queries
│   ├── authentication_system.md          # Auth flows, RBAC, impersonation
│   ├── onboarding_system.md              # 5-step user onboarding
│   ├── organizations_system.md           # Multi-tenancy, invites, roles
│   ├── todos_system.md                   # Todo example (CRUD template)
│   └── testing_infrastructure.md         # Test patterns, fixtures, mocking
├── SOP/                                   # Best practices for tasks
│   ├── database_migrations.md            # Schema changes workflow
│   ├── adding_api_endpoints.md           # Backend endpoint creation
│   ├── adding_pages.md                   # Frontend page creation
│   ├── bun_vite_configuration.md         # Bun + Vite setup
│   └── troubleshooting.md                # Common issues and fixes
└── Tasks/                                 # PRD + implementation plans
    └── (placeholder)
```

---

_Last updated: 2026-01-24_
