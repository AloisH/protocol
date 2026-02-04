<script setup lang="ts">
import type { CommandPaletteItem } from '@nuxt/ui';

const { query, results, isOpen, open, close } = useDocsSearch();

defineShortcuts({
  meta_k: open,
});

const groups = computed(() => {
  if (!results.value.length)
    return [];

  return [
    {
      id: 'docs',
      label: 'Documentation',
      items: results.value.map(r => ({
        id: r.path,
        label: r.title,
        description: r.content,
        to: r.path,
        onSelect: () => {
          navigateTo(r.path);
          close();
        },
      })),
    },
  ];
});

function handleSelect(item: CommandPaletteItem | undefined) {
  if (item?.to) {
    navigateTo(item.to as string);
    close();
  }
}
</script>

<template>
  <div>
    <UButton
      variant="ghost"
      icon="i-lucide-search"
      size="sm"
      block
      @click="open"
    >
      <span class="flex-1 text-left">Search</span>
      <UKbd>⌘K</UKbd>
    </UButton>

    <UModal v-model:open="isOpen">
      <template #content>
        <UCommandPalette
          v-model:search-term="query"
          :groups="groups"
          placeholder="Search docs..."
          close
          :empty-state="{
            icon: 'i-lucide-search',
            label: query ? 'No results' : 'Start typing to search',
          }"
          @update:open="isOpen = $event"
          @update:model-value="handleSelect"
        />
      </template>
    </UModal>
  </div>
</template>
