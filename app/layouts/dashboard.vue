<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui';

const { user, signOut } = useAuth();
const { isAdmin } = useRole();
const { activeOrgSlug, fetchOrganizations } = useOrganization();

// UI state
const commandPaletteOpen = ref(false);
const shortcutsHelpOpen = ref(false);
const sidebarCollapsed = ref(false);

// Global keyboard shortcuts
useKeyboardShortcuts({
  onOpenCommandPalette: () => (commandPaletteOpen.value = true),
  onToggleSidebar: () => (sidebarCollapsed.value = !sidebarCollapsed.value),
  onOpenShortcutsHelp: () => (shortcutsHelpOpen.value = true),
});

// Fetch orgs on mount for sidebar
onMounted(() => fetchOrganizations());

// Unified navigation - always shows all items
const navigationItems = computed<NavigationMenuItem[][]>(() => {
  const mainItems: NavigationMenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'i-lucide-house',
      to: activeOrgSlug.value ? `/org/${activeOrgSlug.value}/dashboard` : '/org/select',
    },
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile',
    },
  ];

  const adminItems: NavigationMenuItem[] = isAdmin.value
    ? [
        {
          label: 'Admin',
          icon: 'i-lucide-shield',
          to: '/admin/users',
        },
        {
          label: 'Email Previews',
          icon: 'i-lucide-mail',
          to: '/admin/email-preview',
        },
      ]
    : [];

  return [[...mainItems, ...adminItems]];
});

const footerItems: NavigationMenuItem[][] = [
  [
    {
      label: 'Feedback',
      icon: 'i-lucide-message-circle',
      to: 'https://github.com/aloish/bistro',
      target: '_blank',
    },
    {
      label: 'Help & Support',
      icon: 'i-lucide-info',
      to: 'https://github.com/nuxt/ui',
      target: '_blank',
    },
  ],
];

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile',
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      onSelect: () => signOut({ redirectTo: '/auth/login' }),
    },
  ],
]);
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      v-model:collapsed="sidebarCollapsed"
      resizable
      collapsible
      :ui="{
        footer: 'border-t border-default',
      }"
      class="bg-default border-default border-r"
      role="navigation"
      aria-label="Main navigation"
    >
      <template #header="{ collapsed }">
        <div
          v-if="!collapsed"
          class="flex w-full items-center justify-between gap-2"
        >
          <OrganizationSwitcher class="min-w-0 flex-1" />
          <UDashboardSidebarCollapse />
        </div>
        <UDashboardSidebarCollapse
          v-else
          class="mx-auto"
        />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          @click="commandPaletteOpen = true"
        />

        <ClientOnly>
          <UNavigationMenu
            :collapsed="collapsed"
            :items="navigationItems"
            orientation="vertical"
          />

          <UNavigationMenu
            :collapsed="collapsed"
            :items="footerItems"
            orientation="vertical"
            class="mt-auto"
          />
        </ClientOnly>
      </template>

      <template #footer="{ collapsed }">
        <ClientOnly>
          <UDropdownMenu
            :items="userMenuItems"
            :ui="{
              content: 'w-(--reka-dropdown-menu-trigger-width)',
            }"
          >
            <UUser
              v-if="!collapsed"
              :name="user?.name || user?.email || 'User'"
              :avatar="{ src: user?.image || undefined, text: getUserInitials(user) }"
              class="w-full cursor-pointer rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            />

            <UAvatar
              v-else
              :src="user?.image || undefined"
              :alt="user?.name || user?.email || 'User'"
              :text="getUserInitials(user)"
              size="md"
              role="button"
              aria-label="User menu"
              class="hover:ring-primary cursor-pointer ring-2 ring-neutral-200 transition-colors dark:ring-neutral-700"
            />
          </UDropdownMenu>
        </ClientOnly>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel class="flex h-screen w-full flex-col">
      <UDashboardNavbar title="Bistro">
        <template #right>
          <UColorModeButton />
        </template>
      </UDashboardNavbar>

      <main
        id="main-content"
        class="flex-1 overflow-y-auto p-4 sm:p-6"
        aria-label="Main content"
      >
        <slot />
      </main>
    </UDashboardPanel>

    <AdminImpersonationBanner />
    <DashboardCommandPalette v-model:open="commandPaletteOpen" />
    <DashboardShortcutsHelp v-model:open="shortcutsHelpOpen" />
  </UDashboardGroup>
</template>
