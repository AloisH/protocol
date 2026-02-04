# Docs Features

Documentation search and navigation components.

## Components

- `DocsSearch.vue` - Search interface for documentation
  - Searchable doc navigation
  - Keyboard shortcuts support

## Composables

- `composables/docs/useDocsSearch.ts` - Search functionality
  - Search state management
  - Query handling
  - Result filtering

- `composables/docs/useDocsNavigation.ts` - Navigation state
  - Active page tracking
  - Sidebar state
  - Breadcrumb generation

## Dependencies

- Composables: Auto-imported
- Nuxt UI: UInput, UButton components

## Usage

```vue
<script setup lang="ts">
const { query, results, search } = useDocsSearch();
const { currentPage, breadcrumbs } = useDocsNavigation();

// Search docs
await search('authentication');

// Navigate
navigateTo(results.value[0].path);
</script>

<template>
  <DocsSearch />

  <!-- Custom search -->
  <UInput v-model="query" placeholder="Search docs..." @input="search" />
</template>
```

**Features:**

- Real-time search
- Keyboard navigation
- Auto-imported composables

See: [app/CLAUDE.md](../../CLAUDE.md) for composables pattern
