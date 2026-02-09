<script setup lang="ts">
import type { Activity, ActivityGroup } from '#shared/db/schema';
import { VueDraggable } from 'vue-draggable-plus';

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
  change: [activities: Activity[], groupId: string];
  addActivity: [groupId: string];
}>();

const collapsed = ref(false);

// Local mutable copy for draggable to manipulate
const localActivities = ref<Activity[]>([...props.activities]);

watch(
  () => props.activities,
  (val) => {
    localActivities.value = [...val];
  },
);

function onDragEnd() {
  emit('change', localActivities.value, props.group.id);
}

const dropdownItems = computed(() => [
  [{
    label: 'Edit Group',
    icon: 'i-lucide-edit',
    onSelect: () => emit('editGroup', props.group),
  }],
  [{
    label: 'Add Activity',
    icon: 'i-lucide-plus',
    onSelect: () => emit('addActivity', props.group.id),
  }],
  [{
    label: 'Delete Group',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => emit('deleteGroup', props.group),
  }],
]);
</script>

<template>
  <div class="rounded-lg border border-neutral-200 dark:border-neutral-700">
    <!-- Group header -->
    <button
      type="button"
      class="flex w-full cursor-pointer items-center gap-2 rounded-t-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
      @click="collapsed = !collapsed"
    >
      <UIcon
        :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
        class="h-4 w-4 text-neutral-500 transition-transform"
      />
      <span class="flex-1 text-left text-sm font-semibold text-neutral-900 dark:text-white">
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
    <VueDraggable
      v-show="!collapsed"
      v-model="localActivities"
      group="activities"
      handle=".drag-handle"
      :animation="200"
      ghost-class="opacity-50"
      item-key="id"
      class="min-h-[2rem] space-y-2 p-2"
      @update="onDragEnd"
      @add="onDragEnd"
      @remove="onDragEnd"
    >
      <div
        v-for="activity in localActivities"
        :key="activity.id"
        class="group flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div class="drag-handle flex-shrink-0 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
          <UIcon name="i-lucide-grip-vertical" class="h-5 w-5 text-neutral-400" />
        </div>
        <div class="flex-1">
          <ActivityCard
            :activity="activity"
            @edit="emit('editActivity', $event)"
            @delete="emit('deleteActivity', $event)"
          />
        </div>
      </div>
    </VueDraggable>

    <!-- Empty state (shown when collapsed is false and no activities) -->
    <div
      v-if="!collapsed && activities.length === 0"
      class="p-2"
    >
      <div class="rounded border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-400 dark:border-neutral-600">
        Drag activities here or click + to add
      </div>
    </div>
  </div>
</template>
