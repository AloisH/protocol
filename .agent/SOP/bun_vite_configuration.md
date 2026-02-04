# Bun + Vite Configuration

**Related docs:** project_architecture.md, adding_pages.md

---

## Overview

Bistro uses **Bun** as package manager/runtime with **Vite** (via Nuxt). Bun's flat node_modules structure (`.bun` directory) requires specific Vite configuration to prevent MIME type errors.

---

## Critical Configuration

### Vite FS Allow (nuxt.config.ts)

**REQUIRED for Bun compatibility:**

```typescript
// nuxt.config.ts
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  vite: {
    server: {
      fs: {
        allow: [__dirname], // Allow Bun's .bun directory
        strict: false, // Disable strict FS restrictions
      },
      headers: {
        'Cache-Control': 'no-store', // Prevent module caching
      },
    },
    optimizeDeps: {
      exclude: ['@prisma/client', '@prisma/adapter-pg'],
    },
  },
});
```

**Why needed:**

- Bun stores packages in `node_modules/.bun/{package}@{version}+{hash}/`
- Vite's default FS restrictions block `@fs` paths outside project root
- `allow: [__dirname]` permits access to entire project (includes `.bun`)
- `strict: false` removes additional MIME type checks

---

## Common Errors

### 1. MIME Type Blocked

**Error:**

```
Loading module from "http://localhost:3000/_nuxt/@fs/home/user/bistro/node_modules/.bun/vue@3.5.25+hash/..." was blocked because of a disallowed MIME type ("").
```

**Cause:** Vite blocking access to Bun's `.bun` directory

**Fix:** Add `fs.allow: [__dirname]` (see Critical Configuration)

---

### 2. Virtual Module Export Error

**Error:**

```
The requested module 'virtual:nuxt:.nuxt/nuxt.config.mjs' doesn't provide an export named: 'nuxtDefaultErrorValue'
```

**Cause:** Browser cached old Nuxt 3 modules while running Nuxt 4

**Fix:**

```bash
# 1. Clear all caches
rm -rf .nuxt node_modules bun.lock
bun pm cache rm

# 2. Fresh install
bun install
bun db:generate

# 3. Clear browser cache
# DevTools (F12) → Application → Storage → "Clear site data"

# 4. Restart dev server
bun dev
```

---

### 3. Dependency Version Conflicts

**Error:** Multiple Nuxt versions (3.x and 4.x) in `node_modules/.bun/`

**Cause:** `@nuxt/test-utils` pulling Nuxt 3 as peer dependency

**Fix:**

```bash
# Remove conflicting versions
rm -rf node_modules/.bun/nuxt@3*

# Or add package.json override:
{
  "overrides": {
    "nuxt": "^4.2.2"
  }
}
```

---

## Development Workflow

### Fresh Install

```bash
# 1. Remove existing
rm -rf node_modules bun.lock .nuxt

# 2. Install
bun install

# 3. Generate Prisma
bun db:generate

# 4. Start dev
bun dev
```

### After Dependency Update

```bash
# 1. Clear Nuxt cache
rm -rf .nuxt

# 2. Regenerate
bun db:generate

# 3. Restart
bun dev
```

### Clear All Caches

```bash
# Project caches
rm -rf .nuxt
rm -rf node_modules/.vite
rm -rf node_modules/.cache

# Bun global cache
bun pm cache rm

# Reinstall
bun install
```

---

## Nuxt Content Migration

### Old API (Deprecated)

```typescript
// ❌ OLD: serverQueryContent (deprecated)
import { serverQueryContent } from '#content/server';

const posts = await serverQueryContent(event, 'blog')
  .where('draft', { $ne: true })
  .sort({ date: -1 })
  .find();
```

### New API (Current)

```typescript
// ✅ NEW: queryCollection
import type { BlogCollectionItem } from '@nuxt/content';
import { queryCollection } from '@nuxt/content/nitro';

const allPosts = (await queryCollection(event, 'blog').all()) as BlogCollectionItem[];

// In-memory filtering (no chaining)
const posts = allPosts.filter((post: BlogCollectionItem) => !post.draft);
```

**Key differences:**

- Import from `@nuxt/content/nitro` (not `#content/server`)
- `.all()` returns all items, filter in-memory
- Cast to collection type for TypeScript
- Access `post.path` (not `post._path`)
- `post.body` is MarkdownRoot object (not string)

---

## Browser Cache Issues

### Symptoms

- Dev server starts successfully
- Browser shows module loading errors
- Hard refresh doesn't help

### Solution

**Clear browser storage:**

1. Open DevTools (F12)
2. Application tab → Storage
3. "Clear site data" button
4. Hard refresh: Ctrl+Shift+R (Linux/Windows) or Cmd+Shift+R (Mac)

**Or use Incognito/Private window** to test without cache.

---

## Troubleshooting Checklist

**Module loading errors:**

- [ ] Check `vite.server.fs.allow` includes `__dirname`
- [ ] Check `vite.server.fs.strict: false` set
- [ ] Clear `.nuxt`, `.vite`, `.cache` directories
- [ ] Clear browser cache/storage
- [ ] Try Incognito window

**Version conflicts:**

- [ ] Check for multiple Nuxt versions: `find node_modules/.bun -name "*nuxt@*"`
- [ ] Remove old versions: `rm -rf node_modules/.bun/nuxt@3*`
- [ ] Clear Bun cache: `bun pm cache rm`
- [ ] Fresh install: `rm -rf node_modules bun.lock && bun install`

**Prisma errors:**

- [ ] Regenerate: `bun db:generate`
- [ ] Check DATABASE_URL in `.env`
- [ ] Check Docker running: `docker compose ps`

---

## Configuration Reference

### Complete nuxt.config.ts

```typescript
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/content', '@nuxt/ui'],

  nitro: {
    rollupConfig: {
      plugins: [vue()],
      external: [/^@prisma\//, /\.wasm$/],
    },
    experimental: {
      wasm: true,
    },
    prerender: {
      routes: ['/rss.xml'],
    },
  },

  vite: {
    server: {
      fs: {
        allow: [__dirname], // Bun .bun directory access
        strict: false, // Disable strict FS checks
      },
      headers: {
        'Cache-Control': 'no-store', // Prevent module caching
      },
    },
    optimizeDeps: {
      exclude: ['@prisma/client', '@prisma/adapter-pg'],
    },
    resolve: {
      alias: {
        '.prisma/client/index-browser': './node_modules/@prisma/client/index-browser.js',
      },
    },
  },
});
```

---

## Related Issues

**GitHub references:**

- [Vite FS Allow Issues](https://github.com/vitejs/vite/issues/5689)
- [Bun + Vite Guide](https://bun.com/docs/guides/ecosystem/vite)
- [Nuxt Content queryCollection](https://content.nuxt.com)

---

_Last updated: 2026-01-24_
