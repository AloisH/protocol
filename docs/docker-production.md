# Production Docker Setup

Test production Docker build locally with your `.env` configuration.

## Quick Start

```bash
# Build and run production setup
bun docker:prod

# Or run in detached mode
bun docker:prod:up
```

## Available Commands

```bash
# Build and run (foreground, with logs)
bun docker:prod

# Just build the Docker image
bun docker:prod:build

# Start services (detached/background)
bun docker:prod:up

# Stop services
bun docker:prod:down

# View logs
bun docker:prod:logs
```

## What It Does

The production setup includes:

1. **PostgreSQL** - Production database
2. **DB Migration** - Runs `prisma migrate deploy` on startup
3. **App** - Production build of Nuxt app

## Environment Variables

Uses `.env.docker` file automatically (configured in scripts).

**Two separate env files:**

- `.env` - Local development (uses `localhost:5432`)
- `.env.docker` - Docker production (uses `postgres:5432`)

This way you don't need to manually change DATABASE_URL each time.

**Required variables:**

- `DATABASE_URL` - Postgres connection (use internal Docker network)
- `AUTH_SECRET` - Auth secret key
- `APP_URL` - Application URL

**Optional variables:**

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `POLAR_API_KEY`
- `RESEND_API_KEY`
- `REDIS_URL`

## Database URL for Docker

The `.env.docker` file uses Docker service names:

```bash
# .env.docker - for Docker containers
DATABASE_URL=postgresql://bistro:bistro@postgres:5432/bistro

# .env - for local dev
DATABASE_URL=postgresql://bistro:bistro@localhost:5432/bistro
```

Note: Uses `postgres` hostname (Docker service name) instead of `localhost`.

## Workflow

### 1. First Time Setup

```bash
# Make sure env files exist
bun setup  # Creates .env and .env.docker

# Or manually:
cp .env.example .env
cp .env.example .env.docker

# Update .env.docker to use Docker network
sed -i 's/localhost:5432/postgres:5432/g' .env.docker

# Build and run
bun docker:prod
```

### 2. Access Application

```bash
# App runs on http://localhost:3000
curl http://localhost:3000/api/health
```

### 3. View Logs

```bash
# Follow logs
bun docker:prod:logs

# Or specific service
docker compose -f docker-compose.prod.yml logs -f app
```

### 4. Stop Services

```bash
bun docker:prod:down
```

## Troubleshooting

### Port Already in Use

```bash
# Stop dev services first
docker compose down

# Or use different ports in docker-compose.prod.yml
```

### Migration Failures

```bash
# Check migration logs
docker compose -f docker-compose.prod.yml logs db-migrate

# Reset and retry
bun docker:prod:down
bun docker:prod
```

### Build Failures

```bash
# Clean build
docker compose -f docker-compose.prod.yml down -v
bun docker:prod:build --no-cache
```

## Architecture

```
┌─────────────────────────────────────┐
│  docker-compose.prod.yml            │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐                  │
│  │  postgres    │                  │
│  │  (database)  │                  │
│  └──────┬───────┘                  │
│         │                           │
│  ┌──────▼───────┐                  │
│  │  db-migrate  │ (runs once)      │
│  │  (migrations)│                  │
│  └──────┬───────┘                  │
│         │                           │
│  ┌──────▼───────┐                  │
│  │     app      │ :3000            │
│  │  (Nuxt prod) │                  │
│  └──────────────┘                  │
│                                     │
└─────────────────────────────────────┘
```

## Differences from Development

| Aspect           | Development   | Production         |
| ---------------- | ------------- | ------------------ |
| **Build**        | Dev server    | Optimized build    |
| **Port**         | 3000 (host)   | 3000 (container)   |
| **Database**     | Host postgres | Container postgres |
| **Hot Reload**   | ✅            | ❌                 |
| **Source Maps**  | ✅            | ❌                 |
| **Minification** | ❌            | ✅                 |
| **ENV**          | `.env` direct | `.env` via Docker  |

## CI/CD Integration

This setup mirrors production deployment:

```yaml
# Example GitHub Actions
- name: Test production build
  run: bun docker:prod:build

- name: Run production
  run: bun docker:prod:up

- name: Health check
  run: curl http://localhost:3000/api/health
```

## See Also

- [Deployment Guide](./deployment.md)
- [Environment Variables](.env.example)
- [Docker Compose Reference](https://docs.docker.com/compose/)
