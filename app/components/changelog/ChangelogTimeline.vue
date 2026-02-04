<script setup lang="ts">
import type { ChangelogEntry } from '~/composables/changelog/useChangelog';

interface Props {
  entries: ChangelogEntry[];
  getVersionColor: (type: string) => 'error' | 'primary' | 'neutral';
  getChangeIcon: (type: string) => string;
  getChangeColor: (type: string) => string;
}

defineProps<Props>();
</script>

<template>
  <UChangelogVersions v-if="entries.length">
    <UChangelogVersion
      v-for="entry in entries"
      :key="entry.path"
      :title="entry.title"
      :description="entry.description"
      :date="entry.date"
      :badge="{ label: entry.version, color: getVersionColor(entry.type) }"
      :to="entry.path"
    >
      <template #body>
        <div
          v-if="entry.changes?.length"
          class="mt-4 space-y-2"
        >
          <div
            v-for="(change, idx) in entry.changes"
            :key="idx"
            class="flex items-start gap-2 text-sm"
          >
            <UIcon
              :name="getChangeIcon(change.type)"
              :class="getChangeColor(change.type)"
              class="mt-0.5 size-4 shrink-0"
            />
            <span class="text-neutral-600 dark:text-neutral-400">
              {{ change.description }}
            </span>
          </div>
        </div>
      </template>
    </UChangelogVersion>
  </UChangelogVersions>

  <div
    v-else
    class="py-12 text-center"
  >
    <UIcon
      name="i-lucide-file-text"
      class="mx-auto mb-4 size-12 text-neutral-300 dark:text-neutral-600"
    />
    <p class="text-neutral-500">
      No changelog entries found.
    </p>
  </div>
</template>
