<script setup lang="ts">
import type { FetchError } from 'ofetch';
import type { Organization } from '../../../prisma/generated/client';

interface Props {
  organizations: Organization[];
  pending: boolean;
  error: FetchError | null | undefined;
}

defineProps<Props>();

defineEmits<Emits>();

interface Emits {
  (e: 'select', slug: string): void;
  (e: 'retry'): void;
}
</script>

<template>
  <div
    v-if="pending"
    class="space-y-2"
  >
    <div
      v-for="i in 3"
      :key="i"
      class="flex items-center gap-3 p-3"
    >
      <USkeleton class="h-5 w-5 rounded" />
      <div class="flex-1 space-y-2">
        <USkeleton class="h-4 w-32" />
        <USkeleton class="h-3 w-48" />
      </div>
    </div>
  </div>

  <div
    v-else-if="error"
    class="py-8"
  >
    <UAlert
      color="error"
      icon="i-lucide-alert-triangle"
      title="Error loading organizations"
      :description="error.message"
    />
    <UButton
      class="mt-4"
      @click="$emit('retry')"
    >
      Retry
    </UButton>
  </div>

  <UEmpty
    v-else-if="organizations.length === 0"
    icon="i-lucide-building-2"
    title="No organizations yet"
    description="Create your first organization to get started"
    :actions="[{ label: 'Create Organization', to: '/org/create', icon: 'i-lucide-plus' }]"
  />

  <div
    v-else
    class="space-y-2"
  >
    <UButton
      v-for="org in organizations"
      :key="org.id"
      variant="ghost"
      class="w-full justify-start"
      @click="$emit('select', org.slug)"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-building-2"
          class="h-5 w-5"
        />
        <div class="text-left">
          <div class="font-medium">
            {{ org.name }}
          </div>
          <div
            v-if="org.description"
            class="text-xs text-neutral-500"
          >
            {{ org.description }}
          </div>
        </div>
      </div>
    </UButton>
  </div>
</template>
