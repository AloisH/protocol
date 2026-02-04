<script setup lang="ts">
useSeoMeta({
  title: 'Dashboard - Protocol',
  description: 'Track your protocols and monitor daily, weekly, monthly, or yearly routines locally.',
});

onMounted(() => {
  navigateTo('/protocols');
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <p class="text-gray-600">
        Loading protocols...
      </p>
    </div>
  </div>
</template>
