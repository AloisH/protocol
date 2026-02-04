<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';

const props = defineProps<{
  protocol: Protocol;
}>();

defineEmits<{
  edit: [protocol: Protocol];
  delete: [id: string];
}>();

const statusColor = computed(() => {
  switch (props.protocol?.status) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'completed':
      return 'neutral';
    default:
      return 'info';
  }
});

const durationLabel = computed(() => {
  const freq = props.protocol?.duration;
  return freq ? freq.charAt(0).toUpperCase() + freq.slice(1) : 'Unknown';
});
</script>

<template>
  <UCard class="hover:shadow-lg transition-shadow">
    <!-- Header -->
    <template #header>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="font-bold text-lg truncate">
            {{ protocol.name }}
          </h3>
          <p v-if="protocol.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
            {{ protocol.description }}
          </p>
        </div>
        <UBadge :color="statusColor" variant="soft" class="ml-2 flex-shrink-0">
          {{ protocol.status }}
        </UBadge>
      </div>
    </template>

    <!-- Body -->
    <div class="space-y-3">
      <!-- Duration -->
      <div class="flex items-center gap-2 text-sm">
        <UIcon name="i-lucide-calendar" class="text-gray-400" />
        <span class="text-gray-600">{{ durationLabel }}</span>
      </div>

      <!-- Created Date -->
      <div class="flex items-center gap-2 text-sm">
        <UIcon name="i-lucide-clock" class="text-gray-400" />
        <span class="text-gray-600">{{ new Date(protocol.createdAt).toLocaleDateString() }}</span>
      </div>

      <!-- Target Metric if set -->
      <div v-if="protocol.targetMetric" class="flex items-center gap-2 text-sm">
        <UIcon name="i-lucide-target" class="text-gray-400" />
        <span class="text-gray-600">{{ protocol.targetMetric }}</span>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex gap-2 justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-edit"
          @click="$emit('edit', protocol)"
        >
          Edit
        </UButton>
        <UButton
          color="error"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          @click="$emit('delete', protocol.id)"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UCard>
</template>
