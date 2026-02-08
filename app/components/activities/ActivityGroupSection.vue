<script setup lang="ts">
import type { Activity, ActivityGroup } from '#shared/db/schema';
import Sortable from 'sortablejs';

interface Props {
  group: ActivityGroup;
  activities: Activity[];
  protocolId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  editGroup: [group: ActivityGroup];
  deleteGroup: [group: ActivityGroup];
  editActivity: [activity: Activity];
  deleteActivity: [activity: Activity];
  reorder: [orderedIds: string[], groupId: string];
  addActivity: [groupId: string];
}>();

const collapsed = ref(false);
const listRef = useTemplateRef('group-list');
let sortableInstance: Sortable | null = null;

function initSortable() {
  if (listRef.value) {
    sortableInstance = Sortable.create(listRef.value, {
      group: 'activities',
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'opacity-50',
      onEnd: (e) => {
        if (e.to === listRef.value) {
          const ids = Array.from(listRef.value!.querySelectorAll('[data-activity-id]')).map(
            el => (el as HTMLElement).dataset.activityId,
          ) as string[];
          emit('reorder', ids, props.group.id);
        }
      },
    });
  }
}

onMounted(initSortable);

watch(() => props.activities.length, () => {
  nextTick(() => {
    sortableInstance?.destroy();
    initSortable();
  });
});

onBeforeUnmount(() => {
  sortableInstance?.destroy();
});

const dropdownItems = computed(() => [
  [{
    label: 'Edit Group',
    icon: 'i-lucide-edit',
    click: () => emit('editGroup', props.group),
  }],
  [{
    label: 'Add Activity',
    icon: 'i-lucide-plus',
    click: () => emit('addActivity', props.group.id),
  }],
  [{
    label: 'Delete Group',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    click: () => emit('deleteGroup', props.group),
  }],
]);
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-gray-700">
    <!-- Group header -->
    <button
      type="button"
      class="flex w-full cursor-pointer items-center gap-2 rounded-t-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
      @click="collapsed = !collapsed"
    >
      <UIcon
        :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
        class="h-4 w-4 text-gray-500 transition-transform"
      />
      <span class="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
        {{ group.name }}
      </span>
      <UBadge size="sm" variant="subtle" color="neutral">
        {{ activities.length }}
      </UBadge>
      <UDropdownMenu :items="dropdownItems" @click.stop>
        <UButton
          icon="i-lucide-more-horizontal"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.stop
        />
      </UDropdownMenu>
    </button>

    <!-- Activities -->
    <div v-show="!collapsed" ref="group-list" class="min-h-[2rem] space-y-2 p-2">
      <div
        v-for="activity in activities"
        :key="activity.id"
        :data-activity-id="activity.id"
        class="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="drag-handle flex-shrink-0 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing dark:hover:bg-gray-800">
          <UIcon name="i-lucide-grip-vertical" class="h-5 w-5 text-gray-400" />
        </div>
        <div class="flex-1">
          <ActivityCard
            :activity="activity"
            @edit="emit('editActivity', $event)"
            @delete="emit('deleteActivity', $event)"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="activities.length === 0"
        class="rounded border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 dark:border-gray-600"
      >
        Drag activities here or click + to add
      </div>
    </div>
  </div>
</template>
