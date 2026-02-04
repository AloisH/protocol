# Setup Scripts

## setup.ts

Automated environment setup for local development.

**Usage:**

```bash
# Runs automatically after bun install (via "prepare" hook)
bun install

# Or run manually
bun setup
```

**Auto-skips when:**

- CI environment detected (`CI=true` or `GITHUB_ACTIONS=true`)
- Production environment (`NODE_ENV=production`)
- Docker environment (`/.dockerenv` exists)
- `.env` file already exists (already set up)

**What it does:**

1. Creates `.env` from `.env.example` (if missing)
2. Generates random `AUTH_SECRET`
3. Starts Docker services (postgres, redis)
4. Waits for PostgreSQL to be ready
5. Runs Prisma migrations
6. Generates Prisma client

**Interactive prompts:**

- Create .env? [Y/n]
- Start Docker? [Y/n]
- Run migrations? [Y/n]

**Safe for CI/Production:**

Script automatically detects and skips in:

- GitHub Actions / CI pipelines
- Production environments
- Docker containers
- When .env already exists

No need to conditionally run - it's safe everywhere.

**First-time setup flow:**

```bash
git clone <repo>
bun install        # Automatically runs setup
# Prompts:
#  - Create .env? [Y/n]
#  - Start Docker? [Y/n]
#  - Run migrations? [Y/n]

bun dev           # Start developing
```

**Subsequent installs:**

```bash
bun install       # Skips setup (.env exists)
```
