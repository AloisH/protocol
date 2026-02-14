<script setup lang="ts">
const { clearAllData } = useIndexedDB();

const loading = ref(false);
const error = ref<string | null>(null);
const modalOpen = ref(false);

async function handleClear() {
  loading.value = true;
  error.value = null;

  try {
    const success = await clearAllData();
    if (!success) {
      error.value = 'Failed to clear data';
      return;
    }
    window.location.reload();
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to clear data';
  }
  finally {
    loading.value = false;
    modalOpen.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-trash-2" class="size-5" />
        <h3 class="font-semibold">
          Clear All Data
        </h3>
      </div>
    </template>

    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
      Permanently delete all protocols, activities, and tracking data. This action cannot be undone.
    </p>

    <UAlert
      v-if="error"
      :description="error"
      color="error"
      icon="i-lucide-alert-circle"
      variant="soft"
      class="mb-4"
    />

    <UButton
      color="error"
      icon="i-lucide-trash-2"
      @click="modalOpen = true"
    >
      Clear All Data
    </UButton>

    <UModal
      v-model:open="modalOpen"
      title="Clear All Data?"
      description="This action cannot be undone."
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="flex gap-4">
          <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
            <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              All data will be deleted permanently
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              All protocols, activities, tracking history, and settings will be removed.
            </p>
          </div>
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
          @click="handleClear"
        >
          Clear All Data
        </UButton>
      </template>
    </UModal>
  </UCard>
</template>
