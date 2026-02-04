# Shared Components

Reusable UI components used across the app.

## Components

- `AppLogo.vue` - Application logo with optional link to home
  - Props: `to?: string` (default: '/')
  - Displays "Bistro" text with gradient styling
  - Responsive sizing
  - Includes test file: `AppLogo.test.ts`

## Dependencies

- Nuxt UI: ULink component
- Auto-imported (no import needed)

## Usage

```vue
<template>
  <!-- Default (links to /) -->
  <AppLogo />

  <!-- Custom link -->
  <AppLogo to="/dashboard" />

  <!-- In header -->
  <UHeader>
    <template #left>
      <AppLogo />
    </template>
  </UHeader>
</template>
```

**Styling:** Uses Tailwind gradient classes, responsive text sizing

**Testing:** See `AppLogo.test.ts` for Vitest + @nuxt/test-utils pattern

See: [app/CLAUDE.md](../../CLAUDE.md) for component patterns
