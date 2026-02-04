# Production Deployment

This guide covers deploying Bistro to production using Docker.

## Prerequisites

- Docker & Docker Compose installed
- Production `.env` file configured
- PostgreSQL connection (via Docker or external service)
- (Optional) External Redis for background jobs

## Environment Configuration

Create a `.env` file in the project root with production values:

### Required Variables

```bash
# Application
NODE_ENV=production
APP_URL=https://yourdomain.com

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/bistro

# Better Auth
AUTH_SECRET=<generate-secure-secret-min-32-chars>
AUTH_TRUST_HOST=true

# AI Providers (at least one required for AI features)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional Variables

```bash
# Redis (for background jobs)
REDIS_URL=redis://host:6379

# Payments (Polar)
POLAR_API_KEY=polar_...
POLAR_WEBHOOK_SECRET=...

# Email (Resend)
RESEND_API_KEY=re_...

# Storage (Vercel Blob or S3)
BLOB_READ_WRITE_TOKEN=...
S3_ENDPOINT=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...

# Observability
SENTRY_DSN=...
```

**Security Notes:**

- Generate `AUTH_SECRET` with: `openssl rand -base64 32`
- Never commit `.env` to version control
- Use secrets management in production (e.g., Docker secrets, Kubernetes secrets)

## Build & Deploy

### 1. Build Docker Image

```bash
docker build -t bistro:latest ./apps/web
```

### 2. Check Image Size

```bash
docker images bistro:latest
```

Expected size: <500MB

### 3. Start Production Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will:

1. Start PostgreSQL with health checks
2. Run database migrations via init container
3. Start the application once migrations complete

### 4. View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# App only
docker-compose -f docker-compose.prod.yml logs -f app

# Migrations
docker-compose -f docker-compose.prod.yml logs db-migrate
```

### 5. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/

# Check running containers
docker ps
```

### 6. Stop Services

```bash
docker-compose -f docker-compose.prod.yml down

# With volumes cleanup
docker-compose -f docker-compose.prod.yml down -v
```

## Database Migrations

Migrations run automatically via the `db-migrate` init container before the app starts. This ensures:

- Migrations execute once before any app instance starts
- Safe for multi-instance deployments
- App won't start if migrations fail

### Manual Migration

If needed, run migrations manually:

```bash
docker-compose -f docker-compose.prod.yml run --rm db-migrate
```

## Health Checks

### Application

- **Endpoint:** `GET /`
- **Interval:** 30s
- **Timeout:** 3s
- **Retries:** 3
- **Start Period:** 10s

### PostgreSQL

- **Check:** `pg_isready -U bistro`
- **Interval:** 10s
- **Timeout:** 5s
- **Retries:** 5

## Architecture

The production setup uses:

- **Multi-stage Dockerfile** — Optimized build with separate deps/build/runtime stages
- **Init container pattern** — Migrations run before app via `db-migrate` service
- **Health-based dependencies** — Services start only when dependencies are healthy
- **Non-root user** — App runs as `bun:bun` (UID/GID 1000)
- **Minimal runtime** — Final image contains only production deps + built output

## Deployment Platforms

### Docker Compose (Self-hosted)

Use the provided `docker-compose.prod.yml` on any server with Docker installed.

### Container Platforms

The Dockerfile works with any container platform:

- **Fly.io:** Deploy with `fly launch` (flyctl required)
- **Railway:** Connect GitHub repo, set env vars
- **Render:** Create web service from Dockerfile
- **DigitalOcean App Platform:** Deploy from GitHub
- **AWS ECS/Fargate:** Push to ECR, create task definition
- **Google Cloud Run:** Push to GCR, deploy service
- **Azure Container Apps:** Push to ACR, create container app

### Kubernetes

Create K8s manifests:

- Deployment (with init container for migrations)
- Service (ClusterIP + Ingress)
- ConfigMap/Secret (for env vars)
- PersistentVolumeClaim (for Postgres if not using managed DB)

## Production Checklist

- [ ] All required env vars set
- [ ] `AUTH_SECRET` generated with cryptographically secure method
- [ ] PostgreSQL connection tested
- [ ] Redis configured (if using background jobs)
- [ ] AI provider API keys valid
- [ ] SSL/TLS certificate configured (via reverse proxy or platform)
- [ ] Domain DNS configured
- [ ] Health checks responding
- [ ] Migrations applied successfully
- [ ] App accessible at production URL
- [ ] Monitoring/logging configured
- [ ] Backups enabled for database

## Troubleshooting

### Container won't start

Check logs:

```bash
docker-compose -f docker-compose.prod.yml logs app
```

Common issues:

- Missing required env vars (validated by entrypoint)
- Database connection failed
- Migrations failed

### Migrations fail

View migration logs:

```bash
docker-compose -f docker-compose.prod.yml logs db-migrate
```

Common issues:

- Invalid `DATABASE_URL`
- Database user lacks permissions
- Network connectivity to database

### Health check failing

Check app is listening on port 3000:

```bash
docker exec bistro-app curl localhost:3000
```

### Image too large

Current optimizations should keep image <500MB. If larger:

- Check `.dockerignore` includes `node_modules`, `.nuxt`, `.output`
- Verify multi-stage build copies only necessary files
- Consider using `bun build --compile` for standalone binary

## External Services

For production, consider using managed services instead of Docker containers:

- **Database:** AWS RDS, DigitalOcean Managed Postgres, Supabase, Neon
- **Redis:** AWS ElastiCache, Upstash, Redis Cloud
- **Storage:** Vercel Blob, AWS S3, Cloudflare R2
- **Email:** Resend, SendGrid, Postmark
- **Monitoring:** Sentry, DataDog, New Relic

Update `docker-compose.prod.yml` and `.env` accordingly.

## Security Best Practices

1. **Secrets Management**
   - Use Docker secrets or K8s secrets in production
   - Never log sensitive env vars
   - Rotate `AUTH_SECRET` periodically

2. **Network Security**
   - Use reverse proxy (nginx, Caddy, Traefik) with SSL
   - Enable HTTPS only
   - Configure CORS appropriately

3. **Container Security**
   - App runs as non-root user
   - Base image regularly updated (oven/bun:1-alpine)
   - Scan images for vulnerabilities: `docker scan bistro:latest`

4. **Database Security**
   - Use strong passwords
   - Enable SSL for database connections
   - Restrict network access
   - Regular backups

## Performance Optimization

- **Horizontal Scaling:** Run multiple app containers behind load balancer
- **Database:** Use connection pooling (Prisma handles this)
- **Caching:** Configure Redis for session/data caching
- **CDN:** Serve static assets via CDN
- **Monitoring:** Track response times, error rates, resource usage

## Support

For deployment issues:

- Check [GitHub Discussions](https://github.com/your-org/bistro/discussions)
- Open issue with logs and config (redact secrets!)
- Join [Discord community](#) for real-time help
