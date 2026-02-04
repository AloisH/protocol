# Troubleshooting Guide

Common issues and fixes for Bistro development.

---

## Database

### "Cannot find module '@prisma/client'"

```bash
bun db:generate  # Generate Prisma Client
```

### "Database connection failed"

```bash
docker compose up -d  # Start postgres
# Check DATABASE_URL matches docker-compose.yml credentials
```

### "Type errors after DB schema change"

```bash
bun db:generate  # Regenerate types
bun typecheck    # Verify
```

### "Connection pool exhausted"

Using multiple PrismaClient instances. Always use singleton:

```typescript
import { db } from '~/server/utils/db';
```

### "Prisma client errors after schema change"

```bash
bun db:generate
bun db:migrate
```

---

## Authentication

### "OAuth buttons not showing"

Add to `.env`:

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Restart dev server.

### "Session not updating after login"

Must call `fetchSession()` after auth operations:

```typescript
await signIn.email({ email, password });
await fetchSession(); // Add this
await navigateTo('/org/[slug]/dashboard');
```

### "Unauthorized on protected route"

Ensure session cookie sent. Check DevTools → Network → Cookies.

---

## Build & CI

### "Build fails in CI but works locally"

Run full CI sequence locally:

```bash
bun lint
bun db:generate  # Often forgotten
bun typecheck
bun test:run
bun build
```

### "Git hooks not running"

```bash
bun prepare  # Install simple-git-hooks
```

---

## Testing

### "Tests failing with Prisma errors"

Mock Prisma modules:

```typescript
vi.mock('@prisma/client');
vi.mock('@prisma/adapter-pg');
vi.mock('pg');
```

See `server/utils/db.test.ts` for example.

### "Cannot find module" in tests

- Use relative imports (`./testDb`, not `~/server/utils/testDb`)
- Check import depth

### "Unique constraint failed" in tests

- Fixtures use timestamp + random for uniqueness
- Ensure transaction hooks in place (beforeEach/afterEach)

### "Tests fail in specific order"

- Not using transactions properly
- Data created in `beforeAll` persists (use `beforeEach`)

---

## Development

### "Bun command not found in scripts"

Use from repo root, not subdirectories:

```bash
cd /home/alois/bistro  # Go to root
bun dev                # Then run command
```

### "Runtime config not available"

Add vars to `.env` (copy from .env.example) and restart dev server.

### "Cannot find module '~~/server/...'"

TypeScript path issue. Restart TypeScript server in editor.

### "Type error in API handler"

Add explicit return types:

```typescript
async function getProject(id: string): Promise<Project | null> {
  // ...
}
```

---

## Docker

### Local vs Docker DATABASE_URL

- Local dev: `DATABASE_URL=postgresql://bistro:bistro@localhost:5432/bistro`
- Docker prod: `DATABASE_URL=postgresql://bistro:bistro@postgres:5432/bistro`

Note: hostname differs (`localhost` vs `postgres`).

Use `.env` for local, `.env.docker` for production.

---

## Quick Fixes Checklist

| Symptom                | Fix                                    |
| ---------------------- | -------------------------------------- |
| Prisma types wrong     | `bun db:generate`                      |
| DB connection failed   | `docker compose up -d`                 |
| OAuth not working      | Check env vars, restart                |
| Session stale          | Call `fetchSession()`                  |
| CI fails locally works | Run `bun db:generate` before typecheck |
| Hooks not running      | `bun prepare`                          |
| Tests Prisma errors    | Mock Prisma modules                    |
| Command not found      | Run from repo root                     |

---

_See also: [Testing Infrastructure](../System/testing_infrastructure.md) for test-specific issues_
