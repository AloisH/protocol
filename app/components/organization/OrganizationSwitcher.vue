<script setup lang="ts">
const { organizations, activeOrganization, activeOrgSlug, fetchOrganizations } = useOrganization();

// Fetch orgs on mount
onMounted(() => fetchOrganizations());

const items = computed(() => [
  [
    {
      label: 'Members',
      icon: 'i-lucide-users',
      to: `/org/${activeOrgSlug.value}/members`,
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: `/org/${activeOrgSlug.value}/settings`,
    },
  ],
  [
    ...organizations.value.map((org: (typeof organizations.value)[0]) => ({
      label: org.name,
      avatar: { text: org.name.charAt(0).toUpperCase() },
      trailingIcon: org.slug === activeOrgSlug.value ? 'i-lucide-check' : undefined,
      to: `/org/${org.slug}/dashboard`,
    })),
  ],
  [
    {
      label: 'Create Organization',
      icon: 'i-lucide-plus',
      to: '/org/create',
    },
  ],
]);
</script>

<template>
  <ClientOnly>
    <UDropdownMenu
      v-if="activeOrganization"
      :items="items"
      :ui="{
        content: '',
      }"
    >
      <UButton
        color="neutral"
        variant="ghost"
        trailing-icon="i-lucide-chevron-down"
        block
        class="group hover:bg-neutral-100 dark:hover:bg-neutral-800"
        :aria-label="`Switch organization, current: ${activeOrganization.name}`"
      >
        <div class="flex items-center gap-2">
          <UAvatar
            :text="activeOrganization.name.charAt(0).toUpperCase()"
            size="xs"
            class="group-hover:ring-primary ring-2 ring-neutral-200 transition-all dark:ring-neutral-700"
          />
          <span class="font-semibold">{{ activeOrganization.name }}</span>
        </div>
      </UButton>
    </UDropdownMenu>
    <!-- Fallback when no orgs -->
    <UButton
      v-else
      color="neutral"
      variant="ghost"
      to="/org/create"
      block
      class="hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-plus" />
        <span>Create Organization</span>
      </div>
    </UButton>
  </ClientOnly>
</template>
