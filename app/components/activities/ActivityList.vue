<script setup lang="ts">
import type { Activity, ActivityGroup } from '#shared/db/schema';
import Sortable from 'sortablejs';

interface Props {
  protocolId: string;
}

const props = defineProps<Props>();
const {
  activities,
  loading,
  createActivity,
  updateActivity,
  deleteActivity,
  reorderActivities,
  loadActivities,
  ungroupedActivities,
  activitiesForGroup,
} = useActivities();

const {
  groups,
  loadGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} = useActivityGroups();

// Activity form/delete state
const isFormOpen = ref(false);
const isDeleteOpen = ref(false);
const editingActivity = ref<Activity | null>(null);
const deletingActivity = ref<Activity | null>(null);
const pendingGroupId = ref<string | undefined>();

// Group form/delete state
const isGroupFormOpen = ref(false);
const isGroupDeleteOpen = ref(false);
const editingGroup = ref<ActivityGroup | null>(null);
const deletingGroup = ref<ActivityGroup | null>(null);

const ungroupedListRef = useTemplateRef('ungrouped-list');
let sortableInstance: Sortable | null = null;

const protocolUngrouped = computed(() =>
  ungroupedActivities.value.filter(a => a.protocolId === props.protocolId),
);

onMounted(async () => {
  await Promise.all([
    loadActivities(props.protocolId),
    loadGroups(props.protocolId),
  ]);
  initUngroupedSortable();
});

function initUngroupedSortable() {
  if (ungroupedListRef.value) {
    sortableInstance = Sortable.create(ungroupedListRef.value, {
      group: 'activities',
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'opacity-50',
      onEnd: () => {
        if (ungroupedListRef.value) {
          const ids = Array.from(ungroupedListRef.value.querySelectorAll('[data-activity-id]')).map(
            el => (el as HTMLElement).dataset.activityId,
          ) as string[];
          reorderActivities(props.protocolId, ids, undefined);
        }
      },
    });
  }
}

watch(() => protocolUngrouped.value.length, () => {
  nextTick(() => {
    sortableInstance?.destroy();
    initUngroupedSortable();
  });
});

onBeforeUnmount(() => {
  sortableInstance?.destroy();
});

// Activity CRUD handlers
function openCreateForm(groupId?: string) {
  editingActivity.value = null;
  pendingGroupId.value = groupId;
  isFormOpen.value = true;
}

function openEditForm(activity: Activity) {
  editingActivity.value = activity;
  pendingGroupId.value = activity.groupId;
  isFormOpen.value = true;
}

function openDeleteDialog(activity: Activity) {
  deletingActivity.value = activity;
  isDeleteOpen.value = true;
}

async function onFormSubmit(data: any) {
  try {
    if (editingActivity.value) {
      await updateActivity(editingActivity.value.id, { ...data, groupId: pendingGroupId.value });
    }
    else {
      const allActivities = activities.value.filter(a => a.protocolId === props.protocolId);
      const maxOrder = Math.max(...(allActivities.map(a => a.order) || [0]), -1) + 1;
      await createActivity(props.protocolId, data.name, data.activityType, data.frequency, maxOrder);

      const newActivity = activities.value[activities.value.length - 1];
      if (newActivity) {
        await updateActivity(newActivity.id, { ...data, groupId: pendingGroupId.value });
      }
    }
    isFormOpen.value = false;
    editingActivity.value = null;
    pendingGroupId.value = undefined;
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

// Group CRUD handlers
function openGroupForm(group?: ActivityGroup) {
  editingGroup.value = group ?? null;
  isGroupFormOpen.value = true;
}

function openGroupDeleteDialog(group: ActivityGroup) {
  deletingGroup.value = group;
  isGroupDeleteOpen.value = true;
}

async function onGroupFormSubmit(data: { name: string }) {
  try {
    if (editingGroup.value) {
      await updateGroup(editingGroup.value.id, { name: data.name });
    }
    else {
      await createGroup(props.protocolId, data.name);
    }
    editingGroup.value = null;
  }
  catch (e) {
    console.error('Failed to save group:', e);
  }
}

async function onGroupDeleteConfirm() {
  if (deletingGroup.value) {
    try {
      await deleteGroup(deletingGroup.value.id);
      await loadActivities(props.protocolId);
      isGroupDeleteOpen.value = false;
      deletingGroup.value = null;
    }
    catch (e) {
      console.error('Failed to delete group:', e);
    }
  }
}

function onGroupReorder(orderedIds: string[], groupId: string) {
  reorderActivities(props.protocolId, orderedIds, groupId);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-gray-900 dark:text-white">
        Activities
      </h3>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-folder-plus"
          size="sm"
          variant="outline"
          @click="openGroupForm()"
        >
          Add Group
        </UButton>
        <UButton
          icon="i-lucide-plus"
          size="sm"
          @click="openCreateForm()"
        >
          Add Activity
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-16 w-full rounded" />
      <USkeleton class="h-16 w-full rounded" />
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && activities.length === 0 && groups.length === 0"
      class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900/50"
    >
      <UIcon name="i-lucide-inbox" class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        No activities yet. Add one to get started!
      </p>
    </div>

    <template v-if="!loading">
      <!-- Ungrouped Activities -->
      <div
        v-if="protocolUngrouped.length > 0 || groups.length > 0"
        ref="ungrouped-list"
        class="min-h-[2rem] space-y-2"
      >
        <div
          v-for="activity in protocolUngrouped"
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
              @edit="openEditForm"
              @delete="openDeleteDialog"
            />
          </div>
        </div>
      </div>

      <!-- Groups -->
      <ActivityGroupSection
        v-for="group in groups"
        :key="group.id"
        :group="group"
        :activities="activitiesForGroup(group.id)"
        :protocol-id="protocolId"
        @edit-group="openGroupForm"
        @delete-group="openGroupDeleteDialog"
        @edit-activity="openEditForm"
        @delete-activity="openDeleteDialog"
        @reorder="onGroupReorder"
        @add-activity="openCreateForm"
      />
    </template>

    <!-- Activity Form & Delete -->
    <ActivityForm
      v-model="isFormOpen"
      :activity="editingActivity ?? undefined"
      :protocol-id="protocolId"
      @submit="onFormSubmit"
    />

    <DeleteActivityDialog
      v-model="isDeleteOpen"
      :activity="deletingActivity"
      @confirm="onDeleteConfirm"
    />

    <!-- Group Form & Delete -->
    <ActivityGroupForm
      v-model="isGroupFormOpen"
      :group="editingGroup"
      @submit="onGroupFormSubmit"
    />

    <UModal v-model="isGroupDeleteOpen">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-red-500" />
          <span>Delete Group</span>
        </div>
      </template>
      <template #body>
        <div class="space-y-4 p-4">
          <UAlert
            icon="i-lucide-info"
            color="warning"
            title="Warning"
            description="This will delete the group and all activities inside it, along with their tracking logs."
          />
          <div v-if="deletingGroup" class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ deletingGroup.name }}
            </p>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ activitiesForGroup(deletingGroup.id).length }} activities
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" @click="isGroupDeleteOpen = false">
            Cancel
          </UButton>
          <UButton color="error" @click="onGroupDeleteConfirm">
            Delete Group
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
