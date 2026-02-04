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
        Organization Members
      </h1>
    </template>

    <div class="space-y-6">
      <OrganizationMembers :organization-slug="slug" />
    </div>
  </UCard>
</template>
