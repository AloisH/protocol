<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';

interface Props {
  protocol: Protocol | null;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [boolean];
  'saved': [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

const { activities, loadActivities } = useActivities();
const {
  activityLogs,
  sessionNotes,
  sessionRating,
  loading,
  completedCount,
  totalCount,
  initSession,
  updateActivityLog,
  toggleActivity,
  toggleDose,
  saveSession,
} = useSession();

const toast = useToast();
const protocolActivities = computed(() => {
  if (!props.protocol)
    return [];
  return activities.value.filter(a => a.protocolId === props.protocol!.id);
});

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
});

watch(
  () => [props.protocol, props.modelValue] as const,
  async ([protocol, open]) => {
    if (protocol && open) {
      await loadActivities(protocol.id);
      await initSession(protocol.id);
    }
  },
  { immediate: true },
);

async function handleSave() {
  const success = await saveSession();
  if (success) {
    toast.add({
      title: 'Session saved',
      icon: 'i-lucide-check',
      color: 'success',
    });
    emit('saved');
    isOpen.value = false;
  }
  else {
    toast.add({
      title: 'Failed to save session',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
  }
}
</script>

<template>
  <UModal v-model="isOpen" class="max-w-2xl">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h2 class="text-lg font-bold">
            {{ protocol?.name }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formattedDate }}
          </p>
        </div>
        <UBadge v-if="totalCount > 0" color="primary" variant="soft">
          {{ completedCount }} / {{ totalCount }}
        </UBadge>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 p-4">
        <!-- Activities -->
        <div class="space-y-3">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Activities
          </h3>

          <div v-if="protocolActivities.length === 0" class="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
            <UIcon name="i-lucide-inbox" class="mx-auto h-8 w-8 text-gray-400" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              No activities in this protocol
            </p>
          </div>

          <div v-else class="space-y-2">
            <SessionActivityItem
              v-for="activity in protocolActivities"
              :key="activity.id"
              :activity="activity"
              :log="activityLogs.get(activity.id) || { activityId: activity.id, completed: false }"
              @toggle="toggleActivity(activity.id)"
              @toggle-dose="toggleDose(activity.id, $event)"
              @update="updateActivityLog(activity.id, $event)"
            />
          </div>
        </div>

        <!-- Session Notes -->
        <div class="space-y-2">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Session Notes
          </h3>
          <UTextarea
            v-model="sessionNotes"
            placeholder="How did the session go?"
            :rows="3"
          />
        </div>

        <!-- Rating -->
        <div class="space-y-2">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Rate this session
          </h3>
          <SessionRating v-model="sessionRating" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton :loading="loading" @click="handleSave">
          Save Session
        </UButton>
      </div>
    </template>
  </UModal>
</template>
