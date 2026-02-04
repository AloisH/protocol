<script setup lang="ts">
const error = ref<Error | null>(null);

function retry() {
  error.value = null;
}

onErrorCaptured((e) => {
  error.value = e instanceof Error ? e : new Error(String(e));
  return false;
});
</script>

<template>
  <slot v-if="!error" />
  <div v-else class="flex flex-col items-center justify-center gap-4 p-8 text-center">
    <UIcon name="i-lucide-alert-triangle" class="size-12 text-red-500" />
    <div>
      <h3 class="text-lg font-semibold">
        Something went wrong
      </h3>
      <p class="text-sm text-neutral-500">
        {{ error.message }}
      </p>
    </div>
    <UButton variant="outline" icon="i-lucide-refresh-cw" @click="retry">
      Try again
    </UButton>
  </div>
</template>
