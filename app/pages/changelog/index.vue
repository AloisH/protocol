<script setup lang="ts">
const {
  selectedType,
  entries,
  allEntries,
  filterByType,
  countByType,
  getVersionColor,
  getChangeIcon,
  getChangeColor,
} = useChangelog();

useSeo({
  title: 'Changelog',
  description: 'Track new features, improvements, and bug fixes in Bistro.',
});
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero Section -->
    <div
      class="from-primary-500/10 via-primary-600/5 dark:from-primary-400/10 dark:via-primary-500/5 relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br to-transparent p-12"
    >
      <div class="bg-primary-500/20 absolute top-0 right-0 -z-10 h-96 w-96 rounded-full blur-3xl" />
      <div class="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />

      <div class="max-w-3xl">
        <h1
          class="mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-5xl font-bold text-transparent dark:from-white dark:to-gray-400"
        >
          Changelog
        </h1>
        <p class="text-xl text-neutral-600 dark:text-neutral-400">
          Track new features, improvements, and bug fixes in Bistro.
        </p>
      </div>
    </div>

    <ChangelogFilters
      :selected-type="selectedType"
      :total-count="allEntries.length"
      :count-by-type="countByType"
      @filter="filterByType"
    />

    <ChangelogTimeline
      :entries="entries"
      :get-version-color="getVersionColor"
      :get-change-icon="getChangeIcon"
      :get-change-color="getChangeColor"
    />
  </div>
</template>
