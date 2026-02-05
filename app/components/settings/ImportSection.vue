<script setup lang="ts">
const { validateImport, importData } = useIndexedDB();

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const mode = ref<'merge' | 'replace'>('merge');
const confirmOpen = ref(false);
const pendingData = ref<unknown>(null);

const fileInput = ref<HTMLInputElement | null>(null);

function selectFile() {
  fileInput.value?.click();
}

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file)
    return;

  error.value = null;
  success.value = false;

  try {
    const text = await file.text();
    const json = JSON.parse(text);

    const validation = validateImport(json);
    if (!validation.success) {
      error.value = `Invalid file: ${validation.error}`;
      return;
    }

    pendingData.value = validation.data;

    if (mode.value === 'replace') {
      confirmOpen.value = true;
    }
    else {
      await doImport();
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to read file';
  }
  finally {
    target.value = '';
  }
}

async function doImport() {
  if (!pendingData.value)
    return;

  loading.value = true;
  try {
    const result = await importData(pendingData.value, mode.value);
    if (!result.success) {
      error.value = result.error ?? 'Import failed';
      return;
    }
    success.value = true;
    pendingData.value = null;
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Import failed';
  }
  finally {
    loading.value = false;
    confirmOpen.value = false;
  }
}

function cancelImport() {
  pendingData.value = null;
  confirmOpen.value = false;
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-upload" class="size-5" />
        <h3 class="font-semibold">
          Import Data
        </h3>
      </div>
    </template>

    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
      Restore data from a previously exported JSON backup file.
    </p>

    <div class="space-y-4">
      <URadioGroup
        v-model="mode"
        :items="[
          { label: 'Merge', value: 'merge', description: 'Add to existing data, update duplicates' },
          { label: 'Replace', value: 'replace', description: 'Delete all existing data first' },
        ]"
      />

      <UAlert
        v-if="error"
        :description="error"
        color="error"
        icon="i-lucide-alert-circle"
        variant="soft"
      />

      <UAlert
        v-if="success"
        description="Data imported successfully"
        color="success"
        icon="i-lucide-check"
        variant="soft"
      />

      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        aria-label="Select backup file"
        @change="handleFileChange"
      >

      <UButton
        :loading="loading"
        icon="i-lucide-upload"
        @click="selectFile"
      >
        Select Backup File
      </UButton>
    </div>

    <UModal
      v-model:open="confirmOpen"
      title="Replace All Data?"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <UAlert
          title="This will delete all existing data"
          description="All protocols, activities, and tracking logs will be removed and replaced with the imported data. This cannot be undone."
          color="warning"
          icon="i-lucide-alert-triangle"
          variant="soft"
        />
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="cancelImport"
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          :loading="loading"
          @click="doImport"
        >
          Replace All Data
        </UButton>
      </template>
    </UModal>
  </UCard>
</template>
