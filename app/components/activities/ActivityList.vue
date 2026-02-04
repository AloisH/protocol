<script setup lang="ts">
import type { Activity } from '#shared/db/schema';
import Sortable from 'sortablejs';

interface Props {
  protocolId: string;
}

const props = defineProps<Props>();
const { activities, loading, createActivity, updateActivity, deleteActivity, reorderActivities, loadActivities } = useActivities();

const isFormOpen = ref(false);
const isDeleteOpen = ref(false);
const editingActivity = ref<Activity | null>(null);
const deletingActivity = ref<Activity | null>(null);
const listRef = useTemplateRef('activity-list');

let sortableInstance: Sortable | null = null;

onMounted(async () => {
  if (activities.value.length === 0) {
    await loadActivities(props.protocolId);
  }

  // Initialize sortable
  if (listRef.value) {
    sortableInstance = Sortable.create(listRef.value, {
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'opacity-50',
      onUpdate: async (e) => {
        if (e.newIndex !== undefined && e.oldIndex !== undefined) {
          const newOrder = Array.from(listRef.value!.querySelectorAll('[data-activity-id]')).map(
            el => (el as HTMLElement).dataset.activityId,
          ) as string[];
          await reorderActivities(props.protocolId, newOrder);
        }
      },
    });
  }
});

onBeforeUnmount(() => {
  sortableInstance?.destroy();
});

const protocolActivities = computed(() => {
  return activities.value.filter((a: Activity) => a.protocolId === props.protocolId);
});

function openCreateForm() {
  editingActivity.value = null;
  isFormOpen.value = true;
}

function openEditForm(activity: Activity) {
  editingActivity.value = activity;
  isFormOpen.value = true;
}

function openDeleteDialog(activity: Activity) {
  deletingActivity.value = activity;
  isDeleteOpen.value = true;
}

async function onFormSubmit(data: any) {
  try {
    if (editingActivity.value) {
      await updateActivity(editingActivity.value.id, data);
    }
    else {
      const maxOrder = Math.max(
        ...((protocolActivities.value.map((a: Activity) => a.order)) || [0]),
        -1,
      ) + 1;
      await createActivity(
        props.protocolId,
        data.name,
        data.activityType,
        data.frequency,
        maxOrder,
      );

      // Update with all fields
      const newActivity = protocolActivities.value[protocolActivities.value.length - 1];
      if (newActivity) {
        await updateActivity(newActivity.id, data);
      }
    }
    isFormOpen.value = false;
    editingActivity.value = null;
  }
  catch (e) {
    console.error('Failed to save activity:', e);
  }
}

async function onDeleteConfirm() {
  if (deletingActivity.value) {
    try {
      await deleteActivity(deletingActivity.value.id);
      isDeleteOpen.value = false;
      deletingActivity.value = null;
    }
    catch (e) {
      console.error('Failed to delete activity:', e);
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-gray-900 dark:text-white">
        Activities
      </h3>
      <UButton
        icon="i-lucide-plus"
        size="sm"
        @click="openCreateForm"
      >
        Add Activity
      </UButton>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && protocolActivities.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900/50">
      <UIcon name="i-lucide-inbox" class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        No activities yet. Add one to get started!
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-16 w-full rounded" />
      <USkeleton class="h-16 w-full rounded" />
    </div>

    <!-- Activity List -->
    <div
      v-if="!loading && protocolActivities.length > 0"
      ref="listRef"
      class="space-y-2"
    >
      <div
        v-for="activity in protocolActivities"
        :key="activity.id"
        :data-activity-id="activity.id"
        class="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
      >
        <!-- Drag handle -->
        <div class="drag-handle flex-shrink-0 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing dark:hover:bg-gray-800">
          <UIcon name="i-lucide-grip-vertical" class="h-5 w-5 text-gray-400" />
        </div>

        <!-- Activity details -->
        <div class="flex-1">
          <ActivityCard
            :activity="activity"
            @edit="openEditForm"
            @delete="openDeleteDialog"
          />
        </div>
      </div>
    </div>

    <!-- Forms & Dialogs -->
    <ActivityForm
      v-model="isFormOpen"
      :activity="editingActivity"
      :protocol-id="protocolId"
      @submit="onFormSubmit"
    />

    <DeleteActivityDialog
      v-model="isDeleteOpen"
      :activity="deletingActivity"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>
