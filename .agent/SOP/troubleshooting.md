# Troubleshooting Guide

Common issues and fixes for Protocol development.

---

## IndexedDB / Dexie

### "Cannot open database" or schema errors

Clear IndexedDB and reload:
- DevTools → Application → IndexedDB → ProtocolDB → Delete database
- Reload page

### "Failed to execute 'transaction'" on SSR

Missing SSR guard. Add to composable:

```typescript
if (import.meta.server) return
```

### Data not loading on page

Ensure data fetch is in `onMounted()` (client-only lifecycle):

```typescript
onMounted(async () => {
  await loadData()
})
```

### Migration not running

Dexie migrations run once per browser per version. To re-test:
1. Delete database in DevTools
2. Reload page

---

## Nuxt UI v4

### USelect not showing options

Use `:items` not `:options`:
```vue
<!-- Correct -->
<USelect :items="options" v-model="selected" />

<!-- Wrong (v3 API) -->
<USelect :options="options" v-model="selected" />
```

### UModal content not rendering

Use named slots:
```vue
<UModal>
  <template #body>Content</template>
  <template #footer>Actions</template>
</UModal>
```

---

## Build & Types

### TypeScript errors after schema change

```bash
bun run typecheck
```

If persists: restart TypeScript server in editor.

### Build fails

Run full check sequence:

```bash
bun run lint
bun run typecheck
bun run test:run
bun run build
```

### Git hooks not running

```bash
bun run prepare  # Install simple-git-hooks
```

---

## Development

### Commands must run from repo root

```bash
cd /home/alois/protocol
bun run dev
```

### .nuxt restart loop

Vite watch config ignores .nuxt:
```typescript
// nuxt.config.ts
vite: { server: { watch: { ignored: ['**/.nuxt/**'] } } }
```

If loop persists: `rm -rf .nuxt && bun run dev`

### Drag-and-drop not working

Check `vue-draggable-plus` setup:
- Ensure `v-model` bound to reactive array
- Check `item-key` prop matches item ID field
- Verify `@update:modelValue` handler calls `persistOrder()`

---

## Quick Fixes

| Symptom | Fix |
|---------|-----|
| DB errors on server | Add `import.meta.server` guard |
| Stale data after mutation | Call `loadX()` after DB write |
| Component not found | Check `pathPrefix: false` in nuxt.config |
| USelect empty | Use `:items` not `:options` |
| Modal content missing | Use `#body`/`#footer` slots |
| Types wrong | `bun run typecheck` + restart TS server |
| Build fails | `rm -rf .nuxt && bun run build` |

---

_Last updated: 2026-02-11_
