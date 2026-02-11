# Project Architecture

**Related docs:** [Storage Schema](./storage_schema.md), [Feature Systems](./protocols_system.md)

---

## Project Goal

Protocol — Free MIT-licensed local-first PWA for personal routine tracking. Set up and monitor daily, weekly, monthly, or yearly protocols with activities (exercises, supplements, warmups, habits).

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Nuxt 4 (Vue 3) | SSR, file-based routing, auto-imports |
| UI | Nuxt UI v4 | Component library (Reka UI-based) |
| Styling | Tailwind 4 | Utility-first CSS |
| Storage | Dexie.js (IndexedDB) | Client-side database |
| Validation | Zod | Schema validation |
| Charts | Chart.js + vue-chartjs | Analytics visualization |
| Drag & Drop | vue-draggable-plus | Activity reordering |
| IDs | nanoid | Unique ID generation |
| Icons | @iconify-json/lucide | Icon set |
| Runtime | Bun | Package manager + runtime |
| Testing | Vitest + happy-dom | Unit tests |
| E2E | Playwright | End-to-end tests |
| Linting | ESLint (@antfu config) | Code quality |
| Security | nuxt-security | CSP, HSTS, XFrame |

---

## Project Structure

```
app/
├── app.vue                    # Root (PWA install, JSON-LD, OG)
├── app.config.ts              # Theme: primary=green, neutral=slate
├── pages/
│   ├── index.vue              # / — Today's dashboard (daily progress)
│   ├── protocols/index.vue    # /protocols — Protocol list + CRUD
│   ├── execute/[protocolId].vue # /execute/:id — Session execution mode
│   ├── analytics.vue          # /analytics — Charts, metrics, calendar
│   ├── settings.vue           # /settings — Export/import, notifications
│   └── legal/                 # Privacy policy, terms
├── components/
│   ├── activities/            # ActivityCard, ActivityForm, ActivityList, groups
│   ├── analytics/             # CompletionChart, CompletionCalendar, MetricCard
│   ├── protocols/             # ProtocolCard, ProtocolForm, DeleteDialog
│   ├── session/               # SessionModal, SessionActivityItem, SessionRating
│   ├── settings/              # ExportSection, ImportSection, NotificationsSection
│   ├── shared/                # AppHeader, AppFooter, AppLogo, ErrorBoundary
│   ├── dashboard/             # DashboardShortcutsHelp
│   ├── blog/                  # BlogPostAuthor, BlogPostGrid (placeholder)
│   └── content/               # Alert
├── composables/               # Auto-imported (see Composables section)
├── layouts/default.vue        # Sticky header + footer + main content
├── middleware/                 # Route guards (currently unused)
├── plugins/
│   └── notifications.client.ts # Scheduled reminder notifications
├── utils/
│   └── error.ts               # getErrorMessage() helper
└── assets/css/main.css        # Global styles

shared/
├── db/
│   └── schema.ts              # Dexie DB definition + TypeScript interfaces
└── schemas/
    ├── db.ts                  # Zod schemas for all entities
    ├── protocols.ts           # ProtocolFormSchema (create/edit)
    ├── activities.ts          # ActivityFormSchema (discriminated union)
    └── export.ts              # ExportDataSchema (backup/restore)

public/
├── manifest.json              # PWA manifest
├── icon-192x192.png
└── icon-512x512.png
```

---

## Architecture Patterns

### Local-First Design

- **No backend**: All data stored client-side in IndexedDB via Dexie.js
- **No API calls**: Network tab should be empty (except static assets)
- **SSR guard**: All DB access wrapped with `if (import.meta.server) return`
- **PWA ready**: Manifest configured, service worker TODO (@vite-pwa/nuxt commented out)

### Auto-Imports

- Components in `app/components/` — no import needed, `pathPrefix: false`
- Composables in `app/composables/` + `app/composables/**` — nested auto-import
- Nuxt utils: `useRoute()`, `useState()`, `navigateTo()`, `computed()`, `ref()`, etc.
- `#shared` alias → `./shared` for schema imports

### State Management

- **`useState()`**: SSR-safe shared state (useDaily, useSettings)
- **`ref()`**: Client-only state (useSession, useProtocols)
- **`computed()`**: Derived values
- **`readonly()`**: All composable state exports wrapped for immutability
- No Pinia/Vuex — composables are the state layer

### Composables

| Composable | State | Purpose |
|-----------|-------|---------|
| useProtocols | ref | Protocol CRUD (create, update, delete, archive, pause, resume) |
| useActivities | ref | Activity CRUD + reorder + group management |
| useActivityGroups | ref | Activity group CRUD + reorder |
| useSession | ref | Session execution state machine (init, toggle, save) |
| useDaily | useState | Today's protocols, completions, streaks, progress |
| useTracking | ref | TrackingLog queries |
| useAnalytics | ref | Calendar data, completion trends, protocol stats |
| useSettings | useState | App settings CRUD |
| useTimer | ref | Timer state machine (start/pause/resume/reset) |
| useBeep | — | Audio feedback (playBeep) |
| useNotifications | — | Web Notifications API |
| useIndexedDB | — | Export/import/clear data |
| useKeyboardShortcuts | — | Keyboard shortcut definitions |
| useSeo | — | SEO meta helper |

### Validation

- **Form input**: `ProtocolFormSchema`, `ActivityFormSchema` (Zod)
- **DB entities**: `ProtocolSchema`, `ActivitySchema`, etc. (Zod)
- **Export/Import**: `ExportDataSchema` validates full backup
- **No `as` assertions**: Always use Zod parsing

---

## Key Configuration

### nuxt.config.ts Highlights

- Modules: `@nuxt/ui`, `@nuxt/image`, `nuxt-security`, `@nuxtjs/sitemap`, `nuxt-og-image`
- PWA: `@vite-pwa/nuxt` commented out (TODO: fix service worker path)
- Vite: `fs.allow: [__dirname]`, `strict: false` (Bun compat)
- TypeScript: `strictNullChecks: true`
- Security: CSP with nonce, XFrame DENY, HSTS in prod
- Prerendering: disabled (fully client-side PWA)

### PWA Manifest

- Name: "Protocol"
- Display: standalone
- Theme: `#10b981` (emerald)
- Categories: productivity, utilities

---

## Key Gotchas

1. **SSR guard**: Always check `import.meta.server` before any Dexie call
2. **`useState()` vs `ref()`**: Use `useState()` for shared state that needs SSR safety
3. **Nuxt UI v4**: Uses `items` not `options` for USelect; UModal needs `#body`/`#footer` slots
4. **Component naming**: `pathPrefix: false` means `activities/ActivityCard.vue` → `<ActivityCard>` (not `<ActivitiesActivityCard>`)
5. **Zod v4**: Using `zod@^4.2.1` — some API differences from v3
6. **`#shared` alias**: Use `import { db } from '#shared/db/schema'` for DB access
7. **Readonly exports**: Composables export `readonly(ref)` — don't mutate externally
8. **Run from root**: All `bun run` commands must run from repo root

---

## Project Status

**Implemented:**

- Protocol CRUD with status (active/paused/completed)
- Activities: 4 types (warmup, exercise, supplement, habit)
- Activity groups with collapsible sections + drag-and-drop
- Multi-dose supplement support with per-dose tracking
- Custom day-of-week scheduling
- Session execution mode with timer, rest phases, summary
- Daily dashboard with progress ring, streaks
- Analytics: completion chart, calendar heatmap, protocol stats
- Data export/import with Zod validation
- Notification reminders (Web Notifications API)
- Settings management (theme, notifications, reminder schedule)
- Security headers (CSP, HSTS, XFrame)

**Not yet implemented:**

- PWA service worker (@vite-pwa/nuxt needs fix)
- Blog/content pages (components exist, no routes)

---

_Last updated: 2026-02-11_
