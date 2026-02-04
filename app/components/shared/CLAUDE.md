# Shared Components

Reusable UI components used across the app (shared utilities, not feature-specific).

## Components

- `AppHeader.vue` - Header with logo and navigation
  - Auto-renders app branding
  - Navigation links (Home, Protocols, Tracking, Analytics)
  - Color mode toggle
  - Responsive mobile menu

- `AppLogo.vue` - Application logo with optional link to home
  - Props: `to?: string` (default: '/')
  - Displays "Protocol" text
  - Responsive sizing
  - Includes test file: `AppLogo.test.ts`

## Dependencies

- Nuxt UI: ULink, UButton, UColorModeButton
- Auto-imported (no import needed)

## Usage

```vue
<template>
  <!-- Default (links to /) -->
  <AppLogo />

  <!-- Custom link -->
  <AppLogo to="/protocols" />

  <!-- In header -->
  <AppHeader />
      <AppLogo />
    </template>
  </UHeader>
</template>
```

**Styling:** Uses Tailwind gradient classes, responsive text sizing

**Testing:** See `AppLogo.test.ts` for Vitest + @nuxt/test-utils pattern

See: [app/CLAUDE.md](../../CLAUDE.md) for component patterns
