<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';

const isOpen = defineModel<boolean>('open', { default: false });

const router = useRouter();
const auth = useAuth();
const { isAdmin } = useRole();
const { activeOrgSlug } = useOrganization();
const colorMode = useColorMode();
const { recentItems, addRecentItem } = useRecentItems();

// Navigation helper
function navigateTo(path: string) {
  isOpen.value = false;
  void router.push(path);
}

// Logout handler
function handleLogout() {
  isOpen.value = false;
  void auth.signOut({ redirectTo: '/auth/login' });
}

// Theme toggle
function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  isOpen.value = false;
}

// Track selection for recent items
function handleSelect(item: CommandPaletteItem | undefined) {
  if (item && item.id) {
    addRecentItem({
      id: item.id as string,
      label: item.label as string,
      icon: item.icon as string | undefined,
    });
  }
}

// Navigation items
const navItems = computed<CommandPaletteItem[]>(() => [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    icon: 'i-lucide-house',
    onSelect: () => { navigateTo(activeOrgSlug.value ? `/org/${activeOrgSlug.value}/dashboard` : '/org/select'); },
  },
  {
    id: 'nav-profile',
    label: 'Profile',
    icon: 'i-lucide-user',
    onSelect: () => { navigateTo('/profile'); },
  },
]);

// Organization items
const orgItems = computed<CommandPaletteItem[]>(() =>
  activeOrgSlug.value
    ? [
        {
          id: 'org-members',
          label: 'Members',
          icon: 'i-lucide-users',
          onSelect: () => { navigateTo(`/org/${activeOrgSlug.value}/members`); },
        },
        {
          id: 'org-settings',
          label: 'Settings',
          icon: 'i-lucide-settings',
          onSelect: () => { navigateTo(`/org/${activeOrgSlug.value}/settings`); },
        },
      ]
    : [],
);

// Admin items
const adminItems = computed<CommandPaletteItem[]>(() => [
  {
    id: 'admin-panel',
    label: 'Admin Panel',
    icon: 'i-lucide-shield',
    onSelect: () => { navigateTo('/admin/users'); },
  },
  {
    id: 'admin-email',
    label: 'Email Previews',
    icon: 'i-lucide-mail',
    onSelect: () => { navigateTo('/admin/email-preview'); },
  },
]);

// Action items
const actionItems = computed<CommandPaletteItem[]>(() => [
  {
    id: 'action-theme',
    label: colorMode.value === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
    icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
    onSelect: toggleTheme,
  },
  {
    id: 'action-logout',
    label: 'Logout',
    icon: 'i-lucide-log-out',
    onSelect: handleLogout,
  },
]);

// Build groups based on permissions
const groups = computed<CommandPaletteGroup[]>(() => {
  const result: CommandPaletteGroup[] = [];

  // Recent items (if any)
  if (recentItems.value.length > 0) {
    result.push({
      id: 'recent',
      label: 'Recent',
      items: recentItems.value.map(item => ({
        id: item.id,
        label: item.label,
        icon: item.icon || 'i-lucide-clock',
        onSelect: (e: Event) => {
          // Find and execute the original action
          const allItems = [
            ...navItems.value,
            ...orgItems.value,
            ...adminItems.value,
            ...actionItems.value,
          ];
          const original = allItems.find(i => i.id === item.id);
          original?.onSelect?.(e);
        },
      })),
    });
  }

  // Always visible - Navigation
  result.push({
    id: 'navigation',
    label: 'Navigation',
    items: navItems.value,
  });

  // Org pages - show when org is active
  if (activeOrgSlug.value && orgItems.value.length > 0) {
    result.push({
      id: 'organization',
      label: 'Organization',
      items: orgItems.value,
    });
  }

  // Admin only
  if (isAdmin.value) {
    result.push({
      id: 'admin',
      label: 'Admin',
      items: adminItems.value,
    });
  }

  // Actions - always visible
  result.push({
    id: 'actions',
    label: 'Actions',
    items: actionItems.value,
  });

  return result;
});
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Search..."
        close
        @update:open="isOpen = $event"
        @update:model-value="handleSelect"
      />
    </template>
  </UModal>
</template>
