<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const slug = route.params.slug as string;
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-3xl font-bold">
        Organization Settings
      </h1>
    </template>

    <div class="space-y-6">
      <p class="text-neutral-600 dark:text-neutral-400">
        Settings for {{ slug }}
      </p>
    </div>
  </UCard>
</template>
