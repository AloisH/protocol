# Shared Components

Reusable UI components used across the app (shared utilities, not feature-specific).

## Components

- `AppHeader.vue` - Production-grade Protocol header with distinctive design
  - Geometric accent logo (gradient emerald/teal square)
  - Serif branding (Playfair Display font)
  - Navigation: Protocols, Tracking, Analytics with active states
  - Mobile-responsive menu with smooth transitions
  - Color mode toggle
  - Settings icon with link to `/settings`
  - Dark mode support with backdrop blur effect
  - Includes test file: `AppHeader.test.ts`
  - **Design**: Minimalist geometric aesthetic with refined typography

- `AppLogo.vue` - Application logo with optional link to home
  - Props: `to?: string` (default: '/')
  - Displays "Protocol" text
  - Responsive sizing
  - Includes test file: `AppLogo.test.ts`

## Dependencies

- Nuxt UI: ULink, UButton, UColorModeButton
- Auto-imported (no import needed)

## Usage

### AppHeader

Auto-rendered in `layouts/default.vue`:

```vue
<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
```

**Features:**

- Desktop navigation with icons (Protocols, Tracking, Analytics)
- Mobile hamburger menu with smooth slide-down animation
- Active link styling with gradient indicator
- Color mode button (light/dark toggle)
- Settings button links to `/settings`
- Sticky positioning with backdrop blur
- Border bottom (neutral 200/800 light/dark)

**Routing:**

- Links auto-update active state based on current `route.path`
- Mobile menu closes automatically on route change
- No additional props needed

### AppLogo

```vue
<template>
  <!-- Default (links to /) -->
  <AppLogo />

  <!-- Custom link -->
  <AppLogo to="/protocols" />
</template>
```

## Styling & Design

**Color scheme:**

- Primary: Emerald #10b981 (gradient to teal #14b8a6)
- Accent: Protocol green with hover states
- Neutral: Gray 700/300 (light/dark)

**Typography:**

- Logo: Serif (Playfair Display 600-800 weight)
- Navigation: Sans-serif (Public Sans) medium
- Responsive sizing: `text-lg` → `text-sm`

**Dark mode:**

- Automatic via `UColorModeButton`
- Uses `dark:` Tailwind prefix
- Transparent backgrounds with backdrop blur

**Testing:** See `AppHeader.test.ts` for Vitest + @nuxt/test-utils pattern

See: [app/CLAUDE.md](../../CLAUDE.md) for component patterns
