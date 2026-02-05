<script setup lang="ts">
const { exportData, downloadExport } = useIndexedDB();

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

async function handleExport() {
  loading.value = true;
  error.value = null;
  success.value = false;

  try {
    const data = await exportData();
    if (!data) {
      error.value = 'Failed to export data';
      return;
    }
    downloadExport(data);
    success.value = true;
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Export failed';
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-download" class="size-5" />
        <h3 class="font-semibold">
          Export Data
        </h3>
      </div>
    </template>

    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
      Download all your protocols, activities, and tracking data as a JSON file.
    </p>

    <UAlert
      v-if="error"
      :description="error"
      color="error"
      icon="i-lucide-alert-circle"
      variant="soft"
      class="mb-4"
    />

    <UAlert
      v-if="success"
      description="Data exported successfully"
      color="success"
      icon="i-lucide-check"
      variant="soft"
      class="mb-4"
    />

    <UButton
      :loading="loading"
      icon="i-lucide-download"
      @click="handleExport"
    >
      Export Backup
    </UButton>
  </UCard>
</template>
