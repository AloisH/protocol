# Project Architecture

**Related docs:** database_schema.md, authentication_system.md

---

## Project Goal

Bistro - Free MIT-licensed Nuxt 4 starter for AI-powered SaaS. Alternative to paid starters ($149-$349).

Provides production-ready foundation:

- Authentication (Better Auth: email/password + OAuth)
- Database (Prisma 7 + PostgreSQL)
- Role-based access control (USER/ADMIN/SUPER_ADMIN)
- Admin impersonation
- User onboarding (5-step flow)
- Organizations (multi-tenant support)
- Content management (Nuxt Content)
- Email service (Resend + Vue Email templates)
- AI workflows (Vercel AI SDK - planned)
- Payments (Polar - planned)

---

## Tech Stack

### Frontend

- **Nuxt 4**: Vue 3 framework, server-side rendering, file-based routing
- **Nuxt UI v4**: Component library, built on Tailwind 4
- **Nuxt Content**: MDC syntax, collections for blog/docs
- **Tailwind 4**: Utility-first CSS
- **TypeScript**: Strict mode enabled
- **Composition API**: Vue 3 `<script setup>` only
- **Zod**: Schema validation (client + server)

### Backend

- **Nitro**: Nuxt server engine (H3 event handlers)
- **PostgreSQL**: Database (dev + prod via Docker)
- **Prisma 7**: ORM with @prisma/adapter-pg
- **pg**: PostgreSQL driver with connection pooling
- **Better Auth**: Authentication (email/password + OAuth)
- **Resend**: Email delivery (transactional emails)
- **Vue Email**: React-based email templates
- **Vercel AI SDK**: AI integrations (planned)
- **Nuxt Content**: Blog/docs with queryCollection API
- **Feed**: RSS generation for blog posts

### Infrastructure

- **Bun**: Runtime + package manager
- **Docker Compose**: Local dev (postgres + redis)
- **GitHub Actions**: CI/CD (lint, typecheck, test, build, docker)
- **Vitest**: Testing framework with happy-dom
- **ESLint + Prettier**: Code quality
- **simple-git-hooks + lint-staged**: Pre-commit checks

---

## Project Structure

```

├── app/                           # Client-side code
│   ├── app.vue                    # Root layout (UApp wrapper)
│   ├── pages/                     # File-based routes
│   │   ├── index.vue              # / (landing)
│   │   ├── dashboard.vue          # /org/[slug]/dashboard (protected)
│   │   ├── profile.vue            # /profile (protected)
│   │   ├── auth/                  # Auth flows
│   │   │   ├── login.vue
│   │   │   ├── register.vue
│   │   │   └── verify-email.vue
│   │   ├── onboarding.vue         # /onboarding (5-step flow)
│   │   ├── organizations/         # Organization management
│   │   │   ├── create.vue
│   │   │   ├── select.vue
│   │   │   └── invite.vue
│   │   ├── org/[slug]/            # Organization workspace
│   │   │   ├── dashboard.vue
│   │   │   ├── members.vue
│   │   │   └── settings.vue
│   │   └── admin/                 # Admin pages (SUPER_ADMIN only)
│   │       ├── users.vue          # User management
│   │       └── email-preview.vue  # Email template preview
│   ├── components/                # Auto-imported Vue components
│   │   ├── AppLogo.vue
│   │   ├── AuthButton.vue         # Login/Avatar dropdown
│   │   ├── AuthOAuthButtons.vue   # OAuth providers
│   │   ├── ImpersonationBanner.vue
│   │   ├── SessionList.vue
│   │   ├── OrganizationSwitcher.vue
│   │   ├── OrganizationMembers.vue
│   │   └── onboarding/            # Onboarding step components
│   │       ├── OnboardingWelcome.vue
│   │       ├── OnboardingProfile.vue
│   │       ├── OnboardingUseCase.vue
│   │       ├── OnboardingPreferences.vue
│   │       └── OnboardingComplete.vue
│   ├── composables/               # Auto-imported composables
│   │   ├── useAuth.ts             # Auth state (Better Auth client)
│   │   ├── useRole.ts             # RBAC helpers
│   │   ├── useImpersonation.ts    # Impersonation helpers
│   │   └── useAuthRedirect.ts     # Auth redirect logic
│   ├── middleware/                # Route guards
│   │   └── auth.global.ts         # Global auth check
│   └── assets/
│       └── css/main.css           # Global styles
├── server/                        # Server-side code
│   ├── features/                  # Domain features
│   │   ├── auth/
│   │   │   ├── auth-config.ts     # Better Auth setup
│   │   │   └── auth-session.ts    # Session helper
│   │   ├── user/
│   │   │   ├── user-service.ts    # User operations
│   │   │   └── user-repository.ts # DB queries
│   │   ├── email/
│   │   │   ├── email-service.ts   # Email sending
│   │   │   ├── email-client.ts    # Resend singleton
│   │   │   └── templates/         # Vue Email templates
│   │   ├── organization/
│   │   │   ├── organization-service.ts
│   │   │   └── organization-repository.ts
│   │   ├── impersonation/
│   │   │   ├── impersonation-service.ts
│   │   │   └── impersonation-repository.ts
│   │   └── auth/
│   │       ├── auth-config.ts     # Better Auth setup
│   │       ├── auth-session.ts    # Session helper
│   │       ├── session-service.ts
│   │       └── session-repository.ts
│   ├── api/                       # HTTP endpoints (auto-registered)
│   │   ├── auth/[...].ts          # Better Auth catch-all
│   │   ├── user/                  # User endpoints
│   │   │   ├── profile.get.ts
│   │   │   ├── profile.put.ts
│   │   │   ├── account.delete.ts
│   │   │   ├── onboarding.get.ts
│   │   │   ├── onboarding.put.ts
│   │   │   ├── onboarding/
│   │   │   │   ├── complete.post.ts
│   │   │   │   ├── skip.post.ts
│   │   │   │   └── restart.post.ts
│   │   │   ├── sessions.get.ts
│   │   │   ├── sessions/[id].delete.ts
│   │   │   ├── sessions/revoke-others.post.ts
│   │   │   └── current-organization.put.ts
│   │   ├── organizations/         # Organization endpoints
│   │   │   ├── index.get.ts       # List user orgs
│   │   │   ├── index.post.ts      # Create org
│   │   │   ├── [slug]/
│   │   │   │   ├── index.get.ts   # Get org
│   │   │   │   ├── index.put.ts   # Update org
│   │   │   │   ├── index.delete.ts # Delete org
│   │   │   │   ├── members.get.ts
│   │   │   │   └── invites/
│   │   │   │       ├── index.get.ts
│   │   │   │       └── index.post.ts
│   │   │   └── invites/
│   │   │       ├── [token].get.ts
│   │   │       └── accept.post.ts
│   │   └── admin/                 # Admin endpoints (SUPER_ADMIN)
│   │       ├── users/
│   │       │   ├── index.get.ts   # List users
│   │       │   └── [id]/role.put.ts # Update role
│   │       ├── impersonate/
│   │       │   ├── index.post.ts  # Start impersonation
│   │       │   ├── stop.post.ts   # Stop impersonation
│   │       │   └── active.get.ts  # Check active
│   │       ├── email-preview.get.ts
│   │       └── email-preview/send-test.post.ts
│   ├── utils/                     # Core utilities
│   │   ├── db.ts                  # Prisma singleton
│   │   └── api-handler.ts         # Handler wrappers
│   └── middleware/                # Server middleware
│       └── role-guard.ts          # RBAC middleware
├── shared/                        # Shared schemas (next to server/)
│   └── schemas/
│       ├── common.ts              # idSchema, slugSchema
│       ├── user.ts                # updateProfileSchema
│       └── role.ts                # roleSchema
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Migration history
│   └── generated/                 # Prisma Client (gitignored)
├── lib/
│   └── auth-client.ts             # Better Auth client (unused, prefer useAuth)
├── nuxt.config.ts                 # Nuxt config
├── vitest.config.ts               # Test config
├── eslint.config.mjs              # ESLint config
└── package.json                   # Web app dependencies
```

---

## Architecture Patterns

### Client-Side

**File-based routing:**

- `pages/index.vue` → `/`
- `pages/org/[slug]/dashboard.vue` → `/org/[slug]/dashboard`
- `pages/auth/login.vue` → `/auth/login`
- `pages/admin/users.vue` → `/admin/users`

**Auto-imports:**

- Components in `app/components/` (no import needed)
- Composables in `app/composables/` (no import needed)
- Nuxt utils: `useRoute()`, `useState()`, `navigateTo()`, etc.

**State management:**

- `useState()` for reactive state (no Vuex/Pinia)
- `useAuth()` for auth state (session, user)
- `useRole()` for RBAC (hasRole, isSuperAdmin)

**Route protection:**

- `middleware/auth.global.ts` checks all routes
- Public routes in `nuxt.config.ts` runtimeConfig.public.publicRoutes
- Redirects to `/auth/login` if unauthenticated

### Server-Side

**Feature-based architecture:**

```
API routes (api/)
    ↓
Features (service + repository)
    ↓
Core (utils/db)
```

**Benefits:**

- High cohesion: Related code together
- Clear boundaries: Explicit dependencies
- Easy navigation: All user code in features/user/
- Scalable: Add features without restructuring

**Layers:**

1. **API routes** (`server/api/`): HTTP handlers
   - Validate input (Zod schemas)
   - Call service layer
   - Return JSON response

2. **Service layer** (`server/features/*/service.ts`): Business logic
   - Validation
   - Error handling
   - Orchestrate repository calls

3. **Repository layer** (`server/features/*/repository.ts`): DB queries
   - User-scoped queries (CRITICAL: always filter by userId)
   - Relations
   - Transactions

4. **Core utilities** (`server/utils/`):
   - `db.ts`: Prisma singleton (global, prevents connection pool exhaustion)
   - `api-handler.ts`: Request wrappers (session check, validation)

**Import conventions:**

- Server code: Relative paths (`../../utils/db`)
- Shared schemas: `#shared` alias (`#shared/schemas/user`)
- Prisma types: Relative paths (`../../prisma/generated/client`)
- Auto-imported: `server/utils/*` exports (no import needed)

---

## Database Architecture

**Singleton pattern (CRITICAL):**

```typescript
// server/utils/db.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not set');

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton | undefined };

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

**Why singleton:**

- Prisma 7 requires driver adapters
- PrismaPg manages connection pool internally via connectionString
- Global singleton prevents multiple instances → connection pool exhaustion

**User-scoped queries (CRITICAL):**

```typescript
// ✅ DO: Always filter by user
const projects = await db.project.findMany({
  where: { userId },
});

// ❌ DON'T: Missing user filter - DATA LEAK!
const projects = await db.project.findMany();
```

---

## Authentication Architecture

**Better Auth setup:**

- **Server config** (`server/features/auth/auth-config.ts`):
  - Prisma adapter (DB integration)
  - Email/password provider
  - OAuth providers (conditional, only if env vars present)
  - Admin plugin (impersonation)
  - Session cookie cache (5 min)

- **Session helper** (`server/features/auth/auth-session.ts`):
  - `serverAuth().getSession()` for server-side checks
  - Used in API handlers, middleware

- **Client composable** (`app/composables/useAuth.ts`):
  - Wraps Better Auth client
  - Reactive state: `session`, `user`, `loggedIn`
  - Methods: `signIn`, `signUp`, `signOut`, `fetchSession`
  - Auto-syncs on client-side session changes

**Auth flow:**

1. User submits login form
2. `useAuth().signIn.email()` calls Better Auth
3. Better Auth creates session, sets cookie
4. `fetchSession()` updates client state
5. Middleware checks session on route changes
6. API handlers validate session token

**OAuth flow:**

1. User clicks OAuth button
2. Better Auth redirects to provider
3. Provider redirects back to `/auth/callback`
4. Better Auth creates session
5. Client must call `fetchSession()` to populate state

---

## Role-Based Access Control (RBAC)

**Roles:**

- `USER`: Default role (access to own data)
- `ADMIN`: Admin features (user management)
- `SUPER_ADMIN`: Full access (impersonation, role changes)

**Implementation:**

- **Database**: `User.role` field (Prisma enum)
- **Server middleware**: `requireRole(['ADMIN', 'SUPER_ADMIN'])` in API routes
- **Client composable**: `useRole()` (hasRole, isSuperAdmin, isAdmin)
- **UI**: Conditional rendering based on role

**Admin impersonation:**

- SUPER_ADMIN can impersonate users
- Better Auth admin plugin
- 1-hour auto-expiration
- Cannot impersonate other SUPER_ADMINs
- Audit logging (ImpersonationLog table)
- Global banner during impersonation

---

## Integration Points

### Database (Prisma + PostgreSQL)

**Connection:**

- Local dev: `DATABASE_URL=postgresql://bistro:bistro@localhost:5432/bistro`
- Docker prod: `DATABASE_URL=postgresql://bistro:bistro@postgres:5432/bistro`
- Fallback: `prisma.config.ts`

**Migrations:**

```bash
bun db:migrate      # Create + apply
bun db:generate     # Regenerate client
bun db:studio       # Prisma Studio UI
```

### Authentication (Better Auth)

**Better Auth integration:**

- Catch-all route: `server/api/auth/[...].ts`
- Session cookie: `better-auth.session_token`
- Cache: 5 min (may see stale session)

**OAuth providers:**

- GitHub (optional, if GITHUB_CLIENT_ID set)
- Google (optional, if GOOGLE_CLIENT_ID set)
- Runtime check: `config.public.oauthGithubEnabled`

### Email (Resend + Vue Email)

**Integration:**

- `server/features/email/email-client.ts`: Resend singleton
- `server/features/email/email-service.ts`: Email sending service
- `server/features/email/templates/`: Vue Email templates (React-based)
- Server-only (never client-side)

**Templates:**

- VerifyEmail: Email verification link
- ResetPasswordEmail: Password reset link
- MagicLinkEmail: Passwordless login
- AccountDeletion: Account deletion confirmation

**Preview:**

- `/admin/email-preview`: Live template preview (SUPER_ADMIN)

### AI (Vercel AI SDK - Planned)

**Integration:**

- OpenAI, Anthropic, local models
- Server API routes only (API keys server-side)
- Workflows: blog post gen, ad creative, landing page builder

### Payments (Polar - Planned)

**Integration:**

- Webhook: `/api/webhooks/polar`
- Signature verification (POLAR_WEBHOOK_SECRET)
- Events: checkout.completed, subscription.created
- Update user subscription in DB

---

## Environment Configuration

**Required (.env):**

```bash
DATABASE_URL=postgresql://bistro:bistro@localhost:5432/bistro
AUTH_SECRET=your-secret-key-change-in-production
```

**Optional (.env):**

```bash
# OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@example.com

# AI
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

# Payments
POLAR_API_KEY=...
POLAR_WEBHOOK_SECRET=...

# Storage
REDIS_URL=redis://localhost:6379
BLOB_READ_WRITE_TOKEN=...
```

**Docker (.env.docker):**

```bash
DATABASE_URL=postgresql://bistro:bistro@postgres:5432/bistro
# Note: postgres hostname (NOT localhost)
```

**Runtime config (nuxt.config.ts):**

- Server: `runtimeConfig.authSecret`, `runtimeConfig.databaseUrl`
- Public: `runtimeConfig.public.appUrl`, `runtimeConfig.public.publicRoutes`

---

## CI/CD Pipeline

**GitHub Actions (.github/workflows/ci.yml):**

Runs on push/PR to main/develop:

1. **Lint**: ESLint + Prettier check
2. **Typecheck**: TypeScript + Prisma generate
3. **Test**: Vitest with coverage → Codecov
4. **Build**: Nuxt production build
5. **Docker**: Build production image

**Git hooks (simple-git-hooks):**

Pre-commit:

- ESLint auto-fix on `.ts`, `.vue` files
- Prettier format on `.json`, `.md`, `.css` files

---

## Deployment

**Supported platforms:**

- Vercel (recommended)
- Railway
- Render
- Self-hosted (Docker)

**Production Docker:**

```bash
bun docker:prod         # Build + run
bun docker:prod:up      # Run detached
bun docker:prod:logs    # View logs
```

**Production checklist:**

- Set `AUTH_SECRET` (random 32+ chars)
- Configure `DATABASE_URL` (managed postgres)
- Add OAuth credentials (optional)
- Set `APP_URL` (production domain)
- Configure email (Resend)
- Enable analytics/monitoring (planned)

---

## Testing Strategy

**Unit tests:**

- Place next to files: `Component.test.ts`, `service.test.ts`
- Mock external dependencies (Prisma, Resend)
- Focus on logic, not implementation

**Integration tests:**

- API routes with mock DB
- Component interactions
- Auth flows

**E2E tests (planned):**

- Playwright for critical paths
- Login → Dashboard → AI workflow

**Coverage:**

- Vitest v8 provider
- Uploaded to Codecov in CI

---

## Key Gotchas

1. **Bun + Vite**: Configure `vite.server.fs.allow: [__dirname]` for .bun directory access - see [SOP/bun_vite_configuration.md](../SOP/bun_vite_configuration.md)
2. **Database singleton**: NEVER `new PrismaClient()`, always `import { db } from '~/server/utils/db'`
3. **User-scoped queries**: ALWAYS filter by userId (data leak prevention)
4. **OAuth session**: Must call `fetchSession()` after OAuth callback
5. **Public routes**: Add to `nuxt.config.ts` (NOT middleware)
6. **Commands from root**: ALWAYS run commands from project root
7. **Prisma regenerate**: After schema changes, run `bun db:generate` before typecheck
8. **Type safety**: No `as` assertions, no `!` non-null assertions - use Zod validation
9. **Imports**: Server uses relative paths, shared uses `#shared` alias
10. **Nuxt Content**: Use `queryCollection` from `@nuxt/content/nitro` (not deprecated `serverQueryContent`)

---

## Project Status

**Implemented:**

- ✅ Nuxt 4 app structure
- ✅ Database (Prisma 7 + PostgreSQL)
- ✅ Auth (Better Auth email/password + OAuth)
- ✅ Roles & Permissions (USER/ADMIN/SUPER_ADMIN)
- ✅ Admin impersonation
- ✅ User onboarding (5-step flow)
- ✅ Organizations (multi-tenant, invites, roles)
- ✅ Session management (list, revoke)
- ✅ Email service (Resend + Vue Email templates)
- ✅ Content management (Nuxt Content with queryCollection)
- ✅ Blog system (posts, draft support, RSS feed)
- ✅ Bun + Vite configuration (FS allow, cache prevention)
- ✅ Testing (Vitest + coverage)
- ✅ CI/CD (GitHub Actions)
- ✅ Docker (dev + prod)
- ✅ Git hooks (lint-staged)

**Planned:**

- ⏳ Payment integration (Polar)
- ⏳ AI workflows (Vercel AI SDK)

---

## Performance Targets

**Build:**

- Dev server start: < 2s
- Hot reload: < 200ms
- Production build: < 60s

**Runtime:**

- Initial page load: < 1s
- Route transitions: < 100ms
- API response: < 200ms

**Database:**

- Connection pooling (PrismaPg handles internally)
- Indexed foreign keys
- Pagination for large queries

**CI:**

- Full pipeline: < 5 min
- Individual jobs: < 2 min each
- Parallel job execution
