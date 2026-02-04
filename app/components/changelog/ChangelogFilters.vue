<script setup lang="ts">
import { changeTypes } from '~/composables/changelog/useChangelog';

interface Props {
  selectedType: string;
  totalCount: number;
  countByType: (type: string) => number;
}

defineProps<Props>();

defineEmits<Emits>();

interface Emits {
  (e: 'filter', type: string): void;
}
</script>

<template>
  <div class="mb-8">
    <div class="mb-4 flex items-center gap-3">
      <UIcon
        name="i-lucide-filter"
        class="text-neutral-400"
      />
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
        Filter by type
      </h2>
    </div>

    <div class="flex flex-wrap gap-2">
      <UBadge
        variant="subtle"
        :color="!selectedType ? 'primary' : 'neutral'"
        class="cursor-pointer"
        @click="$emit('filter', '')"
      >
        All ({{ totalCount }})
      </UBadge>
      <UBadge
        v-for="type in changeTypes"
        :key="type.value"
        variant="subtle"
        :color="selectedType === type.value ? 'primary' : 'neutral'"
        class="cursor-pointer"
        @click="$emit('filter', type.value)"
      >
        <UIcon
          :name="type.icon"
          class="mr-1 size-3"
        />
        {{ type.label }} ({{ countByType(type.value) }})
      </UBadge>
    </div>
  </div>
</template>
