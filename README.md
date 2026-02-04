# Protocol

> **Personal routine tracking PWA**

Set up and track your daily, weekly, monthly, or yearly protocols locally. Monitor your progress over time with a fully offline-capable web app.

## What is Protocol?

Protocol is a personal routine tracker built with Nuxt 4 that runs entirely in your browser. Create protocols (recurring routines), add activities (warmups, exercises, supplements), log sessions, and track your progress over time—all without any backend or cloud storage.

**Features:**

- ✅ **Local-first** — All data stored in your browser (IndexedDB)
- ✅ **Offline-ready** — Works completely offline as a PWA
- ✅ **Simple setup** — No accounts, no logins, no backend
- ✅ **Track progress** — See improvement over time with charts
- ✅ **Flexible protocols** — Daily/weekly/monthly/yearly routines
- ✅ **Private** — Your data stays on your device

## Built With

- ⚡ **Nuxt 4** — Full-stack Vue framework
- 📦 **Dexie.js** — IndexedDB wrapper
- 🎨 **Nuxt UI + Tailwind** — Beautiful components
- 📱 **Vite PWA** — Progressive Web App support
- 📊 **Chart.js** — Progress visualization

## Quick Start

```bash
# Clone
git clone https://github.com/AloisH/protocol.git
cd protocol

# Install dependencies
bun install

# Start dev server
bun dev
```

Visit http://localhost:3000

## How It Works

1. **Create Protocol** — Set up a routine (name, frequency, days)
2. **Add Activities** — Warmups, exercises, supplements, habits
3. **Log Session** — Check off activities as you complete them
4. **Track Progress** — View completion rates and improvement trends

## Project Structure

```
protocol/
├── app/
│   ├── pages/          # Routes
│   ├── components/     # Vue components
│   ├── composables/    # Composable logic
│   └── layouts/        # Layout wrappers
├── server/             # API routes (if needed)
├── shared/             # Shared types/schemas
└── nuxt.config.ts
```

## Data Storage

All data stored locally in **IndexedDB**:

- **Protocols** — Routine definitions
- **Sessions** — Completed instances
- **Progress** — Metrics over time

Export/import functionality lets you backup and restore data.

## Commands

```bash
bun dev          # Start dev server
bun build        # Production build
bun test         # Run tests
bun lint         # Lint code
bun typecheck    # Type checking
```

## License

MIT © 2025 Protocol Contributors

---

**Local-first protocol tracking • No backend required • Fully offline-capable**
