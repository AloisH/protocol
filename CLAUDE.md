# Protocol

Local-first PWA for personal routine tracking. Set up and monitor daily, weekly, monthly, or yearly protocols.

## Commands

```bash
bun run dev              # Start dev server (:3000)
bun run test             # Unit tests (watch)
bun run test:run         # Unit tests (single run)
bun run test:integration # Integration tests
bun run lint             # ESLint
bun run typecheck        # TypeScript check
bun run build            # Production build
```

**Run from repo root.**

## Critical Rules

1. **Composition API** - `<script setup>` only, no Options API
2. **Zod validation** - Use schemas from `#shared/schemas/*`, no type assertions (`as`)
3. **Local-first** - All data in IndexedDB via Dexie.js
4. **No backend calls** - PWA is fully client-side

## Workflow

1. Use `/plan-issue <number>` for complex features
2. Check existing patterns before creating new (Glob + Grep)
3. Run `/check` before commits
4. Use `/commit` for conventional messages

## Documentation

- [README.md](README.md) - Project overview
- [.agent/README.md](.agent/README.md) - System documentation index

## Structure

```
app/            # Pages, components, composables
shared/         # Zod schemas
public/         # Static assets
```

## Stack

- **Nuxt 4** — Full-stack framework
- **Dexie.js** — IndexedDB wrapper
- **Nuxt UI** — Component library
- **Tailwind 4** — Styling
- **Vite PWA** — Progressive Web App
