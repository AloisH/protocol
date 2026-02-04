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
  'update:modelValue': [value: boolean];
  'confirm': [];
}>();

const loading = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

async function handleConfirm() {
  loading.value = true;
  try {
    emit('confirm');
  }
  finally {
    loading.value = false;
    isOpen.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Delete Protocol?"
    description="This action cannot be undone."
    :ui="{ footer: 'justify-end' }"
  >
    <!-- Body slot for content -->
    <template #body>
      <div class="flex gap-4 mb-4">
        <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
          <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            All data will be deleted permanently
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            All routines and tracking data associated with this protocol will also be removed.
          </p>
        </div>
      </div>

      <div v-if="protocol" class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <p class="font-semibold text-gray-900 dark:text-white">
          {{ protocol.name }}
        </p>
        <p v-if="protocol.description" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ protocol.description }}
        </p>
      </div>
    </template>

    <!-- Footer slot for actions -->
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
        @click="handleConfirm"
      >
        Delete Protocol
      </UButton>
    </template>
  </UModal>
</template>
