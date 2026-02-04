<script setup lang="ts">
interface Props {
  tags: { name: string; count: number }[];
  selectedTag: string;
  total: number;
}

defineProps<Props>();

const emit = defineEmits<Emits>();

interface Emits {
  (e: 'select', tag: string): void;
}
</script>

<template>
  <div class="mb-8">
    <div class="mb-4 flex items-center gap-3">
      <UIcon
        name="i-lucide-tag"
        class="text-neutral-400"
      />
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
        Filter by topic
      </h2>
    </div>

    <div class="flex flex-wrap gap-2">
      <UBadge
        variant="subtle"
        :color="!selectedTag ? 'primary' : 'neutral'"
        class="cursor-pointer"
        @click="emit('select', '')"
      >
        All ({{ total }})
      </UBadge>

      <UBadge
        v-for="tag in tags"
        :key="tag.name"
        variant="subtle"
        :color="selectedTag === tag.name ? 'primary' : 'neutral'"
        class="cursor-pointer"
        @click="emit('select', tag.name)"
      >
        {{ tag.name }} ({{ tag.count }})
      </UBadge>
    </div>
  </div>
</template>
