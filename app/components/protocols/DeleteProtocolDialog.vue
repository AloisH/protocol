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

function handleCancel() {
  isOpen.value = false;
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Delete Protocol?" :close-button="true">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-error-100 dark:bg-error-900/20">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-error-600 dark:text-error-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold">
            Delete Protocol?
          </h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This action cannot be undone.
          </p>
        </div>
      </div>
    </template>

    <!-- Protocol Info -->
    <div v-if="protocol" class="space-y-4">
      <div class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <p class="font-semibold text-neutral-900 dark:text-white">
          {{ protocol.name }}
        </p>
        <p v-if="protocol.description" class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {{ protocol.description }}
        </p>
      </div>

      <!-- Warning -->
      <UAlert
        title="All routines and tracking data will also be deleted"
        color="error"
        icon="i-lucide-info"
        variant="soft"
      />
    </div>

    <!-- Actions -->
    <template #footer>
      <div class="flex gap-3 justify-end">
        <UButton
          variant="ghost"
          :disabled="loading"
          @click="handleCancel"
        >
          Keep It
        </UButton>
        <UButton
          color="error"
          :loading="loading"
          icon="i-lucide-trash-2"
          @click="handleConfirm"
        >
          Delete Protocol
        </UButton>
      </div>
    </template>
  </UModal>
</template>
