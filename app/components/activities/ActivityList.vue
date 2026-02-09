<script setup lang="ts">
import type { Activity, ActivityGroup } from '#shared/db/schema';
import { VueDraggable } from 'vue-draggable-plus';

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
  persistOrder,
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

// Local mutable list for ungrouped draggable
const localUngrouped = ref<Activity[]>([]);

const protocolUngrouped = computed(() =>
  ungroupedActivities.value.filter(a => a.protocolId === props.protocolId),
);

watch(
  protocolUngrouped,
  (val) => {
    localUngrouped.value = [...val];
  },
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([
    loadActivities(props.protocolId),
    loadGroups(props.protocolId),
  ]);
});

function onUngroupedDragEnd() {
  persistOrder(props.protocolId, localUngrouped.value, undefined);
}

function onGroupChange(items: Activity[], groupId: string) {
  persistOrder(props.protocolId, items, groupId);
}

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
      await createActivity(props.protocolId, data.name, data.activityType, maxOrder);

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
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-neutral-900 dark:text-white">
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
      class="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-600 dark:bg-neutral-900/50"
    >
      <UIcon name="i-lucide-inbox" class="mx-auto h-8 w-8 text-neutral-400" />
      <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        No activities yet. Add one to get started!
      </p>
    </div>

    <template v-if="!loading">
      <!-- Ungrouped Activities (draggable) -->
      <VueDraggable
        v-if="localUngrouped.length > 0 || groups.length > 0"
        v-model="localUngrouped"
        group="activities"
        handle=".drag-handle"
        :animation="200"
        ghost-class="opacity-50"
        item-key="id"
        class="min-h-[2rem] space-y-2"
        @update="onUngroupedDragEnd"
        @add="onUngroupedDragEnd"
        @remove="onUngroupedDragEnd"
      >
        <div
          v-for="activity in localUngrouped"
          :key="activity.id"
          class="group flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div class="drag-handle flex-shrink-0 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
            <UIcon name="i-lucide-grip-vertical" class="h-5 w-5 text-neutral-400" />
          </div>
          <div class="flex-1">
            <ActivityCard
              :activity="activity"
              @edit="openEditForm"
              @delete="openDeleteDialog"
            />
          </div>
        </div>
      </VueDraggable>

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
        @change="onGroupChange"
        @add-activity="openCreateForm"
      />
    </template>

    <!-- Activity Form & Delete -->
    <ActivityForm
      v-model:open="isFormOpen"
      :activity="editingActivity ?? undefined"
      :protocol-id="protocolId"
      @submit="onFormSubmit"
    />

    <DeleteActivityDialog
      v-model:open="isDeleteOpen"
      :activity="deletingActivity"
      @confirm="onDeleteConfirm"
    />

    <!-- Group Form & Delete -->
    <ActivityGroupForm
      v-model:open="isGroupFormOpen"
      :group="editingGroup"
      @submit="onGroupFormSubmit"
    />

    <UModal
      v-model:open="isGroupDeleteOpen"
      title="Delete Group"
      description="This action cannot be undone."
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <div v-if="deletingGroup" class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
            <div class="flex-shrink-0 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
              <UIcon name="i-lucide-folder" class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-neutral-900 dark:text-white">
                {{ deletingGroup.name }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ activitiesForGroup(deletingGroup.id).length }} activities will be deleted
              </p>
            </div>
          </div>

          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This will permanently delete the group and all activities inside it, along with their tracking logs.
          </p>
        </div>
      </template>
      <template #footer="{ close }">
        <UButton color="neutral" variant="outline" @click="close">
          Cancel
        </UButton>
        <UButton color="error" icon="i-lucide-trash-2" @click="onGroupDeleteConfirm">
          Delete Group
        </UButton>
      </template>
    </UModal>
  </div>
</template>
