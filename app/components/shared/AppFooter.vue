<script setup lang="ts">
const currentYear = new Date().getFullYear();
const appVersion = '0.1.0';

const links = [
  { label: 'Privacy', to: '/legal/privacy' },
  { label: 'Terms', to: '/legal/terms' },
  { label: 'About', to: '/about' },
];

const externalLinks = [
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    href: 'https://github.com/AloisH/protocol',
  },
];
</script>

<template>
  <footer class="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 transition-colors">
    <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <!-- Main footer content -->
      <div class="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-3 md:items-start">
        <!-- Branding & tagline -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="flex items-center justify-center rounded-lg bg-emerald-500 p-2 dark:bg-emerald-600">
              <UIcon name="i-lucide-leaf" class="size-5 text-white" />
            </div>
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
              Protocol
            </h3>
          </div>
          <p class="max-w-xs text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            Local-first routine tracking. No sync. No cloud. Just your data, local.
          </p>
        </div>

        <!-- Navigation links -->
        <nav class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Resources
          </p>
          <ul class="space-y-2">
            <li v-for="link in links" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-sm text-neutral-700 dark:text-neutral-300 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- External links & theme toggle -->
        <div class="space-y-4 sm:text-right md:text-right">
          <div class="flex gap-2 sm:justify-end md:justify-end">
            <UButton
              v-for="link in externalLinks"
              :key="link.label"
              :to="link.href"
              target="_blank"
              rel="noopener noreferrer"
              :icon="link.icon"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="link.label"
              class="hover:text-emerald-600 dark:hover:text-emerald-400"
            />
            <UColorModeButton color="neutral" variant="ghost" size="sm" />
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="my-8 h-px bg-neutral-200 dark:bg-neutral-800" />

      <!-- Bottom footer -->
      <div class="flex flex-col items-center justify-between gap-4 text-xs text-neutral-600 dark:text-neutral-400 sm:flex-row">
        <p>
          &copy; {{ currentYear }} Protocol. Licensed under MIT.
        </p>
        <p class="text-neutral-500 dark:text-neutral-500">
          v{{ appVersion }}
        </p>
      </div>
    </div>
  </footer>
</template>
