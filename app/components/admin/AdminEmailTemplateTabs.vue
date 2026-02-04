<script setup lang="ts">
import type { EmailTemplate } from '~/composables/admin/useEmailTemplates';

interface Props {
  templates: EmailTemplate[];
  selectedId: string;
}

defineProps<Props>();

defineEmits<Emits>();

interface Emits {
  (e: 'select', id: string): void;
}
</script>

<template>
  <div class="border-default border-b">
    <nav class="-mb-px flex gap-4">
      <button
        v-for="template in templates"
        :key="template.id"
        class="border-b-2 px-1 py-3 text-sm font-medium transition-colors" :class="[
          selectedId === template.id
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200',
        ]"
        @click="$emit('select', template.id)"
      >
        {{ template.name }}
      </button>
    </nav>
  </div>
</template>
