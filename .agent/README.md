# Protocol Documentation Index

Central documentation for Protocol - Free MIT-licensed local-first PWA for personal routine tracking.

---

## Quick Start

New to the project? Start here:

1. **[Project Architecture](./System/project_architecture.md)** - Goals, tech stack, structure, patterns
2. **[Storage Schema](./System/storage_schema.md)** - Dexie.js models, structure, queries
3. **[Protocols System](./System/protocols_system.md)** - Protocol/routine/exercise management
4. **[Tracking System](./System/tracking_system.md)** - Exercise logging, progress tracking
5. **[Analytics System](./System/analytics_system.md)** - Metrics, progress charts, analysis
6. **[PWA Features](./System/pwa_features.md)** - Offline, installable, sync

Then refer to SOPs for specific tasks.

---

## System Documentation

**Understand the current state of the system.**

### Core Architecture

- **[Project Architecture](./System/project_architecture.md)**
  - Project goals and status
  - Tech stack (Nuxt 4, Dexie.js, Vite PWA)
  - Project structure & layout
  - Architecture patterns (composables, stores)
  - Component hierarchy
  - Local-first design
  - PWA features (offline, installable)
  - Performance targets
  - Key gotchas

### Storage

- **[Storage Schema](./System/storage_schema.md)**
  - Dexie.js schema models
  - Relations and structure
  - Database definition (schema.ts)
  - Query patterns
  - Indexing strategy
  - Dexie migration patterns
  - Browser storage limits
  - Troubleshooting

### Feature Systems

- **[Protocols System](./System/protocols_system.md)**
  - Protocol CRUD operations
  - Routine management (daily, weekly, monthly, yearly)
  - Exercise library structure
  - Composables (useProtocols)
  - Components (ProtocolCard, RoutineList)
  - Common patterns

- **[Tracking System](./System/tracking_system.md)**
  - Exercise logging (sets, reps, weight, notes)
  - Completion tracking (checkbox state)
  - Session history
  - Data validation (Zod schemas)
  - Composables (useTracking)
  - Components (ExerciseLog, SessionHistory)

- **[Analytics System](./System/analytics_system.md)**
  - Metrics calculation (completion rate, improvement)
  - Progress charts & visualization
  - Streak tracking
  - Comparison (week-to-week, month-to-month)
  - Data aggregation patterns
  - Components (ProgressChart, MetricsPanel)

- **[PWA Features](./System/pwa_features.md)**
  - Service worker setup (Vite PWA)
  - Offline functionality
  - Installable app (manifest)
  - Sync across tabs (Broadcast Channel API)
  - Cache strategies
  - Background sync (optional)

### Testing

- **[Testing Infrastructure](./System/testing_infrastructure.md)**
  - Unit test patterns (Vitest)
  - Fixture factories
  - Dexie mocking
  - Composable testing
  - E2E tests (Playwright)
  - Running tests

---

## Component Documentation

**Component-level docs and patterns.**

### Component-Level Docs (CLAUDE.md in feature directories)

- `app/components/protocols/CLAUDE.md` - Protocol management UI
- `app/components/routines/CLAUDE.md` - Routine creation/editing
- `app/components/tracking/CLAUDE.md` - Exercise logging UI
- `app/components/analytics/CLAUDE.md` - Progress charts
- `app/components/shared/CLAUDE.md` - Shared utilities
- `app/composables/CLAUDE.md` - Composable patterns

### Page Documentation

- **[Pages](./System/pages_system.md)**
  - Index/home page
  - Protocols list page
  - Protocol detail page
  - Tracking/logging page
  - Analytics/progress page
  - Settings page
  - Page transitions & navigation

---

## Standard Operating Procedures (SOPs)

**Best practices for common tasks.**

### Storage

- **[Dexie Schema Updates](./SOP/dexie_schema_updates.md)**
  - Adding new tables
  - Modifying existing tables
  - Dexie schema versioning
  - Migration patterns
  - Data transformation
  - Testing schema changes
  - Troubleshooting

### Frontend

- **[Adding Pages](./SOP/adding_pages.md)**
  - File-based routing (index, dynamic routes)
  - Page structure & layouts
  - Data loading (composables)
  - Forms (Nuxt UI + Zod validation)
  - Navigation patterns
  - SEO meta
  - Styling (Tailwind, dark mode)
  - Nuxt UI components
  - Auto-imports
  - Common scenarios (search, filters, modals)
  - Troubleshooting

- **[Adding Components](./SOP/adding_components.md)**
  - Component structure (script setup, props, emits)
  - Composition API patterns
  - Shared state (composables vs props)
  - Form components (input, textarea, select)
  - List components (tables, cards, grids)
  - Modal & dialog patterns
  - Slots & composition
  - Styling integration
  - Testing components

- **[Creating Composables](./SOP/creating_composables.md)**
  - Composable patterns (state, computed, methods)
  - Dexie integration
  - Error handling
  - Type safety (TypeScript)
  - Testing composables
  - Common composables (useProtocols, useTracking)
  - Performance optimization

### General

- **[Troubleshooting](./SOP/troubleshooting.md)**
  - Build issues
  - Dexie connection/query issues
  - Component/composable issues
  - Testing issues
  - PWA issues
  - Development issues
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

1. Read [Project Architecture](./System/project_architecture.md) - Overview
2. Read [Storage Schema](./System/storage_schema.md) - Understand data model
3. Read [Protocols System](./System/protocols_system.md) - Main feature
4. Read [Tracking System](./System/tracking_system.md) - Logging & history
5. Refer to SOPs when performing tasks

### For Implementing Features

1. Check if similar feature exists (search codebase)
2. Read relevant System docs for context
3. Follow relevant SOP (Dexie updates, Adding Pages, Creating Composables)
4. Update System docs after implementation
5. Test with Vitest + Playwright

### For Fixing Bugs

1. Check relevant System doc for architecture understanding
2. Search Troubleshooting sections in docs
3. Refer to SOP if making structural changes (schema, pages, composables)

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
│   ├── storage_schema.md                 # Dexie models, relations, queries
│   ├── protocols_system.md               # Protocol/routine/exercise management
│   ├── tracking_system.md                # Exercise logging, history
│   ├── analytics_system.md               # Metrics, progress, streaks
│   ├── pwa_features.md                   # Offline, installable, sync
│   ├── pages_system.md                   # Page structure & routing
│   └── testing_infrastructure.md         # Test patterns, fixtures, mocking
├── SOP/                                   # Best practices for tasks
│   ├── dexie_schema_updates.md           # Schema changes workflow
│   ├── adding_pages.md                   # Frontend page creation
│   ├── adding_components.md              # Vue component creation
│   ├── creating_composables.md           # Composable patterns
│   └── troubleshooting.md                # Common issues and fixes
└── Tasks/                                 # PRD + implementation plans
    └── (placeholder)
```

---

_Last updated: 2026-02-04_
