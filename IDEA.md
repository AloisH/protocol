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

| Aspect      | Protocol             | Competitors                      |
| ----------- | -------------------- | -------------------------------- |
| **Model**   | **Local-first PWA**  | Cloud SaaS (Fitbod, Hevy, etc)   |
| **Price**   | **Free**             | $10-30/month                     |
| **Data**    | **Your device only** | Cloud servers (privacy concerns) |
| **Offline** | **✓ Full support**   | Limited/requires internet        |
| **Stack**   | **Nuxt 4 + Dexie**   | React + various backends         |
| **License** | **MIT**              | Proprietary/SaaS                 |

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

## 11) CI/CD & Deployment

**GitHub Actions workflows** (`.github/workflows/`):

- `ci.yml` — Lint, typecheck, unit tests on PRs
- `e2e.yml` — Playwright tests on main
- `deploy.yml` — Auto-deploy to Vercel on merge to main
- `security.yml` — Dependency scanning (Dependabot)

**Deployment (static hosting):**

- **Vercel** (recommended) — One-click from git repo
- **Netlify** — Similar one-click setup
- **GitHub Pages** — Free, GitHub-native
- **Any static host** — Just serve dist/ folder

No server infrastructure needed.

---

## 12) Data export & backup

- **Export:** JSON format for all protocols, routines, tracking logs
- **Import:** Restore from exported JSON
- **Backup:** Browser auto-backs up IndexedDB (user can export manually)
- **No sync** — Data stays local to device (optional: user can implement cloud sync via external service)

---

## 13) Security & Privacy

- **No server** — No data transmission, user privacy guaranteed
- **No tracking** — No analytics, ads, or external requests
- **Offline-first** — Works completely offline, no internet needed
- **Input validation** — Zod schemas validate all user input
- **CSP headers** — Strong Content Security Policy
- **Dependency scanning** — Dependabot for vulnerability checks

---

## 14) Error Handling & Debugging

**Error handling:**

- Try-catch with user-friendly messages
- Console logging in development
- Graceful degradation (no server errors possible)

**Debugging:**

- Vue DevTools for component inspection
- Dexie DevTools for IndexedDB inspection
- Browser DevTools for network/storage

**Analytics (optional):**

- No tracking by default (privacy-first)
- Optional: add Plausible (cookieless) if desired
- No external data transmission

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

## 16) Example protocols & use cases

App includes example protocols demonstrating features:

1. **Neck Training** — Exercise routine with sets/reps tracking, weekly schedule, improvement chart
2. **Running Program** — Weekly mileage goals, pace tracking, monthly progress
3. **Meditation Habit** — Daily tracking, streak counter, mood correlation
4. **Strength Training** — Exercise library, weight progression, body measurements
5. **Yoga Routine** — Daily poses, flexibility tracking, hold time improvements

Each includes:

- Complete routine setup
- Exercise library (with variations)
- Tracking interface
- Progress analytics/charts
- Export functionality

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

## 19) Roadmap (60-day MVP)

**Month 1: Core Features**

- [ ] Nuxt 4 + Dexie.js setup
- [ ] Protocol CRUD (create, edit, delete, list)
- [ ] Routine management (add, reorder, daily/weekly scheduling)
- [ ] Exercise library with sets/reps/weight tracking
- [ ] Basic tracking interface (checkbox logging)
- [ ] Nuxt UI component library integration
- [ ] VSCode + IDE configs
- [ ] GitHub Actions CI
- [ ] Unit tests (Vitest)

**Month 2: Analytics & UX**

- [ ] Progress tracking & charts (improvement metrics)
- [ ] Completion rate dashboard
- [ ] Streak counter & badges
- [ ] Data export (JSON)
- [ ] PWA setup (service worker, installable)
- [ ] Mobile-optimized UI
- [ ] E2E tests (Playwright)
- [ ] Example protocols (Neck Training, Running, Meditation)
- [ ] Documentation site
- [ ] Deploy to Vercel/Netlify

---

## 20) AI agent handoff (machine-actionable)

**For AI agents building Protocol:**

1. **Bootstrap command:**

   ```bash
   git clone https://github.com/alois/protocol
   cd protocol
   bun install
   bun run dev
   # Visit http://localhost:3000
   ```

2. **Key Files:**
   - `CLAUDE.md` (root) — Project rules & patterns
   - `.agent/README.md` — System documentation index
   - `nuxt.config.ts` — Nuxt & PWA config
   - `shared/db/schema.ts` — Dexie database schema

3. **Architecture:**
   - `/app/pages` — File-based routing
   - `/app/composables` — Business logic (useProtocols, useTracking)
   - `/shared/db` — Database operations
   - `/shared/schemas` — Zod validation

4. **Development:**
   - No server setup needed
   - No Docker required
   - No .env needed (client-only)
   - Edit, save, refresh (HMR included)

5. **Testing:**
   - Unit tests: `bun run test` (Vitest)
   - E2E tests: `bun run test:integration` (Playwright)
   - Linting: `bun run lint` (ESLint)
   - Type check: `bun run typecheck`

**AI workflow:**

- Read CLAUDE.md for rules & patterns
- Check `.agent/` for system documentation
- Use composables pattern for shared logic
- Store in Dexie (see schema.ts)
- Test before committing
- Use conventional commits

---

## 21) Security & Privacy

**Privacy guarantees:**

- No data transmission (local-only storage)
- No user tracking
- No analytics (by default)
- No third-party requests
- No user authentication needed
- GDPR compliant (no central data store)
- Fully offline-capable

**Data safety:**

- IndexedDB data encrypted by browser
- No sensitive data in localStorage
- Export/backup functionality for user data
- No auto-deletion of old protocols

---

## 22) Community & Support

**Getting help:**

- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** Q&A, ideas, show & tell
- **GitHub README:** Usage examples

**Ways to contribute:**

- Code contributions (features, bug fixes)
- Documentation improvements
- Example protocols (templates)
- Translations (i18n)
- Bug reports & testing
- UI/UX improvements

**Recognition:**

- All contributors listed in README
- Contributors acknowledged in releases

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

- ✅ License: MIT (free & open source)
- ✅ Framework: Nuxt 4 (static/SSG)
- ✅ UI: Nuxt UI + Tailwind 4
- ✅ Storage: Dexie.js (IndexedDB wrapper)
- ✅ Architecture: Client-side only (no server)
- ✅ PWA: Vite PWA plugin (offline + installable)
- ✅ Runtime: Bun
- ✅ Deployment: Static hosting (Vercel, Netlify, etc)
- ✅ Monetization: Free forever (GitHub Sponsors optional)
- ✅ Structure: Single Nuxt app (no monorepo)
- ✅ Auth: None (local device only)
- ✅ Database: IndexedDB via Dexie (no server DB)

**Next steps:**

1. Create Protocol documentation structure
2. Build example protocols
3. Implement progress tracking/analytics
4. Add PWA features
5. Deploy to production
