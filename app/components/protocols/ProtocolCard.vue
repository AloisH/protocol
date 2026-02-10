<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';

interface Props {
  protocol: Protocol;
  expanded?: boolean;
  activityCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  activityCount: 0,
});

const _emit = defineEmits<{
  edit: [protocol: Protocol];
  delete: [id: string];
  toggle: [];
}>();

const dayLabels: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const durationLabel = computed(() => {
  if (props.protocol.scheduleDays?.length) {
    return props.protocol.scheduleDays.map(d => dayLabels[d] ?? d).join(', ');
  }
  return props.protocol.duration;
});

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
</script>

<template>
  <div>
    <button
      type="button"
      class="group w-full flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-left transition-colors hover:border-gray-300 dark:hover:border-gray-600"
      @click="_emit('toggle')"
    >
      <UIcon
        :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        class="flex-shrink-0 text-gray-400 w-4 h-4"
      />

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold truncate">
            {{ protocol.name }}
          </h3>
          <UBadge :color="statusColor" variant="soft" size="xs">
            {{ protocol.status }}
          </UBadge>
        </div>
        <div class="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          <span>{{ activityCount }} activities</span>
          <span class="capitalize">{{ durationLabel }}</span>
          <span v-if="protocol.description" class="truncate">
            {{ protocol.description }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-edit"
          @click.stop="_emit('edit', protocol)"
        />
        <UButton
          color="error"
          variant="ghost"
          size="xs"
          icon="i-lucide-trash-2"
          @click.stop="_emit('delete', protocol.id)"
        />
      </div>
    </button>

    <!-- Expanded Activities -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="expanded" class="mt-2 ml-7 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
        <ActivityList :protocol-id="protocol.id" />
      </div>
    </Transition>
  </div>
</template>
