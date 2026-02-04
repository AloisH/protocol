<script setup lang="ts">
interface Props {
  name: string;
  avatar?: string;
}

withDefaults(defineProps<Props>(), {
  avatar: '',
});
</script>

<template>
  <UCard class="from-primary-500/5 dark:from-primary-400/10 mt-12 bg-gradient-to-br to-transparent">
    <div class="flex gap-4">
      <UAvatar
        :src="avatar"
        :alt="name"
        size="lg"
      />
      <div>
        <div class="mb-1 text-lg font-semibold text-neutral-900 dark:text-white">
          {{ name }}
        </div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Author • Full-stack developer
        </p>
      </div>
    </div>
  </UCard>
</template>
