# 🍽️ Bistro

[![CI](https://github.com/AloisH/bistro/actions/workflows/ci.yml/badge.svg)](https://github.com/AloisH/bistro/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Production-ready Nuxt 4 SaaS boilerplate with modern full-stack patterns**

## What is Bistro?

Bistro is a SaaS starter kit built with Nuxt 4, providing production-ready patterns for authentication, database operations, multi-tenancy, and role-based access control. Includes a complete todo app as example feature demonstrating real-world CRUD, filtering, and user-scoped data patterns.

**Built with:**

- ⚡ **Nuxt 4** — Full-stack framework
- 🎨 **Nuxt UI + Tailwind 4** — Beautiful, accessible components
- 🗄️ **PostgreSQL + Prisma** — Type-safe database
- 🔐 **Better Auth** — Modern authentication
- 🤖 **Vercel AI SDK** — AI integrations (OpenAI, Anthropic, local models)
- 💳 **Polar** — Developer-friendly payments
- 📧 **Resend** — Email with React templates
- 🐳 **Docker** — Consistent dev & production environments

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/bistro.git
cd bistro

# Install dependencies
bun install

# Start PostgreSQL & Redis
docker compose up -d

# Set up environment variables
cp .env.example .env
# Edit .env with your keys

# Run database migrations
bun db:migrate

# Start development server
bun dev
```

Visit http://localhost:3000

## Production Testing

Test production Docker build locally (uses `.env.docker` automatically):

```bash
# Build and run production setup
bun docker:prod

# Or run detached
bun docker:prod:up

# View logs
bun docker:prod:logs

# Stop
bun docker:prod:down
```

Uses separate `.env.docker` file (postgres hostname) so local dev `.env` (localhost) stays unchanged.

See [docs/docker-production.md](docs/docker-production.md) for details.

## Features

✅ **Example Feature: Todo Management**

- Full CRUD with filtering/sorting
- User-scoped data queries
- URL state persistence
- Optimistic UI updates
- Shows service + repository pattern

🔐 **Authentication & Authorization**

- Email/password authentication (Better Auth)
- OAuth providers (GitHub, Google)
- Role-based access control (USER/ADMIN/SUPER_ADMIN)
- Admin impersonation with audit logging
- Session management with 5-min cache

🏢 **Multi-Tenancy**

- Organization-based data isolation
- Organization roles (OWNER/ADMIN/MEMBER/GUEST)
- Invite system with email tokens
- Organization switching
- Member management

🎨 **User Experience**

- 5-step onboarding flow
- Dark mode support
- Responsive design (Nuxt UI + Tailwind 4)
- Real-time toast notifications
- Loading and empty states

🏗️ **Architecture**

- Feature-based backend (service + repository pattern)
- User-scoped database queries
- Zod validation schemas
- Type-safe API handlers
- Comprehensive test coverage

## Project Structure

```
bistro/
├── apps/web/                    # Main Nuxt 4 app
│   ├── app/                     # Client-side code
│   │   ├── pages/               # File-based routes
│   │   ├── components/          # Vue components
│   │   └── composables/         # useTodos, useAuth, useOrganization
│   ├── server/                  # Server-side code
│   │   ├── api/                 # API endpoints
│   │   ├── features/            # Domain features (todo, user, auth, org)
│   │   │   ├── todo/           # Todo service + repository
│   │   │   ├── user/           # User service + repository
│   │   │   └── auth/           # Better Auth config
│   │   └── utils/               # Core utils (db, api-handler)
│   ├── shared/                  # Shared code
│   │   └── schemas/             # Zod validation schemas
│   ├── prisma/                  # Database
│   │   ├── schema.prisma        # DB schema
│   │   └── migrations/          # Migration history
│   └── nuxt.config.ts
├── .agent/                      # Documentation
│   ├── System/                  # Architecture docs
│   └── SOP/                     # Standard operating procedures
└── CLAUDE.md                    # AI agent instructions
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — AI agent instructions (project overview)
- **[.agent/System/](.agent/System/)** — System architecture docs
  - [Project Architecture](.agent/System/project_architecture.md)
  - [Database Schema](.agent/System/database_schema.md)
  - [Authentication System](.agent/System/authentication_system.md)
  - [Organizations System](.agent/System/organizations_system.md)
  - [Onboarding System](.agent/System/onboarding_system.md)
- **[.agent/SOP/](.agent/SOP/)** — Standard operating procedures
  - [Database Migrations](.agent/SOP/database_migrations.md)
  - [Adding API Endpoints](.agent/SOP/adding_api_endpoints.md)
  - [Adding Pages](.agent/SOP/adding_pages.md)

## API Endpoints

All endpoints user-scoped with automatic session validation:

**Todos:**

- `GET /api/todos` - List todos (with filter/sort query params)
- `POST /api/todos` - Create todo
- `GET /api/todos/:id` - Get single todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `POST /api/todos/:id/toggle` - Toggle completion

**Organizations:**

- `GET /api/organizations` - List user's orgs
- `POST /api/organizations` - Create org
- `GET /api/organizations/:slug` - Get org details
- `PUT /api/organizations/:slug` - Update org (OWNER/ADMIN)
- `DELETE /api/organizations/:slug` - Delete org (OWNER)

**Members & Invites:**

- `GET /api/organizations/:slug/members` - List members
- `PUT /api/organizations/:slug/members/:id/role` - Update role (OWNER)
- `GET /api/organizations/:slug/invites` - List invites (OWNER/ADMIN)
- `POST /api/organizations/:slug/invites` - Create invite (OWNER/ADMIN)
- `POST /api/organizations/invites/accept` - Accept invite (token-based)

**Admin:**

- `GET /api/admin/users` - List all users (ADMIN+)
- `PUT /api/admin/users/:id/role` - Update user role (SUPER_ADMIN)
- `POST /api/admin/impersonate` - Start impersonation (SUPER_ADMIN)
- `POST /api/admin/impersonate/stop` - Stop impersonation

## Why Bistro?

SaaS boilerplate with production patterns baked in:

- ✅ **User-scoped queries** - All data filtered by userId/organizationId
- ✅ **Type safety** - Zod schemas + Prisma types end-to-end
- ✅ **Feature-based architecture** - Service + repository pattern
- ✅ **Security best practices** - RBAC, session validation, audit logging
- ✅ **Modern stack** - Nuxt 4, Prisma 7, Better Auth
- ✅ **Testing** - Vitest with comprehensive coverage
- ✅ **CI/CD** - GitHub Actions with lint/test/build
- ✅ **Docker ready** - Dev + production configs

Replace todo example with your feature, keep the patterns.

## Development

```bash
# Run tests
bun test

# Type checking
bun typecheck

# Lint & format
bun lint
bun format

# Database commands
bun db:migrate    # Run migrations
bun db:seed       # Seed database
bun db:studio     # Open Prisma Studio
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**

- 🐛 Bug reports & fixes
- ✨ New features
- 📖 Documentation improvements
- 🎨 UI/UX enhancements
- 🌍 Translations

## Community & Support

- **Discord:** [Join our community](#)
- **GitHub Discussions:** Ask questions, share projects
- **Twitter/X:** [@bistrosass](#) for updates

## Quick Demo

After setup, try these workflows:

1. **Create account** → `/auth/register`
2. **Complete onboarding** → 5-step flow
3. **Create organization** → `/org/create`
4. **Add todos** → `/org/[slug]/dashboard`
5. **Filter/sort todos** → URL params persist
6. **Invite members** → `/org/[slug]/members`
7. **Switch orgs** → Header dropdown
8. **Admin panel** → Set user role to SUPER_ADMIN in Prisma Studio

## Database Schema

Key models:

- **Todo** - id, title, description, completed, userId
- **User** - email, password, role (USER/ADMIN/SUPER_ADMIN)
- **Organization** - name, slug, planType
- **OrganizationMember** - links users to orgs with roles
- **Session** - Better Auth session management
- **ImpersonationLog** - Admin impersonation audit trail

See `apps/web/prisma/schema.prisma` for full schema.

## License

MIT © 2025 Bistro Contributors

**No restrictions.** Use for personal projects, commercial SaaS, or anything else.

---

**SaaS boilerplate with production-ready Nuxt 4 patterns • Todo app included as example**
