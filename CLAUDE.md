# Bistro

Nuxt 4 SaaS boilerplate with multi-tenancy, RBAC, Better Auth, Prisma 7.

## Commands

```bash
bun run dev              # Start dev server (:3000)
bun run test             # Unit tests (watch)
bun run test:run         # Unit tests (single run)
bun run test:integration # Integration tests
bun run lint             # ESLint
bun run typecheck        # TypeScript check
bun run build            # Production build
bun run db:migrate       # Run migrations
bun run db:generate      # Generate Prisma client
bun run db:studio        # Prisma Studio
docker compose up -d     # Start postgres + redis
```

**Run from repo root.**

## Critical Rules

1. **DB singleton** - Always `import { db } from '~/server/utils/db'`, never `new PrismaClient()`
2. **User-scope queries** - All data queries MUST filter by `userId` or `organizationId`
3. **Zod validation** - Use schemas from `#shared/schemas/*`, no type assertions (`as`)
4. **Composition API** - `<script setup>` only, no Options API

## Workflow

1. Use `/plan-issue <number>` for complex features
2. Check existing patterns before creating new (Glob + Grep)
3. Run `/check` before commits
4. Use `/commit` for conventional messages

## Documentation

**System docs & SOPs:**

- [.agent/README.md](.agent/README.md) - Index of all documentation

**Context-specific (read when working in that area):**

- [server/CLAUDE.md](server/CLAUDE.md) - API patterns, auth, DB
- [app/CLAUDE.md](app/CLAUDE.md) - Pages, components, composables

## Structure

```
app/            # Pages, components, composables
server/         # API routes, features (service + repository)
shared/         # Zod schemas (#shared alias)
prisma/         # Schema, migrations
content/        # Blog/docs content
.agent/         # System docs, SOPs
```

## Quick Troubleshooting

| Issue                 | Fix                                    |
| --------------------- | -------------------------------------- |
| Prisma types wrong    | `bun db:generate`                      |
| DB connection failed  | `docker compose up -d`                 |
| CI fails, local works | Run `bun db:generate` before typecheck |

See [.agent/SOP/troubleshooting.md](.agent/SOP/troubleshooting.md) for more.
