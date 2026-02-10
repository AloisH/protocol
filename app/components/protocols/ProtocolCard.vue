<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';

interface Props {
  protocol: Protocol;
  expanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
});

const _emit = defineEmits<{
  edit: [protocol: Protocol];
  delete: [id: string];
  toggle: [];
}>();

const { activities } = useActivities();

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

const protocolActivities = computed(() => {
  return activities.value.filter(a => a.protocolId === props.protocol.id);
});
</script>

<template>
  <div class="space-y-3">
    <UCard class="hover:shadow-lg transition-shadow">
      <!-- Header -->
      <template #header>
        <div class="flex items-start justify-between gap-2">
          <button
            class="flex flex-1 items-start gap-3 text-left transition-colors hover:opacity-75"
            @click="_emit('toggle')"
          >
            <UIcon
              :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="mt-1.5 flex-shrink-0 text-gray-400"
            />
            <div class="flex-1">
              <h3 class="font-bold text-lg truncate">
                {{ protocol.name }}
              </h3>
              <p v-if="protocol.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
                {{ protocol.description }}
              </p>
            </div>
          </button>

          <div class="flex items-center gap-2 flex-shrink-0">
            <UBadge color="neutral" variant="subtle" size="sm">
              {{ protocolActivities.length }} activities
            </UBadge>
            <UBadge :color="statusColor" variant="soft">
              {{ protocol.status }}
            </UBadge>
          </div>
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
            @click="_emit('edit', protocol)"
          >
            Edit
          </UButton>
          <UButton
            color="error"
            variant="ghost"
            size="sm"
            icon="i-lucide-trash-2"
            @click="_emit('delete', protocol.id)"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- Expanded Activities Section -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="expanded" class="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
        <ActivityList :protocol-id="protocol.id" />
      </div>
    </Transition>
  </div>
</template>
