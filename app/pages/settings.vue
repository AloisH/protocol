<script setup lang="ts">
useSeoMeta({
  title: 'Settings - Protocol',
  description: 'Manage app settings and data backup',
});
</script>

<template>
  <UContainer class="py-8">
    <div class="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 class="text-3xl font-bold">
          Settings
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your data and preferences
        </p>
      </div>

      <section>
        <h2 class="text-xl font-semibold mb-4">
          Data Backup
        </h2>
        <div class="space-y-4">
          <ExportSection />
          <ImportSection />
        </div>
      </section>
    </div>
  </UContainer>
</template>
