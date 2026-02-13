<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const route = useRoute();
const isMenuOpen = ref(false);

const navLinks = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Protocols',
    to: '/protocols',
    icon: 'i-lucide-clipboard-list',
    active: route.path.startsWith('/protocols'),
  },
  {
    label: 'Analytics',
    to: '/analytics',
    icon: 'i-lucide-chart-line',
    active: route.path === '/analytics',
  },
]);

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

// Close menu when route changes
watch(() => route.path, () => {
  closeMenu();
});
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
    <!-- Main header container -->
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Logo section -->
      <NuxtLink
        to="/"
        class="flex items-center gap-3 group"
        aria-label="Protocol home"
      >
        <!-- Geometric accent mark -->
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg transform group-hover:scale-110 transition-transform duration-300" />
          <div class="absolute inset-1 bg-white dark:bg-neutral-950 rounded-md flex items-center justify-center">
            <svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
          </div>
        </div>

        <!-- Logo text -->
        <span class="hidden sm:inline-block text-lg font-serif font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-teal-700 dark:group-hover:from-emerald-300 dark:group-hover:to-teal-300 transition-all duration-300">
          Protocol
        </span>
      </NuxtLink>

      <!-- Desktop navigation -->
      <div class="hidden md:flex items-center gap-1">
        <template v-for="link in navLinks" :key="String(link.to)">
          <NuxtLink
            :to="String(link.to)"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 no-underline"
            :class="link.active && 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'"
          >
            <UIcon v-if="link.icon" :name="link.icon" class="w-4 h-4" />
            <span>{{ link.label }}</span>

            <!-- Active indicator line -->
            <Transition name="scale-y">
              <div
                v-if="link.active"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                style="width: 100%; transform: translateY(calc(100% + 8px))"
              />
            </Transition>
          </NuxtLink>
        </template>
      </div>

      <!-- Right section: Color mode toggle and mobile menu -->
      <div class="flex items-center gap-2">
        <!-- Color mode button -->
        <UColorModeButton
          icon="i-lucide-moon"
          dark-icon="i-lucide-sun"
          class="hidden sm:inline-flex"
        />

        <!-- Mobile menu button -->
        <button
          class="md:hidden p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
          :aria-expanded="isMenuOpen"
          aria-label="Toggle navigation menu"
          @click="toggleMenu"
        >
          <UIcon
            :name="isMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            class="w-5 h-5"
          />
        </button>

        <!-- Settings button -->
        <UButton
          icon="i-lucide-settings"
          to="/settings"
          variant="ghost"
          color="neutral"
          aria-label="Settings"
        />
      </div>
    </nav>

    <!-- Mobile navigation menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-show="isMenuOpen"
        class="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-2">
          <template v-for="link in navLinks" :key="String(link.to)">
            <NuxtLink
              :to="String(link.to)"
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 no-underline"
              :class="link.active && 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'"
              @click="closeMenu"
            >
              <UIcon v-if="link.icon" :name="link.icon" class="w-5 h-5" />
              <span>{{ link.label }}</span>
            </NuxtLink>
          </template>

          <USeparator class="my-2" />

          <UColorModeButton
            variant="ghost"
            color="neutral"
            block
            class="justify-start"
            @click="closeMenu"
          />

          <NuxtLink
            to="/settings"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
            @click="closeMenu"
          >
            <UIcon name="i-lucide-settings" class="w-5 h-5" />
            <span>Settings</span>
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* Smooth transitions for navigation items */
:deep(.router-link-active) {
  position: relative;
}

/* Custom animation for menu transitions */
.scale-y-enter-active,
.scale-y-leave-active {
  transition: transform 200ms ease;
}

.scale-y-enter-from,
.scale-y-leave-to {
  transform: scaleY(0);
}

/* Refined typography for serif branding */
.font-serif {
  font-family: 'Playfair Display', 'Georgia', serif;
}

/* Subtle backdrop effect */
@supports (backdrop-filter: blur(1px)) {
  header {
    backdrop-filter: blur(8px);
  }
}
</style>
