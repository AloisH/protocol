# Bistro — Tech Plan & AI Handover

> **Purpose:** A production-ready technical plan and machine-actionable handoff package so a human developer or another AI agent can pick up the project and start building immediately.

---

## 1) Executive summary

Bistro is a **free, open-source Nuxt 4 starter kit** for developers building AI-powered SaaS products. Unlike paid alternatives ($149-$349), Bistro provides production-ready foundations with built-in AI content/productization workflows (Idea Builder, Ad Creatives, Brand Package, Landing Page, Email Funnels, SEO content). This document provides: tech stack with rationale, system architecture, data model, API contracts, dev setup, CI/CD, security, testing strategy, MVP roadmap, and machine-friendly handoff for AI agents.

**Tech Stack Summary:**

- **Framework:** Nuxt 4 + Nitro (full-stack)
- **UI:** Nuxt UI + Tailwind CSS 4
- **Database:** PostgreSQL + Prisma
- **Auth:** Better Auth
- **AI:** Vercel AI SDK
- **Content:** Nuxt Content
- **Payments:** Polar
- **Email:** Resend
- **Runtime:** Bun
- **Deployment:** Docker + Docker Compose

---

## 2) Goals & success metrics (KPI)

**Developer Experience:**

- Bootstrap to running app: < 10 minutes
- First deployment: < 30 minutes
- Full customization understanding: < 2 hours with docs

**Adoption Metrics:**

- GitHub stars: 1k in first 3 months
- Active forks/projects built: 100+ in 6 months
- Community contributors: 10+ regular contributors

**Technical Goals:**

- Zero-config local dev with Docker Compose
- Type-safe end-to-end (frontend ↔ API)
- Mobile-responsive out of the box
- Lighthouse score > 90

---

## 3) Competitor comparison & differentiation

| Feature          | Bistro                   | supastarter          | nuxtstarter.ai | supersaas     |
| ---------------- | ------------------------ | -------------------- | -------------- | ------------- |
| **Price**        | **Free (OSS)**           | $349 ($244 sale)     | $169           | $149          |
| **Framework**    | **Nuxt 4**               | Nuxt 3               | Nuxt 3         | Nuxt 4        |
| **UI**           | **Nuxt UI + Tailwind 4** | Radix Vue + Tailwind | Tailwind       | Tailwind v4   |
| **ORM**          | **Prisma**               | Prisma               | Supabase       | Drizzle       |
| **Auth**         | **Better Auth**          | Multiple options     | Basic + OAuth  | 30+ providers |
| **AI SDK**       | **✓ Vercel AI SDK**      | Vercel AI SDK        | ❌             | ❌            |
| **Content**      | **✓ Nuxt Content**       | MDX blog             | ❌             | ❌            |
| **AI Workflows** | **✓ Built-in**           | Basic                | ❌             | ❌            |
| **Example Apps** | **6+**                   | Few                  | Few            | 5+            |
| **License**      | **MIT**                  | Proprietary          | Proprietary    | Proprietary   |

**Bistro's Unique Value:**

- **Free & open-source** — no $149-$349 upfront cost
- **AI-first** — content generation, ad creatives, SEO tools built-in
- **Productization workflows** — not just auth/payments, but complete content pipelines
- **Community-driven** — transparent roadmap, accept contributions
- **No vendor lock-in** — choose your DB, hosting, AI provider

---

## 4) Tech stack

**Why these choices?**

- **Nuxt 4**: Latest stable, full-stack, great DX, huge ecosystem
- **Better Auth**: Modern, flexible, no vendor lock-in
- **Vercel AI SDK**: Provider-agnostic, streaming built-in
- **Prisma**: Type-safe ORM, great migrations
- **Bun**: Fastest runtime, all-in-one tooling
- **Docker**: Portable, consistent environments
- **Polar**: Developer-friendly payments, merchant of record

**Core Framework:**

- **Nuxt 4** — Full-stack framework (Vue 3, Composition API, TypeScript)
  - SSR/SSG support, file-based routing, auto-imports
  - Server routes for API (no separate backend needed)
  - Nitro server engine (universal, fast, portable)
- **Tailwind CSS 4** — Utility-first styling with latest performance improvements
- **Nuxt UI** — Pre-built, accessible components built on Headless UI
- **Nuxt Content** — File-based CMS for docs, blog, MDX support

**Data & Backend:**

- **Prisma** — TypeScript-first ORM with migrations
- **PostgreSQL** — Primary database (local/Neon/Vercel Postgres)
- **Redis** (optional) — Background jobs, caching (Upstash for serverless)

**Auth & Security:**

- **Better Auth** — Modern, framework-agnostic auth library
  - Email/password, OAuth, magic links, 2FA
  - Session management, CSRF protection
  - Built-in multi-tenancy support

**AI Integration:**

- **Vercel AI SDK** — Unified interface for LLMs
  - Streaming responses
  - OpenAI, Anthropic, local models
  - Built-in prompt caching
- **Tiptap** — Rich text editor for AI-generated content
- **Vector DB:** Not included by default (can add pgvector if needed)

**Optional Services:**

- **Payments:** Polar (merchant of record, simple setup)
- **Email:** Resend (developer-friendly, generous free tier)
- **Storage:** Vercel Blob or S3-compatible
- **Analytics:** Vercel Analytics (privacy-friendly)

**Deployment:**

- **Docker** (primary) — Docker Compose for dev, production-ready Dockerfile
- **Alternative:** Vercel, Cloudflare Pages, Netlify, Railway
- **Database:** Neon, Supabase, or self-hosted PostgreSQL

**Dev Tools:**

- **Bun** — Fast all-in-one runtime, package manager, bundler
- **Vitest** — Unit testing (ESM-native, fast)
- **Playwright** — E2E testing
- **ESLint + Prettier** — Code quality
- **Docker Compose** — Local dev environment
- **GitHub Actions** — CI/CD

**IDE & AI Assistant Setup:**

- **VSCode** — Settings, extensions, snippets pre-configured
- **Zed** — Modern editor config included
- **Cursor/Claude/Copilot** — AI coding assistant rules and prompts
- **Dev containers** — Ready-to-use devcontainer.json

---

## 5) System architecture

**Architecture:** Full-stack Nuxt 4 monolith powered by Nitro

```
┌─────────────────────────────────────────────────┐
│  Users (Web/Mobile)                             │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────▼─────────┐
        │  Reverse Proxy   │  Nginx/Caddy (SSL/CDN)
        └────────┬─────────┘
                 │
┌────────────────▼──────────────────────────────────┐
│  Docker Container: Nuxt 4 App                     │
│  ┌──────────────────────────────────────────┐    │
│  │ Frontend (Vue 3 + Nuxt UI)               │    │
│  │ • Pages, Components, Composables         │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ Backend (Nitro Server)                   │    │
│  │ • API Routes (/api/v1/*)                 │    │
│  │ • Server Middleware (auth, rate limit)   │    │
│  │ • AI Service (Vercel AI SDK)             │    │
│  │ • Better Auth integration                │    │
│  └──────────────────────────────────────────┘    │
└────────┬──────────────────────────────┬───────────┘
         │                              │
    ┌────▼─────────┐           ┌────────▼──────────┐
    │ PostgreSQL   │           │  External APIs    │
    │ + Prisma     │           │  • OpenAI/Claude  │
    │              │           │  • Polar          │
    └──────────────┘           │  • Resend         │
                               └───────────────────┘
```

**Core Components:**

- **Frontend:** Nuxt pages + Nuxt UI components
- **Backend:** Nitro server routes (built into Nuxt 4)
- **API:** RESTful endpoints at `/api/v1/*`
- **Auth:** Better Auth middleware for session management
- **AI Layer:** Vercel AI SDK with streaming support
- **Database:** Prisma client for type-safe queries
- **Content:** Nuxt Content for docs/blog (MDX)
- **Jobs:** Optional BullMQ + Redis for async AI tasks

**Why Nitro:**

- Universal JS engine (runs anywhere)
- Auto-imports, file-based routing
- Built-in caching, storage layers
- Hot module replacement in dev

---

## 6) Data model (core entities)

- **User**: id, email, name, roles, billing_customer_id, created_at, updated_at
- **Organization / Workspace**: id, name, owner_id, plan, seats
- **Project**: id, org_id, title, template_id, settings, status
- **Template**: id, type, slug, schema, ui_meta
- **Asset**: id, project_id, url, mime_type, size
- **AIJob**: id, project_id, type, input, status, result_ref, cost, duration
- **PromptLibrary**: id, name, prompt_text, tags
- **Subscription**: id, org_id, stripe_subscription_id, tier

Schema definitions and Prisma models are included in `/infra/prisma/schema.prisma` in the repo scaffold.

---

## 7) API contract / OpenAPI skeleton (machine actionable)

A minimal OpenAPI v3 skeleton is included in `/openapi/bistro.yaml` with these endpoints:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/templates`
- `POST /api/v1/projects`
- `GET /api/v1/projects/{id}`
- `POST /api/v1/projects/{id}/ai/generate` (enqueue an AI job)
- `GET /api/v1/ai/jobs/{jobId}`
- `POST /api/v1/webhooks/stripe`

The OpenAPI file contains types for request/response bodies and example payloads.

---

## 8) Dev environment & bootstrap

**Local bootstrap script** (bash) included as `scripts/bootstrap.sh`:

- Installs Bun, Docker Compose (if needed)
- Reads `.env.example` → `.env`
- Starts Postgres + Redis via Docker Compose
- Runs `bun install` and `bun dev` to start Nuxt app

**Repository layout** (monorepo with bun workspaces):

```
/ (root)
  /apps
    /landing (marketing site - Nuxt Content)
    /web (starter kit - full-stack Nuxt 4 app)
    /docs (documentation - Nuxt Content)
  /packages
    /cli (bistro CLI for project scaffolding)
    /ui (shared Nuxt UI components)
    /lib (shared types, utils)
    /database (Prisma schema, migrations, seed data)
    /config (shared configs - ESLint, Prettier, TS)
  /templates (project templates for CLI)
  /prompts (AI prompt templates)
  /scripts (setup, deployment, testing)
  /.vscode (VSCode settings, extensions, snippets)
  /.zed (Zed editor config)
  /.devcontainer (Dev container config)
  /.claude (Claude Code rules)
  /.github (Actions, copilot instructions, templates)
  .cursorrules (Cursor AI rules)
  docker-compose.yml
  .env.example
  README.md
```

**Apps breakdown:**

- **landing** — Public-facing site (bistro.dev), built with Nuxt Content
- **web** — The starter kit itself (users clone/fork this)
- **docs** — Documentation site (docs.bistro.dev)

**CLI package:**

- `bun create bistro` — Bootstrap new project from template
- `bistro add [feature]` — Add features (auth, payments, AI, etc.)
- `bistro deploy` — Guided deployment setup

---

## 9) IDE & developer environment setup

**Pre-configured for popular IDEs:**

**VSCode (`.vscode/` included):**

- `settings.json` — Format on save, ESLint, Prettier, auto-imports
- `extensions.json` — Recommended extensions:
  - Vue - Official (Vue Language Features)
  - Tailwind CSS IntelliSense
  - Prisma
  - ESLint
  - Prettier
  - Error Lens
  - GitLens
- `launch.json` — Debug configurations for Nuxt, Node, tests
- `snippets/` — Custom Vue 3, Nuxt, TypeScript snippets

**Zed (`.zed/` included):**

- `settings.json` — Modern editor optimized config
- Language server settings for Vue, TypeScript
- Fast startup, minimal configuration

**AI Coding Assistants:**

- `.cursorrules` — Rules for Cursor AI (project conventions, patterns)
- `.github/copilot-instructions.md` — Context for GitHub Copilot
- `.claude/` — Claude Code project rules:
  - Architecture patterns to follow
  - Code style guidelines
  - Common tasks and solutions
  - Component naming conventions
- AI-friendly documentation in code comments

**Dev Containers:**

- `.devcontainer/devcontainer.json` — Full development environment
- Pre-installed: Bun, Node, PostgreSQL, Redis
- Works with GitHub Codespaces, VSCode Dev Containers
- One-click setup for new contributors

**Pre-commit Hooks:**

- Husky + lint-staged configured
- Auto-format on commit
- Type checking before push
- Conventional commits enforced

---

## 10) CLI & project scaffolding

**Bistro CLI** — Fast project scaffolding and feature management

**Core commands:**

```bash
# Create new project
bun create bistro my-saas
bun create bistro my-saas --template minimal
bun create bistro my-saas --template saas-full

# Add features to existing project
bistro add auth          # Add Better Auth
bistro add payments      # Add Polar integration
bistro add ai            # Add Vercel AI SDK setup
bistro add email         # Add Resend templates
bistro add blog          # Add Nuxt Content blog

# Project management
bistro dev               # Start dev server
bistro build             # Build for production
bistro deploy            # Interactive deployment wizard
bistro doctor            # Check project health
```

**Templates:**

- **minimal** — Barebones Nuxt 4 + Tailwind 4
- **saas-basic** — Auth + DB + Nuxt UI
- **saas-full** — Auth + AI + Payments + Email (recommended)
- **ai-content** — AI-first content generation toolkit
- **marketplace** — Multi-tenant marketplace setup

**Features:**

- Interactive prompts (like create-t3-app)
- TypeScript-first code generation
- Automatic dependency installation
- Environment variable setup
- Database migration on init
- Git initialization

---

## 11) CI/CD

**GitHub Actions workflows** (included in `.github/workflows/`):

- `ci.yml` — Lint, typecheck, unit tests on all PRs
- `e2e.yml` — Playwright e2e tests on main branch
- `deploy.yml` — Deploy to Vercel on merge to `main` (auto-configured)
- `security.yml` — Dependency scanning with Dependabot
- `release.yml` — Automated releases with semantic versioning

**Deployment:**

- **Docker:** Multi-stage Dockerfile with Bun (primary method)
- **Docker Compose:** Production-ready compose file included
- **Alternative:** Vercel, Railway, Fly.io (configs provided)

Secrets managed via environment variables and GitHub Actions secrets.

---

## 12) Background jobs + AI orchestration

- Use BullMQ + Redis for job queueing
- Workers process: AI generation, PDF/ZIP exports, image post-processing, rate-limited calls to OpenAI
- Job metadata persisted to `AIJob` table. Results written to S3 and referenced in DB.

**Cost control**: set per-org monthly budget & soft quota enforced by AI Orchestrator.

---

## 13) Security checklist

- HTTPS enforced at edge
- Strong CSP and cookie settings (HttpOnly, Secure, SameSite)
- Rate limiting at API gateway and per-user
- Input validation using Zod on both frontend and backend
- Audit logs for billing changes and admin actions
- Monthly dependency vulnerability scans (Dependabot)

---

## 14) Observability (optional, easy to add)

**Error Tracking:**

- Sentry integration (optional) — pre-configured, just add DSN
- Source maps for production debugging

**Logging:**

- Structured JSON logs (console in dev, file in prod)
- Pino or Winston for performance
- Integration guides for BetterStack, Axiom, Logflare

**Analytics (privacy-friendly):**

- Plausible or Umami pre-configured (cookieless)
- Custom event tracking for key actions

**Performance Monitoring:**

- Vercel Analytics (built-in on Vercel)
- Web Vitals tracking included
- API response time middleware

**Note:** All observability is optional and modular — remove what you don't need.

---

## 15) Testing strategy (machine-readable examples included)

- **Unit tests:** Vitest (fast, ESM-native)
- **E2E tests:** Playwright (multi-browser)
- **Component tests:** Testing Library (user-centric)
- **API tests:** Supertest or Playwright API testing
- **Coverage target:** >80% for core business logic

**Example Gherkin scenarios included** in `/tests/features/` for:

- User signup/login flow
- AI content generation
- Project creation and management
- Payment subscription flow

---

## 16) Example apps & templates (like supersaas)

Bistro includes 5+ fully-functional example apps demonstrating best practices:

1. **AI Blog Generator** — Generate SEO-optimized blog posts with AI
2. **Ad Creative Studio** — Create ad copy + images for multiple platforms
3. **Landing Page Builder** — AI-assisted landing page creation with Tiptap
4. **Email Funnel Designer** — Multi-step email sequence builder
5. **Brand Package Creator** — Logo, colors, typography suggestions via AI
6. **Product Idea Validator** — Market research + competitive analysis tool

Each example includes:

- Complete UI implementation
- API routes
- Database schema
- AI prompt templates
- Tests

---

## 17) Open-source licensing & sustainability

**License:** MIT License

- Use for any purpose (personal, commercial, SaaS products)
- No attribution required (appreciated!)
- Modify and redistribute freely
- Full source code available on GitHub

**Sustainability Model:**

- **GitHub Sponsors** — Support ongoing development and maintenance
  - Sponsor tiers: $5/month (supporter), $25/month (backer), $100/month (sponsor)
  - Sponsors get recognition in README and website
  - Monthly updates on development progress
- **100% Free Core** — All core features remain free forever
- **Community-driven** — No paid tiers, premium features, or paywalls

**Contribution Guidelines:**

- All contributions welcome (PRs, issues, docs, translations)
- CLA not required
- Maintainer team reviews within 48 hours
- Public roadmap in GitHub Projects

---

## 18) Documentation & developer experience

**Docs site** (Nuxt Content):

- **Quickstart:** Running app in < 10 minutes
- **Architecture guide:** Understanding the codebase
- **Customization guide:** Swap auth, DB, UI components
- **AI integration:** Vercel AI SDK, adding providers, prompt engineering
- **Deployment guides:** Docker, Vercel, Railway, self-hosted
- **API reference:** Auto-generated from OpenAPI spec
- **Example recipes:** Common customization patterns
- **Component library:** Nuxt UI components showcase

**Interactive tutorials:**

- "Build your first AI feature"
- "Add a new payment tier"
- "Customize the UI theme"

---

## 19) Roadmap (90-day MVP)

**Month 1: Foundation & Infrastructure**

- [ ] Monorepo setup (bun workspaces, turborepo)
- [ ] Starter kit app (apps/web): Nuxt 4 + TypeScript + Tailwind 4
- [ ] Nuxt UI component library integration
- [ ] Prisma + PostgreSQL + migrations
- [ ] Better Auth integration (email, OAuth, 2FA)
- [ ] Docker Compose dev environment
- [ ] IDE configs: VSCode, Zed, devcontainer
- [ ] AI assistant rules: .cursorrules, .claude/, copilot
- [ ] Pre-commit hooks (Husky + lint-staged)
- [ ] Landing page (apps/landing): Nuxt Content
- [ ] CLI package (packages/cli): Project scaffolding
- [ ] GitHub Actions CI

**Month 2: Core AI Features**

- [ ] Vercel AI SDK integration (OpenAI, Anthropic)
- [ ] AI streaming responses with proper error handling
- [ ] Prompt library & management system
- [ ] Tiptap editor integration with AI completion
- [ ] 3 example apps (Blog Generator, Ad Studio, Landing Builder)
- [ ] File upload + storage (Vercel Blob or S3)
- [ ] Background job queue (BullMQ + Redis) for async AI tasks

**Month 3: Polish, Docs & Launch**

- [ ] Polar payments integration (optional, removable)
- [ ] Email templates (Resend)
- [ ] CLI improvements: `bistro add` commands
- [ ] CLI templates: minimal, saas-basic, saas-full
- [ ] Documentation site (apps/docs) with Nuxt Content
- [ ] Landing page polish + pricing/features page
- [ ] Rate limiting + security hardening
- [ ] E2E tests (Playwright) for all apps
- [ ] Production Dockerfile + deployment guides
- [ ] Publish CLI to npm/bun registry
- [ ] Launch on Product Hunt, Hacker News, /r/SideProject

---

## 20) AI agent handoff (machine-actionable)

**For AI agents building Bistro:**

1. **Bootstrap command:**

   ```bash
   bun create bistro my-saas
   cd my-saas
   bun install
   docker compose up -d
   bun db:migrate
   bun dev
   ```

2. **Issue templates** in `.github/ISSUE_TEMPLATE/`:
   - `feature.yml` — structured feature requests
   - `bug.yml` — bug reports with reproduction steps
   - `ai-task.yml` — machine-readable task format for AI agents

3. **Prompt templates** in `/prompts/`:
   - `blog-post.txt` — blog generation
   - `ad-creative.txt` — ad copy generation
   - `landing-page.txt` — landing page structure
   - `seo-meta.txt` — meta descriptions

4. **API contracts:** OpenAPI spec at `/openapi/bistro.yaml` with full request/response schemas

5. **Scriptable tasks** in `/scripts/`:
   - `setup.sh` — one-command setup
   - `deploy.sh` — deployment automation
   - `seed.sh` — database seeding
   - `test-ai.sh` — test AI integrations

6. **Environment variables template** (`.env.example`):
   - All required vars documented
   - Links to where to get API keys
   - Sensible defaults for local dev

**AI collaboration workflow:**

- Read `/docs/CONTRIBUTING.md` for code style, patterns, testing requirements
- Check `/docs/ARCHITECTURE.md` for system design decisions
- Use `/scripts/ai-generate.sh <feature-name>` to scaffold new features
- Run `/scripts/ai-test.sh` before submitting PRs

---

## 21) Security & compliance notes

**For starter kit builders:**

- API keys should NEVER be committed (checked by pre-commit hook)
- GDPR compliance: user data export/deletion endpoints included
- CCPA compliance: opt-out mechanisms in place
- PCI compliance: never store card details (Stripe handles all payment data)
- Rate limiting: per-IP and per-user to prevent abuse
- Content Security Policy: strict CSP headers configured
- Dependency scanning: Dependabot auto-PRs for vulnerabilities

---

## 22) Community & support

**Getting help:**

- **Discord:** [discord.gg/bistro](#) — real-time chat with community
- **GitHub Discussions:** Q&A, show & tell, ideas
- **Stack Overflow:** Tag questions with `bistro-saas`
- **Twitter/X:** [@bistrosass](#) — updates and announcements

**Ways to contribute:**

- Code contributions (features, bug fixes)
- Documentation improvements
- Example apps & templates
- Translations (i18n)
- Blog posts & tutorials
- Video walkthroughs
- Testing & bug reports

**Recognition:**

- All contributors listed in README
- Top contributors get "core team" badge
- Monthly spotlight on community projects

---

## Next steps

1. **Star the repo** to show support and stay updated
2. **Read the quickstart** guide to run locally
3. **Join Discord** to connect with other builders
4. **Build something awesome** and share it with the community
5. **Give feedback** to help improve Bistro

**License:** MIT © 2025 Bistro Contributors

**Repository:** [github.com/your-org/bistro](#) (to be created)

---

## 23) Key decisions summary

**Confirmed specifications:**

- ✅ License: MIT (most permissive)
- ✅ Framework: Nuxt 4 + Nitro
- ✅ UI: Nuxt UI + Tailwind 4
- ✅ Database: PostgreSQL + Prisma only
- ✅ Auth: Better Auth
- ✅ AI: Vercel AI SDK (no vector DB by default)
- ✅ Payments: Polar
- ✅ Runtime: Bun
- ✅ Deployment: Docker-first
- ✅ Monetization: GitHub Sponsors only (100% free core)
- ✅ Structure: Monorepo with landing, starter kit, docs, CLI
- ✅ IDE Setup: VSCode, Zed, devcontainers, AI assistant configs

**Next steps:**

1. Set up monorepo structure
2. Initialize Nuxt 4 apps
3. Build CLI scaffolding tool
4. Create landing page
5. Start Month 1 tasks from roadmap
