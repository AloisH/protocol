<script setup lang="ts">
import type { Activity } from '#shared/db/schema';

interface Props {
  activity: Activity | null;
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<{
  'update:open': [boolean];
  'confirm': [];
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const activityTypeIcons: Record<string, string> = {
  exercise: 'i-lucide-dumbbell',
  warmup: 'i-lucide-zap',
  supplement: 'i-lucide-pill',
  habit: 'i-lucide-check-circle',
};

const loading = ref(false);

async function onConfirm() {
  loading.value = true;
  try {
    emit('confirm');
    isOpen.value = false;
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Delete Activity"
    description="This action cannot be undone."
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <div
          v-if="activity"
          class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div class="flex-shrink-0 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
            <UIcon
              :name="activityTypeIcons[activity.activityType] || 'i-lucide-circle'"
              class="h-4 w-4 text-neutral-600 dark:text-neutral-400"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-neutral-900 dark:text-white">
              {{ activity.name }}
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ activity.activityType }}
            </p>
          </div>
        </div>

        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          This will permanently delete the activity and all associated tracking logs.
        </p>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        :disabled="loading"
        @click="close"
      >
        Cancel
      </UButton>
      <UButton
        color="error"
        :loading="loading"
        icon="i-lucide-trash-2"
        @click="onConfirm"
      >
        Delete
      </UButton>
    </template>
  </UModal>
</template>
