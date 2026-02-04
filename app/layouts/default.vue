<script setup lang="ts">
// Header is rendered via AppHeader component
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
    <!-- New Protocol header -->
    <AppHeader />

    <!-- Main content -->
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<style scoped>
/* Refined typography for serif branding */
.font-serif {
  font-family: 'Playfair Display', 'Georgia', serif;
}
</style>
