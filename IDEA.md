# Protocol — Tech Plan & AI Handover

> **Purpose:** Production-ready local-first PWA for personal routine/protocol tracking. Machine-actionable handoff for developers and AI agents.

---

## 1) Executive summary

Protocol is a **free, open-source Nuxt 4 PWA** for tracking daily, weekly, monthly, or yearly personal protocols. Examples: neck training exercises with improvement tracking, reinforcement training, habit tracking, routine management. Local-first: all data stored in IndexedDB via Dexie.js, no server required. This document provides: tech stack with rationale, system architecture, data model, local storage patterns, dev setup, PWA config, testing strategy, MVP roadmap, and AI-friendly handoff.

**Tech Stack Summary:**

- **Framework:** Nuxt 4 (SSG/static)
- **UI:** Nuxt UI + Tailwind CSS 4
- **Storage:** Dexie.js (IndexedDB wrapper)
- **PWA:** Vite PWA plugin
- **Runtime:** Bun
- **Deployment:** Static hosting (Vercel, Netlify, GitHub Pages)

---

## 2) Goals & success metrics

**User Experience:**

- Quick protocol creation: < 2 minutes
- Track exercises/routines with ease
- See improvement over weeks/months
- Mobile-friendly (native app feel via PWA)

**Technical Goals:**

- Zero server required (fully local-first)
- Offline-first: full functionality without internet
- Type-safe client-side architecture
- Lighthouse score > 90
- Installable as PWA (iOS/Android/Desktop)
- Sync across tabs/windows in same browser

**Adoption Metrics:**

- GitHub stars: 500+ year 1
- Active forks/projects: 50+ in 6 months
- Community contributions: 5+ regular contributors

---

## 3) Differentiation

| Aspect        | Protocol                | Competitors                      |
| ------------- | ----------------------- | -------------------------------- |
| **Model**     | **Local-first PWA**     | Cloud SaaS (Fitbod, Hevy, etc)  |
| **Price**     | **Free**                | $10-30/month                     |
| **Data**      | **Your device only**    | Cloud servers (privacy concerns) |
| **Offline**   | **✓ Full support**      | Limited/requires internet        |
| **Stack**     | **Nuxt 4 + Dexie**      | React + various backends        |
| **License**   | **MIT**                 | Proprietary/SaaS                |

**Protocol's Unique Value:**

- **Privacy-first** — no server, data stays on user's device
- **Offline-ready** — works without internet
- **Zero cost** — free & open source
- **Fast** — instant load, no network latency
- **Community-driven** — transparent roadmap, accept contributions

---

## 4) Tech stack

**Why these choices?**

- **Nuxt 4**: Latest, great DX, SEO-friendly, massive ecosystem
- **Dexie.js**: Simple, powerful IndexedDB wrapper, type-safe
- **Nuxt UI**: Pre-built, accessible components
- **Tailwind CSS 4**: Modern styling, responsive out-of-the-box
- **Vite PWA**: Zero-config PWA setup
- **Bun**: Fastest runtime, all-in-one tooling

**Core Framework:**

- **Nuxt 4** — Modern Vue 3 framework (TypeScript, Composition API)
  - Static/SSG rendering for PWA
  - File-based routing, auto-imports
  - No server required (client-side only)
- **Tailwind CSS 4** — Utility-first, responsive-by-default styling
- **Nuxt UI** — Pre-built, accessible components
- **Vue 3 Composition API** — Reactive state, composables

**Client-Side Storage:**

- **Dexie.js** — Simple, typed IndexedDB wrapper
  - Type-safe schema definition
  - Easy migrations
  - Supports querying, filtering, sorting
- **IndexedDB** — Browser native storage (50MB+ available)
- **LocalStorage** — App preferences, settings

**PWA & Offline:**

- **Vite PWA** — Service worker, manifest, offline support
- **Offline-first** — Works completely without internet
- **Installable** — Native app feel on iOS/Android/Desktop
- **Cross-tab sync** — Broadcast Channel API for sync across windows

**Dev Tools:**

- **Bun** — Runtime, package manager, bundler
- **Vitest** — Unit testing (ESM-native, fast)
- **Playwright** — E2E testing
- **ESLint + Prettier** — Code quality
- **GitHub Actions** — CI/CD

**IDE & AI Assistant Setup:**

- **VSCode** — Settings, extensions pre-configured
- **Cursor/Claude/Copilot** — AI assistant rules included

---

## 5) System architecture

**Architecture:** Client-side only PWA, no backend required

```
┌─────────────────────────────────────────────────┐
│  User Device (Web/iOS/Android App)              │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  Nuxt 4 PWA (Static Deployment)                 │
│  ┌──────────────────────────────────────────┐   │
│  │ Pages & Components (Vue 3)               │   │
│  │ • Protocol creation, tracking, analytics │   │
│  │ • Routines management UI                 │   │
│  │ • Exercise logging                       │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ Client-Side State (Composables)          │   │
│  │ • Reactive state management              │   │
│  │ • Computed properties, watchers          │   │
│  └──────────────────────────────────────────┘   │
└────────────┬──────────────────────────────┬─────┘
             │                              │
    ┌────────▼──────────┐        ┌─────────▼────────┐
    │ IndexedDB (Dexie) │        │ Service Worker   │
    │ • Protocols       │        │ • Offline cache  │
    │ • Routines        │        │ • Background sync│
    │ • Exercises       │        │ • Push notifs    │
    │ • Tracking logs   │        └──────────────────┘
    │ • Settings        │
    └───────────────────┘
```

**Core Components:**

- **Pages:** Nuxt file-based routing for all views
- **Components:** Reusable Vue 3 components (Composition API)
- **Composables:** Shared logic (protocol management, tracking, analytics)
- **Storage:** Dexie.js for structured, typed local data
- **PWA:** Service worker for offline + installable experience
- **UI:** Nuxt UI + Tailwind for consistent design
- **Routing:** Full client-side navigation (no server redirects)

**Why Local-First:**

- Zero server complexity
- User privacy (data never leaves device)
- Instant load times (no network latency)
- Works offline (service worker caching)
- Easy deployment (static hosting)

---

## 6) Data model (core entities)

All stored in IndexedDB via Dexie.js:

- **Protocol**: id, name, description, category, created_at, updated_at
  - Duration: daily, weekly, monthly, yearly
  - Status: active, paused, completed
  - Target metric (e.g., "increase range of motion 20%")

- **Routine**: id, protocol_id, name, order, notes
  - Frequency: daily, weekly, specific days
  - Time of day: morning, afternoon, evening
  - Duration in minutes

- **Exercise**: id, routine_id, name, sets, reps, weight, notes
  - Intensity level (1-10)
  - Equipment type
  - Video URL (optional)

- **TrackingLog**: id, exercise_id, date, completed, sets_done, reps_done, weight_used, notes, difficulty_felt
  - Duration taken
  - Energy level (1-10)
  - Pain/discomfort level (1-10)

- **Analytics**: id, protocol_id, metric_name, values[]
  - Tracks progress over time
  - Completion rate
  - Improvement metrics

- **Settings**: userId, theme, notifications_enabled, rest_day_schedule

Dexie schema definition in `shared/db/schema.ts`

---

## 7) Data operations (client-side)

No server APIs. All operations use Dexie.js composables:

**Protocol Management:**
- `createProtocol(name, description, duration)` → Protocol
- `updateProtocol(id, updates)` → Protocol
- `deleteProtocol(id)` → void
- `getProtocol(id)` → Protocol
- `listProtocols()` → Protocol[]

**Routine Management:**
- `addRoutine(protocolId, name)` → Routine
- `updateRoutine(id, updates)` → Routine
- `deleteRoutine(id)` → void
- `reorderRoutines(protocolId, order[])` → void

**Tracking:**
- `logExercise(exerciseId, date, completion)` → TrackingLog
- `getProgressForExercise(exerciseId, days)` → TrackingLog[]
- `calculateMetrics(protocolId, timeRange)` → Metrics

**Analytics:**
- `getCompletionRate(protocolId, days)` → percentage
- `getImprovement(exerciseId, metric)` → delta
- `exportData()` → JSON

All operations stored in IndexedDB, available offline.

---

## 8) Dev environment & setup

**Bootstrap:**
```bash
git clone https://github.com/alois/protocol
cd protocol
bun install
bun run dev
# Opens http://localhost:3000
```

**No server setup needed** — No Docker, Postgres, or external services.

**Repository layout:**

```
/ (root)
  /app
    /pages         # Route pages (protocols, routines, tracking)
    /components    # Vue components (ProtocolCard, ExerciseLog, etc)
    /composables   # Shared logic (useProtocols, useTracking, etc)
    /layouts       # Page layouts (default, mobile)
  /shared
    /db            # Dexie schema (schema.ts, migrations.ts)
    /schemas       # Zod validation schemas
    /utils         # Helpers (date, calc, export)
  /public          # Static assets
  /.vscode         # VSCode config
  /.github         # CI/CD workflows
  .cursorrules     # Cursor AI rules
  nuxt.config.ts
  dexie.config.ts
  package.json
```

**Key directories:**

- `/app/pages` — File-based routing (index, protocols/, tracking/)
- `/app/composables` — Logic composition (useProtocols, useTracking)
- `/shared/db` — Dexie schema & queries
- `/shared/schemas` — Zod validation

---

## 9) IDE & developer environment

**VSCode (`.vscode/` included):**

- `settings.json` — Format on save, ESLint, Prettier
- `extensions.json` — Recommended:
  - Vue - Official (Vue Language Features)
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - Error Lens
  - GitLens
- `launch.json` — Debug Nuxt
- `snippets/` — Vue 3, Nuxt, TypeScript snippets

**AI Coding Assistants:**

- `.cursorrules` — Cursor AI rules (patterns, conventions)
- `.claude/` — Claude Code rules (CLAUDE.md in each dir)

**Pre-commit Hooks:**

- Husky + lint-staged
- Auto-format on commit
- Type checking before push
- Conventional commits

**No Docker/Postgres setup needed** — Pure client-side dev

---

## 10) CLI & setup

**No special CLI** — Standard Nuxt/Node setup:

```bash
# Clone and start
git clone https://github.com/alois/protocol
cd protocol
bun install
bun run dev

# Build for production
bun run build

# Deploy anywhere (static hosting)
bun run build && deploy dist/
```

**No scaffolding needed** — App is ready to fork/clone directly.

**For contribution:**

```bash
# Install with husky hooks
bun install

# Run tests
bun run test

# Build for deployment
bun run build
```

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
