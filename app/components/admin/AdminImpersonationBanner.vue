<script setup lang="ts">
const { isImpersonating, impersonatedUser, stopImpersonation, checkImpersonation }
  = useImpersonation();
const loading = ref(false);
const toast = useToast();

// Check impersonation status on mount
onMounted(async () => {
  await checkImpersonation();
});

async function handleStopImpersonation() {
  loading.value = true;
  const result = await stopImpersonation();
  loading.value = false;

  if (result.success) {
    toast.add({
      title: 'Stopped impersonation',
      description: 'Returned to your admin account',
      color: 'success',
      icon: 'i-lucide-check',
    });
    await navigateTo({ name: 'admin-users' });
  }
  else {
    toast.add({
      title: 'Error',
      description: result.error || 'Failed to stop impersonation',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
  }
}
</script>

<template>
  <div
    v-if="isImpersonating"
    class="bg-warning-100 dark:bg-warning-950 border-warning-200 dark:border-warning-800 fixed top-0 right-0 left-0 z-50 border-b px-4 py-3 shadow-sm"
  >
    <div class="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <UIcon
          name="i-lucide-alert-triangle"
          class="text-warning-600 dark:text-warning-400 size-5 shrink-0 animate-pulse"
        />
        <div class="min-w-0">
          <p class="text-warning-900 dark:text-warning-100 truncate font-semibold">
            Viewing as {{ impersonatedUser?.name || impersonatedUser?.email || 'User' }}
          </p>
          <p class="text-warning-700 dark:text-warning-300 text-sm font-medium">
            Some actions may be restricted
          </p>
        </div>
      </div>
      <UButton
        color="warning"
        variant="solid"
        size="sm"
        :loading="loading"
        class="shrink-0 font-semibold"
        @click="handleStopImpersonation"
      >
        Stop
      </UButton>
    </div>
  </div>
  <div
    v-if="isImpersonating"
    class="h-[73px]"
  />
</template>
