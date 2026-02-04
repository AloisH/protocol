<script setup lang="ts">
import type { Activity } from '#shared/db/schema';

interface Props {
  activity: Activity | null;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [boolean];
  'confirm': [];
}>();

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value),
});

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
  <UModal v-model="isOpen">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-red-500" />
        <span>Delete Activity</span>
      </div>
    </template>

    <template #body>
      <div class="space-y-4 p-4">
        <UAlert
          icon="i-lucide-info"
          color="yellow"
          title="Warning"
          description="This will delete the activity and all associated tracking logs. This action cannot be undone."
        />

        <div v-if="activity" class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ activity.name }}
          </p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ activity.activityType }} • {{ activity.frequency }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton
          color="error"
          :loading="loading"
          @click="onConfirm"
        >
          Delete Activity
        </UButton>
      </div>
    </template>
  </UModal>
</template>
