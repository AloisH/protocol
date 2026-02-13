<script setup lang="ts">
// Header is rendered via AppHeader component
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-neutral-950 pb-[env(safe-area-inset-bottom)]">
    <!-- New Protocol header -->
    <AppHeader />

    <!-- Main content -->
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <!-- Brand section -->
          <div class="md:col-span-1">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg" />
              <span class="font-semibold text-neutral-900 dark:text-white">Protocol</span>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Personal routine tracking PWA
            </p>
          </div>

          <!-- Product links -->
          <div>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
              Product
            </p>
            <ul class="space-y-2">
              <li><a href="/" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400">Home</a></li>
              <li><a href="/protocols" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400">Protocols</a></li>
              <li><a href="/analytics" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400">Analytics</a></li>
            </ul>
          </div>

          <!-- Resources links -->
          <div>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
              Resources
            </p>
            <ul class="space-y-2">
              <li><a href="https://github.com/AloisH/protocol" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400">GitHub</a></li>
              <li><a href="/docs" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400">Documentation</a></li>
            </ul>
          </div>

          <!-- Legal links -->
          <div>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
              Legal
            </p>
            <ul class="space-y-2">
              <li><a href="/" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400">Privacy</a></li>
              <li><a href="/" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400">Terms</a></li>
            </ul>
          </div>
        </div>

        <!-- Footer divider and copyright -->
        <div class="border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <p class="text-sm text-center text-neutral-600 dark:text-neutral-400">
            &copy; {{ new Date().getFullYear() }} Protocol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Refined typography for serif branding */
.font-serif {
  font-family: 'Playfair Display', 'Georgia', serif;
}
</style>
